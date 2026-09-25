import { test, expect, type Page } from "@playwright/test";
import { platformFixture } from "./platform-fixture";
import { PROJECT_ID, SPACE_ID, USER_ID } from "./platform-fixture";
import { applyBuildResponse, initialBuilder, type BuilderProject, type BuildResponse } from "../../src/lib/build-context";
import { applyTeamCommand, createTeam, type TeamRecord } from "../../src/lib/bot-teams";

const previewHtml = `<!doctype html><html><body><h1>Feedback board</h1><button onclick="document.querySelector('h1').textContent='Saved locally'">Add feedback</button><script>try{parent.document.body.dataset.leaked="yes"}catch(e){document.body.dataset.isolated="yes"}</script></body></html>`;

async function integratedBuilderFixture(page: Page) {
  const fixture = await platformFixture(page);
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/models", route => route.fulfill({ json: {
    live: true, models: [{ id: "test/coder", name: "Test Coder", provider: "Test" }],
  } }));
  await page.route("**/api/providers?*", route => route.fulfill({ json: {
    available: true, canManage: true, connections: [],
  } }));
  await page.route("**/api/build-chat**", async route => {
    const request = route.request();
    const body = request.method() === "GET" ? null : request.postDataJSON();
    const id = body?.projectId || new URL(request.url()).searchParams.get("projectId");
    const project = fixture.records.find(record => record.id === id) as BuilderProject | undefined;
    if (!project) return route.fulfill({ status: 404, json: { error: "Project unavailable" } });
    if (body) {
      requests.push(body);
      expect(body.revision).toBe(project.revision);
      const state = initialBuilder(project);
      const response: BuildResponse = state.messages.some(message => message.role === "assistant")
        ? { action: "build", message: "Saved a local feedback board.", html: previewHtml }
        : { action: "ask", message: "Who should submit feedback?", questions: [
            { id: "audience", text: "Who will submit feedback?", options: ["Customers", "Internal team"] },
          ] };
      project.data.builder = applyBuildResponse(state, response, "test/coder", body.prompt);
      project.revision++;
    }
    return route.fulfill({ json: { project, memory: [] } });
  });
  return { ...fixture, requests };
}

// Same API/state fixture pattern as bot-portal.spec.ts, kept local to this owned file.
async function integratedBotFixture(page: Page, role: "Owner" | "Viewer" = "Owner") {
  const platform = await platformFixture(page, role);
  const records: TeamRecord[] = [];
  const control = { failNextCommand: false };
  await page.route("**/api/bot-teams**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET") return route.fulfill({ json: {
      records: records.filter(record => record.space_id === url.searchParams.get("spaceId") &&
        (!url.searchParams.get("itemId") || record.id === url.searchParams.get("itemId"))), role,
    } });
    if (role === "Viewer") return route.fulfill({ status: 403, json: { error: "Read only" } });
    const body = request.postDataJSON();
    if (request.method() === "POST") {
      const record = { id: crypto.randomUUID(), space_id: body.spaceId, revision: 1, data: createTeam(body.title, body.template) };
      records.push(record);
      return route.fulfill({ json: { record } });
    }
    if (control.failNextCommand) {
      control.failNextCommand = false;
      return route.fulfill({ status: 503, json: { error: "Temporary save failure. Retry your message." } });
    }
    const record = records.find(record => record.id === body.itemId && record.space_id === body.spaceId);
    if (!record) return route.fulfill({ status: 404, json: { error: "Team unavailable" } });
    if (body.revision !== record.revision) return route.fulfill({ status: 409, json: { error: "This team changed elsewhere." } });
    record.data = applyTeamCommand(record.data, body.command, USER_ID);
    record.revision++;
    return route.fulfill({ json: { record } });
  });
  return { ...platform, teams: records, control };
}

test("generated preview executes locally without access to parent session", async ({ page }) => {
  await integratedBuilderFixture(page);
  await page.goto(`/projects/${PROJECT_ID}`);
  await page.getByRole("button", { name: "Start building", exact: true }).click();
  await page.getByLabel("Customers", { exact: true }).check();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const frame = page.frameLocator('iframe[title="Generated app preview"]');
  await expect(frame.getByRole("heading", { name: "Feedback board" })).toBeVisible();
  await frame.getByRole("button", { name: "Add feedback" }).click();
  await expect(frame.getByRole("heading", { name: "Saved locally" })).toBeVisible();
  await expect(frame.locator("body")).toHaveAttribute("data-isolated", "yes");
  await expect(page.locator("body")).not.toHaveAttribute("data-leaked", "yes");
});

