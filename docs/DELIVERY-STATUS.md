# Kova delivery status

Date: 2026-09-25. This is an implemented product slice, not certification that all 338 baseline entries or later additions are complete.

## Implemented

- Redesigned sign-in and signup: name, email, password, confirmation, Google sign-in, recovery and sign-out. No demo bypass.
- Cloud-backed personal and company workspaces, membership roles, scoped invitations and owner protection. Invitations are accepted when the verified email signs in; invitation email delivery is not implemented.
- Prompt and GitHub-reference project entry, optional direct-editor route, clarification, editable template PRD, PM approval, editable TRD, developer approval, archive/restore and search.
- Explicit cloud editor saves with revision-conflict protection. Existing editable graph and configuration tools remain available; some legacy state remains browser-local.
- Authenticated OpenRouter text/HTML generation, account allowlist, ten daily request reservations per account, saved generation records and isolated HTML preview. Browser tests use provider fixtures, not billed inference.
- Separate private Bot pages at /bots/<id>, saved instructions and mode selection, approval-gated simulated runs, pause/resume/cancel, simulated failure/retry and history.
- Simulated credit checkout, success/failure states, immutable transaction ledger, duplicate-transaction protection and exports. No payment processor or real card collection.
- Shared responsive navigation, six IDE themes, custom colors, company settings, approval inbox and connection-status views.

## Explicit simulation and integration boundaries

- Lyzr Bot execution is simulated. Parallel/hierarchical modes visualize orchestration; they do not execute a distributed worker engine.
- PRD/TRD preparation uses editable templates, not an autonomous PM or engineering process. Notion destination is shown but runtime publishing is not connected.
- GitHub URL import stores a reference; it does not clone. GitHub App private-key handoff, repository installation, clone/PR backend remain pending.
- Free-only sandbox execution remains disabled. No paid compute was started.
- Tests/review/release inside the editor validate local configuration or export snapshots. They do not run imported code or deploy generated apps.
- Jev is wired through OpenRouter's decisions endpoint. Automatic chat selection currently uses the conservative GPT-4o-mini default after classification; it does not implement a complete cross-provider routing policy.
- Production shared-key inference is restricted to an approved account, not all signed-in users. Provider spending is not synchronized to the demo ledger. No BYOK secret vault is implemented.
- Google OAuth remains in testing with an approved test user. This is not public OAuth launch approval.

## Verification

- 38 Playwright checks passed across desktop Chromium and mobile Chromium/iPhone-sized viewport.
- Coverage includes signup validation, OAuth failures/PKCE handoff, personal planning-to-editor flow, company invitations, Bot approval/pause/resume, simulated checkout failure/success, viewer restrictions, editor save/reload, graph editing, themes, navigation and overflow.
- Generated-preview test verifies local interaction works while parent-document access is blocked by iframe isolation.
- Browser suites mock Supabase authentication/data and provider responses. They do not prove live provider generation or every external integration.
- Separate live Supabase rollback-only SQL checks passed for cross-tenant reads, viewer writes, role escalation, PM approval, duplicate credit transactions and anonymous access.
- Lint and TypeScript checks passed. Screenshot artifacts are local under artifacts/platform and artifacts/redesign, not committed.

## Remaining before a production platform

Real repository execution and deployments; Notion runtime authorization and publishing; complete agent/runtime orchestration; secret management; audit-grade workflow state machines; billing and real usage reconciliation; enterprise SSO/private runners; broad browser/accessibility/load/security testing; and a refreshed row-by-row feature audit. Passing the current tests is not a zero-defect or complete-feature guarantee.
