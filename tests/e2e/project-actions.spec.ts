import { expect, test, type Page } from "@playwright/test";
import { platformFixture, PROJECT_ID, SPACE_ID } from "./platform-fixture";
import type { Role } from "../../src/lib/platform";

async function actionsFixture(page: Page, role: Role = "Owner") {
  const fixture = await platformFixture(page, role);
  const mutations: { method: string; url: URL }[] = [];
  const control: { wait: Promise<void> | null } = { wait: null };
  await page.route("**/api/models", route => route.fulfill({
    json: { live: true, models: [{ id: "test/coder", name: "Test Coder", provider: "Test" }] },
  }));
  // The shared fixture does not implement record DELETE or single-row conflicts.
  await page.route("https://*.supabase.co/rest/v1/kova_records**", async route => {
    const request = route.request();
    const method = request.method();
    if (method !== "PATCH" && method !== "DELETE") return route.fallback();
    const url = new URL(request.url());
    mutations.push({ method, url });
    if (control.wait) await control.wait;
    if (role === "Viewer" || (method === "DELETE" && !["Owner", "Admin"].includes(role))) {
      return route.fulfill({ status: 403, json: { message: "Denied" } });
    }
    const index = fixture.records.findIndex(record =>
      url.searchParams.get("id") === `eq.${record.id}` &&
      url.searchParams.get("space_id") === `eq.${record.space_id}` &&
      url.searchParams.get("revision") === `eq.${record.revision}`);
    if (index < 0) {
      return method === "DELETE"
        ? route.fulfill({ json: [] })
        : route.fulfill({ status: 406, json: { code: "PGRST116", message: "No matching revision" } });
    }
    expect(request.headers().prefer).toContain("return=representation");
    if (method === "DELETE") {
      const [deleted] = fixture.records.splice(index, 1);
      return route.fulfill({ json: [{ id: deleted.id, space_id: deleted.space_id, revision: deleted.revision }] });
    }
    fixture.records[index] = { ...fixture.records[index], ...request.postDataJSON() };
    return route.fulfill({ json: fixture.records[index] });
  });
  await page.goto("/projects");
  return { ...fixture, mutations, control };
}

function actions(page: Page, title = "RelayDesk") {
  return page.getByRole("button", { name: `Project actions for ${title}`, exact: true });
}

