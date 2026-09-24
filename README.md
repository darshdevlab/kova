# Kova

An Architect 2.0 assignment prototype for guided application building and developer workflows. The current revision redesigns the application around Graphite/Jade, a shared project lifecycle, and persistent local interactions.

## Run

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3100
```

- Application: http://127.0.0.1:3100
- Current design system: http://127.0.0.1:3100/design-system
- Enter through **Continue with demo workspace** when authentication is not configured.

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

Repository cloning, isolated command execution, generated applications, external tests, real PR creation, hosting deployment, live collaboration, encrypted provider-key management, and most inherited integrations remain pending. The preview is a sample application. Local configuration checks do not run repository tests. A local release snapshot does not deploy anything.

The existing Supabase email adapter requires a configured project and live verification. The OpenRouter route can request model text with a server key, but it has no file-editing, test-running, or deployment tools. The model must not claim these actions.

```dotenv
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=
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
