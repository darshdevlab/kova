"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  Database,
  FileText,
  FlaskConical,
  GitPullRequest,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Search,
  Settings,
  Share2,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Modal } from "@/components/ui";
import { readProjects, writeProjects } from "@/lib/storage";
import {
  downloadFile,
  initialWorkspace,
  WorkspaceContext,
  type WorkspaceState,
} from "@/lib/workspace-state";
import type { KovaProject, WorkspaceView } from "@/lib/types";
import { BuildWorkspace } from "./build-workspace";
import {
  ActivitySurface,
  AgentsSurface,
  DataSurface,
  DeploySurface,
  GitSurface,
  PlanSurface,
  SettingsSurface,
  TestsSurface,
} from "./workspace-views";

const ITEMS: {
  id: WorkspaceView;
  label: string;
  icon: typeof Sparkles;
  group: string;
}[] = [
  { id: "build", label: "Build", icon: Box, group: "Workspace" },
  { id: "plan", label: "Plan", icon: FileText, group: "Workspace" },
  { id: "agents", label: "Agents", icon: Workflow, group: "Resources" },
  { id: "data", label: "Data & auth", icon: Database, group: "Resources" },
  { id: "tests", label: "Tests", icon: FlaskConical, group: "Delivery" },
  { id: "git", label: "Git & PR", icon: GitPullRequest, group: "Delivery" },
  { id: "deploy", label: "Deploy", icon: Rocket, group: "Delivery" },
  { id: "activity", label: "Activity", icon: Activity, group: "Manage" },
  { id: "settings", label: "Settings", icon: Settings, group: "Manage" },
];
const STEPS: WorkspaceView[] = ["plan", "build", "tests", "git", "deploy"];
const LABELS = ["Define", "Build", "Verify", "Review", "Release"];

