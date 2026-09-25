# Kova reconciled feature list

2026-09-25. **338 baseline IDs + 17 approved expansions + 14 scoped corrections = 369 tracking rows. No full-feature completion claim.**

Use the [CSV registry](./feature-registry.csv) or [JSON registry](./feature-registry.json) for each description, persona, journey/screen, acceptance, permissions, edge cases and evidence. [Journey IDs](./journeys-and-permissions.md) are ready for acceptance-matrix use.

Statuses are evidence-bounded: pending means no supporting implementation evidence in this reconciliation; partial includes reported slices under verification; working_locally_reported is an older local-only report that has not been reverified. None means verified.

## Baseline: 338 preserved IDs

| ID | Feature | Reported status |
| --- | --- | --- |
| A001 | Google or email authentication | partial |
| A002 | Organization-scoped workspace | partial |
| A003 | Organization switching | partial |
| A004 | Profile editing | pending |
| A005 | Light and dark mode | partial |
| A006 | Plan and credit balance | partial |
| A007 | Stripe billing portal | pending |
| A008 | Referral program | pending |
| A009 | Logout | partial |
| A010 | Prompt-first creation | partial |
| A011 | All projects filter | working_locally_reported |
| A012 | Deployed projects filter | pending |
| A013 | Shared-with-me filter | pending |
| A014 | Newest-first sorting | partial |
| A015 | My Projects view | partial |
| A016 | Published Projects view | pending |
| A017 | Shared Projects view | pending |
| A018 | Project search | partial |
| A019 | Open or visit project | partial |
| A020 | Rename app | pending |
| A021 | Duplicate app | pending |
| A022 | Delete app | pending |
| A023 | Download code | partial |
| A024 | Saved versions via Git tags | pending |
| A025 | AI Consultant onboarding | pending |
| A026 | Time-savings app recommendations | pending |
| A027 | Prompt Library search | pending |
| A028 | Prompt categories | pending |
| A029 | Use-case library | pending |
| A030 | Tutorial library | pending |
| A031 | How-it-works video | pending |
| A032 | Marketplace discovery | pending |
| A033 | Attach files | partial |
| A034 | PDF DOCX TXT RAG | pending |
| A035 | CSV and Excel dataframe context | pending |
| A036 | Import Studio agents | pending |
| A037 | Import public GitHub codebase | pending |
| A038 | Import private GitHub codebase | pending |
| A039 | Preset theme library | pending |
| A040 | Theme search and filters | pending |
| A041 | Light dark and state preview | pending |
| A042 | Cards Dashboard Marketing Palette previews | pending |
| A043 | Personal and organization themes | pending |
| A044 | Paste globals.css | pending |
| A045 | Generate theme from design document | pending |
| A046 | Upload theme zip | pending |
| A047 | Import theme from GitHub beta | pending |
| A048 | Import theme from Figma beta | pending |
| A049 | Automatic pre-build planning | pending |
| A050 | Guided clarification questions | partial |
| A051 | Skip to Start Building | partial |
| A052 | Living PRD | partial |
| A053 | High-fidelity App Mockup | partial |
| A054 | Mockup code view | partial |
| A055 | Workflow diagram | partial |
| A056 | Reusable skill files | pending |
| A057 | PDF and PPT planning artifacts | pending |
| A058 | Starter files | pending |
| A059 | Back to Plan Mode | working_locally_reported |
| A060 | Optional GitAgent choice | pending |
| A061 | Split chat and workspace layout | partial |
| A062 | Plan Agents App Database tabs | partial |
| A063 | Build session history | partial |
| A064 | Tool action traces | pending |
| A065 | Specialist agent progress | pending |
| A066 | Commit cards and push status | pending |
| A067 | Revert generated version | pending |
| A068 | Post-build Plan toggle | partial |
| A069 | Separate Plan chat history | pending |
| A070 | Build timeout feedback | pending |
| A071 | React Flow agent graph | working_locally_reported |
| A072 | Zoom fit and interactivity controls | working_locally_reported |
| A073 | Edit name description role goal instructions | partial |
| A074 | Provider and model selection | partial |
| A075 | Temperature and Top P | pending |
| A076 | Manager and sub-agent orchestration | partial |
| A077 | Multiple models in one app | pending |
| A078 | Agent memory | partial |
| A079 | Scheduled execution | pending |
| A080 | Edit in Lyzr Studio | pending |
| A081 | Attach KB to agents | pending |
| A082 | Upload PDF DOCX TXT | pending |
| A083 | Crawl website into KB | pending |
| A084 | KB document inventory | pending |
| A085 | Gmail | pending |
| A086 | Microsoft Teams | pending |
| A087 | Slack | pending |
| A088 | Telegram | pending |
| A089 | Twitter or X | pending |
| A090 | Instantly | pending |
| A091 | LinkedIn | pending |
| A092 | Asana | pending |
| A093 | Dropbox | pending |
| A094 | Google Calendar | pending |
| A095 | Google Docs | pending |
| A096 | Google Drive | pending |
| A097 | Trello | pending |
| A098 | Notion | pending |
| A099 | Confluence | pending |
| A100 | Apollo | pending |
| A101 | HubSpot | pending |
| A102 | Microsoft Excel | pending |
| A103 | Freshdesk | pending |
| A104 | Google Sheets | pending |
| A105 | Arxiv | pending |
| A106 | GitHub agent tool | pending |
| A107 | Linear | pending |
| A108 | Jira | pending |
| A109 | OpenAPI custom tool | pending |
| A110 | ACI custom app | pending |
| A111 | MCP server connection | pending |
| A112 | Cross-app MCP reuse | pending |
| A113 | Automatic database provisioning | pending |
| A114 | Generated sign-up and sign-in | pending |
| A115 | Table and row browser | working_locally_reported |
| A116 | Schema browser | partial |
| A117 | Read-only explorer | pending |
| A118 | PostgreSQL live implementation | pending |
| A119 | Full file tree | pending |
| A120 | Source viewer | partial |
| A121 | Encrypted environment variables | partial |
| A122 | Runtime browser and network console | pending |
| A123 | Visual element selection for prompt | working_locally_reported |
| A124 | Long-lived sandbox | pending |
| A125 | Self-healing error fixes | pending |
| A126 | Connect personal GitHub | pending |
| A127 | Automatic commit and push | pending |
| A128 | Pull push and branch switching | pending |
| A129 | Platform-managed private repository | pending |
| A130 | Export to personal GitHub | pending |
| A131 | Import existing Next.js repository | pending |
| A132 | GitAgent beta repository | pending |
| A133 | Feature testing project setting | pending |
| A134 | Autonomous browser testing agent | pending |
| A135 | Test this build | partial |
| A136 | Embedded app preview | partial |
| A137 | Standalone preview URL | pending |
| A138 | Refresh and reconnect states | partial |
| A139 | Share project dialog | partial |
| A140 | People with access | partial |
| A141 | Same-app shared editing | pending |
| A142 | Agents KB and resources shared | pending |
| A143 | First deploy flow | partial |
| A144 | Architect public URL | pending |
| A145 | Rename deployed subdomain | pending |
| A146 | Custom domain | pending |
| A147 | Redeploy changes | pending |
| A148 | Undeploy | pending |
| A149 | Social sharing links | pending |
| A150 | VPC or on-premise enterprise option | pending |
| A151 | Publish during deploy | pending |
| A152 | Listing metadata | pending |
| A153 | Owner pays visitor credits | pending |
| A154 | Popular Recent Top Rated sorting | pending |
| A155 | Category use-case integration and LLM filters | pending |
| A156 | Listing metrics and creator profile | pending |
| A157 | View App | pending |
| A158 | Clone App | partial |
| A159 | Build-mode feature specs | pending |
| A160 | Presentations and research documents | pending |
| A161 | Artifacts tab | pending |
| A162 | My Usage and All Users | partial |
| A163 | 7 30 90 day and 12 month ranges | partial |
| A164 | Graph and optional table | partial |
| A165 | Per-app breakdown and search | partial |
| A166 | Per-agent and token ledger | pending |
| A167 | In-product live chat | pending |
| A168 | Support form | pending |
| A169 | Discord and demo paths | pending |
| A170 | Free Starter Pro Max Custom plans | pending |
| FND-001 | Adaptive Guided and Developer experiences | partial |
| FND-002 | Role-aware onboarding and navigation | partial |
| FND-003 | Shared project lifecycle rail | working_locally_reported |
| FND-004 | Traceability project graph | pending |
| FND-005 | Organization workspace and project hierarchy | partial |
| FND-006 | Global search and command palette | partial |
| INT-001 | Create from plain-language idea | partial |
| INT-002 | Import Jira ClickUp Linear or Azure DevOps work item | partial |
| INT-003 | Import PRD from Docs Notion Confluence Word or PDF | partial |
| INT-004 | Import Figma design and Dev Mode status | partial |
| INT-005 | Import one or multiple Git repositories | partial |
| INT-006 | Import production issue logs and traces | pending |
| INT-007 | Clone verified marketplace app agent or workflow | partial |
| PLN-001 | AI Consultant opportunity discovery | pending |
| PLN-002 | Structured requirement extraction | partial |
| PLN-003 | Ambiguity and missing-information detection | partial |
| PLN-004 | Editable living PRD and acceptance criteria | partial |
| PLN-005 | Change-impact preview before execution | pending |
| PLN-006 | Implementation plan with affected resources | partial |
| PLN-007 | Decision ledger with alternatives and rationale | pending |
| DES-001 | High-fidelity clickable app mockup | partial |
| DES-002 | Figma frame component and token mapping | pending |
| DES-003 | Responsive loading empty error and permission state coverage | partial |
| DES-004 | Visual design diff and approval | pending |
| DES-005 | Reusable design system with accessibility validation | partial |
| REP-001 | Repository framework and architecture detection | pending |
| REP-002 | Universal isolated repository change workspace | pending |
| REP-003 | Multi-repository service topology | pending |
| REP-004 | Coordinated multi-repo changeset | pending |
| REP-005 | Monorepo package and dependency graph | pending |
| REP-006 | Existing build test and CI command detection | pending |
| REP-007 | Organization workspace and repository policy inheritance | pending |
| REP-008 | Company branching-strategy profiles | working_locally_reported |
| REP-009 | Protected-branch and CODEOWNERS detection | pending |
| REP-010 | Compatibility and migration report | pending |
| DEV-001 | Dependency readiness inventory | pending |
| DEV-002 | Connect Provision Mock or Skip resolution | partial |
| DEV-003 | Encrypted environment and secret vault | partial |
| DEV-004 | Secure dot-env import and variable classification | pending |
| DEV-005 | Development test staging and production scopes | partial |
| DEV-006 | Contract-based service mock generation | pending |
| DEV-007 | Ephemeral database queue cache and storage provisioning | pending |
| DEV-008 | Full browser code editor and file tree | partial |
| DEV-009 | Integrated terminal and task runner | pending |
| DEV-010 | API explorer and request history | pending |
| AGT-001 | Visual agent and workflow graph | working_locally_reported |
| AGT-002 | Lyzr LangGraph CrewAI OpenAI and custom framework adapters | partial |
| AGT-003 | Two-way visual and agent-code synchronization | pending |
| AGT-004 | Per-agent model tool memory knowledge and schema controls | partial |
| AGT-005 | Conditional loop parallel and human-approval workflow nodes | partial |
| AGT-006 | Model routing fallback latency and budget rules | pending |
| AGT-007 | Agent evaluation datasets scorers and thresholds | pending |
| AGT-008 | Agent trace replay and step debugging | pending |
| AGT-009 | Prompt injection PII output and tool guardrails | partial |
| DAT-001 | Managed database provisioning and explorer | partial |
| DAT-002 | Editable schema and relationship designer | pending |
| DAT-003 | SQL console query history and saved queries | pending |
| DAT-004 | Migration generation preview approval and rollback | pending |
| DAT-005 | Seed data and persona fixtures | partial |
| DAT-006 | Visual authentication role and permission builder | partial |
| DAT-007 | OAuth MFA SSO RBAC and RLS configuration | partial |
| TST-001 | Repository-native lint type and unit tests | pending |
| TST-002 | API integration and contract tests | pending |
| TST-003 | Multi-browser end-to-end testing | pending |
| TST-004 | Responsive visual-regression and accessibility tests | pending |
| TST-005 | Acceptance-criteria-to-test generation | pending |
| TST-006 | Affected-test selection for monorepos and upgrades | pending |
| TST-007 | QA manual checklist evidence and sign-off | partial |
| TST-008 | Failure capture with screenshot video log and trace | pending |
| GIT-001 | GitHub GitLab Bitbucket and Azure Repos connections | pending |
| GIT-002 | Policy-compliant branch-name generation | partial |
| GIT-003 | Diff staging selective commit and conventional messages | pending |
| GIT-004 | Pull or merge request generation and update | partial |
| GIT-005 | PR readiness bundle with evidence risk and rollback | partial |
| GIT-006 | Linked pull requests and merge-order planning | pending |
| GIT-007 | Code-owner reviewer and approval routing | pending |
| GIT-008 | Rich Git provider checks annotations and reruns | pending |
| REL-001 | Preview environment per change | partial |
| REL-002 | Development staging and production promotion | partial |
| REL-003 | Deployment readiness checklist and approvals | partial |
| REL-004 | Vercel AWS Azure GCP Kubernetes and custom deployment targets | pending |
| REL-005 | Immutable release artifact and provenance | partial |
| REL-006 | Deployment history health checks rollback and redeploy | pending |
| REL-007 | Automated release notes changelog and work-item update | pending |
| OPS-001 | Unified app service agent and integration health center | pending |
| OPS-002 | Logs metrics traces and deployment correlation | pending |
| OPS-003 | Production issue reproduction and replay | pending |
| OPS-004 | Per-agent per-run token latency tool and cost ledger | partial |
| OPS-005 | Project and public-app budgets alerts and hard caps | partial |
| OPS-006 | Feedback and analytics to backlog loop | pending |
| COL-001 | Role-based project access and responsibilities | partial |
| COL-002 | Comments mentions and screen or code annotations | pending |
| COL-003 | PM design engineering QA and release approval gates | partial |
| COL-004 | Bidirectional Jira ClickUp Linear and Azure status sync | pending |
| COL-005 | Requirement design code test deployment traceability | pending |
| COL-006 | Audit log for changes approvals exceptions and production actions | partial |
| COL-007 | Self-hosted runner VPC and private-network execution | pending |
| MKT-001 | Verified app agent workflow tool and component templates | partial |
| MKT-002 | Framework dependency security and cost metadata | pending |
| MKT-003 | Clone-to-owned-project setup wizard | partial |
| MKT-004 | Build-readiness score and blocking checklist | partial |
| MKT-005 | Cost and time estimate before build test deploy and publish | pending |
| CMP-001 | Native iOS and Android application build device preview and store-release workflow | pending |
| CMP-002 | Multi-artifact project with web mobile presentation video and data experiences sharing one backend | pending |
| CMP-003 | Background task queue with priority dependencies pause resume and reprioritization | partial |
| CMP-004 | Parallel solution drafts with side-by-side comparison and selective merge | pending |
| CMP-005 | Full-state checkpoints covering code conversation environment and optional database | pending |
| CMP-006 | Character-level file history playback and point-in-time restore | pending |
| CMP-007 | Direct visual property inspector with multi-select batch edits undo redo reset and before-after review | pending |
| CMP-008 | AI image generation editing and project asset library | pending |
| CMP-009 | Build execution profiles for fast balanced and deep work with cost-time tradeoffs | pending |
| CMP-010 | Agent autonomy permissions with Ask Auto and Full modes | pending |
| CMP-011 | Multiple scoped chats and tasks contributing safely to one shared project | pending |
| CMP-012 | Reusable organization and workspace build rules skills and conventions | pending |
| CMP-013 | Pre-publish source dependency secret permission and configuration security scan | pending |
| CMP-014 | Agent web and site research with source citations captured into project context | pending |
| CMP-015 | Preview First versus Full Build execution policy | pending |
| CMP-016 | Freeform design canvas for screens components flows and design-system exploration | pending |
| CMP-017 | Embeddable live prototype and contextual review surface for work-management and design tools | pending |
| CMP-018 | Real-time multiplayer editing with presence cursors and conflict-safe updates | pending |
| CMP-019 | One-click application primitives for payments email file storage and background jobs | pending |
| CMP-020 | CLI SDK and local roundtrip with optional codebase eject | pending |
| CMP-021 | Continuous two-way repository synchronization with drift detection and conflict resolution | pending |
| CMP-022 | Reusable team skills rules and workflow-template marketplace | pending |
| UNI-001 | Kova Context Lens to click or lasso anything and Ask Change Diagnose Test Trace or Measure it | partial |
| UNI-002 | Change Scope Dial for this instance shared component page journey role or whole product | partial |
| UNI-003 | Selection Dependency X-Ray across code repositories APIs data agents tests owners and deployments | pending |
| UNI-004 | Why and provenance view linking selected behavior to requirements designs decisions commits and owners | pending |
| UNI-005 | Selection-based cross-layer change contract with impact plan cost risk and coordinated resources | pending |
| UNI-006 | Journey Lasso to record or select a multi-screen flow and change or test it as one unit | pending |
| UNI-007 | Persona and condition reality switch across roles devices locales accessibility networks permissions and data states | pending |
| UNI-008 | Capability Truth Overlay showing Proposed Mocked Connected Tested Verified and Deployed states with evidence | partial |
| UNI-009 | Agent Output Lens tracing a selected response to model prompt tool knowledge memory source cost and latency | pending |
| UNI-010 | Data Lineage Lens tracing a selected value through UI API transformation schema source and access policy | pending |
| UNI-011 | Requirement and verification heatmap directly over the live application preview | pending |
| UNI-012 | Constraint Pins that protect approved behavior design contracts and security invariants from later builds | pending |
| UNI-013 | Cross-role feedback reconciliation for conflicting PM design engineering QA and stakeholder requests | pending |
| UNI-014 | Risk-adaptive autonomy that escalates approval based on blast radius environment and policy | pending |
| UNI-015 | Reverse Product Map from an imported repository or live app with observed and inferred behavior separated | pending |
| UNI-016 | Selection-to-experiment workflow with variants feature flags success metrics rollout and rollback | pending |
| UNI-017 | Safe Removal Mode for feature cleanup across UI code APIs data flags tests documentation and release plans | pending |
| UNI-018 | Accepted-change learning capture into a reusable token rule skill test pattern or organization convention | pending |
| UNI-019 | Role Handoff Capsules with completed work evidence open questions approvals and next actions from shared state | pending |
| MOD-001 | Prompt-composer model selector with per-prompt provider and model switching | partial |
| MOD-002 | Task-aware Auto model router for UI backend data agent research debugging and testing work | partial |
| MOD-003 | Provider Hub with Kova-managed models and secure bring-your-own-key model families | partial |
| BSC-001 | Prompt draft autosave and cross-session restore | working_locally_reported |
| BSC-002 | Edit resend stop retry regenerate continue and branch conversation controls | partial |
| BSC-003 | Context picker and at-mentions for files screens requirements repositories agents and integrations | partial |
| BSC-004 | Personal prompt history with search reuse and favorites | partial |
| BSC-005 | Context inspector with window meter and pin or remove source controls | partial |
| BSC-006 | Voice dictation with editable transcription before send | pending |
| BSC-007 | Response copy share feedback report and citation source actions | partial |
| BSC-008 | Project folders tags favorites archive restore and bulk organization | partial |
| BSC-009 | Unified notification and approval inbox with in-app and email preferences | partial |
| BSC-010 | Preview toolbar with device presets zoom rotate fullscreen open-tab and copy-URL actions | partial |
| BSC-011 | Browser IDE file operations tabs split view search replace autocomplete diagnostics formatting and navigation | pending |
| BSC-012 | Visual package and dependency manager with install update remove audit license and lockfile controls | pending |
| BSC-013 | Test explorer with suites filters watch coverage rerun and failure navigation | partial |
| BSC-014 | Email verification password recovery MFA passkeys and session or device management | partial |
| BSC-015 | Consent preferences and account data export or deletion | pending |
| BSC-016 | Workspace member invite directory role change suspension and removal | partial |
| BSC-017 | Platform API keys service accounts scoped tokens and webhook subscriptions | pending |
| BSC-018 | Private password-protected expiring preview links with viewer access controls | pending |
| BSC-019 | Builder keyboard screen-reader reduced-motion high-contrast and focus preferences | partial |
| BSC-020 | Builder language locale timezone and date or number format preferences | pending |
| BSC-021 | Autosave and crash or reconnect recovery for forms PRDs designs and code | partial |
| BSC-022 | Debugger breakpoint process port and live-reload manager with restart controls | pending |

