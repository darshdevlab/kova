"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  ArrowRight,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  FolderGit2,
  GitFork,
  Grid2X2,
  LayoutTemplate,
  ListFilter,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { clearSession, readProjects, readSession, writeProjects } from "@/lib/storage";
import type { KovaProject, KovaSession } from "@/lib/types";

type CreateSource = "prompt" | "github" | "work" | "template";

const CREATE_OPTIONS: Array<{
  id: CreateSource;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  { id: "prompt", label: "Describe an idea", description: "Plan and build from a plain-language brief.", icon: Sparkles },
  { id: "github", label: "Import repository", description: "Understand an existing codebase and continue safely.", icon: GitFork },
  { id: "work", label: "Import requirement", description: "Start from Jira, ClickUp, Linear, Docs or a PRD.", icon: FileText },
  { id: "template", label: "Use a template", description: "Clone a verified app, agent or workflow.", icon: LayoutTemplate },
];

function ProjectVisual({ accent }: { accent: KovaProject["accent"] }) {
  return (
    <div className={`project-visual ${accent}`} aria-hidden="true">
      <div className="project-visual-bar"><i /><span /><span /></div>
      <div className="project-visual-body">
        <div className="project-visual-nav"><span /><span /><span /><span /></div>
        <div className="project-visual-main">
          <div className="project-visual-metrics"><i /><i /><i /></div>
          <div className="project-visual-chart"><span /><span /><span /><span /><span /><span /></div>
          <div className="project-visual-rows"><i /><i /><i /></div>
        </div>
      </div>
    </div>
  );
}

