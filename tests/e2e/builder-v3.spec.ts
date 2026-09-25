import { test, expect, type Page } from "@playwright/test";
import { platformFixture, PROJECT_ID } from "./platform-fixture";
import { applyBuildResponse, changeBuilderHtml, initialBuilder, reviseArtifact, approveArtifact } from "../../src/lib/build-context";
import type { BuilderProject, BuildResponse } from "../../src/lib/build-context";
import type { Role } from "../../src/lib/platform";
import { themeTokens } from "../../src/lib/theme";

const html = `<!doctype html><html lang="en"><head><title>Planting calendar</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px Arial;padding:24px;color:#24372a;background:#f6faf7}button{padding:12px;background:#276d47;color:white;border:0;border-radius:5px}</style></head><body><h1>Planting calendar</h1><p>Local garden plan</p><button onclick="document.querySelector('h1').textContent='Plant added'">Add plant</button><script>try{parent.document.body.dataset.builderLeaked='yes'}catch(e){document.body.dataset.isolated='yes'}fetch('https://example.invalid/blocked').catch(()=>document.body.dataset.network='blocked')</script></body></html>`;

async function builderFixture(page: Page, options: { role?: Role; fail?: boolean; catalogLive?: boolean; delivery?: boolean; legacy?: boolean; autoStart?: boolean } = {}) {
  const fixture = await platformFixture(page, options.role || "Owner");
  const project = fixture.records[0] as BuilderProject;
  const workspace = project.data.workspace;
  project.data = { title: "Garden planner", description: "Build a planting calendar for my garden", model: "auto", deliveryMode: options.delivery ? "delivery" : "direct", ...(options.legacy ? { workspace } : {}) };
  if (options.autoStart) await page.addInitScript((id) => {
    if (!sessionStorage.getItem("builder-test-home-submitted")) {
      sessionStorage.setItem(`kova:build-start:${id}`, "1");
      sessionStorage.setItem("builder-test-home-submitted", "1");
    }
  }, PROJECT_ID);
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/models", (route) => route.fulfill({ json: { live: options.catalogLive !== false, models: [{ id: "vendor/coder", name: "Garden Coder", provider: "Vendor" }] } }));
  await page.route("**/api/providers?*", (route) => route.fulfill({ json: { available: true, canManage: true, connections: [] } }));
  await page.route("**/api/build-chat**", async (route) => {
    const request = route.request();
    const memory = [{ id: "m1", title: "Garden preferences", content: "Use metric units." }];
    if (request.method() === "GET") return route.fulfill({ json: { project, memory } });
    const body = request.postDataJSON();
    requests.push(body);
    if (options.fail) return route.fulfill({ status: 502, json: { error: "Selected model unavailable. No model was substituted." } });
    const state = initialBuilder(project);
    if (request.method() === "PATCH") {
      if (body.action === "save-artifact") project.data.builder = reviseArtifact(state, body.kind, body.content, "user");
      else if (body.action === "approve-artifact") project.data.builder = approveArtifact(state, body.kind, "user", options.role || "Owner");
      else {
      const source = body.action === "rollback" ? state.snapshots.find((snapshot) => snapshot.id === body.snapshotId)!.html : body.html;
      project.data.builder = changeBuilderHtml(state, source, body.action === "rollback" ? "Saved revision restored" : "Manual code saved", body.action);
      }
    } else {
      const result: BuildResponse = state.messages.some((message) => message.role === "assistant")
        ? { action: "build", message: "Created a local planting calendar. No backend is connected.", html }
        : { action: "ask", message: "I need your growing climate to choose the planting seasons.", questions: [{ id: "climate", text: "Which climate should your planting calendar use?", options: ["Tropical", "Temperate"] }] };
      project.data.builder = { ...applyBuildResponse(state, result, "vendor/coder", body.prompt), routing: { requestedModel: "auto", selectedModel: "vendor/coder", policy: "catalog-policy", reason: "Code-labelled model selected from live catalog." } };
    }
    project.revision++;
    return route.fulfill({ json: { project, memory } });
  });
  await page.goto(`/projects/${PROJECT_ID}`);
  return { project, requests };
}

