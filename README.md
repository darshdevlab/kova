# Kova

A product-building workspace for individuals and organisations. Start with a requirement and continuous chat, or use a PM-led delivery path with versioned product and technical reviews.

[Live application](https://kova-rho-opal.vercel.app) · [Design system](https://kova-rho-opal.vercel.app/design-system)

## Start here

- [Feature registry and persona journeys](docs/rebuild/README.md): 338 preserved baseline IDs, plus overlapping supplements and corrections.
- [Delivery status](docs/DELIVERY-STATUS.md): implemented behavior, verification and remaining production gaps.
- [Design direction](docs/REBUILD-DESIGN.md): Silver/Ink/Jade, shared tokens, responsive rules and reference principles.

## Product paths

**Direct build:** submit a requirement, answer application-specific questions in chat, inspect the generated HTML preview, edit/export/restore saved versions. There is no fixed questionnaire or mandatory PRD/TRD.

**Product delivery:** PM requirements and PRD review, developer TRD review, then build. Document changes invalidate approvals. Protected approval records and database triggers enforce the gates independently of browser UI.

**Bot organisations:** start from a template or blank team, configure members and directed relationships, then use a private team portal with direct/team chats, artifacts and review requests. Execution is a labelled simulation, not a live Lyzr worker engine.

**Individual and company access:** one verified identity, personal and organisation workspaces, scoped membership roles, invitations, profile usage, separate credits and settings.

## Run locally

Use Node.js 22 or 24 and configure ignored `.env.local` using the variable names in `.env.example`. Never commit actual credentials.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Open [localhost:3100](http://127.0.0.1:3100). Sign in with a configured Supabase account; there is no demo-login bypass.

The linked Supabase project already has the workspace, memory, provider-vault, usage and delivery-review migrations applied. On a fresh project, use the setup documents and review the SQL dependencies before applying migrations. Files named `*-security-tests.sql` are tests, not migrations; memory/delivery suites bootstrap an empty disposable PostgreSQL database and must never run on the linked project.

Provider setup and exact environment requirements: [provider integration](src/lib/providers/README.md). `KOVA_PROVIDER_MASTER_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only. Preserve the encryption master key; replacing it without re-encryption makes saved provider credentials unreadable.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm run test:e2e
node --test tests/providers/providers.test.cjs tests/providers/browser.test.cjs
npx playwright test --config tests/bots-v2/playwright.config.ts
```

Browser suites use explicit API fixtures. The separate opt-in `scripts/live-rebuild-smoke.mjs` uses temporary real accounts and cleans up its own resources. It requires configured server credentials and `KOVA_RUN_LIVE_SMOKE=1`. Optional browser checks use `KOVA_SMOKE_BROWSER=1`; paid model generation stays off unless `KOVA_SMOKE_GENERATE=1` is explicitly set.

## Important boundaries

This is not a completed 338-feature production platform. Repository import currently stores a GitHub reference; it does not clone or execute a repository. Real PR creation, general sandbox execution, generated backend testing/deployment, Notion runtime publishing, enterprise controls and other registry items remain open.

OpenRouter generation, encrypted BYOK, approved-memory retrieval and selected tenant/approval checks have separate live evidence. Other providers are exercised with fixtures. Google OAuth remains in testing. Shared-key inference uses an account allowlist and daily request cap; demo credits and simulated payments never authorize real provider spending.

Stack: Next.js 16, React 19, TypeScript, Supabase, React Flow, Lucide, OpenRouter and Playwright.
