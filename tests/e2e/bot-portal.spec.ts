import { test, expect, type Page } from "@playwright/test";
import { platformFixture, SPACE_ID, USER_ID } from "./platform-fixture";
import {
  applyTeamCommand,
  createTeam,
  type TeamRecord,
} from "../../src/lib/bot-teams";
const TEAM_ID = "e0000000-0000-4000-8000-000000000001";

async function botFixture(page: Page, role: "Owner" | "Viewer" = "Owner") {
  await platformFixture(page, role);
  const records: TeamRecord[] = [
    {
      id: TEAM_ID,
      space_id: SPACE_ID,
      revision: 1,
      data: createTeam("Product operations", "product"),
    },
  ];
  await page.route("**/api/bot-teams**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET")
      return route.fulfill({
        json: {
          records: records.filter(
            (r) =>
              r.space_id === url.searchParams.get("spaceId") &&
              (!url.searchParams.get("itemId") ||
                r.id === url.searchParams.get("itemId")),
          ),
          role,
        },
      });
    if (role === "Viewer")
      return route.fulfill({ status: 403, json: { error: "Read only" } });
    const body = request.postDataJSON();
    if (request.method() === "POST") {
      const record = {
        id: crypto.randomUUID(),
        space_id: body.spaceId,
        revision: 1,
        data: createTeam(body.title, body.template),
      };
      records.push(record);
      return route.fulfill({ json: { record } });
    }
    const record = records.find(
      (r) => r.id === body.itemId && r.space_id === body.spaceId,
    );
    if (!record)
      return route.fulfill({
        status: 404,
        json: { error: "Team unavailable" },
      });
    if (body.revision !== record.revision)
      return route.fulfill({
        status: 409,
        json: { error: "This team changed elsewhere. Reload before retrying." },
      });
    try {
      record.data = applyTeamCommand(record.data, body.command, USER_ID);
      record.revision++;
      return route.fulfill({ json: { record } });
    } catch (e) {
      return route.fulfill({ status: 400, json: { error: String(e) } });
    }
  });
  return records;
}

