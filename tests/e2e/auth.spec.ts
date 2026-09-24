import { test, expect } from "@playwright/test";

test("missing and denied OAuth callbacks fail safely", async ({ page }) => {
  for (const path of [
    "/auth/callback",
    "/auth/callback?error=access_denied&next=https://example.com",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/\?auth_error=callback$/);
    await expect(page.getByRole("status")).toContainText(
      "cancelled or expired",
    );
  }
});

test("callback completion requires a verified session", async ({ page }) => {
  await page.goto("/auth/complete");
  await expect(
    page.getByRole("heading", { name: "Sign-in could not be completed" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("kova:session:v1")),
  ).toBeNull();
  await page.getByRole("link", { name: "Return to sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
});

test("Google sign-in starts a PKCE flow with the exact callback", async ({
  page,
  context,
}) => {
  let authorizeUrl = "";
  await page.route(
    "https://*.supabase.co/auth/v1/authorize**",
    async (route) => {
      authorizeUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "OAuth handoff",
      });
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByText("OAuth handoff")).toBeVisible();
  const url = new URL(authorizeUrl);
  expect(url.searchParams.get("provider")).toBe("google");
  expect(url.searchParams.get("redirect_to")).toBe(
    "http://127.0.0.1:3100/auth/callback",
  );
  expect(url.searchParams.get("code_challenge_method")).toBe("s256");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  expect(
    (await context.cookies("http://127.0.0.1:3100")).some((c) =>
      c.name.includes("code-verifier"),
    ),
  ).toBe(true);
});
