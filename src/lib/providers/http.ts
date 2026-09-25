import "server-only";
import { ProviderError, publicError } from "./errors";
import { isSameOrigin } from "../request-origin";
export async function providerResponse(action: () => Promise<unknown>) {
  try { return Response.json(await action(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { const safe = publicError(error); return Response.json({ error: safe.message, code: safe.code }, { status: safe.status, headers: { "Cache-Control": "no-store" } }); }
}
export function checkMutation(request: Request) {
  if (!isSameOrigin(request, true))
    throw new ProviderError("invalid_origin", "Same-origin request required.", 403);
}
export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ProviderError("invalid_input", "JSON request required.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ProviderError("invalid_input", "Request body required.");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 16384) { await reader.cancel(); throw new ProviderError("body_too_large", "Request too large.", 413); } chunks.push(value); }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ProviderError("invalid_input", "Invalid JSON request."); }
  } finally { reader.releaseLock(); }
}
