"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  Gauge,
  GitBranch,
  GitFork,
  GitPullRequest,
  Globe2,
  KeyRound,
  Layers3,
  Link2,
  LoaderCircle,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Table2,
  TestTube2,
  UploadCloud,
  UserCheck,
  Users,
  Webhook,
  Zap,
} from "lucide-react";

function SurfaceHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <header className="surface-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children ? <div className="surface-header-actions">{children}</div> : null}</header>;
}

export function PlanSurface() {
  return (
    <div className="surface-page">
      <SurfaceHeader eyebrow="Living specification" title="Plan" description="Requirements, decisions and implementation stay connected to the work.">
        <button className="button quiet" type="button"><FileText aria-hidden="true" />Export PRD</button><button className="button primary" type="button"><Check aria-hidden="true" />Approve plan</button>
      </SurfaceHeader>
      <div className="readiness-band"><div><span className="readiness-score">86</span><p><strong>Ready to build</strong><small>2 non-blocking questions remain</small></p></div><div className="readiness-checks"><span><Check aria-hidden="true" />Problem defined</span><span><Check aria-hidden="true" />Users identified</span><span><Check aria-hidden="true" />States covered</span><span className="pending"><CircleDot aria-hidden="true" />Analytics events</span></div><button type="button">Review questions <ChevronRight aria-hidden="true" /></button></div>
      <div className="plan-layout">
        <section className="document-surface">
          <div className="document-toolbar"><span>Product requirements document</span><div><button type="button"><MessageSquareText aria-hidden="true" />4 comments</button><button type="button"><MoreHorizontal aria-hidden="true" /></button></div></div>
          <article className="prd-document"><span className="document-version">PRD v3 · Updated 12 minutes ago</span><h2>RelayDesk support operations</h2><p className="document-lede">Give support teams one place to prioritize customer issues, collaborate with an AI triage agent and measure service quality.</p><h3>Problem</h3><p>Support managers lose time moving between inboxes, knowledge tools and analytics. Agents repeat triage work while urgent requests wait without a clear owner.</p><h3>Primary outcomes</h3><ul><li><Check aria-hidden="true" /><span><strong>Resolve faster</strong>Reduce median first response below five minutes.</span></li><li><Check aria-hidden="true" /><span><strong>Keep humans accountable</strong>Require review for low-confidence and high-risk agent actions.</span></li><li><Check aria-hidden="true" /><span><strong>Improve from evidence</strong>Connect ticket outcomes to knowledge gaps and agent evaluations.</span></li></ul><h3>Acceptance criteria</h3><ol><li>Users can filter and assign the priority queue without a page reload.</li><li>The triage agent shows confidence, sources and escalation reason.</li><li>Managers can compare response and resolution trends over time.</li><li>Every automated action appears in the audit timeline.</li></ol></article>
        </section>
        <aside className="plan-aside">
          <section><div className="aside-heading"><span><Network aria-hidden="true" />Architecture</span><button type="button">Open map</button></div><div className="mini-architecture"><div><Layers3 aria-hidden="true" /><span>Next.js UI</span></div><i /><div><Braces aria-hidden="true" /><span>API layer</span></div><i /><div><Database aria-hidden="true" /><span>Postgres</span></div></div></section>
          <section><div className="aside-heading"><span><Users aria-hidden="true" />Personas</span><button type="button"><Plus aria-hidden="true" /></button></div><div className="persona-list"><div><span>SM</span><p><strong>Support manager</strong><small>Queue health and coaching</small></p></div><div><span>AG</span><p><strong>Support agent</strong><small>Fast, reliable resolution</small></p></div><div><span>OP</span><p><strong>Operations lead</strong><small>Policy and performance</small></p></div></div></section>
          <section><div className="aside-heading"><span><Activity aria-hidden="true" />Decision ledger</span><button type="button">View all</button></div><div className="decision-list"><div><i className="accepted" /><p><strong>Human review threshold</strong><small>Confidence below 82% · Accepted</small></p></div><div><i className="accepted" /><p><strong>Shared tenant model</strong><small>RLS by workspace · Accepted</small></p></div><div><i className="open" /><p><strong>Archive retention</strong><small>30 or 90 days · Open</small></p></div></div></section>
        </aside>
      </div>
    </div>
  );
}

