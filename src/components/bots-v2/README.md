# Bot portal integration

```tsx
import { BotPortal } from "@/components/bots-v2";

<BotPortal spaceId={activeSpace.id} role={membership.role} />
<BotPortal spaceId={activeSpace.id} role={membership.role} itemId={id} />
```

- Mount the list at `/bots` and the team at `/bots/[id]` inside the existing authenticated workspace shell. `id` is the team's `kova_records.id`. The parent owns these routes.
- Keep `spaceId` tied to the active authenticated workspace. The API independently verifies the signed-in user and database membership. The `role` prop only adds UI restrictions; it never grants server access.
- Component CSS and React Flow CSS are imported by the entrypoint. No dependency, global CSS, shared platform types, or SQL changes are required.
- Keep the existing `workspace-platform.sql` and `workspace-guards.sql` installed: membership RLS, immutable record identities, and revision guards remain required. This work does not apply any database changes.

## Persistence and API

`/api/bot-teams` supports scoped GET, POST creation, and revision-checked PUT commands. Teams use existing `kind = bot` rows with `data.schema = bot-team-v2`. Configuration, graph positions, conversations, artifacts, proposed tasks, and decisions save atomically in that record. The typed schema is in `src/lib/bot-teams.ts`; shared `lib/platform` is not extended.

Older Bot records are intentionally not migrated or shown. Do not feed these teams through legacy fixed-step run controls or generic `RecordData` editors. Both chat and direct-chat records are accessible to the team's workspace members; direct means addressed to one Bot, not a private human conversation.

Edits use optimistic revision checks. On a conflict, the local organisation draft is retained and Reload asks before discarding it. There is no realtime collaboration or automatic conflict merge. Limits are 50 graph members, 150 relationships, 100 conversations, and 500 messages per conversation. Start a new team if a team reaches its artifact/task/approval capacity.

## Demo execution

New chat is the primary team action. No provider request, external tool, code execution, or deployment occurs. Instructions, model, and memory scope are saved configuration only; this deterministic demo does not enact those settings. The permission toggles control whether demo drafts, handoffs, and approval requests are produced. Team chat routes to the first coordinator (or first Bot), then shows at most three direct outgoing handoffs. Direct chat has no inter-Bot fan-out. Approving a proposal only records the decision. Checking a task records a manual status change.

## Verification

```sh
npx playwright test --config tests/bots-v2/playwright.config.ts
npx playwright test tests/e2e/bot-portal.spec.ts --reporter=list --output=/tmp/bot-portal-e2e
npx eslint src/components/bots-v2 src/lib/bot-teams.ts src/app/api/bot-teams tests/bots-v2 tests/e2e/bot-portal.spec.ts
npx tsc --noEmit --incremental false
```

Domain/API tests inject an in-memory database with query filters; browser tests reuse the existing authenticated fixture and mock the Bot API. They verify UI persistence across reloads, access boundaries, stale writes, configuration, graph movement, direct chat, approvals, and mobile layout. They do not prove a live Supabase round trip. Browser tests require the parent route integration and the existing dev server configuration.
