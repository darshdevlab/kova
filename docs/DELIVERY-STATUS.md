# Kova delivery status

Updated: 2026-09-25. This rebuild is not certification that all 338 baseline features or later acceptance additions are complete.

## Rebuilt experience

- Persistent, responsive product shell with Silver/Ink/Jade default styling, six selectable themes and working keyboard-accessible profile controls.
- Individual and organisation signup/sign-in intent, official Google identity asset, email/password validation and recovery. Verified organisation creation is idempotent.
- Home submits a requirement directly into a continuous chat/work surface. A one-use handoff starts the conversation without a second click; ordinary visits and reloads do not initiate inference.
- Direct builds ask model-generated, application-specific questions. No fixed Clarify form or mandatory PRD/TRD.
- Product delivery is a separate route with editable/versioned PRD and TRD, role-checked approvals, stale-approval invalidation and review inbox status. Approval authority lives outside browser-writable JSON and database triggers enforce code gates.
- Generated HTML preview, source editing, export and six saved rollback snapshots. Preview blocks parent-session access and external network requests. Local HTML validation is not backend testing.
- Configurable Bot organisations, user/coordinator/Bot nodes, directed editable relationships, templates, private team URLs, team/direct chats, messages, artifacts, tasks and approvals. External execution remains clearly labelled demo.
- Dynamic model catalog and task-aware, budget-bounded shared Auto selection. Home and builder expose funding/provider selection.
- Encrypted server-side BYOK storage for OpenAI, Anthropic, OpenRouter, public HTTPS Ollama and compatible endpoints; connection testing, catalogs, key replacement and deletion. Local/private endpoints are blocked until a dedicated connector exists.
- Proposed/approved/revoked scoped memory with sources, version checks and history. Only approved eligible memory is supplied as reference context. This is not model training.
- Profile credit balance and actual shared-key request usage; separate Credits and Settings sections. Payments remain simulated with no card collection.
- Cloud-backed workspace membership, role changes, invitations, project search/archive, and access to existing saved developer workspaces.

## Verification evidence

- Final combined regression run: 166 checks passed in desktop Chromium and mobile Chromium viewport, including workspace-switch races, account intent, project actions and light/dark theme integration.
- Provider suite: 19 tests passed, covering encryption, tenant permissions, credential redaction, rotation/revocation, SSRF/DNS pinning, deadlines/body bounds, provider catalogs and desktop/mobile controls. Non-OpenRouter inference uses fixtures.
- Eight additional Bot domain/API checks passed with explicit database fixtures.
- Delivery approval migration passed disposable PostgreSQL RLS/trigger checks, including forged approval JSON, role restrictions, stale PRD/TRD gates and direct REST code mutation rejection. Applied to the live Supabase project.
- Thirteen live checks passed for concurrent personal-space creation, idempotent organisation setup, Bot configuration/chats/artifacts/reload, stale revisions, approved memory retrieval, encrypted provider save/catalog, tenant denial, PM/developer delivery approvals, Viewer denial, stale-approval invalidation and forged REST approval rejection. Temporary accounts/workspaces were removed afterward.
- Four additional real-backend browser checks passed at desktop and mobile viewports: preview interaction, persisted Bot messages, authenticated provider settings and project navigation. This run used hand-authored HTML, not paid generation, and cleaned up all temporary resources.
- One earlier live BYOK OpenRouter generation produced a small interactive HTML app using approved project memory and persisted the output. No claim of generated backend execution.
- Final lint, TypeScript and production build passed. Source credential scan found no configured server secret values in the 157 tracked or proposed source files.
- Screenshots are local evidence, not proof of external integrations. Browser suites explicitly use fixtures; live checks are separate.

## External and production boundaries

- GitHub reference import stores a URL; clone, isolated execution and PR creation are not connected. GitHub App key/installation and a supported runner remain prerequisites.
- Notion runtime publishing is not configured. An assistant-side connector is not app runtime authorization.
- No paid sandbox or overage approval was used. There is no general-purpose repository runner or generated-app deployment service in this build.
- Bots demonstrate coordinated execution; they do not run a distributed Lyzr worker engine.
- Shared-key AI is restricted to the configured account allowlist and daily request reservation limit. Demo credits do not pay for inference or increase that limit.
- BYOK costs belong to the connected provider account. Demo ledger values are not reconciled provider spend.
- Google OAuth is still in testing with the approved test user; public OAuth launch and production email delivery require separate configuration.
- Enterprise SSO, private runners, operational telemetry, broad browser/accessibility/load/security testing, and remaining registry acceptance cases are not complete.
- Rotate the provider key previously shared in conversation before a public launch.

## Canonical planning

The [portable feature registry and journeys](./rebuild/README.md) preserve the canonical `Lyzr-AI/product-planning/rebuild` workspace files. The baseline contains 338 IDs. Supplements/corrections are overlapping traceability rows, not a new completed-feature total. See [design rules](./REBUILD-DESIGN.md) and the in-app `/design-system` for the visual direction.
