"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Archive,
  ArrowRight,
  Box,
  Check,
  FileText,
  GitBranch,
  LayoutTemplate,
  LogOut,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { Modal } from "./ui";
import { ThemePicker } from "./theme-picker";
import { clearSession, readProjects, writeProjects } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { initialWorkspace } from "@/lib/workspace-state";
import type { KovaProject } from "@/lib/types";

const OPTIONS = [
  {
    id: "Prompt",
    title: "Start with an idea",
    detail: "Describe the product you have in mind.",
    icon: Sparkles,
  },
  {
    id: "GitHub",
    title: "Bring a repository",
    detail: "Plan changes to an existing codebase.",
    icon: GitBranch,
  },
  {
    id: "Work item",
    title: "Import a requirement",
    detail: "Attach a PRD, design, or work item.",
    icon: FileText,
  },
  {
    id: "Template",
    title: "Use a starting point",
    detail: "Begin with an app or agent template.",
    icon: LayoutTemplate,
  },
] as const;

export function ProjectHub() {
  const router = useRouter();
  const [projects, setProjects] = useState<KovaProject[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All sources");
  const [section, setSection] = useState("Projects");
  const [archived, setArchived] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [source, setSource] = useState<KovaProject["source"]>("Prompt");
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [url, setUrl] = useState("");
  const [showTheme, setShowTheme] = useState(false);
  const [actions, setActions] = useState<KovaProject | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects(readProjects());
      try {
        setArchived(JSON.parse(localStorage.getItem("kova:archived") || "[]"));
      } catch {
        setArchived([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          `${project.name} ${project.description}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === "All sources" || project.source === filter) &&
          (section === "Archived"
            ? archived.includes(project.id)
            : !archived.includes(project.id)),
      ),
    [projects, query, filter, archived, section],
  );
  function createProject() {
    const title = name.trim();
    if (!title || !brief.trim()) return;
    const project: KovaProject = {
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`,
      name: title,
      description: brief.trim(),
      status: "Draft",
      updatedAt: "Just now",
      source,
      mode: source === "GitHub" ? "Developer" : "Guided",
      accent: "green",
      progress: 0,
    };
    writeProjects([project, ...projects]);
    const state = initialWorkspace(project);
    if (url) {
      state.context.push(`${source}: ${url}`);
      state.connections.push(`${source}: ${url}`);
    }
    localStorage.setItem(
      `kova:workspace:v2:${project.id}`,
      JSON.stringify(state),
    );
    router.push(`/workspace/${project.id}?view=plan`);
  }
  function toggleArchive(project: KovaProject) {
    const next = archived.includes(project.id)
      ? archived.filter((id) => id !== project.id)
      : [...archived, project.id];
    setArchived(next);
    localStorage.setItem("kova:archived", JSON.stringify(next));
    setActions(null);
  }
  return (
    <div className="app-page">
      <header className="product-topbar">
        <BrandMark />
        <nav className="topbar-nav" aria-label="Workspace">
          {["Projects", "Templates", "Archived"].map((item) => (
            <button
              key={item}
              className={section === item ? "is-active" : ""}
              onClick={() => setSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <span className="tag">Personal workspace</span>
          <button
            className="icon-button ghost"
            title="Choose color theme"
            aria-label="Choose color theme"
            onClick={() => setShowTheme(true)}
          >
            <Palette />
          </button>
          <button
            className="icon-button ghost"
            title="Sign out"
            aria-label="Sign out"
            onClick={async () => {
              const client = getSupabaseBrowserClient();
              if (client) {
                const { error } = await client.auth.signOut();
                if (error) return;
              }
              clearSession();
              router.push("/");
            }}
          >
            <LogOut />
          </button>
          <span className="avatar">D</span>
        </div>
      </header>
      <main className="hub-main">
        <div className="hub-heading">
          <div>
            <span className="eyebrow">Your workspace</span>
            <h1>
              {section === "Templates"
                ? "A head start on your next idea."
                : section === "Archived"
                  ? "Archived projects"
                  : "Make something that matters."}
            </h1>
            <p>
              {section === "Templates"
                ? "Choose a starting point and make it yours."
                : "Your ideas, builds, and next steps. All here."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => {
              setShowCreate(true);
              setSource("Prompt");
            }}
          >
            <Plus />
            New project
          </button>
        </div>
        {section === "Templates" ? (
          <>
            <div className="hub-notice">
              <LayoutTemplate />
              Local starting points
            </div>
            <div className="project-grid">
              {[
                {
                  title: "Support operations",
                  brief:
                    "A support workspace with ticket triage, customers, knowledge, and an AI assistant.",
                },
                {
                  title: "Internal knowledge agent",
                  brief:
                    "An internal assistant that answers from approved documents with citations and human review.",
                },
                {
                  title: "Customer onboarding",
                  brief:
                    "A customer onboarding portal with progress tracking, tasks, and team approvals.",
                },
              ].map((item) => (
                <article className="project-card" key={item.title}>
                  <div className="project-card-body">
                    <Box className="positive" />
                    <h2>{item.title}</h2>
                    <p>{item.brief}</p>
                    <button
                      className="button quiet"
                      onClick={() => {
                        setSource("Template");
                        setName(item.title);
                        setBrief(item.brief);
                        setShowCreate(true);
                      }}
                    >
                      Use template
                      <ArrowRight />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="project-toolbar">
              <label className="search-field">
                <Search />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects"
                  aria-label="Search projects"
                />
              </label>
              <select
                aria-label="Filter projects"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All sources</option>
                {OPTIONS.map((option) => (
                  <option key={option.id}>{option.id}</option>
                ))}
              </select>
              <span className="toolbar-count">{filtered.length} projects</span>
            </div>
            <section className="project-grid" aria-label="Projects">
              {filtered.map((project, index) => (
                <article className="project-card" key={project.id}>
                  <button
                    className="project-open"
                    onClick={() => router.push(`/workspace/${project.id}`)}
                    aria-label={`Open ${project.name}`}
                  >
                    <Image
                      src={`/previews/${index % 2 === 0 ? "application" : "workflow"}.png`}
                      width={720}
                      height={420}
                      alt={`${project.name} sample workspace preview`}
                      unoptimized
                    />
                  </button>
                  <div className="project-card-body">
                    <div className="project-card-title">
                      <h2>{project.name}</h2>
                      <button
                        className="icon-button ghost"
                        aria-label={`Actions for ${project.name}`}
                        onClick={() => setActions(project)}
                      >
                        <MoreHorizontal />
                      </button>
                    </div>
                    <p>{project.description}</p>
                    <div className="project-meta">
                      <span>{project.source}</span>
                      <span
                        className={`status-badge ${project.status.toLowerCase()}`}
                      >
                        <i />
                        {project.status}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
              {!filtered.length && (
                <div className="empty-state project-empty">
                  <Search />
                  <h2>No projects here</h2>
                  <p>
                    {section === "Archived"
                      ? "Archived projects can be restored from this view."
                      : "Try another search or start a new project."}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
        <section className="activity-strip">
          <div className="activity-strip-heading">
            <div>
              <span className="eyebrow">Keep moving</span>
              <h2>Your next steps</h2>
            </div>
            <span className="tag">Project shortcuts</span>
          </div>
          <div className="attention-list">
            {projects.slice(0, 3).map((project, index) => (
              <button
                key={project.id}
                onClick={() =>
                  router.push(
                    `/workspace/${project.id}?view=${index === 0 ? "plan" : index === 1 ? "git" : "agents"}`,
                  )
                }
              >
                <span className="resource-icon">
                  {index === 0 ? (
                    <FileText />
                  ) : index === 1 ? (
                    <GitBranch />
                  ) : (
                    <Sparkles />
                  )}
                </span>
                <div>
                  <strong>
                    {index === 0
                      ? "Review the product brief"
                      : index === 1
                        ? "Configure your branch policy"
                        : "Shape the agent workflow"}
                  </strong>
                  <small>{project.name}</small>
                </div>
                <ArrowRight />
              </button>
            ))}
          </div>
        </section>
      </main>
      {showTheme && (
        <Modal title="Color theme" close={() => setShowTheme(false)}>
          <ThemePicker />
        </Modal>
      )}
      {showCreate && (
        <Modal
          title="Where would you like to start?"
          close={() => setShowCreate(false)}
        >
          <div className="create-options">
            {OPTIONS.map(({ id, title, detail, icon: Icon }) => (
              <button
                key={id}
                className={source === id ? "is-selected" : ""}
                onClick={() => setSource(id)}
              >
                <Icon />
                <strong>{title}</strong>
                <small>{detail}</small>
              </button>
            ))}
          </div>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              createProject();
            }}
          >
            <label className="field">
              <span>Project name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="Your next big idea"
              />
            </label>
            {(source === "GitHub" || source === "Work item") && (
              <label className="field">
                <span>
                  {source === "GitHub"
                    ? "Repository URL (reference)"
                    : "Requirement or design URL"}
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://..."
                />
              </label>
            )}
            <label className="field">
              <span>What are we building?</span>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                required
                rows={3}
                placeholder="Who is it for, and what should it do?"
              />
            </label>
            {source === "GitHub" && (
              <p className="muted">
                <small>
                  The URL is saved as project context. Repository cloning needs
                  a connected execution service.
                </small>
              </p>
            )}
            <button className="button primary wide" type="submit">
              Create project & plan
              <ArrowRight />
            </button>
          </form>
        </Modal>
      )}
      {actions && (
        <Modal title={actions.name} close={() => setActions(null)}>
          <div className="command-results">
            <button onClick={() => router.push(`/workspace/${actions.id}`)}>
              <Box />
              Open workspace
              <ArrowRight />
            </button>
            <button onClick={() => toggleArchive(actions)}>
              <Archive />
              {archived.includes(actions.id)
                ? "Restore project"
                : "Archive project"}
              <Check />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
