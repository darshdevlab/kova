import { connectionCatalog } from "@/lib/providers/server";
import { providerResponse } from "@/lib/providers/http";
export const runtime = "nodejs";
export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return providerResponse(async () => connectionCatalog(new URL(request.url).searchParams.get("spaceId") || "", (await context.params).id));
}
