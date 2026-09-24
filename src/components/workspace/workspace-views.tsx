"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Database,
  Download,
  FileText,
  FlaskConical,
  GitBranch,
  GitPullRequest,
  Globe,
  KeyRound,
  Link2,
  Lock,
  Play,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Modal, NextStep, SurfaceHeader } from "@/components/ui";
import { downloadFile, useWorkspace } from "@/lib/workspace-state";
import dynamic from "next/dynamic";

export const AgentsSurface = dynamic(
  () => import("./agent-flow").then((module) => module.AgentFlow),
  {
    ssr: false,
    loading: () => <div className="empty-state">Opening workflow...</div>,
  },
);

export function PlanSurface() {
  const { project, state, update, log, notify, navigate } = useWorkspace();
  const [requirement, setRequirement] = useState("");
  const [tab, setTab] = useState("Brief");
  const exportPlan = () =>
    downloadFile(
      `${project.name}-prd.md`,
      `# ${project.name}\n\n${state.brief}\n\n## Acceptance criteria\n${state.requirements.map((item) => `- ${item}`).join("\n")}`,
    );
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="01 / Define"
        title="A clear plan. A better build."
        description={project.name}
      >
        <button className="button quiet" onClick={exportPlan}>
          <Download />
          Export PRD
        </button>
        <button
          className="button primary"
          disabled={!state.brief.trim() || !state.requirements.length}
          onClick={() => {
            update({ approved: true });
            log(
              "Plan approved",
              `${state.requirements.length} acceptance criteria`,
              "Plan",
            );
            notify("Plan approved. Your build keeps this context.");
          }}
        >
          {state.approved ? <Check /> : <FileText />}
          {state.approved ? "Approved" : "Approve plan"}
        </button>
      </SurfaceHeader>
      <div className="plan-layout">
        <section className="document-surface">
          <div className="tab-bar">
            {["Brief", "Acceptance criteria", "Context"].map((name) => (
              <button
                className={tab === name ? "is-active" : ""}
                key={name}
                onClick={() => setTab(name)}
              >
                {name}
                {name === "Acceptance criteria" && (
                  <span>{state.requirements.length}</span>
                )}
              </button>
            ))}
          </div>
          {tab === "Brief" ? (
            <div className="prd-document">
              <div className="document-meta">
                <span className="tag">PRD v{state.version}</span>
                <span>Saved automatically</span>
              </div>
              <h2>{project.name}</h2>
              <label className="field">
                <span>Product brief</span>
                <textarea
                  className="brief-editor"
                  value={state.brief}
                  onChange={(e) =>
                    update({ brief: e.target.value, approved: false })
                  }
                  rows={7}
                />
              </label>
              <h3>Delivery boundaries</h3>
              <div className="principle-row">
                <ShieldCheck />
                <div>
                  <strong>Human approval before release</strong>
                  <p>Review changes and verification before publishing.</p>
                </div>
              </div>
              <div className="principle-row">
                <GitBranch />
                <div>
                  <strong>Isolated project changes</strong>
                  <p>
                    Branch policy: {state.branchStrategy}. Target:{" "}
                    {state.baseBranch}.
                  </p>
                </div>
              </div>
            </div>
          ) : tab === "Acceptance criteria" ? (
            <div className="prd-document">
              <h2>What does done look like?</h2>
              <div className="editable-list">
                {state.requirements.map((item, i) => (
                  <div key={i}>
                    <span className="number-label">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <input
                      aria-label={`Requirement ${i + 1}`}
                      value={item}
                      onChange={(e) =>
                        update({
                          requirements: state.requirements.map(
                            (value, index) =>
                              index === i ? e.target.value : value,
                          ),
                          approved: false,
                        })
                      }
                    />
                    <button
                      className="icon-button ghost"
                      aria-label={`Remove requirement ${i + 1}`}
                      onClick={() =>
                        update({
                          requirements: state.requirements.filter(
                            (_, index) => i !== index,
                          ),
                          approved: false,
                        })
                      }
                    >
                      <X />
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (requirement.trim()) {
                    update({
                      requirements: [...state.requirements, requirement.trim()],
                      approved: false,
                    });
                    setRequirement("");
                  }
                }}
              >
                <input
                  aria-label="New requirement"
                  placeholder="Add an acceptance criterion"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                />
                <button className="button quiet" type="submit">
                  <Plus />
                  Add
                </button>
              </form>
            </div>
          ) : (
            <div className="prd-document">
              <h2>Project context</h2>
              {state.context.map((item) => (
                <div className="resource-row" key={item}>
                  <FileText />
                  <span>{item}</span>
                  <span className="tag">Attached</span>
                </div>
              ))}
              <button
                className="button quiet"
                onClick={() => navigate("settings")}
              >
                <Link2 />
                Connect a source
              </button>
            </div>
          )}
        </section>
        <aside className="plan-aside">
          <section>
            <span className="eyebrow">Readiness</span>
            <div className="readiness-number">
              {state.approved ? "Ready" : "In review"}
              <span
                className={`status-dot ${state.approved ? "" : "warning"}`}
              />
            </div>
            <div className="checklist">
              <span>
                <Check />
                Project brief
              </span>
              <span>
                <Check />
                {state.requirements.length} acceptance criteria
              </span>
              <span>
                {state.approved ? <Check /> : <Circle />}Plan approval
              </span>
            </div>
          </section>
          <section>
            <span className="eyebrow">Application structure</span>
            <div className="architecture-stack">
              <div>
                <Globe />
                <span>Interface</span>
                <small>Next.js</small>
              </div>
              <i />
              <div>
                <Bot />
                <span>Intelligence</span>
                <small>{state.framework}</small>
              </div>
              <i />
              <div>
                <Database />
                <span>Data</span>
                <small>{state.tables.length} tables</small>
              </div>
            </div>
          </section>
          <section>
            <span className="eyebrow">Decision</span>
            <h3>One shared workspace</h3>
            <p>
              Requirements, build changes, and release decisions stay linked to
              this project.
            </p>
          </section>
        </aside>
      </div>
      <NextStep
        title="Turn the plan into a first version"
        detail={
          state.approved
            ? "Your approved brief and criteria travel with the build."
            : "You can explore a build while the plan is still in review."
        }
        action="Continue to build"
        onClick={() => navigate("build")}
      />
    </div>
  );
}

