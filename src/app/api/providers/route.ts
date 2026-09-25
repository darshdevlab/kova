import { listConnections, saveConnection } from "@/lib/providers/server";
import { checkMutation, providerResponse, readBody } from "@/lib/providers/http";
export const runtime = "nodejs";
export function GET(request: Request) { return providerResponse(() => listConnections(new URL(request.url).searchParams.get("spaceId") || "")); }
export function POST(request: Request) { return providerResponse(async () => { checkMutation(request); return { connection: await saveConnection(await readBody(request)) }; }); }
