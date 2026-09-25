# Kova rebuild journeys and permission contract

Planning snapshot: 2026-09-25. All flows below are required target behavior, not claims that the existing product completes them. The registry supplies row-specific acceptance; these journeys supply connected behavior and recovery. Screen IDs are proposed information architecture, not assertions that corresponding routes exist.

## Shared route decisions

One identity can own a personal workspace and belong to multiple companies. Individual is an ownership context; Nontechnical, Developer, PM and QA describe working responsibilities. Client is a project-scoped audience, mapped to Viewer or explicitly granted Contributor/reviewer permissions, not an implicit company-wide role.

Direct Build starts immediately in conversation with a work panel. The coordinator asks app-specific questions only when needed, persists a bounded task contract and delegates actual work. PRD/TRD are optional here. Full Delivery uses PM requirements -> draft PRD -> PM approval -> Notion publication -> developer review/questions -> TRD -> technical approval -> build -> tests/QA -> code review -> release approval -> deployment -> monitoring. Switching route keeps the same project, conversation, source versions and evidence; it does not retrospectively invent missing approvals.

Guided versus Developer changes presentation. Direct Build versus Full Delivery changes the delivery process. Preview First versus Full Build changes output fidelity. Ask/Auto/Full changes permitted autonomy within policy. None of these four choices grants permissions or marks work complete.

## Screen map

| ID | Surface | Required content and behavior |
| --- | --- | --- |
| SC01 | Account access | Signup name/email/password/confirmation, email/Google login, verification/recovery, callback errors; no demo bypass or mandatory onboarding. |
| SC02 | Project home | Active workspace switcher, Build from a prompt, Import a repository, search/filter/organize, resumable projects; optional discovery/templates. |
| SC03 | Profile menu | Scoped balance/limit, used/remaining progress, Add credits, profile, sign out; no configuration or detailed-ledger overload. |
| SC04 | Continuous project workspace | Persistent shell; chat left/work right; composer context/model/funding controls; actual task events; preview/code/test/error/artifact panels. Mobile switches panels without separate state. |
| SC05 | Product and technical artifacts | Optional direct-route planning; Full Delivery PRD, requirements, design/decision references, technical questions and TRD; version history and stale approval markers. |
| SC06 | Inbox and handoff | Assigned questions, approvals, review bundles, unread status and notification preferences; owner and required next action. |
| SC07 | Preview and design | Real or explicitly simulated preview, responsive controls, Context Lens, scope/impact, tokens/assets/canvas, visual diff and design approval. |
| SC08 | Repository intake | Connection/install scope, revision selection, clone status, framework/service/test discovery, corrected topology and compatibility report. |
| SC09 | Developer workspace | Actual source tree/editor/terminal, branch/diff, dependency readiness, environment secret references, process/debug controls and isolated execution. |
| SC10 | Generated-app data/auth | Database/table/schema/query, fixtures, app authentication/permissions, migration preview and separate approval/recovery. |
| SC11 | Test and QA workspace | Exact-build lint/unit/API/browser/visual/accessibility/eval evidence, coverage gaps, manual QA, defects and sign-off. |
| SC12 | Git review | Actual changed files/staging/commits, provider checks, linked PRs, code-owner approvals, merge-order/conflict status. |
| SC13 | Bot directory and teams | Bot organizations/teams, definitions, role/model/tools, workflow topology, scopes, budgets, templates and run history. |
| SC14 | Bot portal and shared memory | Stable private individual chat portal, task activity, approved shared memory/knowledge, provenance/version/retention and context controls. |
| SC15 | Release and deployment | Target capability, immutable artifact, gates, environment promotion, actual deployment/health/URL, domain and rollback limitations. |
| SC16 | Settings and connections | Account/company configuration, members/roles/policies, AI Providers/BYOK, connector permissions, runner setup, appearance, localization, security and retention. |
| SC17 | Credits & Usage | Detailed scoped ledger/filters/reservations/consumption, estimates, separate demo purchase flow and receipts; no real payment collection. |
| SC18 | Operations and audit | Health/logs/traces/cost, deployment correlation, incident/feedback proposals, security/audit evidence. |
| SC19 | Discovery and marketplace | Optional consultant, prompts/use cases/tutorials, listings with supported dependencies/cost/security evidence, clone and publication. |
| SC20 | Client review and collaboration | Permission-limited review links/embeds, comments, assigned approvals, artifact status and handover readiness. |
| SC21 | Export and handover | Source/docs/workflows/approved context/permitted data, dependency manifest, supported portability checks and ownership transfer record. |
| SC22 | Help and support | Support/community/demo destinations, permitted diagnostic attachment, request status and unavailable-service recovery. |

