import { serverDatabase } from "@/lib/supabase/server";
export async function GET() {
  const db = await serverDatabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const enabled =
    Boolean(process.env.OPENROUTER_API_KEY) &&
    (process.env.KOVA_AI_ALLOWED_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .includes(user.email?.toLowerCase() || "");
  return Response.json(
    {
      openrouter: enabled
        ? "Enabled / 10 requests per day"
        : "Not enabled for this account",
      jev: enabled ? "OpenRouter Decisions API" : "Not enabled",
      sandbox: "Disabled / free-only boundary unverified",
      lyzr: "Simulated",
      notion: "Runtime connection pending",
      github: "Private key pending",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
