import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { serverDatabase } from "../supabase/server";
import { assertEncryptionAvailable, decryptCredential, encryptCredential } from "./crypto";
import { authHeaders, baseFor, discoverModels } from "./catalog";
import { ProviderError, publicError } from "./errors";
import { safeJsonRequest } from "./network";
import { providerKinds, type ConnectionSummary, type ProviderKind } from "./types";

const uuid = z.string().uuid();
export function assertRole(role: string | undefined, management = false, inference = false) {
  const allowed = management ? ["Owner", "Admin"] : inference ? ["Owner", "Admin", "PM", "Developer", "QA"] : ["Owner", "Admin", "PM", "Developer", "QA", "Viewer"];
  if (!role || !allowed.includes(role)) throw new ProviderError("forbidden", "You do not have permission to perform this action in this workspace.", 403);
}
export async function authorizeProvider(spaceId: string, management = false, inference = false) {
  if (!uuid.safeParse(spaceId).success) throw new ProviderError("invalid_space", "A valid workspace ID is required.");
  const db = await serverDatabase();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new ProviderError("unauthenticated", "Sign in required.", 401);
  const { data: member, error: membershipError } = await db.from("kova_members").select("role").eq("space_id", spaceId).eq("user_id", user.id).maybeSingle();
  if (membershipError) throw new ProviderError("membership_unavailable", "Workspace access could not be verified.", 503);
  assertRole(member?.role, management, inference);
  return { userId: user.id, role: member!.role as string };
}
function store() {
  assertEncryptionAvailable();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ProviderError("storage_unavailable", "AI Providers unavailable: server credential storage is not configured.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
type Row = { id: string; space_id: string; provider: ProviderKind; label: string; base_url: string; encrypted_credential: string; has_credential: boolean; updated_at: string };
const columns = "id,space_id,provider,label,base_url,has_credential,updated_at";
function summary(row: Omit<Row, "encrypted_credential">): ConnectionSummary {
  return { id: row.id, spaceId: row.space_id, provider: row.provider, label: row.label, baseUrl: row.base_url, hasCredential: row.has_credential, updatedAt: row.updated_at };
}
export async function listConnections(spaceId: string) {
  const access = await authorizeProvider(spaceId);
  const canManage = ["Owner", "Admin"].includes(access.role);
  try {
    const { data, error } = await store().from("kova_provider_connections").select(columns).eq("space_id", spaceId).order("created_at");
    if (error) throw new ProviderError("storage_unavailable", "AI Providers unavailable: credential storage migration is required.", 503);
    return { available: true, canManage, connections: (data || []).map(summary) };
  } catch (error) {
    const safe = publicError(error);
    return { available: false, canManage, reason: safe.message, connections: [] };
  }
}
const saveSchema = z.object({
  spaceId: uuid, id: uuid.optional(), provider: z.enum(providerKinds), label: z.string().trim().min(1).max(80),
  baseUrl: z.string().max(2048).optional(), apiKey: z.string().max(8192).regex(/^[\x21-\x7e]*$/).optional(),
}).strict();
export async function saveConnection(input: unknown) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) throw new ProviderError("invalid_input", "Check the provider, label, endpoint and credential fields.");
  const value = parsed.data;
  await authorizeProvider(value.spaceId, true);
  const db = store();
  const baseUrl = baseFor(value.provider, value.baseUrl);
  const existing = value.id ? await readConnection(value.spaceId, value.id) : undefined;
  if (existing && (existing.provider !== value.provider || existing.base_url !== baseUrl))
    throw new ProviderError("immutable_endpoint", "Create a new connection to change provider or endpoint.");
  const id = existing?.id || crypto.randomUUID();
  if (!existing && value.provider !== "ollama" && !value.apiKey) throw new ProviderError("credential_required", "An API key is required.");
  const encrypted = value.apiKey === undefined || value.apiKey === "" ? existing?.encrypted_credential || encryptCredential("", `${value.spaceId}:${id}:${value.provider}`) : encryptCredential(value.apiKey, `${value.spaceId}:${id}:${value.provider}`);
  const row = { id, space_id: value.spaceId, provider: value.provider, label: value.label, base_url: baseUrl, encrypted_credential: encrypted, has_credential: Boolean(value.apiKey || existing?.has_credential), updated_at: new Date().toISOString() };
  const query = existing ? db.from("kova_provider_connections").update(row).eq("id", id).eq("space_id", value.spaceId) : db.from("kova_provider_connections").insert(row);
  const { data, error } = await query.select(columns).single();
  if (error) throw new ProviderError("save_failed", "Connection could not be saved.", 503);
  return summary(data);
}
async function readConnection(spaceId: string, id: string): Promise<Row> {
  if (!uuid.safeParse(id).success) throw new ProviderError("invalid_connection", "A valid connection ID is required.");
  const { data, error } = await store().from("kova_provider_connections").select("*").eq("space_id", spaceId).eq("id", id).maybeSingle();
  if (error) throw new ProviderError("storage_unavailable", "Credential storage unavailable.", 503);
  if (!data) throw new ProviderError("not_found", "Connection not found in this workspace.", 404);
  return data as Row;
}
function secretFor(row: Row) { return decryptCredential(row.encrypted_credential, `${row.space_id}:${row.id}:${row.provider}`); }
export async function deleteConnection(spaceId: string, id: string) {
  await authorizeProvider(spaceId, true);
  await readConnection(spaceId, id);
  const { error } = await store().from("kova_provider_connections").delete().eq("space_id", spaceId).eq("id", id);
  if (error) throw new ProviderError("delete_failed", "Connection could not be removed.", 503);
}
export async function connectionCatalog(spaceId: string, id: string, management = false) {
  await authorizeProvider(spaceId, management);
  const row = await readConnection(spaceId, id);
  const models = await discoverModels(row.provider, baseFor(row.provider, row.base_url), secretFor(row));
  return { connection: summary(row), models, checkedAt: new Date().toISOString() };
}
/** Server-only capability: no credential or unrestricted URL escapes this function. */
export async function resolveProviderForInference(input: { spaceId: string; connectionId: string; modelId: string }) {
  await authorizeProvider(input.spaceId, false, true);
  const row = await readConnection(input.spaceId, input.connectionId);
  const base = baseFor(row.provider, row.base_url);
  const models = await discoverModels(row.provider, base, secretFor(row));
  if (!models.some(m => m.id === input.modelId)) throw new ProviderError("model_unavailable", "Model is not in this connection's current catalog.", 400);
  return {
    provider: row.provider, modelId: input.modelId, connectionId: row.id,
    async request(payload: Record<string, unknown>) {
      // Recheck membership and reread the key when invoked, including after revocation/rotation.
      await authorizeProvider(input.spaceId, false, true);
      const current = await readConnection(input.spaceId, input.connectionId);
      const path = current.provider === "anthropic" ? "/messages" : current.provider === "ollama" ? "/api/chat" : "/chat/completions";
      return safeJsonRequest(new URL(`${base}${path}`), authHeaders(current.provider, secretFor(current)), { ...payload, model: input.modelId, stream: false });
    },
  };
}