export function WorkspaceShell({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<KovaProject | null>(null);
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [view, setView] = useState<WorkspaceView>("build");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [command, setCommand] = useState(false);
  const [search, setSearch] = useState("");
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      const found = readProjects().find((item) => item.id === projectId);
      if (!found) {
        router.replace("/projects");
        return;
      }
      setProject(found);
      let saved = initialWorkspace(found);
      try {
        const raw = localStorage.getItem(`kova:workspace:v2:${projectId}`);
        if (raw) saved = { ...saved, ...JSON.parse(raw) };
      } catch {
        /* Keep the initial project if a saved draft is malformed. */
      }
      setState(saved);
      const requested = new URLSearchParams(location.search).get("view");
      if (ITEMS.some((item) => item.id === requested))
        setView(requested as WorkspaceView);
      document.documentElement.dataset.theme =
        localStorage.getItem("kova:theme:v2") || "dark";
    }, 0);
    return () => clearTimeout(timer);
  }, [projectId, router]);
  useEffect(() => {
    if (state)
      localStorage.setItem(
        `kova:workspace:v2:${projectId}`,
        JSON.stringify(state),
      );
  }, [state, projectId]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setCommand((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(toastTimer.current);
    };
  }, []);
  const update = useCallback(
    (patch: Partial<WorkspaceState>) =>
      setState((current) => {
        if (!current) return current;
        const affectsVerification = [
          "brief",
          "requirements",
          "branch",
          "baseBranch",
          "tables",
          "authProviders",
          "humanReview",
          "sourceCode",
          "instructions",
          "framework",
          "citations",
        ].some((key) => key in patch);
        return {
          ...current,
          ...(affectsVerification
            ? { verifiedVersion: 0, reviewVersion: 0, releasedVersion: 0 }
            : {}),
          ...patch,
        };
      }),
    [],
  );
  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  const log = useCallback(
    (title: string, detail = "", category = "Project") =>
      setState((current) =>
        current
          ? {
              ...current,
              activities: [
                {
                  id: crypto.randomUUID(),
                  title,
                  detail,
                  category,
                  time: new Date().toISOString(),
                },
                ...current.activities,
              ].slice(0, 100),
            }
          : current,
      ),
    [],
  );
  const navigate = useCallback((next: WorkspaceView) => {
    setView(next);
    setMobileMenu(false);
    history.replaceState(null, "", `?view=${next}`);
  }, []);
  function changeMode(mode: "Guided" | "Developer") {
    if (!project) return;
    setProject({ ...project, mode });
    writeProjects(
      readProjects().map((item) =>
        item.id === project.id ? { ...item, mode } : item,
      ),
    );
  }
  if (!project || !state)
    return (
      <div className="workspace-loading">
        <BrandMark />
        <span>Opening workspace...</span>
      </div>
    );
  const completed = [
    state.approved,
    state.version > 1,
    state.verifiedVersion === state.version,
    state.reviewVersion === state.version,
    state.releasedVersion === state.version,
  ];
  const renderView = () => {
    switch (view) {
      case "build":
        return <BuildWorkspace project={project} />;
      case "plan":
        return <PlanSurface />;
      case "agents":
        return <AgentsSurface />;
      case "data":
        return <DataSurface />;
      case "tests":
        return <TestsSurface />;
      case "git":
        return <GitSurface />;
      case "deploy":
        return <DeploySurface />;
      case "activity":
        return <ActivitySurface />;
      case "settings":
        return <SettingsSurface />;
    }
  };
  return (
    <WorkspaceContext.Provider
      value={{ project, state, update, log, navigate, notify }}
    >
      <div className={`workspace-shell ${collapsed ? "is-collapsed" : ""}`}>
        <header className="workspace-topbar">
          <div className="workspace-brand">
            <BrandMark compact={collapsed} />
            <button
              className="icon-button ghost"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={
                collapsed ? "Expand navigation" : "Collapse navigation"
              }
              title="Toggle navigation"
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </button>
          </div>
          <div className="workspace-project-title">
            <button
              className="icon-button ghost"
              onClick={() => router.push("/projects")}
              aria-label="Back to projects"
              title="All projects"
            >
              <ArrowLeft />
            </button>
            <span className="project-monogram">{project.name.slice(0, 1)}</span>
            <strong>{project.name}</strong>
            <span className="tag">Private</span>
          </div>
          <div className="workspace-top-actions">
            <div className="mode-segment" aria-label="Workspace depth">
              {(["Guided", "Developer"] as const).map((mode) => (
                <button
                  key={mode}
                  className={project.mode === mode ? "is-active" : ""}
                  onClick={() => changeMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              className="icon-button ghost"
              onClick={() => setCommand(true)}
              aria-label="Search or command"
              title="Search commands"
            >
              <Search />
            </button>
            <button
              className="icon-button ghost"
              onClick={() => setShare(true)}
              aria-label="Share project"
              title="Share project"
            >
              <Share2 />
            </button>
            <button
              className="button primary compact"
              onClick={() => navigate("deploy")}
            >
              Publish
              <ArrowRight />
            </button>
          </div>
        </header>
        <aside className="workspace-sidebar" aria-label="Project sections">
          <button
            className="workspace-switch"
            onClick={() => router.push("/projects")}
          >
            <span className="avatar">D</span>
            <span>
              Personal workspace<small>Local prototype</small>
            </span>
            <ChevronDown />
          </button>
          {["Workspace", "Resources", "Delivery", "Manage"].map((group) => (
            <div className="workspace-nav-group" key={group}>
              <span className="workspace-nav-label">{group}</span>
              {ITEMS.filter((item) => item.group === group).map(
                ({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={view === id ? "is-active" : ""}
                    onClick={() => navigate(id)}
                    title={label}
                  >
                    <Icon />
                    <span>{label}</span>
                    {id === "tests" &&
                      state.verifiedVersion === state.version && (
                        <Check className="nav-check" />
                      )}
                  </button>
                ),
              )}
            </div>
          ))}
          <div className="workspace-sidebar-footer">
            <span className="status-dot" />
            <span>
              All changes saved<small>On this device</small>
            </span>
          </div>
        </aside>
        <div className="journey-rail" aria-label="Project lifecycle">
          {STEPS.map((step, i) => (
            <button
              key={step}
              onClick={() => navigate(step)}
              className={`${view === step ? "is-active" : ""} ${completed[i] ? "is-complete" : ""}`}
            >
              <span>
                {completed[i] ? <Check /> : String(i + 1).padStart(2, "0")}
              </span>
              <strong>{LABELS[i]}</strong>
              {i < 4 && <div className="journey-connector" />}
            </button>
          ))}
          <span className="journey-version">
            v{state.version} <i />{" "}
            {project.mode === "Guided" ? "Guided workspace" : state.branch}
          </span>
        </div>
        <main className={`workspace-main view-${view}`} key={view}>
          {renderView()}
        </main>
        <nav
          className="mobile-workspace-nav"
          aria-label="Mobile project sections"
        >
          {ITEMS.filter((item) =>
            ["build", "agents", "tests"].includes(item.id),
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "is-active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
          <button onClick={() => setMobileMenu(true)}>
            <Menu />
            <span>More</span>
          </button>
        </nav>
        {mobileMenu && (
          <Modal title="Project sections" close={() => setMobileMenu(false)}>
            <div className="command-results">
              {ITEMS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => navigate(id)}>
                  <Icon />
                  {label}
                  <ArrowRight />
                </button>
              ))}
            </div>
          </Modal>
        )}
        {command && (
          <Modal title="Go anywhere" close={() => setCommand(false)}>
            <label className="search-field wide">
              <Search />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project tools"
                aria-label="Search commands"
              />
            </label>
            <div className="command-results">
              {ITEMS.filter((item) =>
                item.label.toLowerCase().includes(search.toLowerCase()),
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    navigate(id);
                    setCommand(false);
                  }}
                >
                  <Icon />
                  {label}
                  <ArrowRight />
                </button>
              ))}
            </div>
          </Modal>
        )}
        {share && (
          <Modal title="Share workspace" close={() => setShare(false)}>
            <p className="muted">
              This project is stored on this device. Export a snapshot to share
              its brief, configuration, and review history.
            </p>
            <button
              className="button primary wide"
              onClick={() => {
                downloadFile(
                  `${project.name}-workspace.json`,
                  JSON.stringify({ project, state }, null, 2),
                  "application/json",
                );
                notify("Workspace snapshot exported");
              }}
            >
              Export workspace
              <ArrowRight />
            </button>
          </Modal>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check />
            <span>{toast}</span>
            <button
              onClick={() => setToast("")}
              aria-label="Dismiss notification"
            >
              <X />
            </button>
          </div>
        )}
      </div>
    </WorkspaceContext.Provider>
  );
}
