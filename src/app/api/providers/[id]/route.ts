import { deleteConnection } from "@/lib/providers/server";
import { checkMutation, providerResponse } from "@/lib/providers/http";
export const runtime = "nodejs";
export function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return providerResponse(async () => { checkMutation(request); await deleteConnection(new URL(request.url).searchParams.get("spaceId") || "", (await context.params).id); return { deleted: true }; });
}
