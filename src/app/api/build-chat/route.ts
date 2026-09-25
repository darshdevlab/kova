import { z } from "zod";
import { authorizeAI } from "@/lib/ai-access";
import { serverDatabase } from "@/lib/supabase/server";
import { retrieveApprovedMemory } from "@/lib/project-memory";
import { resolveProviderForInference } from "@/lib/providers/server";
import { ProviderError } from "@/lib/providers/errors";
import { isSameOrigin } from "@/lib/request-origin";
import type { PlatformRecord } from "@/lib/platform";
import { applyBuildResponse, buildMessages, buildResponseSchema, changeBuilderHtml, initialBuilder, MAX_HTML, sharedPriceCeiling, selectBuildModel } from "@/lib/build-context";
import type { BuildRouting, BuilderState, CatalogModel } from "@/lib/build-context";
import { isDeliveryProject, canReviewArtifact, prdApproved, deliveryReady, reviseArtifact } from "@/lib/build-context";

export const runtime = "nodejs";
export const maxDuration = 60;
const requestSchema = z.object({
  projectId: z.uuid(), revision: z.number().int().min(0),
  model: z.string().trim().min(1).max(200),
  connectionId: z.uuid().optional(),
  prompt: z.string().trim().min(1).max(12000).optional(),
  intent: z.enum(["start", "message", "build", "draft-prd", "draft-trd"]),
}).strict();
const editSchema = z.discriminatedUnion("action", [
  z.object({ projectId: z.uuid(), revision: z.number().int().min(0), action: z.literal("save-artifact"), kind: z.enum(["prd", "trd"]), content: z.string().trim().min(20).max(30000) }).strict(),
  z.object({ projectId: z.uuid(), revision: z.number().int().min(0), action: z.literal("approve-artifact"), kind: z.enum(["prd", "trd"]), artifactVersion: z.number().int().positive() }).strict(),
  z.object({ projectId: z.uuid(), revision: z.number().int().min(0), action: z.literal("edit"), html: z.string().max(MAX_HTML) }).strict(),
  z.object({ projectId: z.uuid(), revision: z.number().int().min(0), action: z.literal("rollback"), snapshotId: z.string().min(1).max(100) }).strict(),
]);
function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
async function memberProject(projectId: string, write: boolean) {
  const db = await serverDatabase();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { error: "Sign in before opening this project.", status: 401 } as const;
  const { data: project } = await db.from("kova_records").select("*").eq("id", projectId).eq("kind", "project").single();
  if (!project) return { error: "Project not found or access denied.", status: 404 } as const;
  const { data: member } = await db.from("kova_members").select("role").eq("space_id", project.space_id).eq("user_id", user.id).single();
  if (!member || (write && member.role === "Viewer")) return { error: "Project editing access is required.", status: 403 } as const;
  const access = { db, project: project as PlatformRecord, role: member.role as string, userId: user.id };
  if (isDeliveryProject(access.project)) await hydrateApprovals(access);
  return access;
}
type Access = Exclude<Awaited<ReturnType<typeof memberProject>>, { error: string }>;
async function hydrateApprovals(access: { db: Awaited<ReturnType<typeof serverDatabase>>; project: PlatformRecord }) {
  const { data, error } = await access.db.from("kova_delivery_approvals").select("*").eq("project_id", access.project.id);
  if (error) throw Error("Protected delivery review storage unavailable. Apply delivery-review.sql.");
  const state = initialBuilder(access.project);
  const delivery = { ...state.delivery };
  for (const kind of ["prd", "trd"] as const) {
    const artifact = delivery[kind];
    if (!artifact) continue;
    const trusted = (data || []).find((row) => row.kind === kind && row.approved_artifact?.version === artifact.version && row.approved_artifact?.content === artifact.content && row.approved_artifact?.basedOnPrdVersion === artifact.basedOnPrdVersion);
    delivery[kind] = { ...artifact, approval: trusted ? { version: artifact.version, userId: trusted.approved_by, role: trusted.approved_role, at: trusted.approved_at } : undefined };
  }
  access.project = { ...access.project, data: { ...access.project.data, builder: { ...state, delivery } } } as PlatformRecord;
}
async function loadMemory(access: Access) {
  return retrieveApprovedMemory(access.db, { spaceId: access.project.space_id, projectId: access.project.id });
}
async function persist(access: Access, state: BuilderState) {
  const project = access.project;
  const { data, error } = await access.db.from("kova_records").update({
    data: { ...project.data, builder: state }, revision: project.revision + 1, updated_at: new Date().toISOString(),
  }).eq("id", project.id).eq("space_id", project.space_id).eq("revision", project.revision).select().single();
  if (error || !data) return null;
  return data as PlatformRecord;
}

