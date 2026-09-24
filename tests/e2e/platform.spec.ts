import { test, expect } from "@playwright/test";
import { platformFixture } from "./platform-fixture";
import { PROJECT_ID } from "./platform-fixture";

test("generated preview executes locally without access to parent session", async ({
  page,
}, info) => {
  await platformFixture(page);
  await page.route("**/api/models", (route) =>
    route.fulfill({
      json: {
        models: [
          {
            id: "auto",
            name: "Auto",
            provider: "Kova",
            description: "Routing",
            speed: "Balanced",
          },
        ],
      },
    }),
  );
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      json: {
        html: '<!doctype html><html><body><h1>Feedback board</h1><button onclick="document.querySelector(\'h1\').textContent=\'Saved locally\'">Add feedback</button><script>try{parent.document.body.dataset.leaked="yes"}catch(e){document.body.dataset.isolated="yes"}</script></body></html>',
        content: "Generated prototype",
        model: "test/model",
        funding: "OpenRouter",
      },
    }),
  );
  await page.goto(`/workspace/${PROJECT_ID}`);
  if (info.project.name === "mobile")
    await page
      .getByRole("button", { name: "Conversation", exact: true })
      .click();
  await page.getByRole("button", { name: "Generate UI", exact: true }).click();
  if (info.project.name === "mobile")
    await page
      .locator(".mobile-build-tabs")
      .getByRole("button", { name: "Preview", exact: true })
      .click();
  const frame = page.frameLocator(
    'iframe[title="Generated application preview"]',
  );
  await expect(
    frame.getByRole("heading", { name: "Feedback board" }),
  ).toBeVisible();
  await frame.getByRole("button", { name: "Add feedback" }).click();
  await expect(
    frame.getByRole("heading", { name: "Saved locally" }),
  ).toBeVisible();
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
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Test Person");
  await page.getByLabel("Work email").fill("test@example.invalid");
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

test("personal project clarification PRD TRD editor and persistence", async ({
  page,
}) => {
  await platformFixture(page);
  await page.goto("/projects");
  await page
    .getByLabel("Build prompt")
    .fill("Build a customer feedback portal");
  await page.getByRole("button", { name: "Build from a prompt" }).click();
  await page.getByLabel("Project name").fill("Feedback Studio");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page
    .getByLabel("Who will use this, and what should they achieve?")
    .fill("Customers submit feedback");
  await page
    .getByLabel("What is in scope for the first release?")
    .fill("Feedback intake and review queue");
  await page
    .getByLabel("How will we know the result is successful?")
    .fill("A customer can submit and find a request");
  await page.getByRole("button", { name: "Prepare PRD" }).click();
  await expect(page.getByLabel("PRD document")).toContainText(
    "Customers submit feedback",
  );
  await page.getByRole("button", { name: "Approve PRD" }).click();
  await page.getByRole("button", { name: "Approve TRD" }).click();
  await expect(page.locator(".platform-alert.error")).toContainText(
    "placeholders",
  );
  await page
    .getByLabel("TRD document")
    .fill(
      "Architecture: HTML frontend. Data: synthetic fixtures. Tests: form input validation. Release: preview only.",
    );
  await page.getByRole("button", { name: "Approve TRD" }).click();
  await page.getByRole("button", { name: "Open project editor" }).click();
  await expect(page.locator(".workspace-shell")).toBeVisible();
  await page.screenshot({
    path: `artifacts/platform/${test.info().project.name}-editor.png`,
  });
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
    path: `artifacts/platform/${test.info().project.name}-company.png`,
  });
});
test("Bot private link, hierarchy, approval gates, pause and resume", async ({
  page,
}) => {
  await platformFixture(page);
  await page.goto("/bots");
  await page.getByRole("button", { name: "Create Bot", exact: true }).click();
  await page.getByLabel("Bot name").fill("Delivery coordinator");
  await page.getByLabel("Team structure").selectOption("Hierarchical");
  await page
    .getByLabel("Instructions", { exact: true })
    .fill("Require human review before each handoff");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create Bot", exact: true })
    .click();
  await expect(page).toHaveURL(/\/bots\/[\w-]+$/);
  await page.getByRole("button", { name: "Run simulation" }).click();
  await page.getByRole("button", { name: "Simulate failure", exact: true }).click();
  await page.getByRole("button", { name: "Retry from checkpoint", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Approve PM approval" }).click();
  await page
    .getByRole("button", { name: "Approve Developer approval" })
    .click();
  await page.getByRole("button", { name: "Approve Release approval" }).click();
  await expect(
    page.getByText("Simulation complete", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Simulation complete", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/platform/${test.info().project.name}-bot.png`,
  });
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
    path: `artifacts/platform/${test.info().project.name}-credits.png`,
  });
});
test("viewer cannot create projects Bots or purchase credits", async ({
  page,
}) => {
  await platformFixture(page, "Viewer");
  await page.goto("/projects");
  await expect(
    page.getByRole("button", { name: "Build from a prompt" }),
  ).toBeDisabled();
  await page.goto("/bots");
  await expect(
    page.getByRole("button", { name: "Create Bot", exact: true }),
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
      path: `artifacts/platform/${test.info().project.name}-${path}.png`,
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
