import { z } from "zod";
import { isSameOrigin as sameOrigin } from "@/lib/request-origin";
import { serverDatabase } from "@/lib/supabase/server";
import { canApproveMemory, canProposeMemory, memoryDraftSchema, memoryScopeSchema, unsafeMemory } from "@/lib/project-memory";

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const createSchema = memoryScopeSchema.extend({ draft: memoryDraftSchema }).strict();
const changeSchema = z.object({ spaceId: z.uuid(), id: z.uuid(), version: z.number().int().positive(), action: z.enum(["edit", "approve", "revoke", "delete"]), draft: memoryDraftSchema.optional() }).strict();
async function access(spaceId: string) {
  const db = await serverDatabase();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { response: reply({ error: "Sign in to open memory." }, 401) };
  const { data: member } = await db.from("kova_members").select("role").eq("space_id", spaceId).eq("user_id", user.id).single();
  if (!member) return { response: reply({ error: "Workspace access denied." }, 403) };
  return { db, role: member.role as string };
}
export async function GET(request: Request) {
  const parsed = memoryScopeSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return reply({ error: "Invalid memory scope." }, 400);
  try {
    const auth = await access(parsed.data.spaceId);
    if (auth.response) return auth.response;
    let query = auth.db.from("kova_memory").select("*").eq("space_id", parsed.data.spaceId).is("deleted_at", null);
    query = parsed.data.projectId ? query.eq("project_id", parsed.data.projectId) : query.is("project_id", null);
    query = parsed.data.botId ? query.eq("bot_id", parsed.data.botId) : query.is("bot_id", null);
    const { data, error } = await query.order("updated_at", { ascending: false }).limit(100);
    if (error) return reply({ error: "Memory storage unavailable. Check the memory migration." }, 503);
    return reply({ records: data, role: auth.role });
  } catch { return reply({ error: "Memory is unavailable." }, 503); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origin denied." }, 403);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ error: "Check the lesson, source, and scope." }, 400);
  if (unsafeMemory(JSON.stringify(parsed.data.draft))) return reply({ error: "Remove credentials and instruction overrides from this lesson." }, 400);
  try {
    const { spaceId, projectId, botId, draft } = parsed.data;
    const auth = await access(spaceId);
    if (auth.response) return auth.response;
    if (!canProposeMemory(auth.role)) return reply({ error: "Memory is read only for this role." }, 403);
    const { data, error } = await auth.db.from("kova_memory").insert({ space_id: spaceId, project_id: projectId ?? null, bot_id: botId ?? null, ...fields(draft) }).select("*").single();
    if (error) return reply({ error: "Lesson could not be saved. Check scope and memory storage." }, 400);
    return reply({ record: data }, 201);
  } catch { return reply({ error: "Memory is unavailable." }, 503); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origin denied." }, 403);
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ error: "Invalid memory change." }, 400);
  const { spaceId, id, version, action, draft } = parsed.data;
  if (action === "edit" && (!draft || unsafeMemory(JSON.stringify(draft)))) return reply({ error: "Supply a lesson and source without credentials or instruction overrides." }, 400);
  try {
    const auth = await access(spaceId);
    if (auth.response) return auth.response;
    if (!(action === "edit" ? canProposeMemory(auth.role) : canApproveMemory(auth.role))) return reply({ error: "This action requires a permitted workspace role." }, 403);
    const update = action === "edit" ? fields(draft!) : action === "delete" ? { deleted_at: new Date().toISOString() } : { status: action === "approve" ? "approved" : "revoked" };
    const { data, error } = await auth.db.from("kova_memory").update({ ...update, version: version + 1 }).eq("space_id", spaceId).eq("id", id).eq("version", version).is("deleted_at", null).select("*").single();
    if (error || !data) return reply({ error: "Lesson changed, is expired/stale, or is unavailable. Reload before retrying." }, 409);
    return reply({ record: data });
  } catch { return reply({ error: "Memory is unavailable." }, 503); }
}
function fields(draft: z.infer<typeof memoryDraftSchema>) { return { title: draft.title, content: draft.content, source: draft.source, stale: draft.stale, expires_at: draft.expiresAt }; }