export function DataSurface() {
  const { state, update, log, notify, navigate } = useWorkspace();
  const [tab, setTab] = useState("Tables");
  const [selected, setSelected] = useState(state.tables[0]?.name || "");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"table" | "row" | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Open");
  const table = state.tables.find((item) => item.name === selected);
  function save() {
    if (!name.trim()) return;
    if (modal === "table") {
      const normalized = name.trim().toLowerCase().replace(/\W+/g, "_");
      if (state.tables.some((item) => item.name === normalized)) {
        notify("A table with that name already exists");
        return;
      }
      update({ tables: [...state.tables, { name: normalized, rows: [] }] });
      setSelected(normalized);
      log("Table created", normalized, "Data");
    } else
      update({
        tables: state.tables.map((item) =>
          item.name === selected
            ? {
                ...item,
                rows: [
                  ...item.rows,
                  {
                    id: crypto.randomUUID().slice(0, 8),
                    name: name.trim(),
                    status,
                  },
                ],
              }
            : item,
        ),
      });
    setModal(null);
    setName("");
    notify(modal === "table" ? "Table created locally" : "Row saved locally");
  }
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="Resources"
        title="Data & authentication"
        description="Project data, schemas, and access policies"
      >
        <button
          className="button quiet"
          onClick={() =>
            downloadFile(
              "project-data.json",
              JSON.stringify(state.tables, null, 2),
              "application/json",
            )
          }
        >
          <Download />
          Export data
        </button>
        <button
          className="button primary"
          onClick={() => {
            setName("");
            setModal("table");
          }}
        >
          <Plus />
          New table
        </button>
      </SurfaceHeader>
      <div className="service-status">
        <span>
          <Database />
          Local project database
        </span>
        <span className="tag">Prototype data</span>
        <button className="text-button" onClick={() => navigate("settings")}>
          Connect provider
          <ArrowRight />
        </button>
      </div>
      <div className="tab-bar">
        {["Tables", "Authentication", "Policies"].map((item) => (
          <button
            className={tab === item ? "is-active" : ""}
            key={item}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Tables" ? (
        <div className="schema-layout">
          <aside className="table-list">
            <label className="search-field">
              <Search />
              <input
                placeholder="Find a table"
                aria-label="Search tables"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {state.tables
              .filter((item) => item.name.includes(query))
              .map((item) => (
                <button
                  key={item.name}
                  className={selected === item.name ? "is-active" : ""}
                  onClick={() => setSelected(item.name)}
                >
                  <Database />
                  <span>{item.name}</span>
                  <small>{item.rows.length}</small>
                </button>
              ))}
          </aside>
          <section className="schema-detail">
            <div className="section-heading">
              <h2>{table?.name || "Select a table"}</h2>
              <button
                className="button quiet compact"
                disabled={!table}
                onClick={() => {
                  setName("");
                  setModal("row");
                }}
              >
                <Plus />
                Insert row
              </button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {table?.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <code>{row.id}</code>
                      </td>
                      <td>{row.name}</td>
                      <td>
                        <span className="tag">{row.status}</span>
                      </td>
                      <td>
                        <button
                          className="icon-button ghost"
                          aria-label={`Delete ${row.name}`}
                          onClick={() =>
                            update({
                              tables: state.tables.map((item) =>
                                item.name === selected
                                  ? {
                                      ...item,
                                      rows: item.rows.filter(
                                        (value) => value.id !== row.id,
                                      ),
                                    }
                                  : item,
                              ),
                            })
                          }
                        >
                          <Trash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!table?.rows.length && (
                <div className="empty-state">
                  <Database />
                  <h3>No records yet</h3>
                  <p>Insert the first row to start shaping this table.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : tab === "Authentication" ? (
        <section className="settings-section">
          <h2>Sign-in methods</h2>
          <p className="muted">
            Configure the desired methods. Live sign-in requires a connected
            authentication provider.
          </p>
          {["Email", "Google", "GitHub", "Magic link"].map((provider) => (
            <label className="setting-row" key={provider}>
              <span>
                <strong>{provider}</strong>
                <small>
                  {state.authProviders.includes(provider)
                    ? "Enabled in project configuration"
                    : "Disabled"}
                </small>
              </span>
              <input
                type="checkbox"
                checked={state.authProviders.includes(provider)}
                onChange={(e) => {
                  update({
                    authProviders: e.target.checked
                      ? [...state.authProviders, provider]
                      : state.authProviders.filter((item) => item !== provider),
                  });
                  log("Authentication configuration updated", provider, "Data");
                }}
              />
            </label>
          ))}
        </section>
      ) : (
        <section className="settings-section">
          <h2>Access policies</h2>
          <div className="notice">
            <ShieldCheck />
            Server-enforced policies require a connected database. These are the
            planned boundaries.
          </div>
          {[
            "Workspace members can read project records",
            "Editors can create and update records",
            "Only owners can delete records or change access",
          ].map((item) => (
            <div className="resource-row" key={item}>
              <Lock />
              <span>{item}</span>
              <span className="tag">Planned</span>
            </div>
          ))}
        </section>
      )}
      <NextStep
        title="Check your data configuration"
        detail="Validate table names and authentication settings with the project."
        action="Continue to tests"
        onClick={() => navigate("tests")}
      />
      {modal && (
        <Modal
          title={modal === "table" ? "Create table" : `Insert into ${selected}`}
          close={() => setModal(null)}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="field">
              <span>{modal === "table" ? "Table name" : "Name"}</span>
              <input
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {modal === "row" && (
              <label className="field">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option>Open</option>
                  <option>Active</option>
                  <option>Needs review</option>
                  <option>Resolved</option>
                </select>
              </label>
            )}
            <button className="button primary" type="submit">
              Save
              <Check />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function TestsSurface() {
  const { state, update, log, navigate } = useWorkspace();
  const [results, setResults] = useState<
    { label: string; passed: boolean; detail: string }[] | null
  >(null);
  const [filter, setFilter] = useState("All checks");
  const checks = [
    {
      label: "Project brief is present",
      passed: state.brief.trim().length > 0,
      detail: "A non-empty brief is stored with this project.",
    },
    {
      label: "Acceptance criteria are defined",
      passed:
        state.requirements.length > 0 &&
        state.requirements.every((item) => item.trim()),
      detail: "All acceptance-criterion fields contain text.",
    },
    {
      label: "Branch differs from protected base",
      passed: !!state.branch.trim() && state.branch !== state.baseBranch,
      detail: `${state.branch} targets ${state.baseBranch}.`,
    },
    {
      label: "Table names are unique",
      passed:
        new Set(state.tables.map((item) => item.name)).size ===
        state.tables.length,
      detail: `${state.tables.length} distinct table definitions.`,
    },
    {
      label: "Authentication method is configured",
      passed: state.authProviders.length > 0,
      detail:
        state.authProviders.join(", ") ||
        "Enable a sign-in method in Data & auth.",
    },
    {
      label: "Sensitive actions require review",
      passed: state.humanReview,
      detail: "Human-review guardrail is enabled.",
    },
  ].map((item) => ({ ...item, passed: Boolean(item.passed) }));
  const verified = state.verifiedVersion === state.version;
  const shown = (results || (verified ? checks : [])).filter(
    (item) => filter !== "Needs attention" || !item.passed,
  );
  function run() {
    setResults(checks);
    const passed = checks.every((item) => item.passed);
    update({ verifiedVersion: passed ? state.version : 0 });
    log(
      passed
        ? "Configuration checks passed"
        : "Configuration checks need attention",
      `${checks.filter((item) => item.passed).length}/${checks.length} checks, version ${state.version}`,
      "Verification",
    );
  }
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="03 / Verify"
        title="Evidence before confidence."
        description="Project configuration checks"
      >
        <button
          className="button quiet"
          disabled={!results && !verified}
          onClick={() =>
            downloadFile(
              "verification.json",
              JSON.stringify(
                {
                  version: state.version,
                  scope: "Local configuration only",
                  results: results || checks,
                },
                null,
                2,
              ),
              "application/json",
            )
          }
        >
          <Download />
          Export evidence
        </button>
        <button className="button primary" onClick={run}>
          <Play />
          Run all checks
        </button>
      </SurfaceHeader>
      <div className="metric-strip">
        <div>
          <span>Checks</span>
          <strong>06</strong>
          <small>Project configuration</small>
        </div>
        <div>
          <span>Passed</span>
          <strong className="positive">
            {results
              ? results.filter((item) => item.passed).length
              : verified
                ? "06"
                : "--"}
          </strong>
          <small>
            {verified ? `Verified at v${state.version}` : "Ready to run"}
          </small>
        </div>
        <div>
          <span>Browser tests</span>
          <strong>--</strong>
          <small>Runner not connected</small>
        </div>
        <div>
          <span>Agent evaluations</span>
          <strong>--</strong>
          <small>Runtime not connected</small>
        </div>
      </div>
      <div className="verification-layout">
        <section>
          <div className="tab-bar">
            {["All checks", "Needs attention"].map((item) => (
              <button
                key={item}
                className={filter === item ? "is-active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {shown.length ? (
            shown.map((item) => (
              <div className="test-row" key={item.label}>
                <span className={item.passed ? "positive" : "warning-text"}>
                  {item.passed ? <CheckCircle2 /> : <Circle />}
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                </div>
                <span className="tag">{item.passed ? "Passed" : "Review"}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FlaskConical />
              <h2>
                {filter === "Needs attention" && verified
                  ? "No configuration blockers"
                  : "Ready for a check"}
              </h2>
              <p>
                Run the project checks to collect evidence for this version.
              </p>
            </div>
          )}
        </section>
        <aside className="evidence-aside">
          <ShieldCheck />
          <h2>Know what was verified</h2>
          <p>
            These checks inspect the saved configuration. They do not execute
            your repository or validate a generated application.
          </p>
          <div className="resource-row">
            <Code2 />
            <span>Browser / API testing</span>
            <span className="tag">Pending</span>
          </div>
          <button className="text-button" onClick={() => navigate("settings")}>
            Configure integrations
            <ArrowRight />
          </button>
        </aside>
      </div>
      <NextStep
        title={
          verified
            ? "Prepare your change for review"
            : "Resolve checks before review"
        }
        detail="Verification remains attached to this exact version."
        action="Continue to review"
        disabled={!verified}
        onClick={() => navigate("git")}
      />
    </div>
  );
}

export function GitSurface() {
  const { project, state, update, log, notify, navigate } = useWorkspace();
  const [tab, setTab] = useState("Changes");
  const [title, setTitle] = useState(`Update ${project.name}`);
  const ready = state.verifiedVersion === state.version;
  const reviewed = state.reviewVersion === state.version;
  function exportPR() {
    downloadFile(
      "pull-request.md",
      `# ${title}\n\nBase: ${state.baseBranch}\nBranch: ${state.branch}\nVersion: ${state.version}\n\n${state.brief}\n\n## Verification\nLocal configuration checks ${ready ? "passed" : "pending"}. Repository tests have not run.\n`,
    );
    notify("Pull-request draft exported");
  }
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="04 / Review"
        title="Every change, accounted for."
        description="Review the project and prepare a pull request"
      >
        <button className="button quiet" onClick={exportPR}>
          <Download />
          Export PR draft
        </button>
        <button
          className="button primary"
          disabled={!ready || reviewed}
          onClick={() => {
            update({ reviewVersion: state.version });
            log("Change review approved", `Version ${state.version}`, "Review");
            notify("Review approved for this version");
          }}
        >
          <Check />
          {reviewed ? "Review approved" : "Approve review"}
        </button>
      </SurfaceHeader>
      <div className="git-context">
        <span>
          <GitBranch />
          {state.branch}
        </span>
        <ArrowRight />
        <span>{state.baseBranch}</span>
        <span className="tag">Local change set</span>
      </div>
      <div className="review-layout">
        <section>
          <div className="tab-bar">
            {["Changes", "Branch policy"].map((item) => (
              <button
                className={tab === item ? "is-active" : ""}
                key={item}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === "Changes" ? (
            <div className="diff-content">
              <div className="section-heading">
                <span>
                  <FileText size={16} /> project-specification.md
                </span>
                <span className="positive">
                  +{state.requirements.length + 3}
                </span>
              </div>
              <pre>
                <code>
                  <span>
                    + # {project.name}
                    {"\n"}
                  </span>
                  <span>
                    + {state.brief}
                    {"\n"}
                  </span>
                  <span>+ ## Acceptance criteria{"\n"}</span>
                  {state.requirements.map((item, i) => (
                    <span key={i}>
                      + - {item}
                      {"\n"}
                    </span>
                  ))}
                </code>
              </pre>
              <div className="notice">
                This change set contains the local specification. Connect a
                repository to inspect real source diffs and create a GitHub PR.
              </div>
            </div>
          ) : (
            <div className="form-stack settings-section">
              <label className="field">
                <span>Branching strategy</span>
                <select
                  value={state.branchStrategy}
                  onChange={(e) => update({ branchStrategy: e.target.value })}
                >
                  {["GitHub flow", "GitFlow", "Trunk-based", "Custom"].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="field">
                <span>Working branch</span>
                <input
                  value={state.branch}
                  onChange={(e) =>
                    update({
                      branch: e.target.value,
                      verifiedVersion: 0,
                      reviewVersion: 0,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Target branch</span>
                <input
                  value={state.baseBranch}
                  onChange={(e) =>
                    update({
                      baseBranch: e.target.value,
                      verifiedVersion: 0,
                      reviewVersion: 0,
                    })
                  }
                />
              </label>
              <div className="notice">
                <ShieldCheck />
                Changes to branch settings require verification again.
              </div>
            </div>
          )}
        </section>
        <aside className="review-aside">
          <h2>Review readiness</h2>
          <div className="checklist">
            <span>{ready ? <Check /> : <Circle />}Configuration verified</span>
            <span>
              {reviewed ? <Check /> : <Circle />}Change review approved
            </span>
            <span>
              <Circle />
              Repository connection
            </span>
          </div>
          <label className="field">
            <span>Pull-request title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <button className="button quiet wide" onClick={exportPR}>
            <GitPullRequest />
            Prepare pull request
          </button>
          <button className="text-button" onClick={() => navigate("settings")}>
            Connect GitHub
            <ArrowRight />
          </button>
        </aside>
      </div>
      <NextStep
        title="Prepare the release"
        detail="Carry this reviewed version forward with its verification record."
        action="Continue to release"
        disabled={!reviewed}
        onClick={() => navigate("deploy")}
      />
    </div>
  );
}

export function DeploySurface() {
  const { project, state, update, log, notify, navigate } = useWorkspace();
  const [confirm, setConfirm] = useState(false);
  const ready =
    state.verifiedVersion === state.version &&
    state.reviewVersion === state.version;
  const released = state.releasedVersion === state.version;
  function release() {
    localStorage.setItem(
      `kova:release:${project.id}:${state.version}`,
      JSON.stringify({ project, state, createdAt: new Date().toISOString() }),
    );
    update({ releasedVersion: state.version });
    log(
      "Local release snapshot created",
      `${state.environment}, version ${state.version}. No external deployment.`,
      "Release",
    );
    setConfirm(false);
    notify("Release snapshot saved. External deployment is not connected.");
  }
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="05 / Release"
        title="Ready when you are."
        description="A deliberate path from reviewed changes to release"
      >
        <button className="button quiet" onClick={() => navigate("settings")}>
          <Link2 />
          Connect hosting
        </button>
        <button
          className="button primary"
          disabled={!ready || released}
          onClick={() => setConfirm(true)}
        >
          <Rocket />
          {released ? "Snapshot created" : "Prepare release"}
        </button>
      </SurfaceHeader>
      <div className="release-status">
        <span className="release-symbol">
          <Rocket />
        </span>
        <div>
          <span className="eyebrow">
            {released ? "Snapshot saved" : "Release readiness"}
          </span>
          <h2>
            {released
              ? `Version ${state.version} is packaged`
              : ready
                ? "Your reviewed version is ready"
                : "Two checks before release"}
          </h2>
          <p>
            {released
              ? "Your project snapshot is available to export."
              : "Verify the configuration and approve the change review."}
          </p>
        </div>
        <span className="tag">Local prototype</span>
      </div>
      <div className="environment-rail">
        {["Preview", "Staging", "Production"].map((env, i) => (
          <button
            key={env}
            className={`environment-card ${state.environment === env ? "is-active" : ""}`}
            onClick={() => update({ environment: env })}
          >
            <div>
              <span className="number-label">0{i + 1}</span>
              <span>{state.environment === env ? <Check /> : <Circle />}</span>
            </div>
            <h2>{env}</h2>
            <p>
              {env === "Preview"
                ? "Review with your team"
                : env === "Staging"
                  ? "Validate the release candidate"
                  : "Deliver to your users"}
            </p>
            <footer>
              {state.environment === env
                ? "Selected environment"
                : "Select environment"}
              <ArrowRight />
            </footer>
          </button>
        ))}
      </div>
      <div className="release-grid">
        <section>
          <div className="section-heading">
            <h2>Release checklist</h2>
            <ShieldCheck />
          </div>
          {[
            {
              label: "Configuration checks",
              done: state.verifiedVersion === state.version,
              view: "tests" as const,
            },
            {
              label: "Change review",
              done: state.reviewVersion === state.version,
              view: "git" as const,
            },
            {
              label: "Hosting provider",
              done: false,
              view: "settings" as const,
            },
          ].map((item) => (
            <button
              className="checklist-action"
              key={item.label}
              onClick={() => navigate(item.view)}
            >
              {item.done ? <CheckCircle2 className="positive" /> : <Circle />}
              <span>
                {item.label}
                <small>{item.done ? "Complete" : "Needs setup"}</small>
              </span>
              <ArrowRight />
            </button>
          ))}
        </section>
        <section>
          <div className="section-heading">
            <h2>Release details</h2>
            <Globe />
          </div>
          <dl className="details-list">
            <div>
              <dt>Project</dt>
              <dd>{project.name}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>v{state.version}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{state.environment}</dd>
            </div>
            <div>
              <dt>Public URL</dt>
              <dd>Not deployed</dd>
            </div>
          </dl>
          {released && (
            <button
              className="button quiet wide"
              onClick={() =>
                downloadFile(
                  `${project.name}-release-v${state.version}.json`,
                  JSON.stringify(
                    { project, state, scope: "Local prototype snapshot" },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <Download />
              Download release
            </button>
          )}
        </section>
      </div>
      {released && (
        <NextStep
          title="Keep improving"
          detail="Start the next change with this release preserved in your activity history."
          action="Back to build"
          onClick={() => navigate("build")}
        />
      )}
      {confirm && (
        <Modal
          title={`Prepare ${state.environment.toLowerCase()} release`}
          close={() => setConfirm(false)}
        >
          <p>
            Save version {state.version} with its review and verification
            record. This creates a local snapshot; it does not publish an
            external app.
          </p>
          <button className="button primary wide" onClick={release}>
            Create release snapshot
            <Check />
          </button>
        </Modal>
      )}
    </div>
  );
}

export function ActivitySurface() {
  const { state, navigate } = useWorkspace();
  const [filter, setFilter] = useState("All activity");
  const entries = state.activities.filter(
    (entry) => filter === "All activity" || entry.category === filter,
  );
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="Project history"
        title="The story of your build."
        description="Decisions and changes, in one place"
      >
        <button
          className="button quiet"
          onClick={() =>
            downloadFile(
              "activity.json",
              JSON.stringify(state.activities, null, 2),
              "application/json",
            )
          }
        >
          <Download />
          Export history
        </button>
      </SurfaceHeader>
      <div className="tab-bar">
        {["All activity", "Build", "Verification", "Review", "Release"].map(
          (item) => (
            <button
              key={item}
              className={filter === item ? "is-active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <div className="activity-timeline">
        {entries.map((entry) => (
          <article key={entry.id}>
            <span className="timeline-icon">
              <Activity />
            </span>
            <div>
              <span className="eyebrow">{entry.category}</span>
              <h2>{entry.title}</h2>
              <p>{entry.detail}</p>
            </div>
            <time>
              {new Date(entry.time).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </article>
        ))}
      </div>
      {!entries.length && (
        <div className="empty-state">
          <Activity />
          <h2>No activity yet</h2>
          <p>Your saved changes and decisions will appear here.</p>
          <button className="button quiet" onClick={() => navigate("build")}>
            Continue building
            <ArrowRight />
          </button>
        </div>
      )}
    </div>
  );
}

export function SettingsSurface() {
  const { project, state, update, log, notify } = useWorkspace();
  const [tab, setTab] = useState("Integrations");
  const [connection, setConnection] = useState("");
  const [resource, setResource] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Editor");
  const [invite, setInvite] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark",
  );
  const [envName, setEnvName] = useState("");
  const [mockValue, setMockValue] = useState("");
  const [envs, setEnvs] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`kova:mocks:${project.id}`) || "{}",
      );
    } catch {
      return {};
    }
  });
  function saveMock() {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(envName)) {
      notify("Use an uppercase variable name such as API_URL");
      return;
    }
    const next = { ...envs, [envName]: mockValue };
    setEnvs(next);
    localStorage.setItem(`kova:mocks:${project.id}`, JSON.stringify(next));
    setEnvName("");
    setMockValue("");
    notify("Mock variable saved on this device");
  }
  return (
    <div className="surface-page">
      <SurfaceHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Connections, people, and project preferences"
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            { name: "Integrations", icon: Link2 },
            { name: "Models", icon: Bot },
            { name: "Environment", icon: KeyRound },
            { name: "Members", icon: Users },
            { name: "Appearance", icon: Settings },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={tab === name ? "is-active" : ""}
              onClick={() => setTab(name)}
            >
              <Icon />
              {name}
            </button>
          ))}
        </nav>
        <section className="settings-content">
          <h2>{tab}</h2>
          {tab === "Integrations" && (
            <>
              <p className="muted">
                Add resource references to your project. OAuth authorization and
                live synchronization are not connected.
              </p>
              <div className="integration-grid">
                {[
                  "GitHub",
                  "Figma",
                  "Jira",
                  "ClickUp",
                  "Linear",
                  "Supabase",
                  "Vercel",
                  "Custom API",
                ].map((name) => (
                  <article className="integration-item" key={name}>
                    <span className="integration-logo">{name.slice(0, 2)}</span>
                    <div>
                      <h3>{name}</h3>
                      <p>
                        {state.connections.some((item) =>
                          item.startsWith(`${name}:`),
                        )
                          ? "Reference attached"
                          : "Not connected"}
                      </p>
                    </div>
                    <button
                      className="icon-button ghost"
                      aria-label={`Configure ${name}`}
                      onClick={() => {
                        setConnection(name);
                        setResource("");
                      }}
                    >
                      <Plus />
                    </button>
                  </article>
                ))}
              </div>
              {state.connections.map((item) => (
                <div className="resource-row" key={item}>
                  <Link2 />
                  <span>{item}</span>
                  <button
                    className="icon-button ghost"
                    aria-label={`Remove ${item}`}
                    onClick={() =>
                      update({
                        connections: state.connections.filter(
                          (value) => value !== item,
                        ),
                      })
                    }
                  >
                    <X />
                  </button>
                </div>
              ))}
            </>
          )}
          {tab === "Models" && (
            <>
              <p className="muted">
                Choose models in the build composer. OpenRouter requests use a
                server-side key when configured.
              </p>
              <div className="setting-row">
                <span>
                  <strong>Automatic routing</strong>
                  <small>Use the configured server default model</small>
                </span>
                <span className="tag">Default routing</span>
              </div>
              {["OpenRouter", "OpenAI", "Anthropic", "Google"].map((name) => (
                <div className="setting-row" key={name}>
                  <span>
                    <strong>{name}</strong>
                    <small>
                      {name === "OpenRouter"
                        ? "Server environment: OPENROUTER_API_KEY"
                        : "Direct provider integration pending"}
                    </small>
                  </span>
                  <span className="tag">
                    {name === "OpenRouter" ? "Key required" : "Not connected"}
                  </span>
                </div>
              ))}
              <div className="notice">
                <KeyRound />
                Provider keys must be configured on the server. Do not store
                live keys in project notes or mock variables.
              </div>
            </>
          )}
          {tab === "Environment" && (
            <>
              <p className="muted">
                Define mock values for isolated local planning. Real secrets
                need an encrypted server vault.
              </p>
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMock();
                }}
              >
                <label className="field">
                  <span>Variable name</span>
                  <input
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    placeholder="API_URL"
                    required
                  />
                </label>
                <label className="field">
                  <span>Mock value (non-secret)</span>
                  <input
                    value={mockValue}
                    onChange={(e) => setMockValue(e.target.value)}
                    placeholder="https://example.test"
                    required
                  />
                </label>
                <button className="button quiet" type="submit">
                  <Plus />
                  Add mock variable
                </button>
              </form>
              {Object.entries(envs).map(([name, value]) => (
                <div className="resource-row" key={name}>
                  <code>{name}</code>
                  <span>{value}</span>
                  <button
                    className="icon-button ghost"
                    aria-label={`Remove ${name}`}
                    onClick={() => {
                      const next = { ...envs };
                      delete next[name];
                      setEnvs(next);
                      localStorage.setItem(
                        `kova:mocks:${project.id}`,
                        JSON.stringify(next),
                      );
                    }}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </>
          )}
          {tab === "Members" && (
            <>
              <p className="muted">
                Plan workspace roles. Invitations are saved as drafts; no email
                is sent and no access is granted.
              </p>
              <button className="button quiet" onClick={() => setInvite(true)}>
                <Plus />
                Draft invitation
              </button>
              {state.members.map((member) => (
                <div className="setting-row" key={member.email}>
                  <span>
                    <strong>{member.email}</strong>
                    <small>
                      {member.role === "Owner"
                        ? "Project owner"
                        : "Invitation draft"}
                    </small>
                  </span>
                  <span className="tag">{member.role}</span>
                </div>
              ))}
            </>
          )}
          {tab === "Appearance" && (
            <>
              <p className="muted">Choose your workspace appearance.</p>
              <div className="theme-options">
                {["dark", "light"].map((value) => (
                  <button
                    key={value}
                    className={`theme-option ${value} ${theme === value ? "selected" : ""}`}
                    onClick={() => {
                      setTheme(value);
                      document.documentElement.dataset.theme = value;
                      localStorage.setItem("kova:theme:v2", value);
                    }}
                  >
                    <span className="theme-sample">
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>{value === "dark" ? "Graphite" : "Silver"}</strong>
                    {theme === value && <Check />}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      {connection && (
        <Modal
          title={`Add ${connection} reference`}
          close={() => setConnection("")}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const value = `${connection}: ${resource}`;
              update({
                connections: [
                  ...state.connections.filter((item) => item !== value),
                  value,
                ],
                context: [...new Set([...state.context, value])],
              });
              log("Resource reference attached", connection, "Resources");
              setConnection("");
              notify("Reference saved. Live access is not connected.");
            }}
          >
            <label className="field">
              <span>Resource URL</span>
              <input
                type="url"
                required
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <button className="button primary" type="submit">
              Attach reference
              <Link2 />
            </button>
          </form>
        </Modal>
      )}
      {invite && (
        <Modal title="Draft invitation" close={() => setInvite(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (state.members.some((item) => item.email === memberEmail)) {
                notify("This person is already listed");
                return;
              }
              update({
                members: [
                  ...state.members,
                  { email: memberEmail, role: memberRole },
                ],
              });
              setInvite(false);
              notify("Invitation draft saved. No email was sent.");
            }}
          >
            <label className="field">
              <span>Email</span>
              <input
                required
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
              >
                <option>Editor</option>
                <option>Reviewer</option>
                <option>Viewer</option>
              </select>
            </label>
            <button className="button primary" type="submit">
              Save invitation draft
              <Check />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
