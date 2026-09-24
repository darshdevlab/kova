"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  Braces,
  ChevronLeft,
  CloudUpload,
  Command,
  Database,
  FileText,
  FlaskConical,
  GitPullRequest,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Settings,
  Share2,
  Sparkles,
  Workflow,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { readProjects, writeProjects } from "@/lib/storage";
import type { KovaProject, WorkspaceView } from "@/lib/types";
import { BuildWorkspace } from "@/components/workspace/build-workspace";
import {
  ActivitySurface,
  AgentsSurface,
  DataSurface,
  DeploySurface,
  GitSurface,
  PlanSurface,
  SettingsSurface,
  TestsSurface,
} from "@/components/workspace/workspace-views";

type WorkspaceShellProps = { projectId: string };

const NAV_ITEMS: Array<{ id: WorkspaceView; label: string; icon: typeof Sparkles; group: string }> = [
  { id: "build", label: "Build", icon: Sparkles, group: "Create" },
  { id: "plan", label: "Plan", icon: FileText, group: "Create" },
  { id: "agents", label: "Agents", icon: Workflow, group: "Product" },
  { id: "data", label: "Data & auth", icon: Database, group: "Product" },
  { id: "tests", label: "Tests", icon: FlaskConical, group: "Verify" },
  { id: "git", label: "Git & PR", icon: GitPullRequest, group: "Ship" },
  { id: "deploy", label: "Deploy", icon: Rocket, group: "Ship" },
  { id: "activity", label: "Activity", icon: Activity, group: "Manage" },
  { id: "settings", label: "Settings", icon: Settings, group: "Manage" },
];

export function WorkspaceShell({ projectId }: WorkspaceShellProps) {
  const router = useRouter();
  const [project, setProject] = useState<KovaProject | null>(null);
  const [view, setView] = useState<WorkspaceView>("build");
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const projects = readProjects();
      setProject(
        projects.find((item) => item.id === projectId) ?? {
          id: projectId,
          name: "New product workspace",
          description: "A new application being shaped in Kova.",
          status: "Draft",
          updatedAt: "Just now",
          source: "Prompt",
          mode: "Guided",
          accent: "ember",
          progress: 18,
        },
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [projectId]);

  const groups = useMemo(
    () => [...new Set(NAV_ITEMS.map((item) => item.group))],
    [],
  );

  function changeMode(mode: "Guided" | "Developer") {
    if (!project) return;
    const updated = { ...project, mode };
    setProject(updated);
    const all = readProjects();
    writeProjects(all.some((item) => item.id === project.id) ? all.map((item) => (item.id === project.id ? updated : item)) : [updated, ...all]);
  }

  function renderView() {
    if (!project) return <div className="workspace-loading">Loading workspace…</div>;
    switch (view) {
      case "build": return <BuildWorkspace project={project} />;
      case "plan": return <PlanSurface />;
      case "agents": return <AgentsSurface />;
      case "data": return <DataSurface />;
      case "tests": return <TestsSurface />;
      case "git": return <GitSurface />;
      case "deploy": return <DeploySurface />;
      case "activity": return <ActivitySurface />;
      case "settings": return <SettingsSurface />;
    }
  }

  return (
    <div className={`workspace-shell ${collapsed ? "is-collapsed" : ""}`}>
      <header className="workspace-topbar">
        <div className="workspace-brand">
          <BrandMark compact={collapsed} />
          <button className="icon-button ghost" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"}>
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
        </div>
        <div className="workspace-project-title">
          <button type="button" onClick={() => router.push("/projects")} aria-label="Back to projects"><ChevronLeft aria-hidden="true" /></button>
          <div><strong>{project?.name ?? "Kova project"}</strong><span><i />Saved</span></div>
        </div>
        <div className="workspace-top-actions">
          <div className="mode-segment" role="group" aria-label="Workspace depth">
            <button type="button" className={project?.mode === "Guided" ? "is-active" : ""} onClick={() => changeMode("Guided")}>Guided</button>
            <button type="button" className={project?.mode === "Developer" ? "is-active" : ""} onClick={() => changeMode("Developer")}>Developer</button>
          </div>
          <button className="command-trigger" type="button"><Command aria-hidden="true" /><span>Search or command</span><kbd>⌘ K</kbd></button>
          <button className="icon-button" type="button" aria-label="Share project" title="Share project"><Share2 aria-hidden="true" /></button>
          <button className="button primary compact" type="button" onClick={() => setView("deploy")}><CloudUpload aria-hidden="true" />Deploy</button>
        </div>
      </header>

      <aside className="workspace-sidebar" aria-label="Project sections">
        {groups.map((group) => (
          <div className="workspace-nav-group" key={group}>
            <span className="workspace-nav-label">{group}</span>
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              return (
                <button type="button" key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => setView(item.id)} title={collapsed ? item.label : undefined}>
                  <Icon aria-hidden="true" /><span>{item.label}</span>
                  {item.id === "tests" ? <small>34</small> : null}
                  {item.id === "deploy" ? <i /> : null}
                </button>
              );
            })}
          </div>
        ))}
        <div className="workspace-sidebar-footer">
          <Bot aria-hidden="true" /><span><strong>Kova runtime</strong><small>All systems ready</small></span><i />
        </div>
      </aside>

      <main className="workspace-main">{renderView()}</main>

      <nav className="mobile-workspace-nav" aria-label="Mobile project sections">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return <button type="button" key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => setView(item.id)}><Icon aria-hidden="true" /><span>{item.label}</span></button>;
        })}
        <button type="button" onClick={() => setShowMobileMenu((value) => !value)} className={NAV_ITEMS.slice(5).some((item) => item.id === view) ? "is-active" : ""} aria-expanded={showMobileMenu}><Braces aria-hidden="true" /><span>More</span></button>
      </nav>

      {showMobileMenu ? (
        <div className="mobile-more-menu" role="dialog" aria-label="More project sections">
          <button className="mobile-menu-backdrop" type="button" onClick={() => setShowMobileMenu(false)} aria-label="Close project menu" />
          <section>
            <header><strong>Project tools</strong><MoreHorizontal aria-hidden="true" /></header>
            {NAV_ITEMS.slice(5).map((item) => {
              const Icon = item.icon;
              return <button type="button" key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => { setView(item.id); setShowMobileMenu(false); }}><Icon aria-hidden="true" /><span>{item.label}</span></button>;
            })}
          </section>
        </div>
      ) : null}
    </div>
  );
}