export function AgentsSurface() {
  const [selected, setSelected] = useState("Triage agent");
  const nodes = [
    { name: "New ticket", type: "Trigger", icon: Zap, x: "8%", y: "42%" },
    { name: "Classify intent", type: "Agent", icon: Sparkles, x: "31%", y: "21%" },
    { name: "Triage agent", type: "Agent", icon: Bot, x: "31%", y: "62%" },
    { name: "Risk gate", type: "Approval", icon: ShieldCheck, x: "57%", y: "42%" },
    { name: "Draft response", type: "Tool", icon: FileText, x: "80%", y: "21%" },
    { name: "Escalate", type: "Action", icon: Users, x: "80%", y: "62%" },
  ];
  return (
    <div className="surface-page full-height">
      <SurfaceHeader eyebrow="Agentic application" title="Agents" description="Design the workflow visually, then inspect every model, tool and guardrail.">
        <button className="button quiet" type="button"><Play aria-hidden="true" />Test run</button><button className="button primary" type="button"><Plus aria-hidden="true" />Add node</button>
      </SurfaceHeader>
      <div className="agent-layout">
        <section className="agent-canvas">
          <div className="canvas-grid" aria-hidden="true" />
          <svg className="agent-lines" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true"><path d="M170 260 C230 260 225 125 310 125" /><path d="M170 260 C230 260 225 365 310 365" /><path d="M455 125 C505 125 505 260 570 260" /><path d="M455 365 C505 365 505 260 570 260" /><path d="M700 260 C750 260 745 125 810 125" /><path d="M700 260 C750 260 745 365 810 365" /></svg>
          {nodes.map((node) => { const Icon = node.icon; return <button type="button" key={node.name} className={`agent-node ${selected === node.name ? "is-selected" : ""}`} style={{ left: node.x, top: node.y }} onClick={() => setSelected(node.name)}><span><Icon aria-hidden="true" /></span><p><strong>{node.name}</strong><small>{node.type}</small></p><i /></button>; })}
          <div className="agent-canvas-tools"><button type="button">−</button><span>80%</span><button type="button">+</button><button type="button">Fit</button></div>
        </section>
        <aside className="agent-inspector"><div className="inspector-heading"><div><span className="agent-symbol"><Bot aria-hidden="true" /></span><p><strong>{selected}</strong><small>Agent node</small></p></div><button type="button"><MoreHorizontal aria-hidden="true" /></button></div><label className="field"><span>Model</span><button className="select-like" type="button">Auto · Claude Opus 5.5 <ChevronRight aria-hidden="true" /></button></label><label className="field"><span>Instructions</span><textarea rows={7} defaultValue="Classify priority and intent. Use approved knowledge before drafting. Escalate billing risk and confidence below 82%." /></label><div className="inspector-section"><span>Connected resources</span><button type="button"><Database aria-hidden="true" /><p><strong>Support knowledge</strong><small>184 documents</small></p><Check aria-hidden="true" /></button><button type="button"><Braces aria-hidden="true" /><p><strong>Ticket API</strong><small>6 operations</small></p><Check aria-hidden="true" /></button></div><div className="inspector-section"><span>Guardrails</span><label className="toggle-row"><p><strong>Require citations</strong><small>Sources for factual claims</small></p><input type="checkbox" defaultChecked /><i /></label><label className="toggle-row"><p><strong>Human risk gate</strong><small>Before sensitive actions</small></p><input type="checkbox" defaultChecked /><i /></label></div><button className="button primary wide" type="button">Save agent</button></aside>
      </div>
    </div>
  );
}