## Persona journeys

### J01 - Individual owner: first visit through returning work

Entry: unauthenticated person or returning owner. Screens: SC01 -> SC02 -> SC03/SC17 -> SC04. IDs: A001-A010, FND-005, BSC-001, BSC-014, SUP-13, SUP-17, COR-005-COR-007.

1. Sign up or sign in; validate confirmation and callback state. After authentication, show the personal workspace with prompt/import choices immediately.
2. Open profile to inspect personal available/reserved/used credits and current limit. Unknown balance is a loading/error state, not zero. Select Add credits to enter a labelled simulated purchase.
3. Enter a prompt or resume a saved project. Recover an unsent draft but never auto-send it or restart a prior paid action.
4. Switch between project, usage and settings while the shell remains mounted. Return to the same scroll, editor and draft state.
5. Join a company via the verified invited email, then switch back to personal. Confirm projects, keys, usage and role controls follow the selected workspace.
6. Sign out and revisit a protected URL. No stale personal/company content appears. Recovery of an account never restores revoked workspace access.

Exit evidence: sign-in/recovery/denied callback runs, refreshed draft and usage reconciliation, tenant-switch and sign-out deep-link checks. Personal owners may fill PM/technical roles only where policy allows; the record still names each gate and artifact revision. Cases: EC01, EC02, EC05, EC09, EC11, EC12.

### J02 - Nontechnical builder: requirement to working output

Entry: a plain-language outcome such as a snake game or a customer support tool. Screens: SC02 -> SC04 -> SC07 -> SC11 -> SC15. IDs: INT-001, PLN-003, A049-A051, A061-A065, TST-002-TST-005, COR-007-COR-011.

1. Submit the requirement and open the split-pane project workspace immediately. No fixed business-scope form, Clarification heading or compulsory PRD/TRD gate.
2. Coordinator reads existing context and asks only unresolved app-specific questions in chat. For a game, use sensible defaults or ask about controls; for a support system, clarify actual roles/data/integrations.
3. Show proposed outcome, assumptions, acceptance, permitted data/tools, spend/time bounds and next action in plain language. A missing dependency offers Connect/Provision/Mock/Skip; required skipped dependencies block real completion.
4. Delegate relevant design/frontend/backend/test work. Chat reports actual events, questions and decisions; the side panel displays the current artifact. Lyzr fixtures carry a simulation label on every affected run/output.
5. Inspect preview, make feedback or select an element with Context Lens, review scope impact and iterate within the same conversation.
6. Run real UI and backend checks for the generated output. Explain failures and repair limits in plain language; a working static preview cannot imply a tested backend.
7. Present release target, readiness, expected cost and access policy. Obtain required release authority; verify real hosting/health before saying deployed.
8. Reopen the project later with history, source, output, decisions and errors intact.

Exit evidence: two materially different prompts showing context-sensitive behavior; output behavior and UI/backend tests on the same revision; one failure/retry; mobile continuity. Cases: EC02, EC03, EC05, EC08-EC11, EC14, EC18.

### J03 - Developer: imported repository to reviewed change

