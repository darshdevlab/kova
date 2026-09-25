import { serverDatabase } from "@/lib/supabase/server";

export async function GET() {
  const db = await serverDatabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const { data, error } = await db.rpc("kova_own_ai_usage");
  if (error)
    return Response.json(
      { error: "Usage temporarily unavailable" },
      { status: 503 },
    );
  return Response.json(
    {
      requestsUsed: Number(data || 0),
      requestLimit: 10,
      period: "UTC day",
      source: "Shared Kova provider",
      note: "Request reservations include failed attempts. Provider spend is not synchronized.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