export function DataSurface() {
  const [tab, setTab] = useState<"schema" | "rows" | "auth">("schema");
  return (
    <div className="surface-page">
      <SurfaceHeader eyebrow="Application services" title="Data & authentication" description="A managed data layer with visible schema, policy and user access.">
        <button className="button quiet" type="button"><UploadCloud aria-hidden="true" />Import data</button><button className="button primary" type="button"><Plus aria-hidden="true" />New table</button>
      </SurfaceHeader>
      <div className="service-status"><span><i />Database connected</span><code>Postgres 17 · ap-south-1</code><button type="button"><ExternalLink aria-hidden="true" />Open provider</button></div>
      <div className="data-tabs"><button type="button" className={tab === "schema" ? "is-active" : ""} onClick={() => setTab("schema")}><Network aria-hidden="true" />Schema</button><button type="button" className={tab === "rows" ? "is-active" : ""} onClick={() => setTab("rows")}><Table2 aria-hidden="true" />Rows</button><button type="button" className={tab === "auth" ? "is-active" : ""} onClick={() => setTab("auth")}><UserCheck aria-hidden="true" />Authentication</button></div>
      {tab === "schema" ? <div className="schema-layout"><aside className="table-list"><label><Search aria-hidden="true" /><input placeholder="Search tables" /></label>{["tickets", "customers", "conversations", "knowledge_articles", "agent_runs"].map((table, index) => <button type="button" key={table} className={index === 0 ? "is-active" : ""}><Table2 aria-hidden="true" /><span>{table}</span><small>{[128, 42, 386, 184, 864][index]}</small></button>)}</aside><section className="schema-detail"><div className="schema-title"><div><span><Table2 aria-hidden="true" /></span><p><strong>tickets</strong><small>Customer support requests and triage state</small></p></div><button type="button"><MoreHorizontal aria-hidden="true" /></button></div><div className="column-table"><div className="column-head"><span>Column</span><span>Type</span><span>Default</span><span>Policy</span></div>{[["id","uuid","gen_random_uuid()","Primary"],["workspace_id","uuid","-","RLS"],["subject","text","-","Required"],["priority","ticket_priority","normal","Required"],["assignee_id","uuid","null","Nullable"],["created_at","timestamptz","now()","Indexed"]].map((row) => <div key={row[0]}>{row.map((cell, index) => <span key={cell}>{index === 0 ? <><KeyRound aria-hidden="true" />{cell}</> : cell}</span>)}</div>)}</div><div className="rls-banner"><ShieldCheck aria-hidden="true" /><p><strong>Row-level security enabled</strong><small>Workspace members can only access tickets in their assigned workspace.</small></p><button type="button">View policies</button></div></section></div> : null}
      {tab === "rows" ? <div className="data-placeholder"><Table2 aria-hidden="true" /><h2>Table explorer</h2><p>Browse, filter and edit seeded ticket records with policy-aware access.</p><button className="button primary" type="button">Open tickets</button></div> : null}
      {tab === "auth" ? <div className="auth-config-grid"><section><span className="config-icon"><UserCheck aria-hidden="true" /></span><h2>Authentication methods</h2><p>Email and social sign-in for generated applications.</p><div className="provider-row"><Mail aria-hidden="true" /><span><strong>Email and password</strong><small>Verification required</small></span><i className="connected" /></div><div className="provider-row"><GitFork aria-hidden="true" /><span><strong>GitHub</strong><small>OAuth provider</small></span><button type="button">Configure</button></div><div className="provider-row"><Globe2 aria-hidden="true" /><span><strong>Google</strong><small>OAuth provider</small></span><button type="button">Configure</button></div></section><section><span className="config-icon"><ShieldCheck aria-hidden="true" /></span><h2>Roles and permissions</h2><p>Four application roles connected to database policies.</p>{["Administrator","Support manager","Support agent","Viewer"].map((role, index) => <div className="role-row" key={role}><span>{role}</span><small>{["All access","Manage and report","Work assigned tickets","Read only"][index]}</small><ChevronRight aria-hidden="true" /></div>)}</section></div> : null}
    </div>
  );
}