test("Bot portal chat, handoffs, artifacts, approvals and reload", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const records = await botFixture(page);
  await page.goto(`/bots/${TEAM_ID}`);
  const portal = page.getByRole("region", { name: "Bot portal" });
  await portal.getByRole("button", { name: "New chat", exact: true }).click();
  await portal
    .getByLabel("Message", { exact: true })
    .fill("Prepare an onboarding review");
  await portal.getByRole("button", { name: "Send message" }).click();
  await expect(
    portal.getByText("Simulated handoff", { exact: true }),
  ).toHaveCount(6);
  await portal.getByLabel("Inter-Bot messages").uncheck();
  await expect(
    portal.getByText("Simulated handoff", { exact: true }),
  ).toHaveCount(0);
  await portal.getByLabel("Inter-Bot messages").check();
  await page.screenshot({
    path: `/tmp/bot-portal-${info.project.name}-chat.png`,
    fullPage: true,
  });
  await portal.getByRole("button", { name: "Artifacts", exact: true }).click();
  await expect(portal.locator("pre")).toContainText(
    "not researched or executed work",
  );
  await portal.getByRole("button", { name: /^Approvals/ }).click();
  await portal.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(portal.getByText("Approved", { exact: true })).toBeVisible();
  await portal.getByRole("button", { name: "Tasks", exact: true }).click();
  await portal.getByRole("checkbox").click();
  await expect(portal.getByRole("checkbox")).toBeChecked();
  await expect(portal.getByText("Done", { exact: true })).toBeVisible();
  await page.reload();
  await expect(portal.getByRole("log")).toContainText(
    "Prepare an onboarding review",
  );
  expect(records[0].data.approvals[0].status).toBe("Approved");
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test("Bot organisation config, drag, relationships, save and direct chat", async ({
  page,
}, info) => {
  const records = await botFixture(page);
  await page.goto(`/bots/${TEAM_ID}`);
  const portal = page.getByRole("region", { name: "Bot portal" });
  await portal
    .getByRole("button", { name: "Organisation", exact: true })
    .click();
  await expect(portal.locator(".react-flow__node")).toHaveCount(5);
  await expect(portal.locator(".react-flow__edge")).toHaveCount(4);
  if (info.project.name === "chromium") {
    const node = portal.locator(".react-flow__node").first();
    const box = await node.boundingBox();
    if (!box) throw Error("Graph node missing");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 35,
      box.y + box.height / 2 + 30,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect(portal.getByRole("status")).toContainText("Unsaved");
  }
  await portal.getByRole("button", { name: "Add Bot", exact: true }).click();
  await portal.getByLabel("Name", { exact: true }).fill("Security review");
  await portal
    .getByLabel("Instructions", { exact: true })
    .fill("Review supplied access requirements.");
  await portal.getByLabel("Model", { exact: true }).fill("custom/reviewer");
  await portal.getByLabel("Memory scope").selectOption("team");
  await portal.getByLabel("Propose handoffs").uncheck();
  await portal.getByRole("button", { name: "Save organisation" }).click();
  await expect(portal.getByRole("status")).toHaveText("Saved");
  await page.screenshot({
    path: `/tmp/bot-portal-${info.project.name}-graph.png`,
    fullPage: true,
  });
  await page.reload();
  await portal
    .getByRole("button", { name: "Organisation", exact: true })
    .click();
  const bot = records[0].data.config.bots.find(
    (b) => b.name === "Security review",
  )!;
  await portal.getByLabel("Team member").selectOption(bot.id);
  await expect(portal.getByLabel("Model", { exact: true })).toHaveValue(
    "custom/reviewer",
  );
  await expect(portal.getByLabel("Propose handoffs")).not.toBeChecked();
  await portal.locator("summary").click();
  await portal
    .getByRole("button", { name: "Coordinator → Product Handoff", exact: true })
    .click();
  await portal.getByLabel("Relationship label").fill("Review request");
  await portal.getByRole("button", { name: "Save organisation" }).click();
  await expect(portal.getByRole("status")).toHaveText("Saved");
  expect(
    records[0].data.config.relationships.some(
      (r) => r.label === "Review request",
    ),
  ).toBe(true);
  await portal.getByRole("button", { name: "Chat", exact: true }).click();
  await portal.getByLabel("New chat with").selectOption(bot.id);
  await portal.getByRole("button", { name: "New chat", exact: true }).click();
  await portal
    .getByLabel("Message", { exact: true })
    .fill("Review permission boundaries");
  await portal.getByRole("button", { name: "Send message" }).click();
  await expect(portal.getByRole("log")).toContainText("Security review");
  await expect(
    portal.getByText("Simulated handoff", { exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("Viewer can inspect but cannot configure, chat, or approve", async ({
  page,
}) => {
  await botFixture(page, "Viewer");
  await page.goto(`/bots/${TEAM_ID}`);
  const portal = page.getByRole("region", { name: "Bot portal" });
  await expect(
    portal.getByRole("button", { name: "New chat", exact: true }),
  ).toBeDisabled();
  await portal
    .getByRole("button", { name: "Organisation", exact: true })
    .click();
  await expect(
    portal.getByRole("button", { name: "Add Bot", exact: true }),
  ).toBeDisabled();
  await expect(portal.getByLabel("Team name")).toBeDisabled();
  await expect(portal.locator(".react-flow__node.draggable")).toHaveCount(0);
});

test("Blank team creation and stale save keep user changes reviewable", async ({
  page,
}) => {
  const records = await botFixture(page);
  await page.goto("/bots");
  const portal = page.getByRole("region", { name: "Bot portal" });
  await portal.getByRole("button", { name: "New team", exact: true }).click();
  await portal.getByLabel("Team name").fill("Blank team");
  await portal
    .getByRole("button", { name: "Create team", exact: true })
    .click();
  await expect(
    portal.getByRole("heading", { name: "Blank team" }),
  ).toBeVisible();
  await portal
    .getByRole("button", { name: "Organisation", exact: true })
    .click();
  await expect(portal.locator(".react-flow__node")).toHaveCount(1);
  await portal.getByRole("button", { name: "Add Bot", exact: true }).click();
  records[1].revision++;
  await portal.getByRole("button", { name: "Save organisation" }).click();
  await expect(portal.getByRole("alert")).toContainText("changed elsewhere");
  await expect(portal.getByRole("status")).toHaveText("Unsaved changes");
  await expect(portal.getByLabel("Name", { exact: true })).toHaveValue(
    "New Bot",
  );
});
