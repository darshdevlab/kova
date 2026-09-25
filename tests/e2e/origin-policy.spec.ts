import { test, expect } from "@playwright/test";
import { isSameOrigin } from "../../src/lib/request-origin";

test("origin policy respects proxy host without trusting arbitrary origins", () => {
  const request = (headers: Record<string, string>) =>
    new Request("http://localhost:3100/api/providers", { headers });
  expect(
    isSameOrigin(
      request({ host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" }),
      true,
    ),
  ).toBe(true);
  expect(
    isSameOrigin(
      request({
        host: "kova.example",
        origin: "https://kova.example",
        "x-forwarded-proto": "https",
      }),
      true,
    ),
  ).toBe(true);
  expect(
    isSameOrigin(
      request({
        host: "kova.example",
        origin: "https://attacker.example",
        "x-forwarded-proto": "https",
      }),
      true,
    ),
  ).toBe(false);
  expect(
    isSameOrigin(
      request({
        host: "kova.example",
        origin: "https://kova.example",
        "x-forwarded-proto": "https",
        "sec-fetch-site": "cross-site",
      }),
      true,
    ),
  ).toBe(false);
  for (const origin of [
    "null",
    "https://kova.example/path",
    "https://user@kova.example",
    "https://kova.example?x=y",
  ]) {
    expect(
      isSameOrigin(
        request({ host: "kova.example", origin, "x-forwarded-proto": "https" }),
        true,
      ),
    ).toBe(false);
  }
  expect(isSameOrigin(request({}), true)).toBe(false);
});