export function TestsSurface() {
  const [running, setRunning] = useState(false);
  const [runComplete, setRunComplete] = useState(true);
  async function runTests() { setRunning(true); setRunComplete(false); await new Promise((resolve) => window.setTimeout(resolve, 900)); setRunning(false); setRunComplete(true); }
  return (
    <div className="surface-page">
      <SurfaceHeader eyebrow="Verification evidence" title="Tests" description="Product requirements stay linked to automated and human checks.">
        <button className="button quiet" type="button"><RefreshCw aria-hidden="true" />Last run</button><button className="button primary" type="button" onClick={() => void runTests()} disabled={running}>{running ? <LoaderCircle className="spin" aria-hidden="true" /> : <Play aria-hidden="true" />}{running ? "Running tests" : "Run all tests"}</button>
      </SurfaceHeader>
      <div className="test-summary"><div className="test-score"><span>{running ? "…" : "34"}</span><p><strong>{running ? "Running" : "Passed"}</strong><small>of 34 checks</small></p></div><div><span>Coverage</span><strong>87.4%</strong><i><em style={{ width: "87.4%" }} /></i></div><div><span>Requirements</span><strong>12 / 12</strong><i><em style={{ width: "100%" }} /></i></div><div><span>Duration</span><strong>{running ? "Running" : "42.8s"}</strong><small>3 browsers · 6 viewports</small></div></div>
      <div className="test-layout"><aside className="test-suites"><div className="suite-heading"><span>Test suites</span><button type="button"><Plus aria-hidden="true" /></button></div>{[["All checks",34],["Acceptance",12],["Browser flows",8],["API contracts",6],["Accessibility",5],["Agent evaluations",3]].map(([name,count],index) => <button type="button" key={name} className={index === 0 ? "is-active" : ""}><span>{index === 0 ? <FlaskConical aria-hidden="true" /> : <TestTube2 aria-hidden="true" />}{name}</span><small>{count}</small></button>)}</aside><section className="test-results"><header><div><strong>All checks</strong><span>Last run 8 minutes ago</span></div><div><button type="button">Status: all</button><button type="button">Latest first</button></div></header>{[["User can filter the priority queue","Acceptance · Chromium","1.8s"],["Urgent ticket opens triage evidence","Browser flow · 3 browsers","4.2s"],["Low confidence requires approval","Agent evaluation · 8 cases","12.6s"],["Ticket contract accepts nullable assignee","API contract · POST /tickets","680ms"],["Queue remains usable at 390px","Responsive · Mobile","2.1s"],["Keyboard user can assign a ticket","Accessibility · WCAG AA","3.4s"]].map((test,index) => <article key={test[0]} className={running && index === 2 ? "is-running" : ""}><span className="test-result-icon">{running && index === 2 ? <LoaderCircle className="spin" aria-hidden="true" /> : <Check aria-hidden="true" />}</span><p><strong>{test[0]}</strong><small>{test[1]}</small></p><time>{running && index === 2 ? "Running" : test[2]}</time><button type="button"><ChevronRight aria-hidden="true" /></button></article>)}</section><aside className="test-evidence"><div className="aside-heading"><span><Gauge aria-hidden="true" />Evidence</span><button type="button"><MoreHorizontal aria-hidden="true" /></button></div><div className="evidence-preview"><div className="mini-browser"><span /><span /><span /></div><div><i /><i /><i /></div></div><p><strong>Priority queue at 1440px</strong><small>Screenshot from the latest Chromium run.</small></p><dl><div><dt>Requirement</dt><dd>AC-03</dd></div><div><dt>Commit</dt><dd><code>8e4c29a</code></dd></div><div><dt>Environment</dt><dd>Preview</dd></div></dl><button className="button secondary wide" type="button">Open trace</button></aside></div>
      {runComplete && !running ? <div className="test-complete-banner"><CheckCircle2 aria-hidden="true" /><span><strong>All verification passed</strong><small>Evidence is attached to the current checkpoint.</small></span></div> : null}
    </div>
  );
}