Entry: authorized repo URL, existing project or a linked developer review. Screens: SC08 -> SC04/SC09 -> SC10/SC11 -> SC12. IDs: REP-001-REP-010, DEV-001-DEV-010, GIT-001-GIT-008, SUP-01, SUP-04, SUP-07, COR-010.

1. Choose repository/install scope and exact revision/branch. A URL record is intake-pending until clone and capability checks finish.
2. Inspect discovered stack/services/APIs/owners/tests. Correct inferences and approve the map; unsupported frameworks or unavailable private networking receive an actionable diagnosis.
3. Preserve existing build/test commands and baseline failures. Select Direct Build or review the Full Delivery TRD as appropriate; neither route overwrites existing code just to fit a template.
4. Resolve dependencies/secrets/network access. Secrets use server-side references; sandbox starts only after an enforceable free/included-only boundary is established.
5. Create isolated checkouts/jobs with file/service ownership and interface contracts. Parallel work has an explicit join; conflicts and failed branches block dependent tasks.
6. Edit or delegate code and inspect actual source/diff/runtime. Test app permissions and approve destructive migrations separately.
7. Run repository-native checks and generated API/browser tests against the current revision. Existing baseline failures and skipped checks remain visible.
8. Review/stage changes and create a real policy-compliant draft PR. Multi-repo work includes linked PRs, required owners and merge order. Revoked provider scope or conflicting remote commits lead to recovery, not fabricated success.

Exit evidence: clone/revision, corrected topology, isolated execution, command logs, conflict recovery, actual PR URL and remote checks. Cases: EC01-EC09, EC13, EC14, EC16. S03/S04/S07/S08/S10/S11/S12 extend this path.

### J04 - PM: requirements through accountable delivery

Entry: business idea, approved feedback evidence, Notion document or authorized imported design/work item. Screens: SC04 -> SC05 -> SC06 -> SC11 -> SC15 -> SC18. IDs: INT-002-INT-004, PLN-002-PLN-007, COL-003-COL-005, UNI-019, SUP-02, SUP-08, SUP-12.

1. Select Full Delivery and supply real source context. Capture requirement, owner, source/version and measurable acceptance; missing customer evidence remains an assumption.
2. Resolve relevant business questions in conversation. Draft a PRD with acceptance and design/state coverage; retain unresolved questions with owner and blocker state.
3. PM approves scope and separately authorizes publication of the reviewed PRD. Publish to an explicitly shared Notion page/database through Kova's own scoped runtime integration.
4. Notify the assigned developer with PRD version, sources and open questions. Publication or notification failure remains retryable; the workflow does not imply a successful handoff.
5. Developer reviews and returns business questions to PM, then drafts a TRD rather than another PRD. PM resolves business ambiguity; developer owns technical approval.
6. Track build and QA evidence. A material requirement edit previews affected TRD/code/tests and invalidates affected approvals; no outdated release can proceed.
7. Review accepted outcomes and outstanding limitations. PM approval does not substitute for QA, code review or release authority.
8. Review connected production evidence as a next-scope proposal after release; no autonomous expansion or production mutation.

Exit evidence: PRD approval/publication identity, Notion version, developer notification/question thread/TRD, stale-scope rejection and linked release evidence. Cases: EC04, EC06, EC08, EC09, EC16, EC17.

### J05 - QA: acceptance criteria to release decision

Entry: exact build revision with candidate readiness and linked acceptance. Screens: SC06 -> SC11 -> SC07/SC10 -> SC12/SC15. IDs: TST-001-TST-008, BSC-013, UNI-007/008/011, COL-003, SUP-06.

