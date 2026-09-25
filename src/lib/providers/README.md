# AI Providers integration

## Server configuration

- `KOVA_PROVIDER_MASTER_KEY`: exactly 64 hexadecimal characters (32 random bytes), server-only. Preserve across restarts. Losing/replacing it makes existing credentials unreadable; rotation currently requires replacing saved credentials under the new key. Never prefix with `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase secret (`sb_secret_...`) or legacy service-role key. Never expose in browser bundles.
- Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configure cookie authentication.
- Apply `supabase/provider-connections.sql` after `supabase/workspace-platform.sql`. This task does not apply SQL or configure external services.
- Missing/invalid master key, missing server secret, or unavailable table yields explicit unavailable state. There is no plaintext or browser-storage fallback.

## Components

```tsx
import { AIProvidersPanel } from "@/components/providers/ai-providers-panel";
<AIProvidersPanel spaceId={space.id} role={role} />

import { ProviderConnectionSelector } from "@/components/providers/provider-connection-selector";
<ProviderConnectionSelector spaceId={space.id} value={connectionId}
  onChange={(id, summary) => { /* save id; reload that connection's models */ }} />
```

Panel also has a default export. CSS is contained in `providers.module.css`; no global styles required. UI role is cosmetic: server independently checks membership. Selector `value=""` explicitly chooses the existing platform OpenRouter path. A nonempty value is a saved connection UUID; never silently fall back when it is unavailable. Keep the existing shared ModelSelector for the platform path; load the selected connection's catalog for BYOK. Clear selected model when connection changes. No existing chat/models/platform files are changed here.

`HomeModelControls` (named/default export from `@/components/providers/home-model-controls`) accepts `{spaceId, model, onModelChange, connectionId, onConnectionChange, onReadyChange?}`. It combines the connection selector, the shared platform ModelSelector for empty connectionId and a live BYOK model picker. Changing provider clears the old model and selects the first concrete model from the new live catalog. Restored valid selections are preserved; platform Auto is allowed. Loading, failed/empty catalogs and invalid selections report `onReadyChange(false)`; stale requests are aborted and errors include Retry. Parent must initialize readiness to false and disable/guard Build until onReadyChange reports true. Persist both connectionId and model into the builder. Platform catalog is independently verified as live because the shared ModelSelector can display cached fallback choices.

## HTTP contracts

All routes use Node runtime, verified Supabase session cookies and `Cache-Control: no-store`. All mutations require same-origin `Origin`; JSON POST additionally requires `Content-Type: application/json`, maximum 16 KiB body. Errors are `{error:string,code:string}` with 400/401/403/404/413/415/429/502/503/504 as applicable; upstream body, credentials and internal errors are not returned/logged.

| Method/path | Input | Result/access |
| --- | --- | --- |
| `GET /api/providers?spaceId=UUID` | Workspace | `{available,reason?,canManage,connections:ConnectionSummary[]}`; any member |
| `POST /api/providers` | `{spaceId,id?,provider,label,baseUrl?,apiKey?}` | `{connection:ConnectionSummary}`; Owner/Admin; id updates label/key; provider/endpoint immutable |
| `DELETE /api/providers/{id}?spaceId=UUID` | Connection/workspace | `{deleted:true}`; Owner/Admin |
| `POST /api/providers/{id}/test?spaceId=UUID` | Saved connection | `{ok:true,modelCount,checkedAt}`; Owner/Admin |
| `GET /api/providers/{id}/catalog?spaceId=UUID` | Saved connection | `{connection,models:ProviderModel[],checkedAt}`; any member |

`ConnectionSummary = {id,spaceId,provider,label,baseUrl,hasCredential,updatedAt}`. No key fragments or ciphertext. `ProviderModel = {id,name,contextLength?}`. Provider enum: `openai | anthropic | openrouter | ollama | custom`.

Create requires `apiKey` except Ollama. On update omitted/empty `apiKey` keeps the existing key. Delete and recreate to change endpoint or remove a credential. Official providers use fixed base URLs; custom expects an OpenAI-compatible base including `/v1` where required; Ollama expects a base before `/api/tags`.

## Server inference

```ts
import { resolveProviderForInference } from "@/lib/providers/server";
const target = await resolveProviderForInference({ spaceId, connectionId, modelId });
// target = { provider, modelId, connectionId, request }
const result = await target.request({ messages, max_tokens: 1024 });
```

Resolver verifies current user and workspace access, denies Viewer, loads/decrypts only the workspace connection and checks the live catalog for modelId. `request(payload:Record<string,unknown>):Promise<unknown>` rechecks membership and rereads credentials (rotation/deletion honored); only the selected model and `stream:false` are sent. It returns native provider JSON; adapt Anthropic `content`, Ollama `message`, or OpenAI-compatible `choices` in the caller. Anthropic requires `max_tokens` and a separate `system` field; Ollama generation limits use `options.num_predict`. This is non-streaming. Keys, headers and unrestricted fetch are never exposed. Keep this capability server-only; never serialize it. Caller must verify project access as well, enforce project/workspace association, budgets, request limits and payload bounds.

Discovery includes every model returned by the official catalog, including non-chat models; presence is not a guarantee of chat capability, credits or generation entitlement. Tests are non-billable catalog probes. OpenRouter also probes `/key` because its model catalog is public. Custom/Ollama may expose an unauthenticated catalog; successful discovery only proves catalog access, not paid generation permission.

## Security and verification

AES-256-GCM envelopes use random nonces and workspace/connection/provider associated data. Credential table grants only service-role access, has RLS enabled/forced and no browser policies. Application checks auth and membership before every privileged query. Private/local/reserved addresses, HTTP, non-443 ports, URL credentials/query/fragment and redirects are rejected; DNS resolves all addresses, rejects any restricted result and pins one checked address to the TLS request. No local connector exists. DNS/TLS/body share a 15-second timeout; discovery has an overall 30-second budget, pagination bounds and 8-MiB response limit. TLS hostname verification remains enabled. No provider request/response payload logging is added. Operator reverse-proxy/APM request-body logging must also exclude these credential endpoints.

Run `node --test tests/providers/providers.test.cjs tests/providers/browser.test.cjs`. Tests use synthetic fixtures and no real credentials/provider billing; browser harness compiles actual components with installed Next webpack/React, checks desktop/mobile interactions and writes screenshots under `tests/providers/artifacts`. `npx eslint tests/providers src/lib/providers src/app/api/providers src/components/providers` and `npx tsc --noEmit --incremental false` check lint/types.

Official references checked: [OpenAI models](https://developers.openai.com/api/reference/resources/models/methods/list), [Anthropic models and pagination](https://platform.claude.com/docs/en/api/models/list), [OpenRouter models](https://openrouter.ai/docs/api/api-reference/models/get-models), [OpenRouter current key](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-key), [Ollama tags](https://docs.ollama.com/api/tags), [Supabase server auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