test("signup requires name and matching passwords without demo login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /demo workspace/i }),
  ).toHaveCount(0);
  await page
    .getByRole("tab", { name: "Create account", exact: true })
    .click();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Enter your full name");
  await page.getByLabel("Full name").fill("Test Person");
  await page.getByLabel(/^(Work )?email$/i).fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("password-one");
  await page.getByLabel("Confirm password").fill("password-two");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account" })
    .click();
  await expect(page.getByRole("status")).toContainText("do not match");
});
test("signed out visitors cannot open projects or Bots", async ({ page }) => {
  await page.goto("/bots");
  await expect(page).toHaveURL(/\/$/);
});

test("home prompt opens BuilderV3 immediately, clarifies, builds and persists", async ({ page }) => {
  const fixture = await integratedBuilderFixture(page);
  await page.goto("/projects");
  await page.getByLabel("Build prompt").fill("Build a customer feedback portal");
  await page.getByRole("button", { name: "Build application", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/);
  const builder = page.getByRole("region", { name: "Direct builder", exact: true });
  await expect(builder).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(builder.getByRole("log")).toContainText("Build a customer feedback portal");
  expect(fixture.records).toHaveLength(2);
  expect(fixture.records[1].space_id).toBe(SPACE_ID);
  expect(fixture.records[1].data.deliveryMode).toBe("direct");
  await expect(builder.getByRole("group", { name: "Who will submit feedback?" })).toBeVisible();
  expect(fixture.requests).toHaveLength(1);
  expect(fixture.requests[0].intent).toBe("start");
  await expect(builder.getByRole("button", { name: "Start building", exact: true })).toHaveCount(0);
  expect(await page.evaluate(id => sessionStorage.getItem(`kova:build-start:${id}`), fixture.records[1].id)).toBeNull();
  await builder.getByLabel("Customers", { exact: true }).check();
  await builder.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.frameLocator('iframe[title="Generated app preview"]').getByRole("heading", { name: "Feedback board" })).toBeVisible();
  expect(fixture.requests).toHaveLength(2);
  expect(fixture.requests[0].intent).toBe("start");
  expect(fixture.requests[1].prompt).toContain("Customers");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "HTML source" })).toHaveValue(previewHtml);
  await page.reload();
  await expect(builder.getByRole("log")).toContainText("Customers");
  await expect(page.frameLocator('iframe[title="Generated app preview"]').getByRole("heading", { name: "Feedback board" })).toBeVisible();
  expect(fixture.records).toHaveLength(2);
  expect(fixture.requests).toHaveLength(2);
  await page.screenshot({ path: test.info().outputPath("editor.png"), fullPage: true });
});
test("company creation and invitation are workspace scoped", async ({
  page,
}) => {
  const fixture = await platformFixture(page);
  await page.goto("/company");
  await page
    .getByRole("button", { name: "Create company", exact: true })
    .click();
  await page.getByLabel("Company name").fill("Northstar Studio");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create company", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Northstar Studio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Invite member" }).click();
  await page.getByLabel("Email address").fill("developer@example.invalid");
  await page
    .getByRole("combobox", { name: "Invitation role", exact: true })
    .selectOption("Developer");
  await page.getByRole("button", { name: "Create invitation" }).click();
  await expect(
    page.getByRole("heading", { name: "developer@example.invalid" }),
  ).toBeVisible();
  expect(fixture.invites).toHaveLength(1);
  await page.screenshot({
    path: test.info().outputPath("company.png"),
  });
});
test("Bot directory creates a private team URL with hierarchy, retry, approvals and persistence", async ({ page }) => {
  const fixture = await integratedBotFixture(page);
  await page.goto("/bots");
  const portal = page.getByRole("region", { name: "Bot portal" });
  await portal.getByRole("button", { name: "New team", exact: true }).click();
  await portal.getByLabel("Team name").fill("Delivery coordinator");
  await portal.getByLabel("Starting point").selectOption("product");
  await portal.getByRole("button", { name: "Create team", exact: true }).click();
  await expect(page).toHaveURL(/\/bots\/[\w-]+$/);
  await expect(portal.getByRole("heading", { name: "Delivery coordinator" })).toBeVisible();
  const privateUrl = page.url();
  expect(fixture.teams).toHaveLength(1);
  expect(fixture.teams[0].space_id).toBe(SPACE_ID);
  await portal.getByRole("button", { name: "Organisation", exact: true }).click();
  await expect(portal.locator(".react-flow__node")).toHaveCount(5);
  await expect(portal.locator(".react-flow__edge")).toHaveCount(4);
  await portal.getByRole("button", { name: "Chat", exact: true }).click();
  await portal.getByRole("button", { name: "New chat", exact: true }).click();
  await portal.getByLabel("Message", { exact: true }).fill("Review the release before handoff");
  fixture.control.failNextCommand = true;
  await portal.getByRole("button", { name: "Send message" }).click();
  await expect(portal.getByRole("alert")).toContainText("Temporary save failure");
  await expect(portal.getByLabel("Message", { exact: true })).toHaveValue("Review the release before handoff");
  await portal.getByRole("button", { name: "Send message" }).click();
  await expect(portal.getByText("Simulated handoff", { exact: true })).toHaveCount(6);
  expect(fixture.teams[0].data.approvals[0].status).toBe("Pending");
  await portal.getByRole("button", { name: /^Approvals/ }).click();
  await portal.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(portal.getByText("Approved", { exact: true })).toBeVisible();
  await page.goto("/bots");
  await portal.getByRole("link", { name: /Delivery coordinator/ }).click();
  await expect(page).toHaveURL(privateUrl);
  await page.reload();
  await expect(portal.getByRole("log")).toContainText("Review the release before handoff");
  expect(fixture.teams).toHaveLength(1);
  expect(fixture.teams[0].data.approvals[0].status).toBe("Approved");
  await page.screenshot({ path: test.info().outputPath("bot.png"), fullPage: true });
});
test("mock checkout failure adds nothing and success persists exactly once", async ({
  page,
}) => {
  const fixture = await platformFixture(page);
  await page.goto("/credits");
  await page.getByRole("button", { name: "Buy demo credits" }).click();
  await page.getByLabel("Demo credits", { exact: true }).fill("2500");
  await page.getByRole("button", { name: "Simulate payment failure" }).click();
  await expect(page.getByRole("status")).toContainText("No credits were added");
  expect(fixture.records.filter((r) => r.kind === "credit")).toHaveLength(0);
  await page
    .getByRole("button", { name: "Simulate successful payment" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Simulation complete" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to credits" }).click();
  await page.reload();
  expect(fixture.records.filter((r) => r.kind === "credit")).toHaveLength(1);
  await expect(page.locator(".metric").first()).toContainText("2,500");
  await page.screenshot({
    path: test.info().outputPath("credits.png"),
  });
});
test("viewer cannot create projects Bots or purchase credits", async ({
  page,
}) => {
  await integratedBotFixture(page, "Viewer");
  await page.goto("/projects");
  await expect(
    page.getByRole("button", { name: "Build application" }),
  ).toBeDisabled();
  await page.goto("/bots");
  await expect(
    page.getByRole("button", { name: "New team", exact: true }),
  ).toBeDisabled();
  await page.goto("/credits");
  await expect(
    page.getByRole("button", { name: "Buy demo credits" }),
  ).toBeDisabled();
});
test("all platform routes render without overflow or runtime errors", async ({
  page,
}) => {
  await platformFixture(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "projects",
    "bots",
    "company",
    "approvals",
    "credits",
    "integrations",
    "settings",
  ]) {
    await page.goto(`/${path}`);
    await expect(page.locator(".platform-content")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`${path}.png`),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("AI endpoints reject unauthenticated callers", async ({ request }) => {
  const response = await request.post("/api/chat", {
    data: {
      projectId: "b0000000-0000-4000-8000-000000000001",
      prompt: "Hello",
      model: "auto",
      mode: "Guided",
      projectName: "Test",
    },
  });
  expect(response.status()).toBe(401);
  const decision = await request.post("/api/decisions", {
    data: {
      projectId: "b0000000-0000-4000-8000-000000000001",
      state: "Build a page",
    },
  });
  expect(decision.status()).toBe(401);
});