async function choose(page: Page, action: string, title = "RelayDesk") {
  await actions(page, title).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test("rename validates blank and overlong names, trims and persists", async ({ page }) => {
  const fixture = await actionsFixture(page);
  await expect(actions(page)).toBeVisible();
  await choose(page, "Rename");
  const dialog = page.getByRole("dialog", { name: "Rename project" });
  const name = dialog.getByLabel("Project name", { exact: true });
  await expect(name).toBeFocused();
  for (const invalid of ["   ", "a".repeat(161)]) {
    await name.fill(invalid);
    await dialog.getByRole("button", { name: "Save name" }).click();
    await expect(dialog.getByRole("alert")).toContainText("between 1 and 160");
    expect(fixture.mutations).toHaveLength(0);
  }
  const title = "A".repeat(160);
  await name.fill(`  ${title}  `);
  await dialog.getByRole("button", { name: "Save name" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(actions(page, title)).toBeFocused();
  expect(fixture.records[0].data.title).toBe(title);
  expect(fixture.records[0].revision).toBe(2);
  expect(fixture.records[0].data.description).toBe("Track tasks with clear approvals");
  expect(fixture.mutations[0].url.searchParams.get("id")).toBe(`eq.${PROJECT_ID}`);
  expect(fixture.mutations[0].url.searchParams.get("space_id")).toBe(`eq.${SPACE_ID}`);
  expect(fixture.mutations[0].url.searchParams.get("revision")).toBe("eq.1");
  await page.reload();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
});

test("ellipsis opens a menu without archiving; archive and restore persist", async ({ page }) => {
  const fixture = await actionsFixture(page);
  await actions(page).click();
  await expect(page.getByRole("menu", { name: "Project actions" })).toBeVisible();
  expect(fixture.mutations).toHaveLength(0);
  expect(fixture.records[0].data.archived).not.toBe(true);
  await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
  await expect(actions(page)).toHaveCount(0);
  expect(fixture.records[0].data.archived).toBe(true);
  await page.getByLabel("Project status filter").selectOption("true");
  await expect(actions(page)).toBeVisible();
  await choose(page, "Restore");
  await expect(actions(page)).toHaveCount(0);
  await page.getByLabel("Project status filter").selectOption("false");
  await expect(actions(page)).toBeVisible();
  expect(fixture.records[0].data.archived).toBe(false);
  expect(fixture.records[0].revision).toBe(3);
  expect(fixture.mutations.map(m => m.url.searchParams.get("revision"))).toEqual(["eq.1", "eq.2"]);
  await page.reload();
  await expect(actions(page)).toBeVisible();
});

for (const role of ["Owner", "Admin"] as const) {
  test(`${role} deletion requires the exact name and verified scoped response`, async ({ page }) => {
    const fixture = await actionsFixture(page, role);
    await choose(page, "Delete");
    const dialog = page.getByRole("dialog", { name: "Delete project" });
    const confirm = dialog.getByLabel("Confirm project name");
    const remove = dialog.getByRole("button", { name: "Delete project", exact: true });
    await expect(confirm).toBeFocused();
    await expect(remove).toBeDisabled();
    await confirm.fill("relaydesk");
    await expect(remove).toBeDisabled();
    await confirm.fill("RelayDesk ");
    await expect(remove).toBeDisabled();
    expect(fixture.mutations).toHaveLength(0);
    await confirm.fill("RelayDesk");
    let release!: () => void;
    fixture.control.wait = new Promise<void>(resolve => { release = resolve; });
    await remove.click();
    try {
      await expect(dialog.getByRole("button", { name: "Deleting..." })).toBeDisabled();
      await expect(confirm).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeVisible();
    } finally {
      release();
    }
    await expect(dialog).toHaveCount(0);
    await expect(actions(page)).toHaveCount(0);
    expect(fixture.records).toHaveLength(0);
    expect(fixture.mutations).toHaveLength(1);
    const { method, url } = fixture.mutations[0];
    expect(method).toBe("DELETE");
    expect(url.searchParams.get("id")).toBe(`eq.${PROJECT_ID}`);
    expect(url.searchParams.get("space_id")).toBe(`eq.${SPACE_ID}`);
    expect(url.searchParams.get("revision")).toBe("eq.1");
    expect(url.searchParams.get("select")).toBe("id,space_id,revision");
    await page.reload();
    await expect(actions(page)).toHaveCount(0);
  });
}

test("menu keyboard navigation, dismissal and modal focus return work", async ({ page }, info) => {
  const fixture = await actionsFixture(page);
  const trigger = actions(page);
  await trigger.scrollIntoViewIfNeeded();
  const size = await trigger.boundingBox();
  expect(size?.width).toBeGreaterThanOrEqual(44);
  expect(size?.height).toBeGreaterThanOrEqual(44);
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Project name", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.screenshot({ path: info.outputPath("project-actions-menu.png"), fullPage: true });
  await page.getByRole("heading", { name: "What are we building?" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(fixture.mutations).toHaveLength(0);
});

test("Viewer cannot open project actions", async ({ page }) => {
  const fixture = await actionsFixture(page, "Viewer");
  await expect(actions(page)).toBeVisible();
  await expect(actions(page)).toBeDisabled();
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(fixture.mutations).toHaveLength(0);
});

test("Developer can rename and archive but has no delete action", async ({ page }) => {
  const fixture = await actionsFixture(page, "Developer");
  await actions(page).click();
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeEnabled();
  await expect(page.getByRole("menuitem", { name: "Archive" })).toBeEnabled();
  await expect(page.getByRole("menuitem", { name: "Delete" })).toHaveCount(0);
  expect(fixture.mutations).toHaveLength(0);
});

test("stale rename keeps the draft and does not overwrite a newer project", async ({ page }) => {
  const fixture = await actionsFixture(page);
  await choose(page, "Rename");
  await page.getByLabel("Project name", { exact: true }).fill("My unsaved name");
  fixture.records[0] = { ...fixture.records[0], revision: 2, data: { ...fixture.records[0].data, title: "Updated elsewhere" } };
  await page.getByRole("button", { name: "Save name" }).click();
  const dialog = page.getByRole("dialog", { name: "Rename project" });
  await expect(dialog.getByRole("alert")).toContainText("Refresh before retrying");
  await expect(dialog.getByLabel("Project name", { exact: true })).toHaveValue("My unsaved name");
  await expect(dialog.getByRole("button", { name: "Save name" })).toBeEnabled();
  expect(fixture.records[0].data.title).toBe("Updated elsewhere");
  expect(fixture.mutations[0].url.searchParams.get("revision")).toBe("eq.1");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await page.reload();
  await expect(actions(page, "Updated elsewhere")).toBeVisible();
});

test("stale deletion returning no row keeps the project and shows an error", async ({ page }) => {
  const fixture = await actionsFixture(page);
  await choose(page, "Delete");
  await page.getByLabel("Confirm project name").fill("RelayDesk");
  fixture.records[0] = { ...fixture.records[0], revision: 2 };
  const dialog = page.getByRole("dialog", { name: "Delete project" });
  await dialog.getByRole("button", { name: "Delete project", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Could not confirm deletion");
  await expect(dialog.getByRole("button", { name: "Delete project", exact: true })).toBeEnabled();
  expect(fixture.records).toHaveLength(1);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(actions(page)).toBeVisible();
  await page.reload();
  await expect(actions(page)).toBeVisible();
});