1. Inspect build/source/artifact identity, environment and permitted test data. Missing criteria or source mismatch prevents a complete coverage claim.
2. Derive executable checks and manual exploration from acceptance; retain untested cases. Configure synthetic personas, networks, viewports and supported browser engines.
3. Execute unit/API/contract/browser/visual/accessibility/eval checks as applicable. Separate fixtures, configuration checks, skipped cases and live integration tests.
4. Explore negative permissions and recovery manually; attach screenshots/traces/logs/repro steps to failed criterion and exact revision.
5. Assign defects to a developer/Bot within bounded repair scope, then rerun affected and required regression checks on the new revision.
6. Sign off or reject with known limitations. New code/scope, revoked approver membership or missing evidence invalidates sign-off.
7. Hand the release owner a current evidence bundle. A separate QA Bot does not establish independent human review or correct results by its name alone.

Exit evidence: criterion coverage with failures/skips, browser-engine coverage, manual role checks, defect/retest loop and revision-bound QA decision. Cases: EC01, EC04, EC08-EC11, EC13, EC17.

### J06 - Company admin: workspace governance and billing authority

Entry: existing owner/admin account. Screens: SC02 -> SC16 -> SC13/SC17 -> SC18. IDs: SUP-13-SUP-15, COL-001/006/007, REP-007-REP-009, BSC-016/017, MOD-003.

1. Create/select company workspace; configure members and Owner/Admin/PM/Developer/QA/Viewer roles. Billing authority is an explicit grant, not implied for every member.
2. Invite verified identities, distinguish pending/accepted/expired/revoked invites and handle existing accounts. Role change/suspension/removal revokes active access; last-owner protection prevents lockout.
3. Configure branch/review/approval templates, providers, secrets, spending limits, retention and allowed data destinations. Policy inheritance shows effective rules and controlled overrides.
4. Connect runtime integrations with least required scope and verify capability; the assistant's connected tools do not imply deployed Kova authorization.
5. Assign Bot teams and tool/model grants. Delegated permissions cannot exceed parent grants; generated-app agents receive distinct identities/credentials.
6. Configure client project isolation and explicit handover. Test access both via navigation and crafted API/deep-link requests.
7. Review scoped usage and simulated purchases. Enforce real provider and free-only sandbox budgets separately.
8. If private execution is needed, follow later-phase runner diagnostics/pairing and prove isolation/egress before activation. Until supported, report unavailable.

Exit evidence: member lifecycle/last-owner denial, inherited-policy enforcement, cross-company isolation, connection revocation and audited billing grant. Cases: EC01, EC05-EC07, EC12, EC15, EC16.

### J07 - Client: isolated review and handover

Entry: an invitation or permitted preview/review link for one client project. Screens: SC20 -> SC07/SC05 -> SC06 -> SC21. IDs: COL-001/002/003, BSC-018, CMP-017, UNI-019, SUP-09, SUP-14.

1. Authenticate or satisfy the specific preview-access policy. See only the assigned client project and disclosed artifacts; no company directory, other clients, secrets or unrelated usage.
2. Inspect the shared revision, actual versus mocked capabilities and open limitations. A review link does not automatically grant source export or editing.
3. Comment on an anchored screen/requirement, answer an assigned question or approve only a specifically granted client review. Client acceptance cannot bypass technical/QA/release gates.
4. Revisit after revisions and see which comments became stale and which approvals need renewal.
5. Authorized service-firm owner prepares handover: ownership, permitted source/data, dependencies, deployment responsibility, credentials to reconnect and known limitations.
6. Client accepts transfer/export under explicit grants, verifies supported components outside Kova and loses access to resources not included. Revoke or expire old links after handover as agreed.

Exit evidence: two isolated client projects, denied cross-client URLs/API reads, versioned review, revoked preview and inspected handover manifest. Cases: EC01, EC04, EC06-EC08, EC13.

## Supporting journeys

### J08 - Bot owner: team, private portal and approved memory

Screens: SC13 -> SC14 -> SC04/SC11. IDs: AGT-001-AGT-009, CMP-003/011/012, SUP-03-SUP-06, SUP-11, COR-011-COR-013.

