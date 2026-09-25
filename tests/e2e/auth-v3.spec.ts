import { test, expect } from "@playwright/test";

const key = "kova:auth:pending-intent:v1";

test("tabs and workspace intent support keyboard navigation", async ({ page }) => {
  await page.goto("/");
  const signIn = page.getByRole("tab", { name: "Sign in", exact: true });
  await signIn.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Create account" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "auth-tab-signup");
  await page.getByText("Organisation", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Organisation", exact: true })).toBeChecked();
  await expect(page.getByLabel("Organisation name")).toBeVisible();
  await signIn.click();
  await expect(page.getByLabel("Organisation name")).toHaveCount(0);
  await expect(page.getByText("Use your Kova account to access an organisation you belong to.")).toBeVisible();
});

test("email signup validates blank names, email, passwords and confirmation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Create account" }).click();
  const submit = page.getByRole("button", { name: "Create account", exact: true });
  await page.getByLabel("Full name").fill("   ");
  await submit.click();
  await expect(page.getByRole("status")).toHaveText("Enter your full name.");
  await page.getByLabel("Full name").fill("Test Person");
  await page.getByLabel("Work email").fill("invalid");
  await submit.click();
  await expect(page.getByRole("status")).toHaveText("Enter a valid email address.");
  await page.getByLabel("Work email").fill("person@example.com");
  await page.getByLabel("Password", { exact: true }).fill("        ");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("at least 8");
  await page.getByLabel("Password", { exact: true }).fill("example-secret");
  await submit.click();
  await expect(page.getByRole("status")).toHaveText("Confirm your password.");
  await page.getByLabel("Confirm password").fill("different-secret");
  await submit.click();
  await expect(page.getByRole("status")).toHaveText("Passwords do not match.");
  expect(await page.evaluate((k) => sessionStorage.getItem(k), key)).toBeNull();
});

test("organisation signup stores a stable non-secret pending intent, never a session", async ({ page }) => {
  let body: Record<string, unknown> = {};
  await page.route("https://*.supabase.co/auth/v1/signup**", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { id: "pending-user", email: "person@example.com", identities: [] } });
  });
  await page.goto("/");
  await page.evaluate((k) => sessionStorage.setItem(k, "{broken"), key);
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByText("Organisation", { exact: true }).click();
  await page.getByLabel("Full name").fill("  Test Person  ");
  await page.getByLabel("Work email").fill("  person@example.com  ");
  await page.getByLabel("Password", { exact: true }).fill("example-secret");
  await page.getByLabel("Confirm password").fill("example-secret");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Enter your organisation name.");
  await page.getByLabel("Organisation name").fill("  Example Company  ");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  expect(body.email).toBe("person@example.com");
  expect(body.data).toEqual({ full_name: "Test Person" });
  const pending = await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key);
  expect(pending).toMatchObject({ version: 1, intent: "organisation", action: "create-company", organisationName: "Example Company", email: "person@example.com" });
  expect(pending.id).toBeTruthy();
  expect(JSON.stringify(pending)).not.toContain("secret");
  expect(await page.evaluate(() => localStorage.getItem("kova:session:v1"))).toBeNull();
  await page.getByLabel("Password", { exact: true }).fill("example-secret");
  await page.getByLabel("Confirm password").fill("example-secret");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  expect(await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!).id, key)).toBe(pending.id);
});

test("recovery trims email and reports success without disclosing account existence", async ({ page }) => {
  let email = "";
  await page.route("https://*.supabase.co/auth/v1/recover**", async (route) => {
    email = route.request().postDataJSON().email;
    await route.fulfill({ json: {} });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("status")).toHaveText("Enter a valid email address first.");
  await page.getByLabel("Work email").fill("  person@example.com  ");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("status")).toContainText("If your account exists");
  expect(email).toBe("person@example.com");
});

test("failed sign in locks controls during the request and allows retry", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("https://*.supabase.co/auth/v1/token**", async (route) => {
    await gate;
    await route.fulfill({ status: 400, json: { code: "invalid_credentials", msg: "Invalid login credentials" } });
  });
  await page.goto("/");
  await page.getByLabel("Work email").fill("person@example.com");
  await page.getByLabel("Password", { exact: true }).fill("example-secret");
  await page.getByRole("button", { name: "Continue to Kova" }).click();
  await expect(page.getByRole("button", { name: "Signing in..." })).toBeDisabled();
  await expect(page.getByRole("tab", { name: "Create account" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
  release();
  await expect(page.getByRole("status")).toContainText("Invalid login credentials");
  await expect(page.getByRole("button", { name: "Continue to Kova" })).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem("kova:session:v1"))).toBeNull();
});

test("Google organisation signup requires a name and preserves intent through PKCE", async ({ page }) => {
  let pending: Record<string, unknown> = {};
  await page.route("https://*.supabase.co/auth/v1/authorize**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: "OAuth handoff" });
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByText("Organisation", { exact: true }).click();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("status")).toContainText("Enter your organisation name");
  await page.getByLabel("Organisation name").fill("Example Company");
  // Capture tab storage before the cross-origin navigation.
  await page.exposeFunction("capturePending", (value: Record<string, unknown>) => { pending = value; });
  await page.evaluate((k) => {
    window.addEventListener("beforeunload", () => {
      void (window as unknown as { capturePending: (value: unknown) => Promise<void> }).capturePending(JSON.parse(sessionStorage.getItem(k)!));
    });
  }, key);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByText("OAuth handoff")).toBeVisible();
  expect(pending).toMatchObject({ action: "create-company", organisationName: "Example Company", email: null });
});

test("auth stays within the viewport and renders the official Google image", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".auth-v3-google img")).toHaveAttribute("src", "https://developers.google.com/identity/images/g-logo.png");
  await expect.poll(() => page.locator(".auth-v3-google img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  for (const mode of ["Sign in", "Create account"]) {
    await page.getByRole("tab", { name: mode, exact: true }).click();
    await page.getByText("Organisation", { exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(mode === "Sign in" ? "auth-signin.png" : "auth-signup.png"), fullPage: true });
  }
});
