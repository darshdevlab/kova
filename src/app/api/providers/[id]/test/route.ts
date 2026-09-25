import { connectionCatalog } from "@/lib/providers/server";
import { checkMutation, providerResponse } from "@/lib/providers/http";
export const runtime = "nodejs";
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return providerResponse(async () => { checkMutation(request); const result = await connectionCatalog(new URL(request.url).searchParams.get("spaceId") || "", (await context.params).id, true); return { ok: true, modelCount: result.models.length, checkedAt: result.checkedAt }; });
}
