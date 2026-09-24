import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.KOVA_REVIEW_URL || "http://127.0.0.1:3100";
const output = "artifacts/redesign";
await mkdir(output, { recursive: true });
await mkdir("public/previews", { recursive: true });
const browser = await chromium.launch();
const report = [];
const views = ["build", "plan", "agents", "data", "tests", "git", "deploy", "activity", "settings"];

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1920, height: 1080 }, { width: 320, height: 740 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.getByRole("button", { name: "Continue with demo workspace" }).click();
    await page.getByRole("button", { name: "Open RelayDesk", exact: true }).waitFor();
    if (viewport.width === 1440) {
      await page.screenshot({ path: `${output}/desktop-projects.png` });
      await page.getByRole("button", { name: "New project", exact: true }).click();
      await page.screenshot({ path: `${output}/desktop-new-project.png` });
      await page.getByRole("button", { name: "Close dialog" }).click();
    }
    for (const view of views) {
      await page.goto(`${base}/workspace/relaydesk?view=${view}`);
      await page.locator(`.workspace-main.view-${view}`).waitFor();
      if (view === "agents") await page.locator(".react-flow__node").first().waitFor();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const dimensions = await page.evaluate(() => {
        const main = document.querySelector(".workspace-main");
        return { body: document.body.scrollWidth, viewport: innerWidth, main: main.scrollWidth, available: main.clientWidth };
      });
      if (dimensions.body > dimensions.viewport + 1 || dimensions.main > dimensions.available + 1) throw new Error(`Overflow: ${viewport.width} / ${view} / ${JSON.stringify(dimensions)}`);
      if ([1440, 390].includes(viewport.width)) await page.screenshot({ path: `${output}/${viewport.width === 1440 ? "desktop" : "mobile"}-${view}.png`, scale: "css" });
      if (viewport.width === 1440 && view === "build") await page.locator(".relay-app").screenshot({ path: "public/previews/application.png" });
      if (viewport.width === 1440 && view === "agents") await page.locator(".agent-canvas").screenshot({ path: "public/previews/workflow.png" });
      report.push({ viewport: viewport.width, view, overflow: false });
    }
    if (viewport.width === 1440) {
      for (const name of ["Models", "Environment", "Members", "Appearance"]) {
        await page.getByRole("navigation", { name: "Settings sections" }).getByRole("button", { name, exact: true }).click();
        await page.screenshot({ path: `${output}/desktop-settings-${name.toLowerCase()}.png` });
      }
      await page.getByRole("button", { name: "Silver" }).click();
      await page.goto(`${base}/workspace/relaydesk?view=plan`);
      await page.locator(".workspace-main.view-plan").waitFor();
      await page.screenshot({ path: `${output}/desktop-silver.png` });
      await page.evaluate(() => { localStorage.removeItem("kova:appearance:v3"); localStorage.setItem("kova:theme:v2", "dark"); });
      await page.goto(`${base}/design-system`);
      await page.screenshot({ path: `${output}/design-system-v2.png`, fullPage: true });
    }
    if (errors.length) throw new Error(`Browser errors at ${viewport.width}: ${errors.join("; ")}`);
    await context.close();
  }
  await writeFile(`${output}/viewport-audit.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks: report }, null, 2));
  console.log(`Verified ${report.length} screen/viewport combinations with no horizontal overflow or page errors.`);
} finally {
  await browser.close();
}
