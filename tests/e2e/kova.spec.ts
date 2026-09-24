import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue with demo workspace" }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("moves from a project prompt through verification and release", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop workspace journey");

  await page.getByRole("button", { name: "Open RelayDesk" }).click();
  await expect(page).toHaveURL(/\/workspace\/relaydesk$/);
  await expect(page.getByText("AI triage is active")).toBeVisible();

  await page.getByLabel("Build prompt").fill("Add a clear approval state to the AI triage queue and verify it.");
  await page.getByRole("button", { name: "Send prompt" }).click();
  await expect(page.getByText("Kova is building")).toBeVisible();
  await expect(page.getByText(/Demo · 6 files changed/)).toBeVisible({ timeout: 15_000 });

  await page.getByText("AI triage is active").click();
  await expect(page.getByRole("complementary", { name: "Selected preview element" })).toContainText("Context Lens");
  await expect(page.getByRole("complementary", { name: "Selected preview element" })).toContainText("AI triage queue banner");
  await page.getByRole("button", { name: "Close selection" }).click();

  await page.getByRole("complementary", { name: "Project sections" }).getByRole("button", { name: "Agents" }).click();
  await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Triage agent/ })).toBeVisible();

  await page.getByRole("complementary", { name: "Project sections" }).getByRole("button", { name: /Tests/ }).click();
  await page.getByRole("button", { name: "Run all tests" }).click();
  await expect(page.getByText("All verification passed")).toBeVisible({ timeout: 5_000 });

  await page.getByRole("complementary", { name: "Project sections" }).getByRole("button", { name: "Git & PR" }).click();
  await page.getByRole("button", { name: "Create pull request" }).last().click();
  await expect(page.getByRole("button", { name: "PR #48 created" })).toBeVisible();

  await page.getByRole("complementary", { name: "Project sections" }).getByRole("button", { name: "Deploy" }).click();
  await page.getByRole("button", { name: "Deploy to production" }).click();
  await expect(page.getByText("Production is live")).toBeVisible({ timeout: 5_000 });
});

test("keeps all project sections reachable on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile workspace journey");

  await page.getByRole("button", { name: "Open RelayDesk" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile project sections" })).toBeVisible();
  await page.getByRole("navigation", { name: "Mobile project sections" }).getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("dialog", { name: "More project sections" })).toBeVisible();
  await page.getByRole("dialog", { name: "More project sections" }).getByRole("button", { name: "Deploy" }).click();
  await expect(page.getByRole("heading", { name: "Deploy" })).toBeVisible();

  const bodyWidth = await page.locator("body").evaluate((element) => element.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
});