test("direct builder starts explicitly, asks task-specific questions, saves and isolates preview", async ({ page }) => {
  const fixture = await builderFixture(page);
  await expect(page.getByRole("region", { name: "Direct builder", exact: true })).toBeVisible();
  await expect(page.getByText("Build a planting calendar for my garden", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start building", exact: true })).toBeEnabled();
  expect(fixture.requests).toHaveLength(0);
  await expect(page.getByRole("button", { name: /Prepare PRD|Approve TRD/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Start building", exact: true }).click();
  await page.getByLabel("Tropical", { exact: true }).check();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const preview = page.frameLocator('iframe[title="Generated app preview"]');
  await expect(preview.getByRole("heading", { name: "Planting calendar" })).toBeVisible();
  await preview.getByRole("button", { name: "Add plant" }).click();
  await expect(preview.getByRole("heading", { name: "Plant added" })).toBeVisible();
  await expect(preview.locator("body")).toHaveAttribute("data-isolated", "yes");
  await expect(preview.locator("body")).toHaveAttribute("data-network", "blocked");
  await expect(page.locator("body")).not.toHaveAttribute("data-builder-leaked", "yes");
  expect(fixture.requests[0].model).toBe("auto");
  expect(fixture.requests[1].prompt).toContain("Tropical");
  await page.getByRole("tab", { name: "Memory", exact: true }).click();
  await expect(page.getByText("Use metric units.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.screenshot({ path: test.info().outputPath("builder-preview.png"), fullPage: true });
  await page.reload();
  await expect(page.frameLocator('iframe[title="Generated app preview"]').getByRole("heading", { name: "Planting calendar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start building", exact: true })).toHaveCount(0);
  expect(fixture.requests).toHaveLength(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("manual edits, labelled local validation, export, and rollback work without AI", async ({ page }) => {
  const fixture = await builderFixture(page);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.getByRole("textbox", { name: "HTML source" }).fill(html);
  await page.getByRole("button", { name: "Validate HTML", exact: true }).click();
  await expect(page.getByText("Local HTML checks only", { exact: true })).toBeVisible();
  await expect(page.getByText("These checks do not execute JavaScript or test a backend.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save code", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "HTML source" }).fill(html.replace("Local garden plan", "Revised garden plan"));
  await page.getByRole("button", { name: "Save code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save code", exact: true })).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("Garden-planner.html");
  await page.getByRole("tab", { name: "Activity", exact: true }).click();
  await page.getByRole("button", { name: "Restore Before manual code saved", exact: true }).click();
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "HTML source" })).toHaveValue(html);
  expect(fixture.requests.every((request) => request.action === "edit" || request.action === "rollback")).toBeTruthy();
});

test("provider failure retains the unsent message and never claims a build", async ({ page }) => {
  await builderFixture(page, { fail: true });
  await page.getByRole("textbox", { name: "Message to builder" }).fill("Use a month view");
  await page.getByRole("button", { name: "Start building", exact: true }).click();
  await expect(page.getByRole("region", { name: "Direct builder", exact: true }).getByRole("alert")).toContainText("Selected model unavailable");
  await expect(page.getByRole("textbox", { name: "Message to builder" })).toHaveValue("Use a month view");
  await expect(page.locator('iframe[title="Generated app preview"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reload saved state", exact: true })).toBeVisible();
});

test("Viewer cannot start AI or edit source", async ({ page }) => {
  const fixture = await builderFixture(page, { role: "Viewer" });
  await expect(page.getByRole("button", { name: "Start building", exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "HTML source" })).toHaveAttribute("readonly", "");
  expect(fixture.requests).toHaveLength(0);
});
test("delivery documents gate builds and PRD revision invalidates downstream review", async ({ page }) => {
  await builderFixture(page, { delivery: true });
  await expect(page.getByRole("button", { name: "Build approved plan", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "PRD document", exact: true }).fill("Gardeners need a planting calendar. Scope: monthly planning. Acceptance: a plant can be added.");
  await page.getByRole("button", { name: "Save PRD", exact: true }).click();
  await page.getByRole("button", { name: "Approve PRD", exact: true }).click();
  await page.getByRole("tab", { name: "TRD", exact: true }).click();
  await page.getByRole("textbox", { name: "TRD document", exact: true }).fill("Architecture: inline HTML, CSS and JavaScript. Data: in-memory plants. Validation: planned local browser checks.");
  await page.getByRole("button", { name: "Save TRD", exact: true }).click();
  await page.getByRole("button", { name: "Approve TRD", exact: true }).click();
  await expect(page.getByRole("button", { name: "Build approved plan", exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Build approved plan", exact: true })).toBeEnabled();
  await page.getByRole("textbox", { name: "PRD document", exact: true }).fill("Revised scope: annual planting calendar. Acceptance: gardeners can add plants and filter by year.");
  await expect(page.getByRole("button", { name: "Approve PRD", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Save PRD", exact: true }).click();
  await expect(page.getByRole("button", { name: "Build approved plan", exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "TRD", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "TRD document", exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByText("PRD changed. Revise and save this TRD against the approved PRD.", { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("delivery-review.png"), fullPage: true });
});
test("delivery PM can prepare PRD but cannot edit TRD; direct has no review tabs", async ({ page }) => {
  await builderFixture(page, { delivery: true, role: "PM" });
  await expect(page.getByRole("textbox", { name: "PRD document", exact: true })).toBeEditable();
  await page.getByRole("tab", { name: "TRD", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "TRD document", exact: true })).toHaveAttribute("readonly", "");
});
test("home submission intent runs once and failed calls require manual retry", async ({ page }) => {
  const fixture = await builderFixture(page, { autoStart: true, fail: true });
  await expect(page.getByRole("region", { name: "Direct builder", exact: true }).getByRole("alert")).toContainText("Selected model unavailable");
  expect(fixture.requests).toHaveLength(1);
  expect(await page.evaluate((id) => sessionStorage.getItem(`kova:build-start:${id}`), PROJECT_ID)).toBeNull();
  await page.reload();
  await expect(page.getByRole("button", { name: "Start building", exact: true })).toBeEnabled();
  expect(fixture.requests).toHaveLength(1);
  await expect(page.getByRole("tab", { name: "PRD", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Project tools", exact: true })).toHaveCount(0);
});
test("legacy workspace remains linked only for projects with saved workspace data", async ({ page }) => {
  await builderFixture(page, { legacy: true });
  await expect(page.getByRole("link", { name: "Project tools", exact: true })).toHaveAttribute("href", `/workspace/${PROJECT_ID}`);
});
test("catalog failure consumes home intent without making a paid request", async ({ page }) => {
  const fixture = await builderFixture(page, { autoStart: true, catalogLive: false });
  await expect(page.getByText("Live model catalog unavailable. AI is unavailable until it returns.", { exact: true })).toBeVisible();
  expect(await page.evaluate((id) => sessionStorage.getItem(`kova:build-start:${id}`), PROJECT_ID)).toBeNull();
  expect(fixture.requests).toHaveLength(0);
});
test("builder follows light and dark theme tokens while preview keeps its own white canvas", async ({ page }) => {
  await builderFixture(page);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.getByRole("textbox", { name: "HTML source" }).fill("<!doctype html><html><body><h1>Independent preview</h1></body></html>");
  await page.getByRole("button", { name: "Save code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save code", exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  for (const preset of ["silver", "graphite"]) {
    const tokens = themeTokens({ preset, overrides: {} });
    const colors = await page.evaluate(({ tokens, preset }) => {
      const html = document.documentElement;
      html.dataset.theme = preset === "silver" ? "light" : "dark";
      for (const [key, value] of Object.entries(tokens)) html.style.setProperty(`--${key}`, value);
      const root = document.querySelector('[aria-label="Direct builder"]')!;
      const rootStyle = getComputedStyle(root);
      const probe = document.createElement("span");
      root.append(probe);
      const resolve = (token: string) => { probe.style.color = `var(--${token})`; return getComputedStyle(probe).color; };
      const result = { background: rootStyle.backgroundColor, expectedBackground: resolve("surface"), color: rootStyle.color, expectedColor: resolve("text"), font: rootStyle.fontFamily, expectedFont: getComputedStyle(document.body).fontFamily,
        inputBackground: getComputedStyle(root.querySelector('textarea[aria-label="Message to builder"]')!).backgroundColor,
        iframeBackground: getComputedStyle(root.querySelector("iframe")!).backgroundColor };
      probe.remove(); return result;
    }, { tokens, preset });
    expect(colors.background).toBe(colors.expectedBackground);
    expect(colors.color).toBe(colors.expectedColor);
    expect(colors.inputBackground).toBe(colors.expectedBackground);
    expect(colors.font).toBe(colors.expectedFont);
    expect(colors.iframeBackground).toBe("rgb(255, 255, 255)");
    await expect.poll(() => page.getByRole("button", { name: "Export HTML", exact: true }).evaluate((button) => getComputedStyle(button).backgroundColor)).toBe(colors.expectedBackground);
    await page.screenshot({ path: test.info().outputPath(`builder-${preset}.png`), fullPage: true });
  }
});