1. Create a scoped team/organization and Bot definitions with model, tools, schemas, memory, triggers, budgets and human gates.
2. Open a stable private Bot chat portal; load only authorized current context. Delivery Bots and agents built into an app stay separate.
3. Choose sequential, parallel, hierarchical or mixed topology; validate contracts and explicit joins.
4. Run representative fixtures before activation. Current Lyzr demonstrations show simulated labels, including errors, approval waits, retry/cancel and handoffs.
5. Promote approved decisions into shared memory; another Bot consumes the current version with provenance. Rejected/stale suggestions do not become authoritative.
6. Inspect real native run events where supported, recover checkpoints without duplicate side effects and compare/roll back definition versions without undoing completed external actions.

Exit evidence: team/portal permissions, four mode cases, failed parallel branch, repeated action protection, cross-workspace memory denial and superseded-memory replay. Cases: EC01, EC04, EC09, EC10, EC15, EC16.

### J09 - Provider user: BYOK, model selection and local Ollama

Screens: SC16 -> SC04 -> SC17/SC18. IDs: MOD-001-MOD-003, AGT-006, SUP-10, COR-001-COR-004.

1. Open Settings > AI Providers in the active workspace. Add OpenAI, Anthropic/Claude, OpenRouter or another supported connection; expose effective policy and who can use it.
2. Store credentials encrypted server-side, test connection and discover supported models. Invalid/revoked credentials produce metadata-only errors.
3. For Ollama, pair an authorized local/private connector and endpoint; a hosted server cannot assume the user's localhost is reachable.
4. Search the complete discovered supported catalog, inspect capabilities, choose defaults and override per prompt.
5. Select Kova-managed funding or the permitted provider connection. Before sending, show effective model, payer, estimates and budget; no silent funding-source substitution.
6. Run and record actual provider/model/usage or failure. Auto routing may use optional Jev under policy, with benchmarked fallback/manual review; it never grants authority.
7. Rotate/disconnect and confirm later calls fail; no raw secret appears in chat, browser storage, logs or exports.

Exit evidence: each supported provider lifecycle, paginated/stale catalog, endpoint offline/revocation, model mismatch and quota/rate-limit recovery. Cases: EC05-EC07, EC09, EC14, EC16, EC18.

### J10 - Billing-authorized user: usage and simulated purchase

Screens: SC03 -> SC17 -> SC04. IDs: A006/A162-A166/A170, OPS-004/005, SUP-17, COR-004-COR-006.

1. Read the current workspace summary in profile and open Credits & Usage for detailed history.
2. Filter by period/project/Bot/task/model; distinguish actual, estimated, reserved and demo values. Show remaining and used amounts with accessible progress text.
3. Choose demo pack or validated amount, review simulated price/credits and select Simulate payment. Collect no card/bank details and call no payment processor.
4. Processing ends in simulated success/receipt or recoverable failure/cancellation. Repeated clicks, network retries and refresh produce at most one demo credit entry.
5. A real run reserves authorized spend, settles measured consumption and releases unused reservation on fail/cancel. Demo top-ups cannot fund paid inference or sandbox overages.
6. Insufficient funds offer authorized alternatives, never implicit personal-key fallback or an invented successful run.

Exit evidence: ledger arithmetic, zero/unknown/unlimited limit display, invalid amount/cancel/failure/success/retry/refresh, simultaneous reservations and cross-workspace denial. Cases: EC01, EC02, EC03, EC05, EC09, EC10.

### J11 - Discovery, marketplace and support

Screens: SC19 -> SC02/SC04 -> SC22. IDs: A025-A032, A151-A169, MKT-001-MKT-005, CMP-022.

1. Optionally browse prompts/tutorials/use cases or consult about a problem; users with a prompt can bypass discovery.
2. Inspect listing framework, dependencies, cost, verification evidence and source/version; missing data remains unknown.
3. Clone to a new owned project, reconnect permitted integrations and replace sample data/credentials; do not copy publisher entitlements.
4. Customize through J02/J03, test and deploy through J14. Publishing requires separate listing/cost/access review.
5. Request support with redacted diagnostics and explicit submission; preserve drafts if unavailable.

