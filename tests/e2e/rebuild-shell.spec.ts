import { test, expect } from "@playwright/test";
import { platformFixture, SPACE_ID } from "./platform-fixture";
import { createTeam } from "../../src/lib/bot-teams";
import type { RecordData } from "../../src/lib/platform";

test("navigation preserves shell, profile opens and usage is visible", async ({
  page,
}) => {
  await platformFixture(page);
  await page.route("**/api/account-usage", (r) =>
    r.fulfill({ json: { requestsUsed: 3, requestLimit: 10 } }),
  );
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "What are we building?" }),
  ).toBeVisible();
  await page
    .locator(".platform-rail")
    .evaluate((el) => el.setAttribute("data-test-persistent", "yes"));
  const navigate = async (name: string) => {
    if (test.info().project.name === "mobile")
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name, exact: true })
      .click();
  };
  await navigate("Credits & usage");
  await expect(page.locator(".platform-rail")).toHaveAttribute(
    "data-test-persistent",
    "yes",
  );
  await expect(page.getByText("Opening your workspace...")).toHaveCount(0);
  await navigate("Projects");
  await page
    .getByRole("button", { name: "Account and usage", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Your account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Daily AI requests used" }),
  ).toHaveAttribute("value", "3");
  await page.screenshot({
    path: `artifacts/rebuild/${test.info().project.name}-profile.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Close profile menu" })
    .click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole("region", { name: "Your account" })).toHaveCount(
    0,
  );
});

test("model catalog searches families beyond two choices", async ({ page }) => {
  await platformFixture(page);
  await page.route("**/api/models", (r) =>
    r.fulfill({
      json: {
        live: true,
        models: [
          { id: "qwen/test", name: "Qwen Test", provider: "Qwen" },
          { id: "google/test", name: "Gemini Test", provider: "Google" },
        ],
      },
    }),
  );
  await page.goto("/projects");
  await page.getByRole("button", { name: "Choose model", exact: true }).click();
  await page.getByLabel("Search models").fill("Qwen");
  await page.getByRole("button", { name: /Qwen Test/ }).click();
  await expect(
    page.getByRole("button", { name: "Choose model", exact: true }),
  ).toContainText("Qwen Test");
  await page.screenshot({
    path: `artifacts/rebuild/${test.info().project.name}-home.png`,
    fullPage: true,
  });
});

test("inbox refreshes Bot decisions created after the shell loaded", async ({
  page,
}) => {
  const fixture = await platformFixture(page);
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "What are we building?" }),
  ).toBeVisible();
  const team = createTeam("Review team", "product");
  team.approvals.push({
    id: "approval-1",
    chatId: "chat-1",
    title: "Review proposal",
    status: "Pending",
  });
  const id = "e0000000-0000-4000-8000-000000000002";
  fixture.records.push({
    id,
    space_id: SPACE_ID,
    kind: "bot",
    revision: 1,
    data: team as unknown as RecordData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (test.info().project.name === "mobile")
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Inbox", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review team" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Review", exact: true }),
  ).toHaveAttribute("href", `/bots/${id}`);
});
