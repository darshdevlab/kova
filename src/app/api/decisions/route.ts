import { z } from "zod";
import { authorizeAI, evaluateTask } from "@/lib/ai-access";
export async function POST(request: Request) {
  const parsed = z
    .object({ projectId: z.uuid(), state: z.string().trim().min(1).max(6000) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid decision request" },
      { status: 400 },
    );
  const access = await authorizeAI(parsed.data.projectId);
  if ("error" in access)
    return Response.json({ error: access.error }, { status: access.status });
  try {
    const result = await evaluateTask(parsed.data.state);
    const id = crypto.randomUUID();
    const saved = await access.db
      .from("kova_records")
      .insert({
        id,
        space_id: access.project.space_id,
        kind: "document",
        data: {
          title: "Jev task evaluation",
          projectId: access.project.id,
          source: "OpenRouter",
          content: JSON.stringify(result),
        },
      });
    if (saved.error) throw Error("Decision could not be saved");
    return Response.json({ id, ...result });
  } catch {
    return Response.json(
      { error: "Decision evaluation unavailable. No action was authorized." },
      { status: 502 },
    );
  }
}