Exit evidence: empty filters, inaccessible listing, failed clone, dependency readiness, owner-cost warning and no secret-bearing support submission. Cases: EC03, EC05-EC07, EC10, EC14.

### J12 - Designer or reviewer: reference to accepted visual change

Screens: SC07 -> SC04 -> SC11/SC06. IDs: DES-001-DES-005, CMP-007/008/016, UNI-001-UNI-007, COR-014.

1. Import permitted Figma/reference/assets and record source versions. Apply Kova tokens to builder chrome; generated apps retain their own design.
2. Click/lasso an actual element or journey, inspect provenance/dependencies and choose the intended scope.
3. Propose property/code changes, inspect before/after and responsive/empty/error/permission states; undo/redo preserves unrelated changes.
4. Obtain design approval and run visual/accessibility plus affected functional checks.
5. Mobile pane switching, reduced motion and keyboard focus remain usable; compare rendered screenshots to intended references.

Exit evidence: source-mapped visual diff, desktop/mobile screenshot review, keyboard run and corrected stale selection. Cases: EC03, EC04, EC08, EC11, EC14.

### J13 - Developer/data owner: data, authentication and migration

Screens: SC10 -> SC09 -> SC11 -> SC15. IDs: DAT-001-DAT-007, A113-A118, SUP-07.

1. Choose environment and inspect actual schema/data permissions; separate generated-app authentication from Kova account login.
2. Design schema/auth changes and preview destructive impact with synthetic/masked test data.
3. Require a separate migration grant with backup/recovery or forward-fix plan; code approval alone does not authorize data loss.
4. Apply to the permitted test environment, validate data integrity and role/RLS/API behavior, then seek environment-specific promotion.
5. On partial migration failure, surface applied steps and recover under the approved procedure; do not claim universal reversibility.

Exit evidence: unauthorized write denial, migration approval block, failed migration recovery and app-role tests. Cases: EC01, EC04, EC07, EC08, EC13, EC17.

### J14 - Release owner/operator: release to learning

Screens: SC12/SC11 -> SC15 -> SC18 -> SC05. IDs: REL-001-REL-007, OPS-001-OPS-006, SUP-08.

1. Confirm exact artifact digest, source revision, current QA/code/scope approvals, migrations and supported target.
2. Promote approved artifact under separate environment credentials; free-only execution and budget limits still apply.
3. Verify provider deployment outcome, URL, health and access. A local release snapshot or preview is not a production deployment.
4. Handle unhealthy rollout by the documented rollback/forward-fix procedure; failed operations remain failed.
5. Link observed metrics/incidents/feedback to deployment and requirement. No connected telemetry means no claim about customer behavior.
6. Propose a fix/experiment for PM/operator review, then return to J03/J04; no unapproved production mutation.

Exit evidence: actual provider/deployment ID, health result, failed rollout recovery and proposal-only improvement loop. Cases: EC05-EC09, EC13, EC17.

### J15 - Security/platform admin: private execution and adversarial controls

Screens: SC16 -> SC09/SC13 -> SC18. IDs: COL-006/007, AGT-009, CMP-013, BSC-014/017/018, SUP-15.

1. Define repo/data/network/model egress policy and scoped identities before runner activation.
2. Pair only supported private runners with short-lived scoped credentials; inspect version/capabilities/connectivity/isolation.
3. Exercise denied network destinations, cross-job file access, malicious imported instructions and unauthorized delegation.
4. Configure service-token/session/preview revocation, webhook signing/replay protection, retention and redacted audit.
5. Keep unsupported self-hosting/private execution unavailable; do not present container packaging as demonstrated isolation.

Exit evidence: denied actions at enforcement layer, revoked credential replay, isolated job tests and audit records. Cases: EC01, EC06, EC07, EC12, EC14, EC16.