## Approved scope: 17 additional tracking IDs

| ID | Feature | Reported status |
| --- | --- | --- |
| SUP-01 | Developer-approved repository understanding | pending |
| SUP-02 | Versioned change impact and approval invalidation | partial |
| SUP-03 | Approved shared project knowledge | partial |
| SUP-04 | Isolated concurrent Bot work and explicit joins | pending |
| SUP-05 | Durable checkpoints, takeover and retry safety | partial |
| SUP-06 | Workflow evaluation and definition rollback | pending |
| SUP-07 | Separate migration approval and recovery | pending |
| SUP-08 | Evidence-led production improvement proposals | pending |
| SUP-09 | Portable export and handover | partial |
| SUP-10 | Optional replaceable Jev decision layer | partial |
| SUP-11 | Configurable delivery Bots and scoped adapters | partial |
| SUP-12 | PM-to-developer Full Delivery and optional Direct Build | partial |
| SUP-13 | Personal/company identity and membership | partial |
| SUP-14 | Company policy, clients and controlled overrides | partial |
| SUP-15 | Free-only compute and later private runners | pending |
| SUP-16 | Kova branding and coherent accessible journeys | partial |
| SUP-17 | Credits, usage and simulated purchases | partial |

## Latest corrections: 14 additional tracking IDs

| ID | Feature | Reported status |
| --- | --- | --- |
| COR-001 | Cloud BYOK connection lifecycle | partial |
| COR-002 | Ollama local/private connectivity | pending |
| COR-003 | Complete supported model catalog | partial |
| COR-004 | Per-prompt funding and provider choice | pending |
| COR-005 | Profile credit summary and progress | pending |
| COR-006 | Separate Settings and Credits & Usage | partial |
| COR-007 | Persistent shell and smooth navigation | partial |
| COR-008 | Continuous split-pane project workspace | partial |
| COR-009 | App-specific conversational questions | partial |
| COR-010 | Direct Build route independent of full delivery | partial |
| COR-011 | Real delegation and evidence in conversation | partial |
| COR-012 | Bot organizations and individual chat portals | partial |
| COR-013 | Approved shared Bot memory | partial |
| COR-014 | Reference-grounded coherent UX | partial |

