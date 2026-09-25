# Direct builder integration

Import `BuilderV3` (alias `DirectBuilder`) from `@/components/builder-v3`.

```tsx
<BuilderV3 project={record} role={role} onSaved={saved => updateRecord(saved)} />
```

Props are `{ project: PlatformRecord, role: Role, onSaved: (record: PlatformRecord) => void }`.
The parent owns navigation and the project list. The component resets when project ID changes, accepts newer parent revisions, and reports successful server saves through `onSaved`.

## Stored state

`BuilderProject` in `src/lib/build-context.ts` intersects the existing record type locally. No change to `platform.ts` is required.

- `project.data.builder`: version 1, up to 100 messages, HTML, six rollback snapshots, 60 saved activity events, actual model, optional provider connection ID, and routing metadata.
- `project.data.deliveryMode`: `direct` by default and entirely ungated. `delivery` and `product` require persisted PM PRD approval, then developer TRD approval, before building. Questions remain AI-generated and task-specific.
- The initial project description is displayed as the initial user message. Ordinary mounts perform read-only catalog/context requests. A home submission may set the single-use sessionStorage key `kova:build-start:${project.id}`; after verified context/catalog loading it is consumed before inference. Failure requires manual retry; reload does not recreate the key. Otherwise inference requires an explicit button press.
- New builder states seed `connectionId` from optional `project.data.providerConnectionId`; existing builder state wins. A **Project tools** link is shown only when `project.data.workspace` exists.
- Failed requests retain the input draft; failed code saves retain edited HTML. Reload preserves a dirty code draft for conflict recovery.

## Route contracts

All responses are non-cacheable JSON. All project access uses the authenticated session and workspace membership. Writes require editing membership and compare record revisions. Origin checks use the shared `isSameOrigin` helper.

- `GET /api/build-chat?projectId=UUID`: `{ project, memory }`.
- `POST /api/build-chat`: `{ projectId, revision, model, connectionId?, intent: "start" | "message" | "build" | "draft-prd" | "draft-trd", prompt? }`. Returns `{ project, response, model, memory, routing }` after persistence. Client history/system instructions are rejected.
- `PATCH /api/build-chat`: `{ projectId, revision, action: "edit", html }` or `{ projectId, revision, action: "rollback", snapshotId }`. Returns `{ project }`. No inference or paid request reservation.
- AI JSON is validated as `ask` with task-specific questions, `build` with complete HTML, or `message`. Invalid or truncated responses never replace saved HTML.

## Authoritative delivery reviews

Apply `supabase/delivery-review.sql` after the workspace migrations. Parent reported applying it as `kova_authoritative_delivery_reviews`. The protected `kova_delivery_approvals` table grants authenticated users SELECT only. Role-checked security-definer RPC `kova_approve_delivery` locks the project, checks project/artifact revisions, and records the approving identity and role. The server hydrates approvals from this table; approval fields in writable project JSON are never authority.

PRD editing/drafting/approval allows Owner, Admin, PM. TRD editing/drafting/approval allows Owner, Admin, Developer, after current PRD approval. Delivery HTML generation/edit/rollback allows Owner, Admin, Developer only after both current approvals. Direct behavior remains ungated.

`PATCH /api/build-chat` additionally accepts `{projectId,revision,action:"save-artifact",kind:"prd"|"trd",content}` or `{projectId,revision,action:"approve-artifact",kind,artifactVersion}`. Documents are limited to 30,000 characters with five previous revisions. AI drafting uses `action:"message"` plus `artifact:{kind,content}` and never approves the draft.

A database trigger invalidates both approvals on PRD edits and TRD approval on TRD edits. The old TRD is retained for revision; it must be saved against the new approved PRD. The trigger also protects against direct REST HTML writes before approval and delivery-mode downgrade. It derives Inbox status `PRD review`, `TRD review`, or `Approved`; these labels are not authorization inputs.

Delivery-only labels: tabs **PRD**, **TRD**; editors **PRD document**, **TRD document**; buttons **Draft PRD with AI**, **Save PRD**, **Approve PRD** (and TRD equivalents), **Discuss requirements**, **Build approved plan**. No QA or deployment status is invented.

`supabase/delivery-review-security-tests.sql` is for an EMPTY DISPOSABLE PostgreSQL database only. It tests actual SQL roles/RLS, protected approvals, PM downstream invalidation, forged JSON, Viewer REST-equivalent writes, membership, downgrade prevention, and direct-mode freedom. Never run its bootstrap against the linked live database.

## Providers and memory

- The parent `ModelSelector` and provider agent's `ProviderConnectionSelector` are reused.
- Missing `connectionId` means shared OpenRouter. The existing `authorizeAI` enforces account enablement, key presence, membership, and request limits.
- Shared models are validated against a fresh upstream catalog. Both input and output prices must be known, nonnegative, and within `KOVA_SHARED_MAX_USD_PER_MILLION_TOKENS` (USD per million tokens, default 15, bounded at 100). Nonzero additional request/image prices are rejected. Output is bounded to 8,000 tokens.
- `model: "auto"` uses a deterministic catalog policy: code-labelled models first for build tasks; small/mini/flash-labelled models first for conversation; ties use combined token price then ID. This is a selection policy, not a quality benchmark. Selected model, reason, requested model, and ceiling are stored in `builder.routing` and displayed in Activity. Failed inference never silently substitutes another model.
- BYOK uses `resolveProviderForInference({spaceId,connectionId,modelId})`. The selected connection's catalog is loaded; the first model is visibly selected when changing connections. Anthropic, Ollama, and OpenAI-compatible request/response formats are adapted at this boundary. BYOK does not consume the shared-key reservation.
- `retrieveApprovedMemory` supplies server-approved, scoped memory as untrusted user-reference data. A retrieval error is surfaced, never silently omitted. The memory and provider agents own their schema migrations and server configuration.

## Preview and tests

The builder shell follows Kova semantic theme colors and `--font-sans`; the generated iframe retains its independent white canvas and application styling. Desktop uses conversation/output columns. At widths up to 680px, conversation and output stack vertically; the output keeps its Preview/Code/Activity/Memory tabs (plus PRD/TRD for delivery). There are no mobile Chat/Work switching tabs.

Generated HTML runs in an opaque iframe with `sandbox="allow-scripts"`, no same-origin grant, and an early restrictive CSP. Inline scripts/styles and data/blob images are allowed; fetch, external dependencies, forms, embeds, and workers are blocked by policy. Export retains the CSP. Manual editing and six saved rollback snapshots are supported.

**Validate HTML** performs limited local document checks only. It does not execute JavaScript or verify a backend. Activity contains saved responses/edits/restores; no invented backend stages or test results.

`tests/e2e/builder-v3-api.spec.ts` exercises the real route module with mocked authentication, database, memory, and inference boundaries. `tests/e2e/builder-v3.spec.ts` exercises desktop/mobile UI with API fixtures, including explicit start, dynamic questions, reload persistence, preview interactions/isolation, manual edits, validation, export, rollback, failure recovery, and Viewer access. These tests do not prove live provider inference or deployed database configuration.

Run with isolated artifacts: `npx playwright test tests/e2e/builder-v3.spec.ts tests/e2e/builder-v3-api.spec.ts --reporter=line --output=/tmp/kova-builder-delivery-results`.