export function GitSurface() {
  const [connected, setConnected] = useState(true);
  const [prCreated, setPrCreated] = useState(false);
  return (
    <div className="surface-page">
      <SurfaceHeader eyebrow="Source control" title="Git & pull request" description="Review exactly what changed and respect the repository's delivery policy.">
        <button className="button quiet" type="button" onClick={() => setConnected((value) => !value)}><GitFork aria-hidden="true" />{connected ? "darshdevlab/relaydesk" : "Connect GitHub"}</button><button className="button primary" type="button" onClick={() => setPrCreated(true)}><GitPullRequest aria-hidden="true" />{prCreated ? "Pull request ready" : "Create pull request"}</button>
      </SurfaceHeader>
      {!connected ? <div className="connect-empty"><span><GitFork aria-hidden="true" /></span><h2>Connect GitHub</h2><p>Install the Kova GitHub App, choose repositories and keep organization policy intact.</p><button className="button primary" type="button" onClick={() => setConnected(true)}>Connect GitHub <ArrowRight aria-hidden="true" /></button></div> : <><div className="git-context"><div><GitFork aria-hidden="true" /><span><strong>darshdevlab/relaydesk</strong><small>Synced 24 seconds ago</small></span></div><div><GitBranch aria-hidden="true" /><span><strong>feat/ai-triage-queue</strong><small>Based on main · protected</small></span></div><button type="button"><RefreshCw aria-hidden="true" />Sync</button></div><div className="git-layout"><section className="diff-panel"><header><div><span className="diff-count positive">+184</span><span className="diff-count negative">−32</span><strong>6 files changed</strong></div><button type="button">Stage all</button></header><div className="file-changes">{[["M","app/dashboard/page.tsx","+42 −8"],["M","components/ticket-queue.tsx","+68 −12"],["A","components/triage-panel.tsx","+46"],["M","lib/agents/triage.ts","+18 −6"],["A","tests/triage.spec.ts","+10"],["M","app/globals.css","+12 −6"]].map((file,index) => <button type="button" className={index === 1 ? "is-active" : ""} key={file[1]}><span className={file[0] === "A" ? "added" : "modified"}>{file[0]}</span><p><strong>{file[1]}</strong><small>{file[2]}</small></p><Check aria-hidden="true" /></button>)}</div><pre className="diff-view"><code><span className="diff-line context"><i>43</i><b>43</b>  return (</span><span className="diff-line context"><i>44</i><b>44</b>    &lt;section className=&quot;queue&quot;&gt;</span><span className="diff-line removed"><i>45</i><b> </b>-     &lt;TicketList tickets=&#123;tickets&#125; /&gt;</span><span className="diff-line added"><i> </i><b>45</b>+     &lt;TicketTable</span><span className="diff-line added"><i> </i><b>46</b>+       tickets=&#123;visibleTickets&#125;</span><span className="diff-line added"><i> </i><b>47</b>+       onSelect=&#123;openTriagePanel&#125;</span><span className="diff-line added"><i> </i><b>48</b>+     /&gt;</span><span className="diff-line context"><i>46</i><b>49</b>    &lt;/section&gt;</span></code></pre></section><aside className="pr-readiness"><div className="readiness-title"><span><ShieldCheck aria-hidden="true" /></span><p><strong>PR readiness</strong><small>Safe to request review</small></p><strong>92</strong></div>{[["Requirements linked","12 / 12"],["Checks passing","34 / 34"],["Secrets scan","No findings"],["Reviewers resolved","2 owners"],["Rollback prepared","Checkpoint #14"]].map((item) => <div className="pr-check" key={item[0]}><Check aria-hidden="true" /><span>{item[0]}</span><small>{item[1]}</small></div>)}<label className="field"><span>Commit message</span><input defaultValue="feat: add evidence-aware triage queue" /></label><div className="reviewer-list"><span>Required reviewers</span><div><i>AR</i><p><strong>Aryan Rao</strong><small>CODEOWNER · Frontend</small></p><Check aria-hidden="true" /></div><div><i>SK</i><p><strong>Sana Khan</strong><small>Agent platform</small></p><Clock3 aria-hidden="true" /></div></div><button className="button primary wide" type="button" onClick={() => setPrCreated(true)}>{prCreated ? <Check aria-hidden="true" /> : <GitPullRequest aria-hidden="true" />}{prCreated ? "PR #48 created" : "Create pull request"}</button>{prCreated ? <a href="#pr">Open pull request <ExternalLink aria-hidden="true" /></a> : null}</aside></div></>}
    </div>
  );
}

export function DeploySurface() {
  const [deploying, setDeploying] = useState(false);
  const [live, setLive] = useState(false);
  async function deploy() { setDeploying(true); await new Promise((resolve) => window.setTimeout(resolve, 1200)); setDeploying(false); setLive(true); }
  return (
    <div className="surface-page">
      <SurfaceHeader eyebrow="Release control" title="Deploy" description="Promote the same verified artifact through preview, staging and production.">
        <button className="button quiet" type="button"><Clock3 aria-hidden="true" />History</button><button className="button primary" type="button" onClick={() => void deploy()} disabled={deploying}>{deploying ? <LoaderCircle className="spin" aria-hidden="true" /> : <Rocket aria-hidden="true" />}{deploying ? "Deploying" : live ? "Redeploy" : "Deploy to production"}</button>
      </SurfaceHeader>
      <div className={`deployment-hero ${live ? "is-live" : ""}`}><div className="deployment-status-icon">{deploying ? <LoaderCircle className="spin" aria-hidden="true" /> : live ? <Check aria-hidden="true" /> : <Cloud aria-hidden="true" />}</div><div><span>{deploying ? "Production deployment running" : live ? "Production is live" : "Ready for production"}</span><h2>relaydesk.kova.app</h2><p>{live ? "Deployed just now from feat/ai-triage-queue" : "All required checks and approvals are complete."}</p></div><a href="#live">Open application <ExternalLink aria-hidden="true" /></a></div>
      <div className="environment-rail"><div className="environment-card"><header><span><i />Preview</span><small>Automatic</small></header><strong>relaydesk-git-ai-triage.kova-preview.app</strong><p>Latest commit · 8e4c29a</p><footer><span>Ready · 8m ago</span><button type="button"><ExternalLink aria-hidden="true" /></button></footer></div><ArrowRight aria-hidden="true" /><div className="environment-card"><header><span><i />Staging</span><small>Approved</small></header><strong>staging.relaydesk.kova.app</strong><p>Release candidate · rc-24</p><footer><span>Healthy · 6m ago</span><button type="button"><ExternalLink aria-hidden="true" /></button></footer></div><ArrowRight aria-hidden="true" /><div className={`environment-card production ${live ? "is-live" : ""}`}><header><span><i />Production</span><small>Manual gate</small></header><strong>relaydesk.kova.app</strong><p>{live ? "Release 1.8.0 · current" : "Release 1.7.4 · current"}</p><footer><span>{live ? "Live · just now" : "Healthy · Sep 22"}</span><button type="button"><ExternalLink aria-hidden="true" /></button></footer></div></div>
      <div className="deploy-grid"><section className="release-checklist"><div className="aside-heading"><span><ShieldCheck aria-hidden="true" />Production readiness</span><strong>7 / 7</strong></div>{[["Build artifact","Immutable · rc-24"],["Automated tests","34 passed"],["QA approval","Sana Khan"],["Security scan","No findings"],["Environment variables","12 configured"],["Database migration","Backward compatible"],["Rollback plan","Checkpoint #14"]].map((item) => <div key={item[0]}><Check aria-hidden="true" /><p><strong>{item[0]}</strong><small>{item[1]}</small></p><ChevronRight aria-hidden="true" /></div>)}</section><section className="deployment-settings"><div className="aside-heading"><span><Settings aria-hidden="true" />Deployment settings</span><button type="button">Edit</button></div><dl><div><dt>Provider</dt><dd>Vercel</dd></div><div><dt>Region</dt><dd>Washington, D.C. · iad1</dd></div><div><dt>Framework</dt><dd>Next.js 16</dd></div><div><dt>Build command</dt><dd><code>npm run build</code></dd></div><div><dt>Production branch</dt><dd><code>main</code></dd></div></dl><div className="domain-row"><Globe2 aria-hidden="true" /><p><strong>Custom domain</strong><small>relaydesk.kova.app · SSL active</small></p><Check aria-hidden="true" /></div></section><section className="observability-card"><div className="aside-heading"><span><Gauge aria-hidden="true" />Release health</span><span className="health-live"><i />Live</span></div><div className="health-score"><strong>99.98%</strong><span>Uptime · 30 days</span></div><div className="health-chart" aria-hidden="true">{[42,38,46,44,58,52,60,56,64,62,70,66,74,72,78,76,82,80,86,84].map((height,index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="health-stats"><span><strong>184ms</strong>p95 latency</span><span><strong>0.08%</strong>Error rate</span></div></section></div>
    </div>
  );
}

export function ActivitySurface() {
  return <div className="surface-page narrow"><SurfaceHeader eyebrow="Project timeline" title="Activity" description="Every decision, build, approval and release is preserved with evidence." /><div className="timeline-filters"><button className="is-active" type="button">All activity</button><button type="button">Builds</button><button type="button">Approvals</button><button type="button">Deployments</button></div><section className="activity-timeline">{[["Deployment ready for production","Kova verified 34 checks and assembled the release artifact.","Just now",Rocket,"success"],["Pull request #48 created","feat/ai-triage-queue is awaiting one agent-platform review.","6 min ago",GitPullRequest,"blue"],["Build completed","The triage panel and evidence states changed across 6 files.","12 min ago",Sparkles,"agent"],["Plan approved","Darsh approved PRD v3 and twelve acceptance criteria.","31 min ago",Check,"success"],["Figma source synchronized","Eight components matched; one token difference needs review.","48 min ago",Layers3,"warning"],["Repository imported","Kova detected Next.js, Supabase and the protected main branch.","Yesterday",GitFork,"default"]].map(([title,copy,time,Icon,tone]) => { const TimelineIcon = Icon as typeof Activity; return <article key={title as string}><span className={`timeline-icon ${tone}`}><TimelineIcon aria-hidden="true" /></span><div><h2>{title as string}</h2><p>{copy as string}</p><time>{time as string}</time></div><button type="button"><ChevronRight aria-hidden="true" /></button></article>; })}</section></div>;
}

export function SettingsSurface() {
  const [openRouter, setOpenRouter] = useState(false);
  return <div className="surface-page"><SurfaceHeader eyebrow="Project configuration" title="Settings" description="Manage models, connections, environments and team policy." /><div className="settings-layout"><aside className="settings-nav">{[["General",Settings],["Models & providers",Sparkles],["Integrations",Link2],["Environment",KeyRound],["Members",Users],["Security",ShieldCheck],["Webhooks",Webhook]].map(([label,Icon],index) => { const SettingsIcon = Icon as typeof Settings; return <button type="button" key={label as string} className={index === 1 ? "is-active" : ""}><SettingsIcon aria-hidden="true" />{label as string}</button>; })}</aside><section className="settings-content"><div className="settings-title"><div><h2>Models & providers</h2><p>Choose Kova-managed models or securely connect your own provider account.</p></div><span className="policy-badge"><ShieldCheck aria-hidden="true" />Workspace policy active</span></div><div className="provider-section"><div className="provider-section-heading"><div><h3>Kova model access</h3><p>Included with Kova credits. Auto routes each task to an approved model.</p></div><label className="toggle-row compact"><span>Enabled</span><input type="checkbox" defaultChecked /><i /></label></div><div className="model-policy-grid"><div><span><Zap aria-hidden="true" /></span><p><strong>Fast tasks</strong><small>UI copy, small edits, search</small></p><em>GPT-6 Luna</em></div><div><span><Code2 aria-hidden="true" /></span><p><strong>Build tasks</strong><small>Frontend, backend and debugging</small></p><em>GPT-6 Sol</em></div><div><span><Network aria-hidden="true" /></span><p><strong>Deep tasks</strong><small>Architecture and complex review</small></p><em>Claude Opus 5.5</em></div></div></div><div className="provider-section"><div className="provider-section-heading"><div><h3>Bring your own key</h3><p>Provider credentials stay encrypted and never reach the browser.</p></div><button className="button secondary" type="button"><Plus aria-hidden="true" />Add provider</button></div><div className="provider-list"><div><span className="provider-logo openrouter">OR</span><p><strong>OpenRouter</strong><small>{openRouter ? "Connected · 80 models available" : "One key for multiple model families"}</small></p>{openRouter ? <span className="connected-label"><Check aria-hidden="true" />Connected</span> : <button type="button" onClick={() => setOpenRouter(true)}>Connect</button>}</div><div><span className="provider-logo">AI</span><p><strong>OpenAI</strong><small>Direct provider connection</small></p><button type="button">Connect</button></div><div><span className="provider-logo anthropic">A</span><p><strong>Anthropic</strong><small>Direct provider connection</small></p><button type="button">Connect</button></div><div><span className="provider-logo google">G</span><p><strong>Google AI</strong><small>Direct provider connection</small></p><button type="button">Connect</button></div></div></div><div className="provider-section"><div className="provider-section-heading"><div><h3>Routing policy</h3><p>Controls applied whenever the composer uses Auto.</p></div><button type="button" className="text-button">Edit policy</button></div><div className="policy-rows"><div><p><strong>Prefer regional processing</strong><small>Use providers allowed for the workspace region</small></p><Check aria-hidden="true" /></div><div><p><strong>Fallback on model failure</strong><small>Retry once with the approved equivalent model</small></p><Check aria-hidden="true" /></div><div><p><strong>Maximum build budget</strong><small>Stop and ask before a run exceeds $2.00</small></p><span>$2.00</span></div></div></div></section></div></div>;
}
