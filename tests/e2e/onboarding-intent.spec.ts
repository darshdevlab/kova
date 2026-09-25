import { test, expect } from "@playwright/test";
import {
  onboardingKey,
  parseOnboardingIntent,
} from "../../src/lib/onboarding-intent";
import { platformFixture, USER_ID } from "./platform-fixture";

const intent = (overrides = {}) => ({
  version: 1,
  id: "e0000000-0000-4000-8000-000000000001",
  intent: "organisation",
  action: "create-company",
  organisationName: "Northstar",
  email: "qa@example.invalid",
  createdAt: Date.now(),
  ...overrides,
});

test("onboarding intent rejects stale, mismatched and malformed state", () => {
  expect(
    parseOnboardingIntent(JSON.stringify(intent()), "qa@example.invalid"),
  ).not.toBeNull();
  expect(
    parseOnboardingIntent(JSON.stringify(intent()), "other@example.invalid"),
  ).toBeNull();
  expect(
    parseOnboardingIntent(
      JSON.stringify(intent({ createdAt: Date.now() - 86400001 })),
      "qa@example.invalid",
    ),
  ).toBeNull();
  expect(
    parseOnboardingIntent(
      JSON.stringify(intent({ organisationName: null })),
      "qa@example.invalid",
    ),
  ).toBeNull();
  expect(parseOnboardingIntent("broken", "qa@example.invalid")).toBeNull();
});

test("verified organisation signup creates once and selects its workspace", async ({
  page,
}) => {
  const fixture = await platformFixture(page);
  const companyId = "f0000000-0000-4000-8000-000000000001";
  let calls = 0;
  await page.route("**/rest/v1/rpc/kova_create_company_once", (route) => {
    calls++;
    if (!fixture.spaces.some((s) => s.id === companyId))
      fixture.spaces.push({
        id: companyId,
        name: "Northstar",
        kind: "company",
        owner_id: USER_ID,
      });
    return route.fulfill({ json: companyId });
  });
  await page.addInitScript(
    ({ key, value }) => {
      if (!sessionStorage.getItem("test:onboarding-injected")) {
        sessionStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem("test:onboarding-injected", "yes");
      }
    },
    { key: onboardingKey, value: intent() },
  );
  await page.goto("/projects");
  await expect(page.locator(".space-picker")).toHaveValue(companyId);
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), onboardingKey),
    )
    .toBeNull();
  const firstCalls = calls;
  await page.reload();
  await expect(page.locator(".space-picker")).toHaveValue(companyId);
  expect(calls).toBe(firstCalls);
  expect(fixture.spaces.filter((s) => s.kind === "company")).toHaveLength(1);
});
