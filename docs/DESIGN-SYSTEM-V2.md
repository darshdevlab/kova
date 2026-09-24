# Kova Graphite / Design System v2

This revision supersedes the initial Ember and Action Blue design for the Kova application. The earlier design-system folder remains an historical artifact. The live reference for this revision is `/design-system` in this application.

## Direction

Restrained graphite surfaces, pale jade actions, crisp geometry, and compact workflow connections. The user clarified that "cube and flow" describes an aesthetic, not specific reference products. No named Cube, Flow, or Lyzr interface is being copied.

React Flow supplies the graph engine: https://reactflow.dev/learn . Kova provides its own node styling, lifecycle, inspector, and saved state.

## Palette

| Token | Dark value | Role |
| --- | --- | --- |
| canvas | #141617 | Primary working canvas |
| surface | #1B1D1F | Navigation, conversation, panels |
| surface-raised | #232628 | Dialogs and floating feedback |
| surface-subtle | #25292B | Quiet selected regions |
| text | #EFF1ED | Primary text |
| text-secondary | #B3B8B8 | Supporting content |
| text-muted | #909899 | Metadata |
| border | #303537 | Surface separation |
| border-strong | #50585A | Input and hover definition |
| accent | #ACD4BE | Jade primary action, selected state |
| accent-ink | #152A20 | Text on jade |
| blue | #9BBBCF | Secondary data signal |
| warning | #DBB575 | Attention |
| error | #E5A39E | Error and destructive action |

Silver mode is defined by the same semantic tokens in `src/app/globals.css`. The generated sample application uses a separate lighter surface treatment to distinguish the user's product from the builder.

## Typography and geometry

- Geist for UI and Geist Mono for identifiers.
- Fixed text sizes, never viewport-scaled type. Page headings 24-30px, section titles 18px, body 13-14px, compact controls 12-13px, metadata 10-11px. Sample preview and graph may scale within their own viewport; they are not the builder's primary text.
- Zero letter-spacing. No negative tracking.
- Controls 5px radius; repeated cards and dialogs at most 8px; graph nodes 6px.
- Main action height 40px, compact action 34px. Controls show hover, focus, disabled, and selected states.
- 4px base spacing, 8/12/16/24/32px common gaps.
- No nested decorative cards. Use section dividers, columns, tables, and unframed content.
- Lucide icons; native select and checkbox controls where appropriate.
- Dialogs use the browser's native focus containment and Escape dismissal.
- Reduced-motion preference suppresses animation and transitions.

## Layout and journey

- Desktop: 64px project header, 58px lifecycle, 216px navigation, 350px conversation; output fills the remaining space.
- Wide desktop: 390px conversation with slightly larger body copy.
- Below 1150px: narrower navigation and conversation.
- Below 850px: icon navigation; supporting surfaces stack.
- At 680px and below: bottom project navigation, single working panel, Preview/Conversation switch, stacked inspectors.
- Data tables may scroll internally; the page must not overflow horizontally.
- Workflow uses grid-snapped nodes and orthogonal connections with a small corner radius. Users can pan, zoom, connect, select, edit, add, and remove nodes. A node selector gives an alternative to graph hit targets.
- Define -> Build -> Verify -> Review -> Release is always visible. Relevant next steps are offered within each screen.
- Project brief, requirements, prompts, models, branch settings, data, agent graph, local activity, and release records persist on the device.
- Changes affecting configuration invalidate old verification and approval.

## Truth and function

- Local configuration checks are named as configuration checks, never browser or repository tests.
- Provider references do not imply live OAuth connections.
- A release snapshot does not imply a deployed app.
- A saved PR draft does not imply a created GitHub PR.
- The sample preview does not imply arbitrary code generation.
- Consult `FEATURE-COVERAGE.md` for every planned capability's current boundary.

## Verification

Playwright covers connected local journeys and desktop/mobile screen reachability, persistence, failure recovery, graph operations, and horizontal overflow. Screenshots are stored under `artifacts/redesign/`. These checks do not constitute complete accessibility certification or complete coverage of the 338-feature backlog.
