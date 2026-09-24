# Kova

A guided application-building workspace for individuals and companies. Kova combines a Graphite/Jade interface, cloud-backed project planning, a developer editor, and simulated delivery Bot workflows.

## Run

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

- Application: http://127.0.0.1:3100
- Current design system: http://127.0.0.1:3100/design-system
- Sign in with a configured Supabase account. There is no demo-login bypass.

## Current delivery

Read [delivery status](docs/DELIVERY-STATUS.md) for the verified scope and remaining work. Cloud-backed personal/company workspaces, project briefs and approvals, private Bot URLs, membership controls, simulated credit purchases, and explicit editor saves are implemented. The earlier audit below describes the previous prototype, not a current completion count.

## What works locally

- Project creation, search, source filters, templates, archive/restore.
- Saved product brief, acceptance criteria, plan approval, PRD export.
- Persistent conversation and drafts, searchable model catalog, prompt reuse, copy, stop/retry, failure recovery.
- Context Lens selection and scoped prompts; attachment references (not file ingestion).
- Interactive sample preview with overview, ticket resolution, customers, and knowledge routes.
- Editable source draft and export (not connected to the sample preview).
- Editable React Flow graph: nodes, connections, per-node instructions, graph validation, persistence.
- Local table/row management and desired authentication configuration.
- Real checks of six saved configuration conditions, with review invalidation when relevant inputs change.
- Branch configuration, exportable PR draft, local review gate, and release snapshot/export.
- Activity history, connection references, invitation drafts, mock variables, theme settings, navigation search.
- Desktop and mobile versions of every implemented screen.

## Integration boundaries

This is not a completed production platform. The [338-entry implementation audit](docs/FEATURE-COVERAGE.md) records working local, partial, and pending capabilities individually. A visible flow is not proof that its external service is implemented.

Repository cloning, isolated command execution, external tests, real PR creation, user-app deployment, live collaboration, encrypted provider-key management, and most inherited integrations remain pending. The editor can request a self-contained HTML preview from OpenRouter; it is not a generated full-stack repository. Local configuration checks do not run repository tests. A release snapshot does not deploy anything.

The OpenRouter endpoint verifies authentication and workspace membership, requires an explicit account allowlist, and reserves one of ten daily requests before inference. It has no repository-editing, test-running, or deployment tools. The model must not claim these actions. Simulated credits cannot increase real usage limits.

```dotenv
OPENROUTER_API_KEY=
KOVA_AI_ALLOWED_EMAILS=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Do not store real secrets in local mock variables. No server credentials are committed.

## Design and verification

- [Graphite design rules](docs/DESIGN-SYSTEM-V2.md)
- [Feature coverage](docs/FEATURE-COVERAGE.md)
- Visual evidence: `artifacts/redesign/` (local, gitignored)
- Project thumbnail images: `public/previews/` (captured from the actual sample UI)

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

The Playwright suite covers local creation-to-release, graph editing, data persistence, verification invalidation, model selection, prompt error recovery, and all workspace screens at desktop/mobile sizes. Model responses are fixtures in these browser tests; live provider behavior is not verified by them.

Stack: Next.js 16, React 19, TypeScript, React Flow, Lucide, Supabase-ready adapter, OpenRouter text route, Playwright.
