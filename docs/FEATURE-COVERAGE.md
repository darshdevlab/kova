# Kova implementation coverage

Audited 2026-09-24 against the existing 338-entry catalog (170 inherited + 168 additions).

This is an implementation audit, not a claim of full coverage. "Working locally" means a browser-local capability exists. It does not imply multi-user backend support or production readiness. "Partial" names the boundary. "Pending" means this pass found no verified implementation; it is not a completed feature.

## Summary

- 20 working locally
- 74 partial
- 244 pending
- 338 total tracked entries

The redesign covers authentication, project library, creation, Build, Plan, Agents, Data & auth, Tests, Git & PR, Deploy, Activity, and Settings. The full feature catalog is NOT functional. Real repository import, isolated execution, code generation, external tests, GitHub PRs, hosting, encrypted BYOK, and enforced multi-user authorization remain substantial integration work.

## Verification boundary

Playwright tests cover the local project lifecycle, persistence, configuration invalidation, graph operations, prompt selection/error recovery, and screen reachability on desktop/mobile. Model responses in these tests are intercepted fixtures. They do not establish live model quality, generated code behavior, auth/provider integration, repository test execution, or successful cloud deployment.

| ID | Feature | State | Evidence or limitation |
| --- | --- | --- | --- |
| A001 | Google or email authentication | Partial | Supabase email adapter exists but live authentication was not verified; no Google OAuth flow. |
| A002 | Organization-scoped workspace | Pending | No verified implementation in this revision. |
| A003 | Organization switching | Pending | No verified implementation in this revision. |
| A004 | Profile editing | Pending | No verified implementation in this revision. |
| A005 | Light and dark mode | Working locally | Graphite and Silver themes; saved preference. |
| A006 | Plan and credit balance | Pending | No verified implementation in this revision. |
| A007 | Stripe billing portal | Pending | No verified implementation in this revision. |
| A008 | Referral program | Pending | No verified implementation in this revision. |
| A009 | Logout | Working locally | Clears local session and returns to account access. |
| A010 | Prompt-first creation | Working locally | Brief and name create a saved local project. |
| A011 | All projects filter | Working locally | Project library with source filters. |
| A012 | Deployed projects filter | Pending | No verified implementation in this revision. |
| A013 | Shared-with-me filter | Pending | No verified implementation in this revision. |
| A014 | Newest-first sorting | Partial | New local projects are inserted first; no selectable sort. |
| A015 | My Projects view | Working locally | Local project library. |
| A016 | Published Projects view | Pending | No verified implementation in this revision. |
| A017 | Shared Projects view | Pending | No verified implementation in this revision. |
| A018 | Project search | Working locally | Name and description search. |
| A019 | Open or visit project | Working locally | Open a saved workspace. |
| A020 | Rename app | Pending | No verified implementation in this revision. |
| A021 | Duplicate app | Pending | No verified implementation in this revision. |
| A022 | Delete app | Pending | No verified implementation in this revision. |
| A023 | Download code | Partial | Exports one editable source draft, not an entire generated repository. |
| A024 | Saved versions via Git tags | Pending | No verified implementation in this revision. |
| A025 | AI Consultant onboarding | Pending | No verified implementation in this revision. |
| A026 | Time-savings app recommendations | Pending | No verified implementation in this revision. |
| A027 | Prompt Library search | Pending | No verified implementation in this revision. |
| A028 | Prompt categories | Pending | No verified implementation in this revision. |
| A029 | Use-case library | Pending | No verified implementation in this revision. |
| A030 | Tutorial library | Pending | No verified implementation in this revision. |
| A031 | How-it-works video | Pending | No verified implementation in this revision. |
| A032 | Marketplace discovery | Pending | No verified implementation in this revision. |
| A033 | Attach files | Partial | File-name references only; content is not read or sent. |
| A034 | PDF DOCX TXT RAG | Pending | No verified implementation in this revision. |
| A035 | CSV and Excel dataframe context | Pending | No verified implementation in this revision. |
| A036 | Import Studio agents | Pending | No verified implementation in this revision. |
| A037 | Import public GitHub codebase | Pending | No verified implementation in this revision. |
| A038 | Import private GitHub codebase | Pending | No verified implementation in this revision. |
| A039 | Preset theme library | Pending | No verified implementation in this revision. |
| A040 | Theme search and filters | Pending | No verified implementation in this revision. |
| A041 | Light dark and state preview | Pending | No verified implementation in this revision. |
| A042 | Cards Dashboard Marketing Palette previews | Pending | No verified implementation in this revision. |
| A043 | Personal and organization themes | Pending | No verified implementation in this revision. |
| A044 | Paste globals.css | Pending | No verified implementation in this revision. |
| A045 | Generate theme from design document | Pending | No verified implementation in this revision. |
| A046 | Upload theme zip | Pending | No verified implementation in this revision. |
| A047 | Import theme from GitHub beta | Pending | No verified implementation in this revision. |
| A048 | Import theme from Figma beta | Pending | No verified implementation in this revision. |
| A049 | Automatic pre-build planning | Pending | No verified implementation in this revision. |
| A050 | Guided clarification questions | Pending | No verified implementation in this revision. |
| A051 | Skip to Start Building | Pending | No verified implementation in this revision. |
| A052 | Living PRD | Working locally | Editable brief and acceptance criteria, export. |
| A053 | High-fidelity App Mockup | Partial | Clickable sample app, not prompt-generated output. |
| A054 | Mockup code view | Partial | Editable source draft is independent of sample preview. |
| A055 | Workflow diagram | Partial | Editable agent graph; no generated full architecture diagram. |
| A056 | Reusable skill files | Pending | No verified implementation in this revision. |
| A057 | PDF and PPT planning artifacts | Pending | No verified implementation in this revision. |
| A058 | Starter files | Pending | No verified implementation in this revision. |
| A059 | Back to Plan Mode | Working locally | Lifecycle and navigation return to Plan. |
| A060 | Optional GitAgent choice | Pending | No verified implementation in this revision. |
| A061 | Split chat and workspace layout | Working locally | Responsive conversation and output workspace. |
| A062 | Plan Agents App Database tabs | Partial | All core destinations available in sidebar and mobile menu. |
| A063 | Build session history | Partial | Saved conversation and prompt reuse. |
| A064 | Tool action traces | Pending | No verified implementation in this revision. |
| A065 | Specialist agent progress | Pending | No verified implementation in this revision. |
| A066 | Commit cards and push status | Pending | No verified implementation in this revision. |
| A067 | Revert generated version | Pending | No verified implementation in this revision. |
| A068 | Post-build Plan toggle | Partial | Direct navigation to retained planning state. |
| A069 | Separate Plan chat history | Pending | No verified implementation in this revision. |
| A070 | Build timeout feedback | Pending | No verified implementation in this revision. |
| A071 | React Flow agent graph | Working locally | React Flow with custom editable nodes. |
| A072 | Zoom fit and interactivity controls | Working locally | Graph zoom, fit, pan, and node connections. |
| A073 | Edit name description role goal instructions | Partial | Per-node name and instructions; incomplete role/goal controls. |
| A074 | Provider and model selection | Partial | Composer selection from model catalog; per-agent model routing absent. |
| A075 | Temperature and Top P | Pending | No verified implementation in this revision. |
| A076 | Manager and sub-agent orchestration | Pending | No verified implementation in this revision. |
| A077 | Multiple models in one app | Pending | No verified implementation in this revision. |
| A078 | Agent memory | Pending | No verified implementation in this revision. |
| A079 | Scheduled execution | Pending | No verified implementation in this revision. |
| A080 | Edit in Lyzr Studio | Pending | No verified implementation in this revision. |
| A081 | Attach KB to agents | Pending | No verified implementation in this revision. |
| A082 | Upload PDF DOCX TXT | Pending | No verified implementation in this revision. |
| A083 | Crawl website into KB | Pending | No verified implementation in this revision. |
| A084 | KB document inventory | Pending | No verified implementation in this revision. |
| A085 | Gmail | Pending | No verified implementation in this revision. |
| A086 | Microsoft Teams | Pending | No verified implementation in this revision. |
| A087 | Slack | Pending | No verified implementation in this revision. |
| A088 | Telegram | Pending | No verified implementation in this revision. |
| A089 | Twitter or X | Pending | No verified implementation in this revision. |
| A090 | Instantly | Pending | No verified implementation in this revision. |
| A091 | LinkedIn | Pending | No verified implementation in this revision. |
| A092 | Asana | Pending | No verified implementation in this revision. |
| A093 | Dropbox | Pending | No verified implementation in this revision. |
| A094 | Google Calendar | Pending | No verified implementation in this revision. |
| A095 | Google Docs | Pending | No verified implementation in this revision. |
| A096 | Google Drive | Pending | No verified implementation in this revision. |
| A097 | Trello | Pending | No verified implementation in this revision. |
| A098 | Notion | Pending | No verified implementation in this revision. |
| A099 | Confluence | Pending | No verified implementation in this revision. |
| A100 | Apollo | Pending | No verified implementation in this revision. |
| A101 | HubSpot | Pending | No verified implementation in this revision. |
| A102 | Microsoft Excel | Pending | No verified implementation in this revision. |
| A103 | Freshdesk | Pending | No verified implementation in this revision. |
| A104 | Google Sheets | Pending | No verified implementation in this revision. |
| A105 | Arxiv | Pending | No verified implementation in this revision. |
| A106 | GitHub agent tool | Pending | No verified implementation in this revision. |
| A107 | Linear | Pending | No verified implementation in this revision. |
| A108 | Jira | Pending | No verified implementation in this revision. |
| A109 | OpenAPI custom tool | Pending | No verified implementation in this revision. |
| A110 | ACI custom app | Pending | No verified implementation in this revision. |
| A111 | MCP server connection | Pending | No verified implementation in this revision. |
| A112 | Cross-app MCP reuse | Pending | No verified implementation in this revision. |
| A113 | Automatic database provisioning | Pending | No verified implementation in this revision. |
| A114 | Generated sign-up and sign-in | Pending | No verified implementation in this revision. |
| A115 | Table and row browser | Working locally | Local table/row browser with creation and deletion. |
| A116 | Schema browser | Partial | Tables represented locally; no column/relationship schema editor. |
| A117 | Read-only explorer | Pending | No verified implementation in this revision. |
| A118 | PostgreSQL live implementation | Pending | No verified implementation in this revision. |
| A119 | Full file tree | Pending | No verified implementation in this revision. |
| A120 | Source viewer | Partial | One source draft editor; not a real file tree. |
| A121 | Encrypted environment variables | Pending | No verified implementation in this revision. |
| A122 | Runtime browser and network console | Pending | No verified implementation in this revision. |
| A123 | Visual element selection for prompt | Working locally | Selected sample elements become scoped prompts. |
| A124 | Long-lived sandbox | Pending | No verified implementation in this revision. |
| A125 | Self-healing error fixes | Pending | No verified implementation in this revision. |
| A126 | Connect personal GitHub | Pending | No verified implementation in this revision. |
| A127 | Automatic commit and push | Pending | No verified implementation in this revision. |
| A128 | Pull push and branch switching | Pending | No verified implementation in this revision. |
| A129 | Platform-managed private repository | Pending | No verified implementation in this revision. |
| A130 | Export to personal GitHub | Pending | No verified implementation in this revision. |
| A131 | Import existing Next.js repository | Pending | No verified implementation in this revision. |
| A132 | GitAgent beta repository | Pending | No verified implementation in this revision. |
| A133 | Feature testing project setting | Pending | No verified implementation in this revision. |
| A134 | Autonomous browser testing agent | Pending | No verified implementation in this revision. |
| A135 | Test this build | Partial | Six real local configuration checks; no repository/browser execution. |
| A136 | Embedded app preview | Partial | Interactive sample preview, not generated code. |
| A137 | Standalone preview URL | Pending | No verified implementation in this revision. |
| A138 | Refresh and reconnect states | Partial | Preview refresh resets the sample component; no remote sandbox reconnect. |
| A139 | Share project dialog | Partial | Exportable workspace snapshot, no shared live access. |
| A140 | People with access | Partial | Local member/invitation drafts only. |
| A141 | Same-app shared editing | Pending | No verified implementation in this revision. |
| A142 | Agents KB and resources shared | Pending | No verified implementation in this revision. |
| A143 | First deploy flow | Partial | Gated local release snapshot; no hosting deployment. |
| A144 | Architect public URL | Pending | No verified implementation in this revision. |
| A145 | Rename deployed subdomain | Pending | No verified implementation in this revision. |
| A146 | Custom domain | Pending | No verified implementation in this revision. |
| A147 | Redeploy changes | Pending | No verified implementation in this revision. |
| A148 | Undeploy | Pending | No verified implementation in this revision. |
| A149 | Social sharing links | Pending | No verified implementation in this revision. |
| A150 | VPC or on-premise enterprise option | Pending | No verified implementation in this revision. |
| A151 | Publish during deploy | Pending | No verified implementation in this revision. |
| A152 | Listing metadata | Pending | No verified implementation in this revision. |
| A153 | Owner pays visitor credits | Pending | No verified implementation in this revision. |
| A154 | Popular Recent Top Rated sorting | Pending | No verified implementation in this revision. |
| A155 | Category use-case integration and LLM filters | Pending | No verified implementation in this revision. |
| A156 | Listing metrics and creator profile | Pending | No verified implementation in this revision. |
| A157 | View App | Pending | No verified implementation in this revision. |
| A158 | Clone App | Partial | Template brief becomes an independent project; not full application cloning. |
| A159 | Build-mode feature specs | Pending | No verified implementation in this revision. |
| A160 | Presentations and research documents | Pending | No verified implementation in this revision. |
| A161 | Artifacts tab | Pending | No verified implementation in this revision. |
| A162 | My Usage and All Users | Pending | No verified implementation in this revision. |
| A163 | 7 30 90 day and 12 month ranges | Pending | No verified implementation in this revision. |
| A164 | Graph and optional table | Pending | No verified implementation in this revision. |
| A165 | Per-app breakdown and search | Pending | No verified implementation in this revision. |
| A166 | Per-agent and token ledger | Pending | No verified implementation in this revision. |
| A167 | In-product live chat | Pending | No verified implementation in this revision. |
| A168 | Support form | Pending | No verified implementation in this revision. |
| A169 | Discord and demo paths | Pending | No verified implementation in this revision. |
| A170 | Free Starter Pro Max Custom plans | Pending | No verified implementation in this revision. |
| FND-001 | Adaptive Guided and Developer experiences | Partial | Mode changes default code/preview entry and branch detail; deeper adaptive UX remains. |
| FND-002 | Role-aware onboarding and navigation | Partial | Guided/developer mode only; no role-aware onboarding. |
| FND-003 | Shared project lifecycle rail | Working locally | Shared five-stage lifecycle and next actions. |
| FND-004 | Traceability project graph | Pending | No verified implementation in this revision. |
| FND-005 | Organization workspace and project hierarchy | Partial | Local projects only; no organization hierarchy. |
| FND-006 | Global search and command palette | Partial | Keyboard command palette for all project destinations; no content-wide search. |
| INT-001 | Create from plain-language idea | Working locally | Named project and brief creation. |
| INT-002 | Import Jira ClickUp Linear or Azure DevOps work item | Partial | Work-item URL reference only. |
| INT-003 | Import PRD from Docs Notion Confluence Word or PDF | Partial | Brief text/reference entry only; no document parsing. |
| INT-004 | Import Figma design and Dev Mode status | Partial | Figma URL reference only. |
| INT-005 | Import one or multiple Git repositories | Partial | Repository URL reference only; no clone. |
| INT-006 | Import production issue logs and traces | Pending | No verified implementation in this revision. |
| INT-007 | Clone verified marketplace app agent or workflow | Partial | Local starter briefs only. |
| PLN-001 | AI Consultant opportunity discovery | Pending | No verified implementation in this revision. |
| PLN-002 | Structured requirement extraction | Pending | No verified implementation in this revision. |
| PLN-003 | Ambiguity and missing-information detection | Pending | No verified implementation in this revision. |
| PLN-004 | Editable living PRD and acceptance criteria | Working locally | Editable local PRD and acceptance criteria. |
| PLN-005 | Change-impact preview before execution | Pending | No verified implementation in this revision. |
| PLN-006 | Implementation plan with affected resources | Pending | No verified implementation in this revision. |
| PLN-007 | Decision ledger with alternatives and rationale | Pending | No verified implementation in this revision. |
| DES-001 | High-fidelity clickable app mockup | Partial | Interactive sample app with inbox, customer, knowledge routes. |
| DES-002 | Figma frame component and token mapping | Pending | No verified implementation in this revision. |
| DES-003 | Responsive loading empty error and permission state coverage | Partial | Responsive layouts and empty/error states; generated app coverage not complete. |
| DES-004 | Visual design diff and approval | Pending | No verified implementation in this revision. |
| DES-005 | Reusable design system with accessibility validation | Partial | Versioned design reference page; full accessibility validation pending. |
| REP-001 | Repository framework and architecture detection | Pending | No verified implementation in this revision. |
| REP-002 | Universal isolated repository change workspace | Pending | No verified implementation in this revision. |
| REP-003 | Multi-repository service topology | Pending | No verified implementation in this revision. |
| REP-004 | Coordinated multi-repo changeset | Pending | No verified implementation in this revision. |
| REP-005 | Monorepo package and dependency graph | Pending | No verified implementation in this revision. |
| REP-006 | Existing build test and CI command detection | Pending | No verified implementation in this revision. |
| REP-007 | Organization workspace and repository policy inheritance | Pending | No verified implementation in this revision. |
| REP-008 | Company branching-strategy profiles | Working locally | Saved branching strategy and base/working branches. |
| REP-009 | Protected-branch and CODEOWNERS detection | Pending | No verified implementation in this revision. |
| REP-010 | Compatibility and migration report | Pending | No verified implementation in this revision. |
| DEV-001 | Dependency readiness inventory | Pending | No verified implementation in this revision. |
| DEV-002 | Connect Provision Mock or Skip resolution | Partial | Mock variable configuration only; provisioning not implemented. |
| DEV-003 | Encrypted environment and secret vault | Pending | No verified implementation in this revision. |
| DEV-004 | Secure dot-env import and variable classification | Pending | No verified implementation in this revision. |
| DEV-005 | Development test staging and production scopes | Partial | Release target selection only; no scoped real environments. |
| DEV-006 | Contract-based service mock generation | Pending | No verified implementation in this revision. |
| DEV-007 | Ephemeral database queue cache and storage provisioning | Pending | No verified implementation in this revision. |
| DEV-008 | Full browser code editor and file tree | Partial | Single editable source draft, not full IDE. |
| DEV-009 | Integrated terminal and task runner | Pending | No verified implementation in this revision. |
| DEV-010 | API explorer and request history | Pending | No verified implementation in this revision. |
| AGT-001 | Visual agent and workflow graph | Working locally | Interactive graph saved on this device. |
| AGT-002 | Lyzr LangGraph CrewAI OpenAI and custom framework adapters | Partial | Framework selection stored; execution adapters absent. |
| AGT-003 | Two-way visual and agent-code synchronization | Pending | No verified implementation in this revision. |
| AGT-004 | Per-agent model tool memory knowledge and schema controls | Partial | Per-node instructions and guardrails; missing model, tool, memory, schemas. |
| AGT-005 | Conditional loop parallel and human-approval workflow nodes | Partial | Connected graph nodes and risk branch; graph is not executed. |
| AGT-006 | Model routing fallback latency and budget rules | Pending | No verified implementation in this revision. |
| AGT-007 | Agent evaluation datasets scorers and thresholds | Pending | No verified implementation in this revision. |
| AGT-008 | Agent trace replay and step debugging | Pending | No verified implementation in this revision. |
| AGT-009 | Prompt injection PII output and tool guardrails | Partial | Guardrail flags; not enforced in a running agent. |
| DAT-001 | Managed database provisioning and explorer | Partial | Local data browser only; no managed provisioning. |
| DAT-002 | Editable schema and relationship designer | Pending | No verified implementation in this revision. |
| DAT-003 | SQL console query history and saved queries | Pending | No verified implementation in this revision. |
| DAT-004 | Migration generation preview approval and rollback | Pending | No verified implementation in this revision. |
| DAT-005 | Seed data and persona fixtures | Partial | Editable sample records; no persona generator. |
| DAT-006 | Visual authentication role and permission builder | Partial | Auth method configuration; no generated role/auth implementation. |
| DAT-007 | OAuth MFA SSO RBAC and RLS configuration | Partial | Desired auth methods and policy descriptions; enforcement absent. |
| TST-001 | Repository-native lint type and unit tests | Pending | No verified implementation in this revision. |
| TST-002 | API integration and contract tests | Pending | No verified implementation in this revision. |
| TST-003 | Multi-browser end-to-end testing | Pending | No verified implementation in this revision. |
| TST-004 | Responsive visual-regression and accessibility tests | Pending | No verified implementation in this revision. |
| TST-005 | Acceptance-criteria-to-test generation | Pending | No verified implementation in this revision. |
| TST-006 | Affected-test selection for monorepos and upgrades | Pending | No verified implementation in this revision. |
| TST-007 | QA manual checklist evidence and sign-off | Partial | Local configuration evidence export; no manual QA checklist. |
| TST-008 | Failure capture with screenshot video log and trace | Pending | No verified implementation in this revision. |
| GIT-001 | GitHub GitLab Bitbucket and Azure Repos connections | Pending | No verified implementation in this revision. |
| GIT-002 | Policy-compliant branch-name generation | Partial | User-entered working/base branch; no generated policy enforcement. |
| GIT-003 | Diff staging selective commit and conventional messages | Pending | No verified implementation in this revision. |
| GIT-004 | Pull or merge request generation and update | Partial | Export PR markdown draft; no GitHub PR creation. |
| GIT-005 | PR readiness bundle with evidence risk and rollback | Partial | Local approval and configuration evidence; no real source diff or rollback. |
| GIT-006 | Linked pull requests and merge-order planning | Pending | No verified implementation in this revision. |
| GIT-007 | Code-owner reviewer and approval routing | Pending | No verified implementation in this revision. |
| GIT-008 | Rich Git provider checks annotations and reruns | Pending | No verified implementation in this revision. |
| REL-001 | Preview environment per change | Pending | No verified implementation in this revision. |
| REL-002 | Development staging and production promotion | Partial | Environment choice only. |
| REL-003 | Deployment readiness checklist and approvals | Partial | Local verification and review gates; no external deployment validation. |
| REL-004 | Vercel AWS Azure GCP Kubernetes and custom deployment targets | Pending | No verified implementation in this revision. |
| REL-005 | Immutable release artifact and provenance | Partial | Exported local JSON snapshot, not a built application artifact. |
| REL-006 | Deployment history health checks rollback and redeploy | Pending | No verified implementation in this revision. |
| REL-007 | Automated release notes changelog and work-item update | Pending | No verified implementation in this revision. |
| OPS-001 | Unified app service agent and integration health center | Pending | No verified implementation in this revision. |
| OPS-002 | Logs metrics traces and deployment correlation | Pending | No verified implementation in this revision. |
| OPS-003 | Production issue reproduction and replay | Pending | No verified implementation in this revision. |
| OPS-004 | Per-agent per-run token latency tool and cost ledger | Pending | No verified implementation in this revision. |
| OPS-005 | Project and public-app budgets alerts and hard caps | Pending | No verified implementation in this revision. |
| OPS-006 | Feedback and analytics to backlog loop | Pending | No verified implementation in this revision. |
| COL-001 | Role-based project access and responsibilities | Partial | Draft member roles only. |
| COL-002 | Comments mentions and screen or code annotations | Pending | No verified implementation in this revision. |
| COL-003 | PM design engineering QA and release approval gates | Partial | Plan and change approval locally; no identity-enforced cross-role gates. |
| COL-004 | Bidirectional Jira ClickUp Linear and Azure status sync | Pending | No verified implementation in this revision. |
| COL-005 | Requirement design code test deployment traceability | Pending | No verified implementation in this revision. |
| COL-006 | Audit log for changes approvals exceptions and production actions | Partial | Local activity history, not tamper-resistant audit storage. |
| COL-007 | Self-hosted runner VPC and private-network execution | Pending | No verified implementation in this revision. |
| MKT-001 | Verified app agent workflow tool and component templates | Partial | Three local starter briefs, not verified executable templates. |
| MKT-002 | Framework dependency security and cost metadata | Pending | No verified implementation in this revision. |
| MKT-003 | Clone-to-owned-project setup wizard | Partial | Template-to-project creation flow. |
| MKT-004 | Build-readiness score and blocking checklist | Partial | Local readiness checks, not execution readiness. |
| MKT-005 | Cost and time estimate before build test deploy and publish | Pending | No verified implementation in this revision. |
| CMP-001 | Native iOS and Android application build device preview and store-release workflow | Pending | No verified implementation in this revision. |
| CMP-002 | Multi-artifact project with web mobile presentation video and data experiences sharing one backend | Pending | No verified implementation in this revision. |
| CMP-003 | Background task queue with priority dependencies pause resume and reprioritization | Pending | No verified implementation in this revision. |
| CMP-004 | Parallel solution drafts with side-by-side comparison and selective merge | Pending | No verified implementation in this revision. |
| CMP-005 | Full-state checkpoints covering code conversation environment and optional database | Pending | No verified implementation in this revision. |
| CMP-006 | Character-level file history playback and point-in-time restore | Pending | No verified implementation in this revision. |
| CMP-007 | Direct visual property inspector with multi-select batch edits undo redo reset and before-after review | Pending | No verified implementation in this revision. |
| CMP-008 | AI image generation editing and project asset library | Pending | No verified implementation in this revision. |
| CMP-009 | Build execution profiles for fast balanced and deep work with cost-time tradeoffs | Pending | No verified implementation in this revision. |
| CMP-010 | Agent autonomy permissions with Ask Auto and Full modes | Pending | No verified implementation in this revision. |
| CMP-011 | Multiple scoped chats and tasks contributing safely to one shared project | Pending | No verified implementation in this revision. |
| CMP-012 | Reusable organization and workspace build rules skills and conventions | Pending | No verified implementation in this revision. |
| CMP-013 | Pre-publish source dependency secret permission and configuration security scan | Pending | No verified implementation in this revision. |
| CMP-014 | Agent web and site research with source citations captured into project context | Pending | No verified implementation in this revision. |
| CMP-015 | Preview First versus Full Build execution policy | Pending | No verified implementation in this revision. |
| CMP-016 | Freeform design canvas for screens components flows and design-system exploration | Pending | No verified implementation in this revision. |
| CMP-017 | Embeddable live prototype and contextual review surface for work-management and design tools | Pending | No verified implementation in this revision. |
| CMP-018 | Real-time multiplayer editing with presence cursors and conflict-safe updates | Pending | No verified implementation in this revision. |
| CMP-019 | One-click application primitives for payments email file storage and background jobs | Pending | No verified implementation in this revision. |
| CMP-020 | CLI SDK and local roundtrip with optional codebase eject | Pending | No verified implementation in this revision. |
| CMP-021 | Continuous two-way repository synchronization with drift detection and conflict resolution | Pending | No verified implementation in this revision. |
| CMP-022 | Reusable team skills rules and workflow-template marketplace | Pending | No verified implementation in this revision. |
| UNI-001 | Kova Context Lens to click or lasso anything and Ask Change Diagnose Test Trace or Measure it | Partial | Click selection and scoped prompt; lasso/diagnose/trace/measure absent. |
| UNI-002 | Change Scope Dial for this instance shared component page journey role or whole product | Partial | Element/component/journey prompt scope only. |
| UNI-003 | Selection Dependency X-Ray across code repositories APIs data agents tests owners and deployments | Pending | No verified implementation in this revision. |
| UNI-004 | Why and provenance view linking selected behavior to requirements designs decisions commits and owners | Pending | No verified implementation in this revision. |
| UNI-005 | Selection-based cross-layer change contract with impact plan cost risk and coordinated resources | Pending | No verified implementation in this revision. |
| UNI-006 | Journey Lasso to record or select a multi-screen flow and change or test it as one unit | Pending | No verified implementation in this revision. |
| UNI-007 | Persona and condition reality switch across roles devices locales accessibility networks permissions and data states | Pending | No verified implementation in this revision. |
| UNI-008 | Capability Truth Overlay showing Proposed Mocked Connected Tested Verified and Deployed states with evidence | Partial | Explicit local/prototype/pending labels; no comprehensive overlay. |
| UNI-009 | Agent Output Lens tracing a selected response to model prompt tool knowledge memory source cost and latency | Pending | No verified implementation in this revision. |
| UNI-010 | Data Lineage Lens tracing a selected value through UI API transformation schema source and access policy | Pending | No verified implementation in this revision. |
| UNI-011 | Requirement and verification heatmap directly over the live application preview | Pending | No verified implementation in this revision. |
| UNI-012 | Constraint Pins that protect approved behavior design contracts and security invariants from later builds | Pending | No verified implementation in this revision. |
| UNI-013 | Cross-role feedback reconciliation for conflicting PM design engineering QA and stakeholder requests | Pending | No verified implementation in this revision. |
| UNI-014 | Risk-adaptive autonomy that escalates approval based on blast radius environment and policy | Pending | No verified implementation in this revision. |
| UNI-015 | Reverse Product Map from an imported repository or live app with observed and inferred behavior separated | Pending | No verified implementation in this revision. |
| UNI-016 | Selection-to-experiment workflow with variants feature flags success metrics rollout and rollback | Pending | No verified implementation in this revision. |
| UNI-017 | Safe Removal Mode for feature cleanup across UI code APIs data flags tests documentation and release plans | Pending | No verified implementation in this revision. |
| UNI-018 | Accepted-change learning capture into a reusable token rule skill test pattern or organization convention | Pending | No verified implementation in this revision. |
| UNI-019 | Role Handoff Capsules with completed work evidence open questions approvals and next actions from shared state | Pending | No verified implementation in this revision. |
| MOD-001 | Prompt-composer model selector with per-prompt provider and model switching | Partial | Searchable live catalog, per-prompt selection; live provider execution requires key. |
| MOD-002 | Task-aware Auto model router for UI backend data agent research debugging and testing work | Partial | Auto uses one configured default; task-aware routing not implemented. |
| MOD-003 | Provider Hub with Kova-managed models and secure bring-your-own-key model families | Partial | Provider setup information only; encrypted BYOK management absent. |
| BSC-001 | Prompt draft autosave and cross-session restore | Working locally | Draft autosave and reload restoration. |
| BSC-002 | Edit resend stop retry regenerate continue and branch conversation controls | Partial | Stop, retry, draft restore, resend; no branch/continue controls. |
| BSC-003 | Context picker and at-mentions for files screens requirements repositories agents and integrations | Partial | Context list and selection references; no resource retrieval. |
| BSC-004 | Personal prompt history with search reuse and favorites | Partial | Prompt reuse/history; no favorites or search. |
| BSC-005 | Context inspector with window meter and pin or remove source controls | Partial | Context list and remove; no token meter or pin. |
| BSC-006 | Voice dictation with editable transcription before send | Pending | No verified implementation in this revision. |
| BSC-007 | Response copy share feedback report and citation source actions | Partial | Copy response; remaining actions absent. |
| BSC-008 | Project folders tags favorites archive restore and bulk organization | Partial | Archive/restore and search; no folders, tags, favorites, bulk actions. |
| BSC-009 | Unified notification and approval inbox with in-app and email preferences | Pending | No verified implementation in this revision. |
| BSC-010 | Preview toolbar with device presets zoom rotate fullscreen open-tab and copy-URL actions | Partial | Device presets, refresh, and expanded preview; other controls absent. |
| BSC-011 | Browser IDE file operations tabs split view search replace autocomplete diagnostics formatting and navigation | Pending | No verified implementation in this revision. |
| BSC-012 | Visual package and dependency manager with install update remove audit license and lockfile controls | Pending | No verified implementation in this revision. |
| BSC-013 | Test explorer with suites filters watch coverage rerun and failure navigation | Partial | Configuration checks and filter; no external runner/watch/coverage. |
| BSC-014 | Email verification password recovery MFA passkeys and session or device management | Pending | No verified implementation in this revision. |
| BSC-015 | Consent preferences and account data export or deletion | Pending | No verified implementation in this revision. |
| BSC-016 | Workspace member invite directory role change suspension and removal | Partial | Invitation drafts; no email, authorization, or live membership. |
| BSC-017 | Platform API keys service accounts scoped tokens and webhook subscriptions | Pending | No verified implementation in this revision. |
| BSC-018 | Private password-protected expiring preview links with viewer access controls | Pending | No verified implementation in this revision. |
| BSC-019 | Builder keyboard screen-reader reduced-motion high-contrast and focus preferences | Partial | Focus styles, native dialog keyboard behavior, reduced motion; no complete accessibility audit. |
| BSC-020 | Builder language locale timezone and date or number format preferences | Pending | No verified implementation in this revision. |
| BSC-021 | Autosave and crash or reconnect recovery for forms PRDs designs and code | Partial | Local project state and graph persistence; no distributed recovery. |
| BSC-022 | Debugger breakpoint process port and live-reload manager with restart controls | Pending | No verified implementation in this revision. |