export async function GET(request: Request) {
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("projectId"));
  if (!id.success) return json({ error: "Invalid project." }, 400);
  try {
    const access = await memberProject(id.data, false);
    if ("error" in access) return json({ error: access.error }, access.status);
    return json({ project: access.project, memory: await loadMemory(access) });
  } catch { return json({ error: "Project context is unavailable. Retry when the connection returns." }, 503); }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Cross-origin requests are not accepted." }, 403);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid builder request." }, 400);
  const input = parsed.data;
  if (input.intent === "message" && !input.prompt) return json({ error: "A message is required." }, 400);
  try {
    // Validate membership and current revision before reserving or charging an AI call.
    const member = await memberProject(input.projectId, true);
    if ("error" in member) return json({ error: member.error }, member.status);
    if (member.project.revision !== input.revision) return json({ error: "Project changed. Reload before sending again." }, 409);
    const state = initialBuilder(member.project);
    const delivery = isDeliveryProject(member.project);
    const draftKind = input.intent === "draft-prd" ? "prd" : input.intent === "draft-trd" ? "trd" : null;
    if (draftKind && (!delivery || !canReviewArtifact(member.role, draftKind))) return json({ error: "Your role cannot draft this delivery artifact." }, 403);
    if (draftKind === "trd" && !prdApproved(state)) return json({ error: "Approve the current PRD before drafting the TRD." }, 409);
    if (delivery && input.intent === "build" && (!deliveryReady(state) || !["Owner", "Admin", "Developer"].includes(member.role))) return json({ error: "Build requires approved current PRD and TRD versions and developer access." }, 403);
    if (input.intent === "start" && state.messages.some((message) => message.role === "assistant")) return json({ error: "This conversation has already started. Send a follow-up message." }, 409);
    const memory = await loadMemory(member);
    const messages = buildMessages(member.project, state, memory, input.prompt, input.intent);
    let payload: unknown;
    let content: unknown;
    let model = input.model;
    let routing: BuildRouting = { requestedModel: input.model, selectedModel: input.model, policy: "explicit", reason: "User-selected model verified against the workspace connection catalog." };
    if (input.connectionId) {
      const provider = await resolveProviderForInference({ spaceId: member.project.space_id, connectionId: input.connectionId, modelId: input.model });
      payload = await provider.request(provider.provider === "anthropic"
        ? { max_tokens: 8000, system: messages[0].content, messages: messages.slice(1) }
        : provider.provider === "ollama"
          ? { messages, format: "json", options: { num_predict: 8000 } }
          : { max_tokens: 8000, messages });
      const result = z.object({
        model: z.string().optional(), stop_reason: z.string().nullish(), done: z.boolean().optional(), done_reason: z.string().optional(),
        content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
        message: z.object({ content: z.string() }).optional(),
        choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }), finish_reason: z.string().nullish() })).optional(),
      }).parse(payload);
      if (result.stop_reason === "max_tokens" || result.done_reason === "length" || result.choices?.[0]?.finish_reason === "length") return json({ error: "Model returned an incomplete response. Previous work is preserved." }, 502);
      content = provider.provider === "anthropic" ? result.content?.filter((block) => block.type === "text").map((block) => block.text || "").join("") : provider.provider === "ollama" ? result.message?.content : result.choices?.[0]?.message.content;
      model = result.model || input.model;
    } else {
    const catalogResponse = await fetch("https://openrouter.ai/api/v1/models", { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!catalogResponse.ok) return json({ error: "Live model catalog is unavailable. No model was substituted." }, 503);
    const catalog = await catalogResponse.json() as { data?: CatalogModel[] };
    let selected: CatalogModel;
    try {
      const selection = selectBuildModel(catalog.data || [], input.model, sharedPriceCeiling(process.env.KOVA_SHARED_MAX_USD_PER_MILLION_TOKENS), input.prompt || state.messages.at(-1)?.content || member.project.data.description || "");
      selected = selection.model;
      routing = selection.routing;
    } catch (error) { return json({ error: error instanceof Error ? error.message : "Model unavailable." }, 422); }
    const access = await authorizeAI(input.projectId);
    if ("error" in access) return json({ error: access.error }, access.status);
    if (access.project.revision !== input.revision) return json({ error: "Project changed. Reload before sending again." }, 409);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(35000),
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "X-Title": "Kova Direct Builder" },
      body: JSON.stringify({
        model: selected.id, max_tokens: 8000,
        ...(selected.supported_parameters?.includes("response_format") ? { response_format: { type: "json_object" } } : {}),
        provider: { allow_fallbacks: false },
        messages,
      }),
    });
    if (!response.ok) return json({ error: `Selected model did not complete the request (${response.status}). No model was substituted.` }, 502);
    const result = await response.json();
    content = result.choices?.[0]?.message?.content;
    if (result.choices?.[0]?.finish_reason === "length") return json({ error: "Model returned an incomplete response. Previous work is preserved." }, 502);
    model = typeof result.model === "string" ? result.model : selected.id;
    }
    if (typeof content !== "string") return json({ error: "Model returned no text. Previous work is preserved." }, 502);
    let result;
    try { result = buildResponseSchema.parse(JSON.parse(content)); }
    catch { return json({ error: "Model returned invalid builder JSON. Previous work is preserved." }, 502); }
    if (delivery && result.action === "build" && (!deliveryReady(state) || !["Owner", "Admin", "Developer"].includes(member.role))) return json({ error: "Build blocked: the current PRD and TRD need approval and developer access." }, 403);
    const artifact = result.action === "message" ? result.artifact : undefined;
    if (draftKind && (!artifact || artifact.kind !== draftKind)) return json({ error: "The model did not return the requested delivery document. Previous revisions are preserved." }, 502);
    if (artifact && (!draftKind || artifact.kind !== draftKind)) return json({ error: "An unsolicited document change was rejected." }, 502);
    let next = { ...applyBuildResponse(state, result, model, input.prompt), connectionId: input.connectionId, routing };
    if (artifact) next = { ...next, ...reviseArtifact(next, artifact.kind, artifact.content, member.userId) };
    const project = await persist(member, next);
    if (!project) return json({ error: "The response could not be saved, or the project changed during generation. Reload before retrying." }, 409);
    return json({ project, response: result, model, memory, routing });
  } catch (error) {
    if (error instanceof ProviderError) return json({ error: error.message }, error.status);
    return json({ error: "Builder request could not be completed. Check approved-memory storage and provider availability; reload before retrying." }, 503);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Cross-origin requests are not accepted." }, 403);
  const parsed = editSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid code update." }, 400);
  try {
    const input = parsed.data;
    const access = await memberProject(input.projectId, true);
    if ("error" in access) return json({ error: access.error }, access.status);
    if (access.project.revision !== input.revision) return json({ error: "Project changed. Reload before saving." }, 409);
    const state = initialBuilder(access.project);
    if (input.action === "save-artifact" || input.action === "approve-artifact") {
      if (!isDeliveryProject(access.project) || !canReviewArtifact(access.role, input.kind)) return json({ error: "Your role cannot edit or approve this delivery artifact." }, 403);
      if (input.kind === "trd" && !prdApproved(state)) return json({ error: "Approve the current PRD before preparing or approving the TRD." }, 409);
      const artifact = state.delivery?.[input.kind];
      if (input.action === "approve-artifact" && (!artifact || artifact.version !== input.artifactVersion || (input.kind === "trd" && artifact.basedOnPrdVersion !== state.delivery?.prd?.version))) return json({ error: "Document revision changed. Save and review the current version before approval." }, 409);
      if (input.action === "approve-artifact") {
        const { data, error } = await access.db.rpc("kova_approve_delivery", { project_id: access.project.id, expected_revision: input.revision, artifact_kind: input.kind, artifact_version: input.artifactVersion });
        if (error || !data) return json({ error: "Approval denied or revision changed. Protected review storage must be configured." }, 409);
        access.project = data as PlatformRecord;
        await hydrateApprovals(access);
        return json({ project: access.project });
      }
      const next = reviseArtifact(state, input.kind, input.content, access.userId);
      const project = await persist(access, next);
      return project ? json({ project }) : json({ error: "Document changed or could not be saved. Reload before retrying." }, 409);
    }
    if (isDeliveryProject(access.project) && (!deliveryReady(state) || !["Owner", "Admin", "Developer"].includes(access.role))) return json({ error: "Code changes require current PRD and TRD approvals and developer access." }, 403);
    const html = input.action === "edit" ? input.html : state.snapshots.find((snapshot) => snapshot.id === input.snapshotId)?.html;
    if (html === undefined) return json({ error: "That saved revision is no longer available." }, 404);
    const next = changeBuilderHtml(state, html, input.action === "edit" ? "Manual code saved" : "Saved revision restored", input.action);
    const project = await persist(access, next);
    if (!project) return json({ error: "Code could not be saved. Reload before retrying." }, 409);
    return json({ project });
  } catch { return json({ error: "Code could not be saved. Your draft is still available in the editor." }, 503); }
}
