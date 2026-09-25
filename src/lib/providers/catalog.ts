import "server-only";
import { z } from "zod";
import { ProviderError } from "./errors";
import { endpointUrl, safeJsonRequest } from "./network";
import type { ProviderKind, ProviderModel } from "./types";

export const officialBases: Partial<Record<ProviderKind, string>> = {
  openai: "https://api.openai.com/v1", anthropic: "https://api.anthropic.com/v1", openrouter: "https://openrouter.ai/api/v1",
};
export function baseFor(provider: ProviderKind, base?: string) {
  if (officialBases[provider]) {
    if (base && base !== officialBases[provider]) throw new ProviderError("invalid_endpoint", "This provider uses its official API endpoint.");
    return officialBases[provider]!;
  }
  return endpointUrl(base || "").href.replace(/\/$/, "");
}
export function authHeaders(provider: ProviderKind, secret: string): Record<string, string> {
  return provider === "anthropic" ? { "x-api-key": secret, "anthropic-version": "2023-06-01" } : secret ? { Authorization: `Bearer ${secret}` } : {};
}
const item = z.object({ id: z.string().min(1).max(512), name: z.string().max(512).optional(), display_name: z.string().max(512).optional(), context_length: z.number().int().positive().optional() });
const page = z.object({ data: z.array(item), has_more: z.boolean().optional(), last_id: z.string().optional() });
export async function discoverModels(provider: ProviderKind, base: string, secret: string, send = safeJsonRequest): Promise<ProviderModel[]> {
  const headers = authHeaders(provider, secret);
  const deadline = Date.now() + 30000;
  const get = (url: URL) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new ProviderError("timeout", "Model discovery timed out.", 504);
    return send(url, headers, undefined, Math.min(15000, remaining));
  };
  if (provider === "openrouter") await get(new URL(`${base}/key`));
  if (provider === "ollama") {
    const parsed = z.object({ models: z.array(z.object({ name: z.string().min(1).max(512) })) }).safeParse(await get(new URL(`${base}/api/tags`)));
    if (!parsed.success) throw new ProviderError("invalid_catalog", "Provider returned an invalid model catalog.", 502);
    return parsed.data.models.map(m => ({ id: m.name, name: m.name }));
  }
  const models = new Map<string, ProviderModel>(); let cursor = "";
  for (let n = 0; n < 100; n++) {
    const url = new URL(`${base}/models`);
    if (provider === "anthropic") { url.searchParams.set("limit", "1000"); if (cursor) url.searchParams.set("after_id", cursor); }
    const parsed = page.safeParse(await get(url));
    if (!parsed.success) throw new ProviderError("invalid_catalog", "Provider returned an invalid model catalog.", 502);
    for (const m of parsed.data.data) models.set(m.id, { id: m.id, name: m.display_name || m.name || m.id, ...(m.context_length ? { contextLength: m.context_length } : {}) });
    if (!parsed.data.has_more) return [...models.values()].sort((a, b) => a.id.localeCompare(b.id));
    if (provider !== "anthropic" || !parsed.data.last_id || parsed.data.last_id === cursor) throw new ProviderError("invalid_catalog", "Provider pagination could not be completed.", 502);
    cursor = parsed.data.last_id;
  }
  throw new ProviderError("catalog_limit", "Provider catalog exceeds the pagination limit.", 502);
}
