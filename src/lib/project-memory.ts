import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const memoryScopeSchema = z.object({ spaceId: z.uuid(), projectId: z.uuid().optional(), botId: z.uuid().optional() });
export type MemoryScope = z.infer<typeof memoryScopeSchema>;
export const memoryDraftSchema = z.object({
  title: z.string().trim().min(1).max(160), content: z.string().trim().min(1).max(3000),
  source: z.string().trim().min(1).max(500), expiresAt: z.iso.datetime().nullable().default(null),
  stale: z.boolean().default(false),
}).strict();
export type MemoryDraft = z.infer<typeof memoryDraftSchema>;
export type MemoryRecord = {
  id: string; space_id: string; project_id: string | null; bot_id: string | null;
  title: string; content: string; source: string; status: "proposed" | "approved" | "revoked";
  version: number; stale: boolean; expires_at: string | null; deleted_at: string | null;
  created_by: string; approved_by: string | null; approved_at: string | null; updated_at: string;
  history: Omit<MemoryRecord, "history">[];
};
export const canProposeMemory = (role: string) => ["Owner", "Admin", "PM", "Developer", "QA"].includes(role);
export const canApproveMemory = (role: string) => ["Owner", "Admin", "PM"].includes(role);

// Conservative exclusion, not a guarantee that arbitrary prose contains no secrets.
export function unsafeMemory(value: string) {
  return /(?:-----BEGIN [A-Z ]*PRIVATE KEY|\b(?:sk|ghp|github_pat|sb_secret)[-_][a-z0-9_-]{12,}|\bAKIA[A-Z0-9]{16}|\beyJ[a-z0-9_-]+\.eyJ[a-z0-9_-]+\.[a-z0-9_-]+|(?:api[_ -]?key|password|secret|access[_ -]?token)\s*[:=]\s*\S+|ignore\s+(?:all\s+)?(?:previous|prior|system)\s+instructions|(?:system|developer)\s*(?:prompt|message)\s*:|<\/?(?:system|developer)>)/i.test(value);
}

export function selectApprovedMemory(records: MemoryRecord[], scope: MemoryScope, now = Date.now()) {
  let budget = 11974; // Reserve the enclosing array and separators for twelve items.
  return records.filter((row) => row.space_id === scope.spaceId && row.status === "approved" && !row.stale && !row.deleted_at
    && (!row.project_id || row.project_id === scope.projectId) && (!row.bot_id || row.bot_id === scope.botId)
    && (!row.expires_at || Date.parse(row.expires_at) > now)
    && !unsafeMemory(`${row.title}\n${row.content}\n${row.source}`))
    .sort((a, b) => Number(Boolean(b.bot_id)) - Number(Boolean(a.bot_id)) || Number(Boolean(b.project_id)) - Number(Boolean(a.project_id)) || b.updated_at.localeCompare(a.updated_at))
    .slice(0, 12).flatMap((row) => {
      const item = { id: row.id, title: row.title.slice(0, 160), content: row.content.slice(0, 3000), source: row.source.slice(0, 500), version: row.version };
      const size = JSON.stringify(item).length;
      if (size > budget) return [];
      budget -= size;
      return [item];
    });
}

/** Pass a user-session client. Treat results as untrusted user reference data, never system instructions. */
export async function retrieveApprovedMemory(db: SupabaseClient, input: MemoryScope) {
  const scope = memoryScopeSchema.parse(input);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) throw Error("Memory authentication required.");
  const { data: member, error: memberError } = await db.from("kova_members").select("role").eq("space_id", scope.spaceId).eq("user_id", user.id).single();
  if (memberError || !member) throw Error("Memory workspace access denied.");
  for (const [id, kind] of [[scope.projectId, "project"], [scope.botId, "bot"]] as const) {
    if (!id) continue;
    const { data, error } = await db.from("kova_records").select("id").eq("space_id", scope.spaceId).eq("id", id).eq("kind", kind).single();
    if (error || !data) throw Error("Memory scope is unavailable.");
  }
  let query = db.from("kova_memory").select("id,space_id,project_id,bot_id,title,content,source,status,version,stale,expires_at,deleted_at,updated_at")
    .eq("space_id", scope.spaceId).eq("status", "approved").eq("stale", false).is("deleted_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  query = scope.projectId ? query.or(`project_id.is.null,project_id.eq.${scope.projectId}`) : query.is("project_id", null);
  query = scope.botId ? query.or(`bot_id.is.null,bot_id.eq.${scope.botId}`) : query.is("bot_id", null);
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(100);
  if (error) throw Error("Approved memory could not be loaded.");
  return selectApprovedMemory((data ?? []) as MemoryRecord[], scope);
}
