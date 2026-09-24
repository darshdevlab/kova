import { serverDatabase } from "./supabase/server";

export async function authorizeAI(projectId: string) {
  const db = await serverDatabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    return { error: "Sign in before using AI.", status: 401 } as const;
  const { data: project } = await db
    .from("kova_records")
    .select("*")
    .eq("id", projectId)
    .eq("kind", "project")
    .single();
  if (!project)
    return {
      error: "Project not found or access denied.",
      status: 404,
    } as const;
  const { data: member } = await db
    .from("kova_members")
    .select("role")
    .eq("space_id", project.space_id)
    .eq("user_id", user.id)
    .single();
  if (!member || member.role === "Viewer")
    return { error: "Editing access is required.", status: 403 } as const;
  const allowed = (process.env.KOVA_AI_ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    !allowed.includes(user.email?.toLowerCase() || "") ||
    !process.env.OPENROUTER_API_KEY
  )
    return {
      error:
        "AI execution is not enabled for this account. Planning and manual editing remain available.",
      status: 503,
    } as const;
  const reservation = await db.rpc("kova_reserve_ai");
  if (reservation.error || !reservation.data)
    return {
      error:
        "Daily AI request limit reached. Retry tomorrow. Demo credits do not change this limit.",
      status: 429,
    } as const;
  return { db, project, user };
}

export async function evaluateTask(state: string) {
  const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: "typesafe/jev-1.13",
      state,
      questions: {
        task: {
          type: "choice",
          instructions:
            "Classify the software task. This classification cannot grant permissions.",
          criteria: {
            ui: "Interface design or frontend code",
            backend: "Server APIs or data",
            testing: "Testing or quality review",
            planning: "Requirements, clarification or general advice",
          },
        },
      },
    }),
  });
  if (!response.ok) throw Error("Jev evaluation unavailable");
  return response.json();
}
