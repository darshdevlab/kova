# Kova

Kova is an Architect 2.0 product prototype for both non-technical builders and developers. It keeps intent, implementation, verification, source control, and release evidence in one workspace.

## Product flows

- Authentication with Supabase-ready email access and a credential-free demo workspace
- Prompt-first project creation, repository import, templates, and work-item context
- Guided and Developer workspace depths without splitting the product into two tools
- Build chat with live OpenRouter model discovery, manual model selection, and automatic routing
- Interactive app preview, code explorer, and Context Lens for selecting an exact UI element
- Living PRD, architecture, personas, acceptance criteria, and decision history
- Visual agent workflow with model, tool, knowledge, and guardrail configuration
- Managed data, row-level security, and authentication design surfaces
- Requirement-linked browser, API, accessibility, and agent evaluation evidence
- Git diff, branch policy, reviewer readiness, and pull-request flow
- Preview, staging, production, rollback, environment, and release-health flow
- Activity timeline and bring-your-own-model provider settings

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without environment variables, Kova runs in a deterministic demo mode and every major product flow remains usable.

## Environment

```bash
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=openai/gpt-6-sol
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`OPENROUTER_API_KEY` is only read in the server route. Provider keys never reach the browser. Apply [`supabase/schema.sql`](./supabase/schema.sql) to a dedicated Supabase project before enabling persistent accounts and project data.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Playwright covers authentication, project entry, prompt execution, Context Lens, agent workflow, tests, pull-request creation, deployment, and mobile navigation.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Zod
- Supabase Auth/Postgres readiness with RLS-first schema
- OpenRouter model catalog and server-side chat route
- Lucide icons and the Kova design system
- Playwright end-to-end verification

## Design system

Kova uses a compact workbench language built around Deep Ink (`#171A1F`), Kova Ember (`#F1543F`), Action Blue (`#2F6FED`), and Canvas (`#F6F7F9`). Geist and Geist Mono provide the typography. Surfaces use 4-8px radii, restrained shadows, visible state, and progressive disclosure so the same product remains approachable in Guided mode and precise in Developer mode.
