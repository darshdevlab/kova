import { expect, test, type Page } from "@playwright/test";

async function navigate(page: Page, view: string) {
  await expect(page.locator(".workspace-shell")).toBeVisible();
  const desktop = page.getByRole("complementary", { name: "Project sections" });
  if (await desktop.isVisible())
    await desktop.getByRole("button", { name: view, exact: true }).click();
  else {
    await page
      .getByRole("navigation", { name: "Mobile project sections" })
      .getByRole("button", { name: "More", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: view, exact: true })
      .click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/models", (route) =>
    route.fulfill({
      json: {
        models: [
          {
            id: "auto",
            name: "Auto",
            provider: "Kova",
            description: "Default",
            speed: "Balanced",
          },
          {
            id: "test/model",
            name: "Test model",
            provider: "Test provider",
            description: "Test catalog",
            speed: "Fast",
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continue with demo workspace" })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("creates a project and moves through a persistent gated release journey", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Research desk");
  await page
    .getByLabel("What are we building?", { exact: true })
    .fill("Track research tasks with clear approvals and ownership.");
  await page.getByRole("button", { name: "Create project & plan" }).click();
  await expect(
    page.getByRole("heading", { name: "A clear plan. A better build." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve plan", exact: true }).click();
  await page.getByRole("button", { name: "Continue to build" }).click();
  await expect(
    page.getByText("Build with Kova", { exact: true }),
  ).toBeAttached();
  await navigate(page, "Deploy");
  await expect(
    page.getByRole("button", { name: "Prepare release", exact: true }),
  ).toBeDisabled();
  await navigate(page, "Tests");
  await page.getByRole("button", { name: "Run all checks" }).click();
  await expect(page.locator(".test-row")).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: "Continue to review" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page
    .getByRole("button", { name: "Approve review", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to release" }).click();
  await page
    .getByRole("button", { name: "Prepare release", exact: true })
    .click();
  await page.getByRole("button", { name: "Create release snapshot" }).click();
  await expect(
    page.getByRole("heading", { name: "Version 1 is packaged" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Version 1 is packaged" }),
  ).toBeVisible();
  await expect(page.getByText("Not deployed", { exact: true })).toBeVisible();
  await navigate(page, "Activity");
  await expect(
    page.getByRole("heading", { name: "Local release snapshot created" }),
  ).toBeVisible();
});

test("data edits persist and invalidate old verification", async ({ page }) => {
  await page
    .getByRole("button", { name: "Open RelayDesk", exact: true })
    .click();
  await navigate(page, "Tests");
  await page.getByRole("button", { name: "Run all checks" }).click();
  await navigate(page, "Data & auth");
  await page.getByRole("button", { name: "New table", exact: true }).click();
  await page.getByLabel("Table name", { exact: true }).fill("project_notes");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await page.getByRole("button", { name: "Insert row", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("First milestone");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "First milestone", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .locator(".table-list")
    .getByRole("button", { name: /project_notes/ })
    .click();
  await expect(
    page.getByRole("cell", { name: "First milestone", exact: true }),
  ).toBeVisible();
  await navigate(page, "Tests");
  await expect(
    page.getByRole("button", { name: "Continue to review" }),
  ).toBeDisabled();
});

test("agent graph supports additions, validation, persistence, and removal", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Open RelayDesk", exact: true })
    .click();
  await navigate(page, "Agents");
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  await page.getByRole("button", { name: "Add node", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page.getByLabel("Node name", { exact: true }).fill("Review assistant");
  await page.getByRole("button", { name: "Validate flow" }).click();
  await expect(page.getByRole("status")).toContainText(
    "1 disconnected node(s): Review assistant",
  );
  await page.getByRole("button", { name: "Save workflow" }).click();
  await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page
    .getByLabel("Selected node", { exact: true })
    .selectOption({ label: "Review assistant" });
  await page.getByRole("button", { name: "Remove node", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
});

test("prompt drafts, model selection, context lens, and failure recovery", async ({
  page,
}, info) => {
  await page
    .getByRole("button", { name: "Open RelayDesk", exact: true })
    .click();
  if (info.project.name === "mobile")
    await page
      .getByRole("button", { name: "Conversation", exact: true })
      .click();
  await page.getByLabel("Build prompt").fill("Improve the queue labels");
  await navigate(page, "Plan");
  await page.getByRole("button", { name: "Continue to build" }).click();
  if (info.project.name === "mobile")
    await page
      .getByRole("button", { name: "Conversation", exact: true })
      .click();
  await expect(page.getByLabel("Build prompt")).toHaveValue(
    "Improve the queue labels",
  );
  await page.locator(".model-trigger").click();
  await page.getByLabel("Search models").fill("Test model");
  await page.getByRole("button", { name: /Test model Test provider/ }).click();
  await expect(page.locator(".model-trigger")).toContainText("Test model");
  await page.route("**/api/chat", (route) =>
    route.fulfill({ status: 502, json: { error: "Provider unavailable" } }),
  );
  await page.getByRole("button", { name: "Send prompt" }).click();
  await expect(page.getByRole("status")).toContainText("Provider unavailable");
  await expect(page.getByLabel("Build prompt")).toHaveValue(
    "Improve the queue labels",
  );
  await page.unroute("**/api/chat");
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      json: {
        content: "A model response with a proposed change.",
        funding: "Demo",
        model: "test/model",
      },
    }),
  );
  await page.getByRole("button", { name: "Send prompt" }).click();
  await expect(
    page.getByText("A model response with a proposed change."),
  ).toBeVisible();
  if (info.project.name === "mobile")
    await page
      .locator(".mobile-build-tabs")
      .getByRole("button", { name: "Preview", exact: true })
      .click();
  await page.getByText("AI triage is active", { exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "AI triage queue banner",
  );
  await page
    .getByRole("button", { name: "Add to prompt", exact: true })
    .click();
  await expect(page.getByLabel("Build prompt")).toHaveValue(
    /AI triage queue banner/,
  );
});

test("screens remain usable without horizontal page overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .getByRole("button", { name: "Open RelayDesk", exact: true })
    .click();
  for (const view of [
    "Build",
    "Plan",
    "Agents",
    "Data & auth",
    "Tests",
    "Git & PR",
    "Deploy",
    "Activity",
    "Settings",
  ]) {
    await navigate(page, view);
    await expect(page.locator(".workspace-main")).not.toBeEmpty();
    if (view === "Agents")
      await expect(page.locator(".react-flow__node")).toHaveCount(6);
    await expect
      .poll(() =>
        page.locator("body").evaluate((element) => element.scrollWidth),
      )
      .toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    await expect
      .poll(() =>
        page
          .locator(".workspace-main")
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
      )
      .toBeTruthy();
    await page.screenshot({
      path: `artifacts/redesign/${info.project.name}-${view.toLowerCase().replace(/[^a-z]+/g, "-")}.png`,
    });
  }
  expect(errors).toEqual([]);
});
test("IDE themes and custom colors persist across navigation and reload", async ({
  page,
}, info) => {
  await page
    .getByRole("button", { name: "Choose color theme", exact: true })
    .click();
  await page.getByRole("button", { name: "GitHub Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-preset",
    "github-dark",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Open RelayDesk", exact: true })
    .click();
  await expect(
    page.getByRole("contentinfo", { name: "Workspace status" }),
  ).toContainText("GitHub Dark");
  await page
    .getByRole("button", { name: "Choose color theme", exact: true })
    .click();
  await page
    .getByLabel("Status bar color", { exact: true })
    .evaluate((element) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!;
      setter.call(element, "#654321");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  await expect(
    page.getByRole("contentinfo", { name: "Workspace status" }),
  ).toHaveCSS("background-color", "rgb(101, 67, 33)");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("contentinfo", { name: "Workspace status" }),
  ).toHaveCSS("background-color", "rgb(101, 67, 33)");
  await page
    .getByRole("button", { name: "Choose color theme", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset colors", exact: true }).click();
  await expect(
    page.getByRole("contentinfo", { name: "Workspace status" }),
  ).toHaveCSS("background-color", "rgb(22, 27, 34)");
  await page.getByRole("button", { name: "Code Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("button", { name: "Code Light", exact: true }),
  ).toHaveCSS("background-color", "rgb(243, 243, 243)");
  await page.getByRole("dialog").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: `artifacts/themes/${info.project.name}-theme-picker.png`,
    scale: "css",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Open branch settings", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Every change, accounted for." }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-preset",
    "code-light",
  );
  const overflow = await page
    .locator("body")
    .evaluate((element) => element.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