### J16 - Owner/client: export, local roundtrip and exit

Screens: SC21 -> SC09/SC20. IDs: A023/A130, CMP-020, BSC-015, SUP-09.

1. Select authorized source/docs/workflows/approved decisions/permitted data and disclose retention/ownership limits.
2. Generate dependency/version/adapter manifest, excluding secrets and other clients' resources.
3. Inspect archive for completeness and supported build instructions; identify provider-specific or unsupported portability limits.
4. Run supported components outside Kova with newly supplied credentials, or label the result export-only.
5. Reimport/local-roundtrip with drift/conflict review where supported; deletion/transfer is separate from export and requires its own authority.

Exit evidence: inspected export manifest, secret/tenant exclusion, reproducible supported run and safe roundtrip conflict handling. Cases: EC01, EC04, EC07, EC13, EC14.

## Permission matrix

These are target defaults. Server-side effective policy is authoritative; UI visibility alone is never a control.

| Action | Individual owner | Nontechnical contributor | Developer | PM | QA | Owner/Admin | Client |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read project/chat | Own scope | Granted projects | Granted projects | Granted projects | Granted projects | Admin scope per policy | Explicit project/artifacts only |
| Request build/edit | Own bounded contract | Granted task scope | Granted repo/task scope | Propose; execute only with grant | Test/defect; edit only with grant | Role does not imply repo execution | No by default |
| Approve PRD | Own project policy | Only if designated | Only if designated PM | Assigned scope | No by default | Only if designated scope owner | Assigned client review only |
| Approve TRD/code | Own project policy | No by default | Designated technical/code owner | No by default | No by default | Only with technical grant | No |
| QA sign-off | Own policy, actor recorded | No by default | Only if policy allows same actor | No by default | Assigned QA | No automatic bypass | No |
| Release/migrate | Separate grant and gates | No by default | Separate grant and gates | No by default | QA sign-off only | Separate release/data grant | No |
| Manage members/policy | Personal ownership only | No | No by default | No | No | Granted company scope; protect last owner | No |
| Configure/use BYOK | Own connection | Use granted connection | Use/configure if granted | Use if granted | Use if granted | Grant/rotate policy-scoped connections | No by default |
| Buy demo credits/view usage | Own scope | Own allowed usage | Own allowed usage | Own allowed usage | Own allowed usage | Billing-granted purchase/aggregate view | No by default |
| Export/transfer | Permitted own data | Explicit export grant | Explicit export grant | Explicit export grant | Evidence export if granted | Authorized ownership/data scope | Handover grant only |

Viewer remains read-only. Switching presentation, workspace, persona simulation or Bot mode never raises authority. Suspension/removal is checked on active connections and queued jobs as well as on the next page load. Tokens, notifications, search, previews, exports and shared memory obey the same tenant boundary.

## Edge and error contracts

Each registry row references a subset. Every linked case is required acceptance, not a test result.

