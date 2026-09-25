import { test, expect, type Page } from "@playwright/test";
import { platformFixture, SPACE_ID, USER_ID } from "./platform-fixture";
import { onboardingKey } from "../../src/lib/onboarding-intent";

const COMPANY_ID = "d0000000-0000-4000-8000-000000000002";
const COMPANY_PROJECT_ID = "b0000000-0000-4000-8000-000000000002";
const activeKey = `kova:active:${USER_ID}`;

async function workspaces(page: Page) {
  const fixture = await platformFixture(page);
  fixture.spaces.push({ id: COMPANY_ID, name: "Company workspace", kind: "company", owner_id: USER_ID });
  fixture.records.push({ ...fixture.records[0], id: COMPANY_PROJECT_ID, space_id: COMPANY_ID,
    data: { ...fixture.records[0].data, title: "Company roadmap" } });
  await page.route("**/rest/v1/kova_members**", async (route) => {
    const company = new URL(route.request().url()).searchParams.get("space_id") === `eq.${COMPANY_ID}`;
    const member = { space_id: company ? COMPANY_ID : SPACE_ID, user_id: USER_ID, role: company ? "Viewer" : "Owner" };
    await route.fulfill({ json: route.request().headers().accept?.includes("object+json") ? member : [member] });
  });
  await page.route("**/api/providers**", (route) => route.fulfill({ json: { connections: [], providers: [] } }));
  await page.route("**/api/models**", (route) => route.fulfill({ json: { models: [], live: false } }));
  return fixture;
}

async function navigate(page: Page, name: string) {
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  if (!await navigation.isVisible()) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await navigation.getByRole("link", { name, exact: true }).click();
}

async function seedIntent(page: Page, intent: "individual" | "organisation", remembered: string, invalid = false) {
  await page.addInitScript(({ key, active, remembered, intent, invalid }) => {
    // Seed once so reload/navigation can test the persisted outcome rather than resetting it.
    if (sessionStorage.getItem("workspace-selection-seeded")) return;
    sessionStorage.setItem("workspace-selection-seeded", "1");
    sessionStorage.setItem(active, remembered);
    sessionStorage.setItem(key, JSON.stringify({ version: 1, id: "e0000000-0000-4000-8000-000000000001",
      intent, action: invalid ? "create-company" : "select-workspace", organisationName: invalid ? "a".repeat(81) : null,
      email: "qa@example.invalid", createdAt: Date.now() }));
  }, { key: onboardingKey, active: activeKey, remembered, intent, invalid });
}

for (const [intent, remembered, selected, heading] of [
  ["individual", COMPANY_ID, SPACE_ID, "RelayDesk"],
  ["organisation", SPACE_ID, COMPANY_ID, "Company roadmap"],
] as const) {
  test(`${intent} sign-in overrides remembered workspace and persists selection`, async ({ page }) => {
    await workspaces(page);
    await seedIntent(page, intent, remembered);
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), activeKey)).toBe(selected);
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), onboardingKey)).toBeNull();

    // An item route changes itemId and reruns platform initialization on the persistent shell.
    await page.route("**/api/build-chat**", (route) => route.fulfill({ status: 503, json: { error: "Builder disabled in workspace selection fixture" } }));
    await page.getByRole("heading", { name: heading, exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
    await navigate(page, "Projects");
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Active workspace", includeHidden: true })).toHaveValue(selected);
    await page.reload();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Active workspace", includeHidden: true })).toHaveValue(selected);
  });
}

for (const endpoint of ["kova_records", "kova_invites"] as const) {
  test(`late ${endpoint} response cannot overwrite another workspace`, async ({ page }) => {
    await workspaces(page);
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "RelayDesk", exact: true })).toBeVisible();
    let release!: () => void;
    let intercepted!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { intercepted = resolve; });
    let held = false;
    await page.route(`**/rest/v1/${endpoint}**`, async (route) => {
      const scope = new URL(route.request().url()).searchParams.get("space_id");
      if (scope === `eq.${SPACE_ID}` && !held) {
        held = true;
        intercepted();
        await gate;
      }
      await route.fallback();
    });
    try {
      await navigate(page, "Inbox");
      await started;
      const navigation = page.getByRole("navigation", { name: "Main navigation" });
      if (!await navigation.isVisible()) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await page.getByRole("combobox", { name: "Active workspace" }).selectOption(COMPANY_ID);
      await navigate(page, "Projects");
      await expect(page.getByRole("heading", { name: "Company roadmap", exact: true })).toBeVisible();
      await expect(page.getByRole("banner").locator(".status-chip")).toHaveText("Viewer");

      // Wait for the old load's last HTTP response and a render, so the assertion observes its attempted commit.
      const oldLoadFinished = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname.endsWith("/kova_invites") && url.searchParams.get("space_id") === `eq.${SPACE_ID}`;
      });
      release();
      await (await oldLoadFinished).finished();
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole("combobox", { name: "Active workspace", includeHidden: true })).toHaveValue(COMPANY_ID);
      await expect(page.getByRole("heading", { name: "Company roadmap", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "RelayDesk", exact: true })).toHaveCount(0);
      await expect(page.getByRole("banner").locator(".status-chip")).toHaveText("Viewer");
      await expect(page.getByRole("textbox", { name: "Build prompt" })).toBeDisabled();
      await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), activeKey)).toBe(COMPANY_ID);
    } finally { release(); }
  });
}

test("invalid organisation intent is explained and consumed after workspace load", async ({ page }) => {
  await workspaces(page);
  await seedIntent(page, "organisation", SPACE_ID, true);
  let creates = 0;
  await page.route("**/rpc/kova_create_company_once", async (route) => { creates++; await route.fulfill({ status: 400, json: { message: "Unexpected company creation" } }); });
  await page.goto("/projects");
  await expect(page.getByText("Your previous sign-in choice expired or was invalid. Choose a workspace below.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "RelayDesk", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), onboardingKey)).toBeNull();
  expect(creates).toBe(0);
});

test("organisation signup input matches the 80-character onboarding limit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Create account", exact: true }).click();
  await page.getByRole("radio", { name: "Organisation", exact: true }).check();
  await expect(page.getByLabel("Organisation name", { exact: true })).toHaveAttribute("maxlength", "80");
});
