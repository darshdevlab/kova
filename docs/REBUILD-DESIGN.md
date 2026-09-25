# Kova: product and interaction direction

## Decisions before screens

Kova is a working environment, not a landing page or a sequence of generic forms. The primary object is a project with a continuous conversation and inspectable artifacts. A Bot team is a separate configurable organisation of workers, not a predetermined ten-step delivery checklist.

Two project journeys coexist. Direct build starts with a requirement and goes into chat and a work panel. Product delivery adds product and technical documents, ownership and approval gates where a team needs them. Neither a user's job title nor their company membership forces them into the heavier journey.

One verified identity can own a personal space and join multiple organisations. Signup makes that choice visible. Membership and workspace policy, not a cosmetic mode toggle or user metadata, enforce permissions.

## Visual rules

- Default: white canvas, silver navigation, ink text, restrained jade primary actions. Retain explicit light/dark IDE themes and user preferences.
- Type: Geist, 13px product text, 12px utility labels, 25-30px page titles. No negative tracking, viewport-scaled text, or oversized marketing copy.
- Navigation: fixed 224px desktop rail and 60px header. Preserve them during section changes. Drawer navigation on mobile.
- Use lists for projects and integrations, not repeated cards with unrelated sample screenshots. Show a project's actual preview only when it exists.
- Use 4-8px radii, thin neutral borders, restrained focus rings. Shadows only establish overlays, not every section.
- Icons: Lucide for controls; original provider assets for identity. Never replace a provider logo with a generic initial.
- Every action has a destination, busy state, success/failure response and permission behavior. No placeholder Details buttons masquerading as integrations.
- Profile opens an account menu with credit visibility, usage, billing links and sign-out. Settings and Credits remain separate destinations.
- Bot organisation canvas uses explicit directed relationships. Dragging changes positions; connecting changes who can delegate or communicate. Do not equate a visual edge with granted backend permission.
- Mobile builder stacks conversation and work output without discarding either pane's state. Desktop keeps them side by side. A dedicated mobile pane switcher remains a later refinement.
- Mocked external execution has a small truthful indicator and clear trace entries. No fake passing tests or deployments.

## References and what is borrowed

- https://vercel.com/geist/typography: disciplined type hierarchy and utility-scale labels, not its brand or full component styling.
- https://vercel.com/geist/colors: semantic surface, border and text levels, not a copied palette.
- https://linear.app/docs/projects: project-oriented navigation and contextual details, not Linear's screen composition.
- https://x.ai/news/introducing-grok-bot: persistent workers and visible team conversations, not its UI or product identity.
- Saved research under ../research records builder chat/preview, question, approval, model and failure patterns. Screenshots are evidence of observed flows, not layout templates.

## Verification contract

The [feature registry](./rebuild/feature-registry.json) maps original scope to persona, journey and acceptance checks. Its canonical source remains in the adjacent product-planning/rebuild workspace folder. A passing UI fixture does not verify live API behavior. Record browser, database, provider and deployment evidence separately. Do not call this production-complete until the registry, connected-service tests, security review and operational requirements agree.