| ID | Trigger and expected behavior | Evidence to retain |
| --- | --- | --- |
| EC01 | Wrong tenant, guessed object ID, Viewer write, removed member or unauthorized client: deny at server/serving layer, redact metadata and clear unauthorized cached views. | Allowed/denied requests using two workspaces and identities, including direct links and queued work. |
| EC02 | Slow/offline network, disconnect or server error: section-level pending/error, preserved drafts, safe retry, no false success or whole-shell reset. | Interrupted/reconnected journey, saved state and request outcomes. |
| EC03 | Empty/invalid input, malformed upload, exceeded size or missing field: actionable validation; no mutation until valid; retain other entries. | Valid/boundary/invalid inputs and persisted-state comparison. |
| EC04 | Concurrent edit, stale tab/revision, remote drift or workspace switch: detect conflict, show versions, reconcile explicitly and never overwrite silently. | Two-session conflict, chosen resolution and final revisions. |
| EC05 | Insufficient balance, parallel reservation, provider quota, unknown spend or free compute boundary missing: block/stop safely, settle once; demo credits do not grant real funds. | Ledger before/after, enforcement result, cancelled/failed reservation and no paid compute. |
| EC06 | Expired/revoked OAuth, missing scope/install/page access, provider timeout/rate limit: reconnect with retained context, backoff and accurate connection state; no guessed success. | Provider capability/denial result and retried operation identity. |
| EC07 | Secret, sensitive data or forbidden egress requested: enforce scope, redact logs/context/export, use encrypted references and deny unapproved destinations. | Redacted inspection, denied requests and key rotation/revocation records without secret values. |
| EC08 | Requirement/code/test changes after approval: mark affected evidence/approvals stale, block gated transition and require the accountable role on the new version. | Old/new artifact identity, blocked release and reapproval. |
| EC09 | Cancel/pause/crash/retry/duplicate click/webhook: persist state and side-effect IDs; recover checkpoints without duplicate external actions or debits. | Run state timeline, idempotency record and externally observed effect count. |
| EC10 | Mocked provider, Lyzr fixture, sample preview, config-only test or demo payment: label at action/output/history and exclude from live/verified completion. | Screens and evidence metadata showing execution mode and remaining dependency. |
| EC11 | Keyboard, screen reader, small viewport, long labels, reduced motion: no clipped/overlapping controls; focus and drafts survive transitions; accessible status/progress. | Desktop/mobile screenshots plus keyboard/assistive-technology interaction notes. |
| EC12 | Invalid callback, unverified identity, session expiry, recovery replay, revoked session: fail securely, offer recovery and retain only permitted unsent work. | Auth failures, protected-route/API denials and successful authorized recovery. |
| EC13 | Delete/transfer/destructive migration/undeploy: preview impact, obtain specific authority, honor retention/backups and explain irreversibility; partial failure has a recovery plan. | Approved impact, operation record and restoration/forward-fix check where supported. |
| EC14 | Unsupported repo/framework/model/tool/runner/artifact: disclose capability limits, offer supported path or unavailable state; never invent a functional adapter. | Capability report and blocked unsupported operation. |
| EC15 | Stale/conflicting/deleted memory or cross-team knowledge: honor approval/version/retention, surface conflict, exclude unauthorized context from every Bot. | Two-Bot replay before/after supersession and denied cross-workspace retrieval. |
| EC16 | Prompt injection in imports/tools/memory, malicious tool schema or delegated escalation: treat content as data; deterministic policy rejects expanded privileges and unsafe network/tool calls. | Adversarial fixture, denied action and audit evidence. |
| EC17 | Unhealthy/stale deployment, missing telemetry or production action request: distinguish unknown from healthy, require current release/operator authority and use approved recovery. | Deployment/health identity, denied ungated action and incident/recovery record. |
| EC18 | Context window exceeded, unavailable attachment, incompatible model or truncated output: show actual sources/limits, allow correction and safe continuation; never silently omit required context. | Submitted-context manifest, model capability check and preserved conversation state. |

## Legacy scenario coverage

S01 -> J01/J02; S02 -> J04/J12/J03/J05/J14; S03 -> J03; S04 -> J03 with coordinated repos; S05 -> J14/J03/J05; S06 -> J12; S07 -> J03/J13; S08 -> J13; S09 -> J08/J09/J05; S10 -> J03/J16; S11 -> J03/J05; S12 -> J03/J14 with explicit policy exceptions; S13 -> J05; S14 -> J06/J15; S15 -> J11/J02/J03; S16 -> J14/J04.

The original S01 mandatory-planning wording is superseded for Direct Build. Original Jira-led S02 wording is superseded by Notion for current delivery. Native mobile, multi-artifact, marketplace, enterprise and export remain committed baseline scope even when scheduled later; a journey mapping is not implementation completion.

