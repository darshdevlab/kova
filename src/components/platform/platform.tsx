"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Download,
  FileText,
  FolderOpen,
  GitBranch,
  LayoutGrid,
  Link2,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { HomeModelControls } from "@/components/providers/home-model-controls";
import { ProjectActions } from "./project-actions";
import { BuilderV3 } from "@/components/builder-v3";
import { BotPortal } from "@/components/bots-v2";
import { teamSchema } from "@/lib/bot-teams";
import { AIProvidersPanel } from "@/components/providers/ai-providers-panel";
import { MemoryPanel } from "@/components/memory";
import { onboardingKey, parseOnboardingIntent } from "@/lib/onboarding-intent";
import { Modal } from "@/components/ui";
import { ThemePicker } from "@/components/theme-picker";
import { clearSession, writeSession } from "@/lib/storage";
import {
  database,
  saveRecord,
  isAdmin,
  canEdit,
  BOT_STEPS,
  type Space,
  type Role,
  type PlatformRecord,
  type RecordData,
  type RecordKind,
} from "@/lib/platform";
import { downloadFile } from "@/lib/workspace-state";

export type View =
  | "projects"
  | "bots"
  | "approvals"
  | "credits"
  | "company"
  | "integrations"
  | "settings";
const NAV = [
  { id: "projects", label: "Projects", icon: LayoutGrid },
  { id: "bots", label: "Bots", icon: Bot },
  { id: "approvals", label: "Inbox", icon: Bell },
  { id: "credits", label: "Credits & usage", icon: Coins },
  { id: "company", label: "People & workspace", icon: Users },
  { id: "integrations", label: "Connections", icon: Link2 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
const ROLES: Role[] = ["Admin", "PM", "Developer", "QA", "Viewer"];
const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export function Platform({
  view = "projects",
  itemId,
}: {
  view?: View;
  itemId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [space, setSpace] = useState<Space>();
  const [role, setRole] = useState<Role>("Viewer");
  const [records, setRecords] = useState<PlatformRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [theme, setTheme] = useState(false);
  const [profile, setProfile] = useState(false);
  const profilePanel = useRef<HTMLElement>(null);
  const [profileName, setProfileName] = useState("");
  const [usage, setUsage] = useState<{
    requestsUsed: number;
    requestLimit: number;
  } | null>(null);
  const [deliveryMode, setDeliveryMode] = useState("direct");
  const [settingsTab, setSettingsTab] = useState("providers");
  const [query, setQuery] = useState("");
  const [aiConnection, setAiConnection] = useState("Checking availability");
  const [archived, setArchived] = useState(false);
  const [modal, setModal] = useState<
    "project" | "company" | "bot" | "checkout" | "invite" | null
  >(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [source, setSource] = useState("Prompt");
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("auto");
  const [homeConnectionId, setHomeConnectionId] = useState("");
  const [modelReady, setModelReady] = useState(false);
  const [mode, setMode] = useState("Sequential");
  const [instructions, setInstructions] = useState("");
  const [amount, setAmount] = useState(1000);
  const [payment, setPayment] = useState<"review" | "success" | "failed">(
    "review",
  );
  const paymentId = useRef("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Developer");
  const [members, setMembers] = useState<{ user_id: string; role: Role }[]>([]);
  const [invites, setInvites] = useState<
    { id: string; email: string; role: Role }[]
  >([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const current = records.find((r) => r.id === itemId);
  const balance = records
    .filter((r) => r.kind === "credit")
    .reduce((n, r) => n + (r.data.amount || 0), 0);
  const editable = canEdit(role);
  const admin = isAdmin(role);
  const titleLabel = NAV.find((n) => n.id === view)?.label || "Projects";
  const loadGeneration = useRef(0);
  const desiredSpace = useRef<string | undefined>(undefined);

  const load = useCallback(async (sid: string) => {
    const generation = ++loadGeneration.current;
    const db = database();
    const { data, error } = await db
      .from("kova_records")
      .select("*")
      .eq("space_id", sid)
      .order("created_at", { ascending: false });
    if (error)
      throw Error("Unable to load workspace. Check your connection and retry.");
    const memberResult = await db
      .from("kova_members")
      .select("user_id,role")
      .eq("space_id", sid);
    if (memberResult.error) throw Error("Unable to verify membership.");
    const user = await db.auth.getUser();
    if (user.error || !user.data.user)
      throw Error("Your session expired. Sign in again to continue.");
    const nextRole =
      memberResult.data.find(
        (m: { user_id: string; role: Role }) =>
          m.user_id === user.data.user?.id,
      )?.role || "Viewer";
    const inviteResult = await db
      .from("kova_invites")
      .select("id,email,role")
      .eq("space_id", sid);
    if (generation !== loadGeneration.current || desiredSpace.current !== sid)
      return false;
    setRecords(data as PlatformRecord[]);
    setMembers(memberResult.data);
    setRole(nextRole);
    setInvites(inviteResult.data || []);
    return true;
  }, []);

  useEffect(() => {
    if (!profile) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    profilePanel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setProfile(false);
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        profilePanel.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        ) || [],
      );
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      trigger?.focus();
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const controller = new AbortController();
    fetch("/api/account-usage", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsage)
      .catch(() => {});
    return () => controller.abort();
  }, [profile]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/connections", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAiConnection(data?.openrouter || "Status unavailable"))
      .catch(() => setAiConnection("Status unavailable"));
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const db = database();
        const { data, error } = await db.auth.getUser();
        if (error || !data.user) {
          router.replace("/");
          return;
        }
        if (!active) return;
        setEmail(data.user.email || "");
        setProfileName(
          data.user.user_metadata.full_name ||
            data.user.email?.split("@")[0] ||
            "Your account",
        );
        setUserId(data.user.id);
        writeSession({
          email: data.user.email || "",
          name: data.user.user_metadata.full_name || "",
          mode: "supabase",
        });
        const accepted = await db.rpc("kova_accept_invites");
        if (accepted.error) throw accepted.error;
        const personal = await db.rpc("kova_create_space", {
          space_name: "Personal workspace",
          space_kind: "personal",
        });
        if (personal.error) throw personal.error;
        const pendingRaw = sessionStorage.getItem(onboardingKey);
        const pending = parseOnboardingIntent(
          pendingRaw,
          data.user.email || "",
        );
        if (pendingRaw && !pending)
          setToast(
            "Your previous sign-in choice expired or was invalid. Choose a workspace below.",
          );
        let onboardedId: string | undefined;
        if (
          pending?.intent === "organisation" &&
          pending.action === "create-company"
        ) {
          const created = await db.rpc("kova_create_company_once", {
            request_id: pending.id,
            company_name: pending.organisationName,
          });
          if (created.error) throw created.error;
          onboardedId = created.data;
          sessionStorage.setItem(`kova:active:${data.user.id}`, created.data);
        }
        const result = await db
          .from("kova_spaces")
          .select("*")
          .order("created_at");
        if (result.error) throw result.error;
        if (!active) return;
        setSpaces(result.data);
        let sid =
          onboardedId || sessionStorage.getItem(`kova:active:${data.user.id}`);
        if (pending?.intent === "individual")
          sid = result.data.find((s: Space) => s.kind === "personal")?.id;
        if (
          pending?.intent === "organisation" &&
          pending.action === "select-workspace"
        ) {
          const company =
            result.data.find(
              (s: Space) => s.kind === "company" && s.id === sid,
            ) || result.data.find((s: Space) => s.kind === "company");
          if (company) sid = company.id;
          else
            setToast(
              "No organisation membership yet. Create an organisation or ask an administrator for an invitation.",
            );
        }
        if (itemId) {
          const item = await db
            .from("kova_records")
            .select("space_id")
            .eq("id", itemId)
            .maybeSingle();
          if (item.data) sid = item.data.space_id;
        }
        const selected =
          result.data.find((s: Space) => s.id === sid) || result.data[0];
        if (!active || !selected) return;
        desiredSpace.current = selected.id;
        setSpace(selected);
        const loaded = await load(selected.id);
        if (!active || !loaded) return;
        sessionStorage.setItem(`kova:active:${data.user.id}`, selected.id);
        if (pendingRaw) sessionStorage.removeItem(onboardingKey);
      } catch {
        if (active)
          setError(
            "We could not open your workspace. Please refresh to retry.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [load, router, itemId]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (view !== "approvals" || !space?.id) return;
    const timer = setTimeout(() => {
      void load(space.id).catch(() =>
        setError("Could not refresh your inbox. Please retry."),
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [view, space?.id, load]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (current) {
        setMode(current.data.mode || "Sequential");
        setInstructions(current.data.instructions || "");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [current]);
  const action = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Unable to complete this action.",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );
  async function save(
    kind: RecordKind,
    data: RecordData,
    existing?: PlatformRecord,
  ) {
    if (!space) throw Error("Select a workspace.");
    const saved = await saveRecord(space.id, kind, data, existing);
    setRecords((all) => [saved, ...all.filter((r) => r.id !== saved.id)]);
    return saved;
  }
  async function switchSpace(sid: string) {
    await action(async () => {
      const next = spaces.find((s: Space) => s.id === sid);
      if (!next) return;
      desiredSpace.current = sid;
      setRecords([]);
      setSpace(next);
      setRole("Viewer");
      setHomeConnectionId("");
      setModel("auto");
      setModelReady(false);
      sessionStorage.setItem(`kova:active:${userId}`, sid);
      if (!(await load(sid))) return;
      if (itemId) router.push(`/${view}`);
    });
  }
  function openCreate(kind: typeof modal) {
    setTitle("");
    setUrl("");
    setModal(kind);
    setPayment("review");
    paymentId.current = crypto.randomUUID();
  }
  async function createProject() {
    if (!prompt.trim() || !title.trim()) throw Error("Add a name and a brief.");
    if (
      source === "GitHub" &&
      !/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(url)
    )
      throw Error(
        "Enter a GitHub repository URL, without a branch or file path.",
      );
    const row = await save("project", {
      title: title.trim(),
      description: prompt.trim(),
      source,
      url,
      model,
      status: "Draft",
      stage: "Clarify",
      deliveryMode,
      answers: ["", "", ""],
    });
    setModal(null);
    router.push(`/projects/${row.id}`);
  }
  function empty(label: string, detail: string) {
    return (
      <div className="platform-empty">
        <FolderOpen />
        <h2>{label}</h2>
        <p>{detail}</p>
      </div>
    );
  }
  function heading(title: string, subtitle: string, command?: React.ReactNode) {
    return (
      <div className="platform-title">
        <div>
          <span className="eyebrow">{space?.name}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {command}
      </div>
    );
  }
  function status(value: string) {
    return (
      <span
        className={`status-chip ${/Approved|complete|Active/.test(value) ? "good" : ""}`}
      >
        {value}
      </span>
    );
  }
  function renderProjects() {
    if (itemId) {
      if (!current)
        return empty(
          "Project unavailable",
          "It may have been removed, or you may not have access.",
        );
      return (
        <BuilderV3
          key={current.id}
          project={current}
          role={role}
          onSaved={(saved) =>
            setRecords((all) => [
              saved,
              ...all.filter((r) => r.id !== saved.id),
            ])
          }
        />
      );
    }
    const projects = records.filter(
      (r) =>
        r.kind === "project" &&
        Boolean(r.data.archived) === archived &&
        `${r.data.title} ${r.data.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <>
        <div className="home-heading">
          <span className="eyebrow">
            {space?.kind === "company"
              ? "Team workspace"
              : "Personal workspace"}
          </span>
          <h1>What are we building?</h1>
        </div>
        <section className="launchpad">
          <form
            className="prompt-surface"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                if (!modelReady || !editable || !prompt.trim())
                  throw Error(
                    "Select an available model and enter your requirement.",
                  );
                const row = await save("project", {
                  title: prompt
                    .trim()
                    .split(/\s+/)
                    .slice(0, 7)
                    .join(" ")
                    .slice(0, 80),
                  description: prompt.trim(),
                  model,
                  providerConnectionId: homeConnectionId || undefined,
                  deliveryMode,
                  source: "Prompt",
                  stage: "Clarify",
                  status: "Draft",
                });
                setPrompt("");
                sessionStorage.setItem(`kova:build-start:${row.id}`, "1");
                router.push(`/projects/${row.id}`);
              });
            }}
          >
            <textarea
              aria-label="Build prompt"
              placeholder="Describe your application, or a change you want to make…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              disabled={!editable}
            />
            <div className="prompt-controls">
              <div className="composer-options">
                <HomeModelControls
                  spaceId={space!.id}
                  model={model}
                  onModelChange={setModel}
                  connectionId={homeConnectionId}
                  onConnectionChange={setHomeConnectionId}
                  onReadyChange={setModelReady}
                />
                <select
                  aria-label="Project journey"
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                >
                  <option value="direct">Direct build</option>
                  <option value="delivery">Product delivery</option>
                </select>
              </div>
              <button
                className="button primary"
                disabled={!editable || busy || !prompt.trim() || !modelReady}
              >
                Build application
                {busy ? <LoaderCircle className="spin" /> : <ArrowRight />}
              </button>
            </div>
          </form>
          <button
            className="import-action"
            disabled={!editable}
            onClick={() => {
              setSource("GitHub");
              openCreate("project");
            }}
          >
            <GitBranch />
            <strong>Import a repository</strong>
            <ArrowRight />
          </button>
        </section>
        <div className="platform-toolbar">
          <div className="inline-actions">
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Your projects</h2>
            <select
              aria-label="Project status filter"
              value={String(archived)}
              onChange={(e) => setArchived(e.target.value === "true")}
            >
              <option value="false">Active</option>
              <option value="true">Archived</option>
            </select>
          </div>
          <label className="search-field">
            <Search />
            <input
              aria-label="Search projects"
              placeholder="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="record-grid">
          {projects.map((r) => (
            <article className="record-card" key={r.id}>
              <Link
                className="project-file-icon"
                href={`/projects/${r.id}`}
                aria-label={`Open ${r.data.title}`}
              >
                <FolderOpen />
              </Link>
              <div className="record-card-body">
                <div className="record-meta">
                  {status(r.data.status || "Draft")}
                  <span>{date(r.updated_at)}</span>
                </div>
                <Link href={`/projects/${r.id}`}>
                  <h3>{r.data.title}</h3>
                </Link>
                <p>{r.data.description}</p>
                <div className="record-meta">
                  <span>
                    {r.data.source} /{" "}
                    {r.data.deliveryMode === "delivery"
                      ? "Product delivery"
                      : "Direct build"}
                  </span>
                  <ProjectActions record={r} role={role}
                    onSaved={saved => setRecords(all => all.map(item => item.id === saved.id ? saved : item))}
                    onDeleted={id => setRecords(all => all.filter(item => item.id !== id))} />
                </div>
              </div>
            </article>
          ))}
        </div>
        {!projects.length &&
          empty(
            archived ? "Nothing archived" : "Your next project starts here",
            archived
              ? "Archived projects will appear here."
              : "Start with a prompt or bring an existing repository.",
          )}
      </>
    );
  }
  function renderCredits() {
    const entries = records.filter((r) => r.kind === "credit");
    return (
      <>
        {heading(
          "Know where every credit goes.",
          "Workspace balance and transaction history.",
          <button
            className="button primary"
            disabled={!admin}
            onClick={() => openCreate("checkout")}
          >
            <Plus />
            Buy demo credits
          </button>,
        )}
        <div className="platform-alert">
          Demo billing only. Credits do not authorize paid API usage or sandbox
          overages.
        </div>
        <div className="metrics-row">
          <div className="metric">
            <span>AVAILABLE DEMO CREDITS</span>
            <strong>{balance.toLocaleString()}</strong>
            <small>
              {balance < 100 ? "Low balance" : "Ready for simulations"}
            </small>
          </div>
          <div className="metric">
            <span>RESERVED</span>
            <strong>0</strong>
            <small>No metered execution connected</small>
          </div>
          <div className="metric">
            <span>REAL PROVIDER SPEND</span>
            <strong>Not synced</strong>
            <small>OpenRouter billing is separate</small>
          </div>
        </div>
        <div className="section-heading">
          <h2>Transactions</h2>
          <button
            className="button quiet"
            onClick={() =>
              downloadFile(
                "kova-demo-transactions.json",
                JSON.stringify(entries, null, 2),
                "application/json",
              )
            }
          >
            <Download />
            Export
          </button>
        </div>
        {entries.length ? (
          <div className="platform-table-wrap">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Date</th>
                  <th>Credits</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.data.title}
                      <br />
                      <small className="small-code">{r.id.slice(0, 8)}</small>
                    </td>
                    <td>{date(r.created_at)}</td>
                    <td>+{r.data.amount?.toLocaleString()}</td>
                    <td>{status("Simulated payment")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          empty(
            "No transactions yet",
            "Demo purchases will appear here. No real payment will be taken.",
          )
        )}
      </>
    );
  }
  function renderCompany() {
    return (
      <>
        {heading(
          space?.kind === "company" ? space.name : "Your personal workspace",
          space?.kind === "company"
            ? "People, responsibilities and workspace access."
            : "Your own space, with room to start a company workspace.",
          <button
            className="button primary"
            onClick={() => openCreate("company")}
          >
            <Building2 />
            Create company
          </button>,
        )}
        <div className="section-heading">
          <h2>Members</h2>
          {space?.kind === "company" && admin && (
            <button
              className="button secondary"
              onClick={() => openCreate("invite")}
            >
              <Plus />
              Invite member
            </button>
          )}
        </div>
        <div className="platform-table-wrap">
          <table className="platform-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td>
                    {m.user_id === userId
                      ? email
                      : `Member ${m.user_id.slice(0, 8)}`}
                    {m.user_id === userId && " (you)"}
                  </td>
                  <td>
                    {admin && m.role !== "Owner" ? (
                      <select
                        aria-label={`Role for ${m.user_id}`}
                        value={m.role}
                        disabled={busy}
                        onChange={(e) =>
                          void action(async () => {
                            const result = await database().rpc(
                              "kova_change_member",
                              {
                                sid: space!.id,
                                uid: m.user_id,
                                new_role: e.target.value,
                              },
                            );
                            if (result.error) throw Error(result.error.message);
                            await load(space!.id);
                          })
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                        <option>Remove</option>
                      </select>
                    ) : (
                      m.role
                    )}
                  </td>
                  <td>{status("Active")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invites.length > 0 && (
          <>
            <div className="section-heading">
              <h2>Pending invitations</h2>
            </div>
            {invites.map((inv) => (
              <div className="integration-row" key={inv.id}>
                <Users />
                <div>
                  <h3>{inv.email}</h3>
                  <p>{inv.role} / joins on verified sign-in</p>
                </div>
                <button
                  className="button quiet"
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      const { error } = await database()
                        .from("kova_invites")
                        .delete()
                        .eq("id", inv.id);
                      if (error) throw error;
                      await load(space!.id);
                    })
                  }
                >
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}
        <section className="detail-section" style={{ marginTop: 32 }}>
          <h2>Workspace boundaries</h2>
          <p className="muted">
            Members only see workspaces they belong to. Viewers have read-only
            access. Only owners and administrators manage membership and demo
            purchases.
          </p>
          <p className="muted">
            Invitations are recorded here. Email delivery is not connected;
            share the sign-in link with the invitee.
          </p>
        </section>
      </>
    );
  }
  function renderInbox() {
    const pending = records.filter(
      (r) =>
        (r.kind === "project" && r.data.status?.includes("review")) ||
        (r.kind === "run" && r.data.status === "Awaiting approval") ||
        (r.kind === "bot" &&
          (() => {
            const team = teamSchema.safeParse(r.data);
            return (
              team.success &&
              team.data.approvals.some((a) => a.status === "Pending")
            );
          })()),
    );
    return (
      <>
        {heading(
          "Keep the work moving.",
          "Decisions, questions and handoffs that need attention.",
        )}
        {pending.length ? (
          <div className="integration-list">
            {pending.map((r) => (
              <div className="integration-row" key={r.id}>
                <span className="record-icon">
                  <Bell />
                </span>
                <div>
                  <h3>{r.data.title}</h3>
                  <p>
                    {r.kind === "run"
                      ? BOT_STEPS[r.data.completed || 0]
                      : r.kind === "bot"
                        ? "Bot team decisions awaiting review (demo execution)"
                        : r.data.status}
                  </p>
                </div>
                <Link
                  className="button secondary"
                  href={
                    r.kind === "run"
                      ? `/bots/${r.data.botId}`
                      : r.kind === "bot"
                        ? `/bots/${r.id}`
                        : `/projects/${r.id}`
                  }
                >
                  Review
                  <ArrowRight />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          empty(
            "You're all caught up",
            "Approval requests will appear as your projects and Bots move forward.",
          )
        )}
      </>
    );
  }
  function renderIntegrations() {
    return (
      <>
        {heading(
          "Connect your working world.",
          "One place for the tools behind your projects.",
        )}
        <div className="integration-list">
          {[
            {
              name: "GitHub",
              detail: "Repository access and pull requests",
              state: "Private key pending",
              icon: GitBranch,
            },
            {
              name: "Notion",
              detail: "PRDs, technical plans and project decisions",
              state: "Runtime connection pending",
              icon: FileText,
            },
            {
              name: "Lyzr",
              detail: "External agents powering your Kova Bots",
              state: "Simulated",
              icon: Bot,
            },
            {
              name: "OpenRouter",
              detail: "Model catalog, generation and Jev decisions",
              state: aiConnection,
              icon: Sparkles,
            },
            {
              name: "Sandbox",
              detail: "Isolated builds and tests / free usage only",
              state: "Execution disabled",
              icon: ShieldCheck,
            },
          ].map((c) => (
            <div className="integration-row" key={c.name}>
              <span className="record-icon">
                <c.icon />
              </span>
              <div>
                <h3>{c.name}</h3>
                <p>{c.detail}</p>
              </div>
              {status(c.state)}
              <button
                className="button quiet"
                onClick={() =>
                  setToast(
                    c.name === "Lyzr"
                      ? "Configure the simulated Lyzr adapter in Bots."
                      : `${c.name} requires server-side setup. Do not paste secrets into project prompts.`,
                  )
                }
              >
                Details
                <ChevronRight />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }
  function renderSettings() {
    return (
      <>
        {heading("Settings", space?.name || "Workspace")}
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Settings sections"
        >
          {[
            ["providers", "AI Providers"],
            ["memory", "Memory"],
            ["account", "Account & appearance"],
          ].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={settingsTab === id}
              onClick={() => setSettingsTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {settingsTab === "providers" ? (
          <AIProvidersPanel spaceId={space!.id} role={role} />
        ) : settingsTab === "memory" ? (
          <MemoryPanel spaceId={space!.id} role={role} />
        ) : (
          <>
            <div className="detail-layout">
              <div>
                <section className="detail-section">
                  <h2>Appearance</h2>
                  <ThemePicker />
                </section>
                <section className="detail-section">
                  <h2>Change password</h2>
                  <form
                    className="form-stack"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action(async () => {
                        if (newPassword !== confirmPassword)
                          throw Error("Passwords do not match.");
                        const { error } = await database().auth.updateUser({
                          password: newPassword,
                        });
                        if (error) throw Error(error.message);
                        setNewPassword("");
                        setConfirmPassword("");
                        setToast("Password updated");
                      });
                    }}
                  >
                    <label className="field">
                      <span>New password</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Confirm new password</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </label>
                    <button className="button secondary" disabled={busy}>
                      Update password
                    </button>
                  </form>
                </section>
              </div>
              <aside className="detail-aside">
                <h3>Account</h3>
                <p>{email}</p>
                <h3>Workspace export</h3>
                <p>
                  Download accessible projects, documents, Bot definitions and
                  demo transactions. External provider credentials are not
                  included.
                </p>
                <button
                  className="button secondary"
                  onClick={() =>
                    downloadFile(
                      "kova-workspace.json",
                      JSON.stringify(
                        {
                          workspace: space,
                          records,
                          exportedAt: new Date().toISOString(),
                        },
                        null,
                        2,
                      ),
                      "application/json",
                    )
                  }
                >
                  <Download />
                  Export workspace
                </button>
              </aside>
            </div>
          </>
        )}
      </>
    );
  }
  if (loading)
    return (
      <main className="platform-loading">
        <BrandMark />
        <LoaderCircle className="spin" />
        <p>Opening your workspace...</p>
      </main>
    );
  if (!space)
    return (
      <main className="platform-loading">
        <BrandMark />
        <p role="alert">{error}</p>
        <button className="button primary" onClick={() => location.reload()}>
          Retry
        </button>
        <Link href="/">Return to sign in</Link>
      </main>
    );
  return (
    <div className="platform kova-v3">
      <aside className={`platform-rail ${mobile ? "open" : ""}`}>
        <BrandMark />
        <select
          className="space-picker"
          aria-label="Active workspace"
          value={space.id}
          onChange={(e) => void switchSpace(e.target.value)}
          disabled={busy}
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          className="workspace-create-link"
          onClick={() => openCreate("company")}
        >
          <Plus size={14} />
          Create organisation
        </button>
        <span className="rail-caption">Workspace</span>
        <nav className="platform-nav" aria-label="Main navigation">
          {NAV.map((n) => (
            <Link
              key={n.id}
              className={view === n.id ? "active" : ""}
              href={`/${n.id}`}
              onClick={() => setMobile(false)}
            >
              <n.icon />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="rail-bottom">
          <button
            className="rail-profile profile-trigger"
            aria-label="Open profile"
            aria-expanded={profile}
            onClick={() => setProfile(!profile)}
          >
            <span className="avatar">{email.slice(0, 1).toUpperCase()}</span>
            <span>
              {profileName}
              <small>
                {space.kind === "company"
                  ? "Organisation account"
                  : "Personal account"}
              </small>
            </span>
            <MoreHorizontal size={16} />
          </button>
        </div>
        {mobile && (
          <button className="button quiet" onClick={() => setMobile(false)}>
            <X />
            Close navigation
          </button>
        )}
      </aside>
      <div className="platform-body">
        <header className="platform-header">
          <div className="platform-breadcrumb">
            <button
              className="icon-button ghost mobile-rail-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>{space.name}</span>
            <ChevronRight size={12} />
            <strong>{titleLabel}</strong>
          </div>
          <div className="platform-header-actions">
            <span className="status-chip">{role}</span>
            <button
              className="icon-button ghost"
              aria-label="Choose color theme"
              title="Choose color theme"
              onClick={() => setTheme(true)}
            >
              <Palette />
            </button>
            <Link
              className="icon-button ghost"
              aria-label="Open inbox"
              href="/approvals"
            >
              <Bell />
            </Link>
            <button
              className="avatar"
              aria-label="Account and usage"
              aria-expanded={profile}
              onClick={() => setProfile(!profile)}
            >
              {email.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="platform-content">
          {error && (
            <div className="platform-alert error" role="alert">
              <span>{error}</span>
              <button
                className="icon-button ghost"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X />
              </button>
            </div>
          )}
          {role === "Viewer" && (
            <div className="platform-alert">
              You have read-only access to this workspace.
            </div>
          )}
          {view === "projects" ? (
            renderProjects()
          ) : view === "bots" ? (
            <BotPortal
              key={space.id}
              spaceId={space.id}
              role={role}
              itemId={itemId}
            />
          ) : view === "credits" ? (
            renderCredits()
          ) : view === "company" ? (
            renderCompany()
          ) : view === "approvals" ? (
            renderInbox()
          ) : view === "integrations" ? (
            renderIntegrations()
          ) : (
            renderSettings()
          )}
        </main>
      </div>
      {profile && (
        <>
          <button
            className="profile-dismiss"
            aria-label="Close profile menu"
            onClick={() => setProfile(false)}
          />
          <section
            ref={profilePanel}
            className="profile-popover"
            aria-label="Your account"
          >
            <div className="profile-identity">
              <span className="avatar">{email.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{profileName}</strong>
                <small>{email}</small>
              </div>
            </div>
            <div className="profile-usage">
              <div>
                <strong>{balance.toLocaleString()} credits</strong>
                <span>Demo balance</span>
              </div>
              <small>Demo purchases are separate from provider billing.</small>
              {usage ? (
                <>
                  <div className="usage-meter-label">
                    <span>Daily AI requests</span>
                    <strong>
                      {usage.requestsUsed} / {usage.requestLimit}
                    </strong>
                  </div>
                  <progress
                    aria-label="Daily AI requests used"
                    value={usage.requestsUsed}
                    max={usage.requestLimit}
                  />
                  <small>Resets at midnight UTC. Failed attempts count.</small>
                </>
              ) : (
                <p className="muted">AI usage unavailable</p>
              )}
            </div>
            <Link href="/credits" onClick={() => setProfile(false)}>
              <Coins size={16} />
              Credits & usage
              <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => {
                setProfile(false);
                openCreate("checkout");
              }}
              disabled={!admin}
            >
              <Plus size={16} />
              Add credits
            </button>
            <Link href="/settings" onClick={() => setProfile(false)}>
              <Settings size={16} />
              Account settings
            </Link>
            <button
              onClick={() =>
                void action(async () => {
                  const result = await database().auth.signOut();
                  if (result.error) throw result.error;
                  clearSession();
                  setProfile(false);
                  router.replace("/");
                })
              }
            >
              <LogOut size={16} />
              Sign out
            </button>
          </section>
        </>
      )}
      {theme && (
        <Modal title="Color theme" close={() => setTheme(false)}>
          <ThemePicker />
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            modal === "project"
              ? source === "GitHub"
                ? "Import a repository"
                : "New project"
              : modal === "company"
                ? "Create company workspace"
                : modal === "bot"
                  ? "Create a Bot"
                  : modal === "invite"
                    ? "Invite a teammate"
                    : "Buy demo credits"
          }
          close={() => {
            if (!busy) setModal(null);
          }}
        >
          {modal === "checkout" ? (
            payment === "success" ? (
              <div className="billing-success">
                <CheckCircle2 />
                <h2>Simulation complete</h2>
                <p>
                  {amount.toLocaleString()} demo credits added. No money was
                  charged.
                </p>
                <button
                  className="button primary"
                  onClick={() => setModal(null)}
                >
                  Back to credits
                </button>
              </div>
            ) : (
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    if (
                      !Number.isSafeInteger(amount) ||
                      amount < 100 ||
                      amount > 100000
                    )
                      throw Error(
                        "Choose between 100 and 100,000 whole credits.",
                      );
                    const id = paymentId.current;
                    const existing = records.find(
                      (r) => r.kind === "credit" && r.data.source === id,
                    );
                    if (!existing)
                      await save("credit", {
                        title: "Demo credit purchase",
                        amount,
                        source: id,
                        status: "Simulated",
                      });
                    setPayment("success");
                  });
                }}
              >
                <div className="platform-alert">
                  Simulation only. No card details or real payment.
                </div>
                <label className="field">
                  <span>Demo credits</span>
                  <input
                    type="number"
                    min={100}
                    max={100000}
                    step={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </label>
                <div className="checkout-summary">
                  <span>Illustrative total</span>
                  <strong>${(amount / 100).toFixed(2)}</strong>
                </div>
                {payment === "failed" && (
                  <p role="status" className="form-message">
                    Simulated payment failed. No credits were added.
                  </p>
                )}
                <button className="button primary" disabled={busy}>
                  {busy ? <LoaderCircle className="spin" /> : <Coins />}Simulate
                  successful payment
                </button>
                <button
                  type="button"
                  className="button quiet"
                  disabled={busy}
                  onClick={() => setPayment("failed")}
                >
                  Simulate payment failure
                </button>
              </form>
            )
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  if (modal === "project") await createProject();
                  if (modal === "company") {
                    const { data, error } = await database().rpc(
                      "kova_create_space",
                      { space_name: title.trim(), space_kind: "company" },
                    );
                    if (error) throw Error(error.message);
                    const result = await database()
                      .from("kova_spaces")
                      .select("*")
                      .order("created_at");
                    setSpaces(result.data || []);
                    desiredSpace.current = data;
                    setSpace(result.data?.find((s: Space) => s.id === data));
                    sessionStorage.setItem(`kova:active:${userId}`, data);
                    await load(data);
                    setModal(null);
                    router.push("/company");
                  }
                  if (modal === "bot") {
                    const row = await save("bot", {
                      title: title.trim(),
                      description: instructions,
                      mode,
                      instructions,
                      source: "Lyzr simulation",
                      status: "Configured",
                      steps: BOT_STEPS,
                    });
                    setModal(null);
                    router.push(`/bots/${row.id}`);
                  }
                  if (modal === "invite") {
                    if (inviteEmail.toLowerCase() === email.toLowerCase())
                      throw Error("You already belong to this workspace.");
                    const { error } = await database()
                      .from("kova_invites")
                      .insert({
                        space_id: space.id,
                        email: inviteEmail.trim().toLowerCase(),
                        role: inviteRole,
                      });
                    if (error)
                      throw Error(
                        "Invitation could not be saved. It may already exist.",
                      );
                    await load(space.id);
                    setModal(null);
                    setToast(
                      "Invitation recorded. Share the Kova sign-in link; email delivery is not connected.",
                    );
                  }
                });
              }}
            >
              {modal !== "invite" && (
                <label className="field">
                  <span>
                    {modal === "company"
                      ? "Company name"
                      : modal === "bot"
                        ? "Bot name"
                        : "Project name"}
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={80}
                    pattern=".*\S.*"
                    autoFocus
                  />
                </label>
              )}
              {modal === "project" && (
                <>
                  {source === "GitHub" && (
                    <>
                      <label className="field">
                        <span>Repository URL</span>
                        <input
                          type="url"
                          required
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://github.com/owner/repository"
                        />
                      </label>
                      <p className="muted">
                        Repository reference only until the GitHub App and
                        isolated runner are connected. No clone is performed.
                      </p>
                    </>
                  )}
                  <label className="field">
                    <span>Requirement and scope</span>
                    <textarea
                      required
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Build approach</span>
                    <select
                      value={deliveryMode}
                      onChange={(e) => setDeliveryMode(e.target.value)}
                    >
                      <option value="direct">Direct build</option>
                      <option value="delivery">Product delivery</option>
                    </select>
                  </label>
                </>
              )}
              {modal === "bot" && (
                <>
                  <label className="field">
                    <span>Team structure</span>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      {["Sequential", "Parallel", "Hierarchical", "Mixed"].map(
                        (m) => (
                          <option key={m}>{m}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="field">
                    <span>Instructions</span>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={4}
                      placeholder="Purpose, constraints and escalation rules"
                    />
                  </label>
                  <p className="muted">
                    Lyzr simulation. Every Bot gets its own private URL.
                  </p>
                </>
              )}
              {modal === "invite" && (
                <>
                  <label className="field">
                    <span>Email address</span>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Role</span>
                    <select
                      value={inviteRole}
                      aria-label="Invitation role"
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <p className="muted">
                    Access is granted only after this email signs in with a
                    verified account.
                  </p>
                </>
              )}
              {modal === "company" && (
                <p className="muted">
                  You will own this workspace. Invite your team after creation.
                </p>
              )}
              <button className="button primary" disabled={busy}>
                {busy ? <LoaderCircle className="spin" /> : <Plus />}
                {modal === "invite"
                  ? "Create invitation"
                  : modal === "company"
                    ? "Create company"
                    : modal === "bot"
                      ? "Create Bot"
                      : "Create project"}
              </button>
            </form>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X />
          </button>
        </div>
      )}
    </div>
  );
}