export function ProjectHub() {
  const router = useRouter();
  const [projects, setProjects] = useState<KovaProject[]>([]);
  const [session, setSession] = useState<KovaSession | null>(null);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [source, setSource] = useState<CreateSource>("prompt");
  const [brief, setBrief] = useState("Build an operations workspace with AI-assisted triage and analytics.");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProjects(readProjects());
      setSession(readSession());
      const saved = window.localStorage.getItem("kova:theme") === "dark" ? "dark" : "light";
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () => projects.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("kova:theme", next);
  }

  function createProject() {
    const name =
      source === "github"
        ? "Imported service workspace"
        : source === "work"
          ? "Customer onboarding refresh"
          : source === "template"
            ? "Agent operations starter"
            : "New product workspace";
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
    const project: KovaProject = {
      id,
      name,
      description: brief || "A new Kova project.",
      status: "Draft",
      updatedAt: "Just now",
      source: source === "github" ? "GitHub" : source === "work" ? "Work item" : source === "template" ? "Template" : "Prompt",
      mode: source === "github" ? "Developer" : "Guided",
      accent: source === "github" ? "blue" : "ember",
      progress: 18,
    };
    const next = [project, ...projects];
    setProjects(next);
    writeProjects(next);
    router.push(`/workspace/${id}`);
  }

  function signOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="app-page">
      <header className="product-topbar">
        <BrandMark />
        <nav className="topbar-nav" aria-label="Workspace">
          <a className="is-active" href="#projects">Projects</a>
          <a href="#templates">Templates</a>
          <a href="#activity">Activity</a>
        </nav>
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Notifications" title="Notifications"><Bell aria-hidden="true" /><span className="notification-dot" /></button>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">{theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button>
          <button className="profile-button" type="button" title={session?.email ?? "Demo user"}><span>D</span><ChevronDown aria-hidden="true" /></button>
        </div>
      </header>

      <aside className="hub-sidebar" aria-label="Project navigation">
        <button className="sidebar-action" type="button" onClick={() => setShowCreate(true)}><Plus aria-hidden="true" />New project</button>
        <nav>
          <a className="is-active" href="#projects"><Grid2X2 aria-hidden="true" />All projects<span>{projects.length}</span></a>
          <a href="#recent"><Clock3 aria-hidden="true" />Recent</a>
          <a href="#shared"><Boxes aria-hidden="true" />Shared with me</a>
          <a href="#archived"><Archive aria-hidden="true" />Archived</a>
        </nav>
        <div className="sidebar-section-label">Workspace</div>
        <nav>
          <a href="#activity"><Activity aria-hidden="true" />Activity</a>
          <a href="#settings"><Settings aria-hidden="true" />Settings</a>
        </nav>
        <div className="hub-sidebar-bottom">
          <div className="workspace-usage"><div><span>Build credits</span><strong>72%</strong></div><i><span /></i><small>18,240 remaining</small></div>
          <button className="sidebar-signout" type="button" onClick={signOut}><LogOut aria-hidden="true" />Sign out</button>
        </div>
      </aside>

      <main className="hub-main" id="projects">
        <div className="hub-heading">
          <div><span className="eyebrow">Darsh&apos;s workspace</span><h1>Projects</h1><p>Continue a build or start from an idea, requirement or repository.</p></div>
          <button className="button primary" type="button" onClick={() => setShowCreate(true)}><Plus aria-hidden="true" />New project</button>
        </div>

        <div className="project-toolbar">
          <label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /></label>
          <button className="button quiet" type="button"><ListFilter aria-hidden="true" />All types<ChevronDown aria-hidden="true" /></button>
          <span className="toolbar-count">{filtered.length} projects</span>
        </div>

        <section className="project-grid" aria-label="Projects">
          <button className="new-project-card" type="button" onClick={() => setShowCreate(true)}>
            <span><Plus aria-hidden="true" /></span><strong>Create a project</strong><small>Prompt, import or clone</small>
          </button>
          {filtered.map((project) => (
            <article className="project-card" key={project.id}>
              <button type="button" className="project-open" onClick={() => router.push(`/workspace/${project.id}`)} aria-label={`Open ${project.name}`}>
                <ProjectVisual accent={project.accent} />
              </button>
              <div className="project-card-body">
                <div className="project-card-title"><div><h2>{project.name}</h2><span className={`status-badge ${project.status.toLowerCase()}`}><i />{project.status}</span></div><button className="icon-button ghost" type="button" aria-label={`More actions for ${project.name}`}>•••</button></div>
                <p>{project.description}</p>
                <div className="project-meta"><span>{project.source}</span><span>{project.mode}</span><time>{project.updatedAt}</time></div>
              </div>
            </article>
          ))}
        </section>

        <section className="activity-strip" id="activity">
          <div className="activity-strip-heading"><div><span className="eyebrow">Live workspace</span><h2>Needs your attention</h2></div><button className="button quiet" type="button">View activity<ArrowRight aria-hidden="true" /></button></div>
          <div className="attention-list">
            <div><span className="attention-icon warning"><FileText aria-hidden="true" /></span><p><strong>Approve checkout acceptance criteria</strong><small>Checkout analytics · Product gate</small></p><button type="button">Review</button></div>
            <div><span className="attention-icon agent"><Sparkles aria-hidden="true" /></span><p><strong>Triage evaluation reached 94%</strong><small>RelayDesk · 2 cases need review</small></p><button type="button">Inspect</button></div>
            <div><span className="attention-icon success"><Check aria-hidden="true" /></span><p><strong>Production deployment completed</strong><small>Policy answer agent · 18 min ago</small></p><button type="button">Open</button></div>
          </div>
        </section>
      </main>

      {showCreate ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowCreate(false); }}>
          <section className="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <div className="dialog-header"><div><span className="eyebrow">Start a project</span><h2 id="create-title">What are you bringing to Kova?</h2></div><button className="icon-button" type="button" onClick={() => setShowCreate(false)} aria-label="Close dialog"><X aria-hidden="true" /></button></div>
            <div className="create-options">
              {CREATE_OPTIONS.map((option) => {
                const Icon = option.icon;
                return <button type="button" key={option.id} className={source === option.id ? "is-selected" : ""} onClick={() => setSource(option.id)}><span><Icon aria-hidden="true" /></span><strong>{option.label}</strong><small>{option.description}</small>{source === option.id ? <Check className="option-check" aria-hidden="true" /> : null}</button>;
              })}
            </div>
            {source === "github" ? (
              <div className="connection-preview"><GitFork aria-hidden="true" /><div><strong>GitHub connection ready</strong><p>Select a repository after project creation. Kova will inspect its framework, commands and branch policy before changing code.</p></div><span>Connected</span></div>
            ) : (
              <label className="field create-brief"><span>{source === "work" ? "Requirement or PRD" : source === "template" ? "Template goal" : "What should Kova build?"}</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={4} /></label>
            )}
            <div className="dialog-footer"><span><FolderGit2 aria-hidden="true" />Private workspace</span><div><button className="button quiet" type="button" onClick={() => setShowCreate(false)}>Cancel</button><button className="button primary" type="button" onClick={createProject}>Create project<ArrowRight aria-hidden="true" /></button></div></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
