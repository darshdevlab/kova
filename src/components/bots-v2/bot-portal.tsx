"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Download,
  MessageSquare,
  Network,
  Plus,
  RefreshCw,
  X,
  FileText,
  ListTodo,
  ShieldCheck,
} from "lucide-react";
import {
  canManageBots,
  templates,
  type TeamRecord,
  type TeamConfig,
  type TeamCommand,
} from "@/lib/bot-teams";
import { TeamGraph } from "./team-graph";
import "@xyflow/react/dist/style.css";
import styles from "./bot-portal.module.css";

export type BotPortalProps = { spaceId: string; role: string; itemId?: string };
export function BotPortal(props: BotPortalProps) {
  // Remount on workspace/route changes so stale requests and drafts cannot cross scopes.
  return (
    <PortalSession
      key={`${props.spaceId}:${props.itemId ?? "list"}:${props.role}`}
      {...props}
    />
  );
}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw Error(body.error || "Request failed. Retry shortly.");
  return body as T;
}
function PortalSession({ spaceId, role, itemId }: BotPortalProps) {
  const router = useRouter();
  const [records, setRecords] = useState<TeamRecord[]>([]);
  const [serverRole, setServerRole] = useState("Viewer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [template, setTemplate] =
    useState<(typeof templates)[number]["id"]>("blank");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState("Chat");
  const [config, setConfig] = useState<TeamConfig>();
  const [chatId, setChatId] = useState<string>();
  const [target, setTarget] = useState("team");
  const [text, setText] = useState("");
  const [artifactId, setArtifactId] = useState<string>();
  const [showInterbot, setShowInterbot] = useState(true);
  const lock = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const readOnly = !canManageBots(role) || !canManageBots(serverRole);
  const record = records.find((r) => r.id === itemId && r.space_id === spaceId);
  const team = record?.data;
  const dirty =
    !!team &&
    !!config &&
    JSON.stringify(config) !== JSON.stringify(team.config);
  const chat = team?.chats.find((c) => c.id === chatId) ?? team?.chats[0];
  const load = useCallback(
    (signal?: AbortSignal) => {
      return api<{ records: TeamRecord[]; role: string }>(
        `/api/bot-teams?spaceId=${encodeURIComponent(spaceId)}${itemId ? `&itemId=${encodeURIComponent(itemId)}` : ""}`,
        { signal },
      )
        .then((result) => {
          if (signal?.aborted) return;
          setRecords(result.records.filter((r) => r.space_id === spaceId));
          setServerRole(result.role);
          setConfig(
            result.records.find(
              (r) => r.id === itemId && r.space_id === spaceId,
            )?.data.config,
          );
        })
        .catch((e: unknown) => {
          if (!signal?.aborted)
            setError(e instanceof Error ? e.message : "Unable to load teams.");
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [spaceId, itemId],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [chat?.messages.length, chat?.id]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function mutate(command: TeamCommand) {
    if (!record || readOnly || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ record: TeamRecord }>("/api/bot-teams", {
        method: "PUT",
        body: JSON.stringify({
          spaceId,
          itemId: record.id,
          revision: record.revision,
          command,
        }),
      });
      if (result.record.space_id !== spaceId || result.record.id !== record.id)
        throw Error("Unexpected workspace response.");
      setRecords([result.record]);
      if (command.action === "configure") {
        setConfig(result.record.data.config);
        if (!result.record.data.config.bots.some((b) => b.id === target))
          setTarget("team");
      }
      if (command.action === "new-chat") {
        setChatId(result.record.data.chats[0].id);
        setText("");
        setTab("Chat");
      }
      if (command.action === "send") setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function create() {
    if (readOnly || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ record: TeamRecord }>("/api/bot-teams", {
        method: "POST",
        body: JSON.stringify({ spaceId, title, template }),
      });
      router.push(`/bots/${result.record.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create team.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function reload() {
    if (
      !dirty ||
      window.confirm("Discard unsaved organisation changes and reload?")
    ) {
      setLoading(true);
      setError("");
      void load();
    }
  }
  const tabs = [
    { name: "Chat", icon: MessageSquare },
    { name: "Organisation", icon: Network },
    { name: "Artifacts", icon: FileText },
    { name: "Tasks", icon: ListTodo },
    { name: "Approvals", icon: ShieldCheck },
  ];
  return (
    <section className={styles.portal} aria-label="Bot portal">
      <header className={styles.header}>
        <div className={styles.heading}>
          {itemId && (
            <Link
              href="/bots"
              aria-label="All Bot teams"
              title="All Bot teams"
              onClick={(e) => {
                if (
                  dirty &&
                  !window.confirm("Discard unsaved organisation changes?")
                )
                  e.preventDefault();
              }}
            >
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <h1>{team?.title ?? (itemId ? "Bot team" : "Bots")}</h1>
            <span className={styles.muted}>
              {itemId ? "Demo execution" : "Team workspace"}
              {readOnly && !loading ? " · Read only" : ""}
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            title="Reload from cloud"
            aria-label="Reload from cloud"
            disabled={busy || loading}
            onClick={reload}
          >
            <RefreshCw size={16} />
          </button>
          {team ? (
            <button
              className={styles.primary}
              disabled={readOnly || busy || dirty}
              onClick={() => void mutate({ action: "new-chat", target })}
            >
              <Plus size={16} />
              New chat
            </button>
          ) : (
            !itemId && (
              <button
                className={styles.primary}
                disabled={readOnly || loading}
                onClick={() => setCreating(!creating)}
              >
                <Plus size={16} />
                New team
              </button>
            )
          )}
        </div>
      </header>
      {error && (
        <div className={styles.error} role="alert">
          {error}
          <button onClick={reload} disabled={busy}>
            Reload
          </button>
        </div>
      )}
      {loading ? (
        <p className={styles.empty} role="status">
          Loading Bot teams...
        </p>
      ) : !itemId ? (
        <>
          {creating && (
            <form
              className={styles.create}
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <label>
                Team name
                <input
                  required
                  autoFocus
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product operations"
                />
              </label>
              <label>
                Starting point
                <select
                  value={template}
                  onChange={(e) =>
                    setTemplate(e.target.value as typeof template)
                  }
                >
                  {templates.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={styles.primary}
                disabled={busy || !title.trim()}
              >
                Create team
              </button>
            </form>
          )}
          {!records.length && !error ? (
            <div className={styles.empty}>
              <Network size={32} />
              <h2>No Bot teams yet</h2>
            </div>
          ) : (
            <div className={styles.teamList}>
              {records.map((r) => (
                <Link href={`/bots/${r.id}`} key={r.id}>
                  <Network size={22} />
                  <div>
                    <strong>{r.data.title}</strong>
                    <small>
                      {
                        r.data.config.bots.filter((b) => b.kind !== "user")
                          .length
                      }{" "}
                      Bots · {r.data.chats.length} conversations
                    </small>
                  </div>
                  <span>Open →</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : !team || !config ? (
        !error && (
          <p className={styles.empty}>Team unavailable in this workspace.</p>
        )
      ) : (
        <>
          <nav className={styles.tabs} aria-label="Team views">
            {tabs.map(({ name, icon: Icon }) => (
              <button
                key={name}
                aria-current={tab === name ? "page" : undefined}
                onClick={() => setTab(name)}
              >
                <Icon size={16} />
                {name}
                {name === "Approvals" &&
                  team.approvals.some((a) => a.status === "Pending") && (
                    <span className={styles.count}>
                      {
                        team.approvals.filter((a) => a.status === "Pending")
                          .length
                      }
                    </span>
                  )}
              </button>
            ))}
          </nav>
          {dirty && tab !== "Organisation" && (
            <div className={styles.notice}>
              Organisation changes are unsaved.
              <button onClick={() => setTab("Organisation")}>
                Review changes
              </button>
            </div>
          )}
          {tab === "Organisation" && (
            <TeamGraph
              config={config}
              onChange={setConfig}
              readOnly={readOnly}
              busy={busy}
              dirty={dirty}
              onSave={() => void mutate({ action: "configure", config })}
            />
          )}
          {tab === "Chat" && (
            <div className={styles.chatLayout}>
              <aside className={styles.conversations}>
                <label>
                  New chat with
                  <select
                    aria-label="New chat with"
                    value={target}
                    disabled={readOnly || busy}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="team">Team chat</option>
                    {team.config.bots
                      .filter((b) => b.kind !== "user")
                      .map((b) => (
                        <option value={b.id} key={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </label>
                <span className={styles.fieldTitle}>Conversations</span>
                {!team.chats.length && (
                  <small className={styles.muted}>No conversations yet</small>
                )}
                {team.chats.map((c) => (
                  <button
                    className={styles.conversation}
                    aria-current={chat?.id === c.id ? "true" : undefined}
                    key={c.id}
                    onClick={() => {
                      setChatId(c.id);
                      setText("");
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>
                      {c.title}
                      <small>
                        {c.target === "team"
                          ? "Team chat"
                          : (team.config.bots.find((b) => b.id === c.target)
                              ?.name ?? "Removed Bot")}
                      </small>
                    </span>
                  </button>
                ))}
              </aside>
              <div className={styles.chat}>
                <div className={styles.chatHeader}>
                  <strong>{chat?.title ?? "New conversation"}</strong>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={showInterbot}
                      onChange={(e) => setShowInterbot(e.target.checked)}
                    />
                    Inter-Bot messages
                  </label>
                </div>
                <div
                  className={styles.messages}
                  role="log"
                  aria-label="Conversation messages"
                  aria-live="polite"
                >
                  {!chat?.messages.length && (
                    <div className={styles.empty}>
                      <MessageSquare size={28} />
                      <h2>
                        {chat
                          ? "What should the team work on?"
                          : "Start a new chat"}
                      </h2>
                    </div>
                  )}
                  {chat?.messages
                    .filter((m) => showInterbot || m.type !== "handoff")
                    .map((m) => (
                      <article
                        className={`${styles.message} ${m.type === "handoff" ? styles.handoff : ""}`}
                        key={m.id}
                      >
                        <div>
                          <strong>{m.senderName}</strong>
                          <span>→ {m.recipient}</span>
                          <small>
                            {m.type === "user"
                              ? "Message"
                              : m.type === "handoff"
                                ? "Simulated handoff"
                                : "Demo proposal"}
                          </small>
                        </div>
                        <p>{m.text}</p>
                      </article>
                    ))}
                  <div ref={end} />
                </div>
                <form
                  className={styles.composer}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (chat)
                      void mutate({ action: "send", chatId: chat.id, text });
                  }}
                >
                  <textarea
                    aria-label="Message"
                    placeholder={
                      readOnly
                        ? "Read-only conversation"
                        : "Message the team..."
                    }
                    value={text}
                    maxLength={6000}
                    rows={3}
                    disabled={readOnly || busy || !chat || dirty}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    className={styles.primary}
                    aria-label="Send message"
                    title="Send message"
                    disabled={
                      readOnly || busy || !chat || !text.trim() || dirty
                    }
                  >
                    <ArrowUp size={18} />
                  </button>
                  <small>Demo execution · No tools run</small>
                </form>
              </div>
            </div>
          )}
          {tab === "Artifacts" && (
            <div className={styles.artifactLayout}>
              <div>
                {!team.artifacts.length && (
                  <p className={styles.empty}>No artifacts yet.</p>
                )}
                {team.artifacts.map((a) => (
                  <button
                    key={a.id}
                    className={styles.artifactLink}
                    aria-current={artifactId === a.id ? "true" : undefined}
                    onClick={() => setArtifactId(a.id)}
                  >
                    <FileText size={18} />
                    <span>
                      {a.title}
                      <small>{a.source}</small>
                    </span>
                  </button>
                ))}
              </div>
              {(() => {
                const artifact =
                  team.artifacts.find((a) => a.id === artifactId) ??
                  team.artifacts[0];
                return artifact ? (
                  <article className={styles.artifact}>
                    <div className={styles.toolbar}>
                      <h2>{artifact.title}</h2>
                      <button
                        aria-label="Download artifact"
                        title="Download artifact"
                        onClick={() => {
                          const url = URL.createObjectURL(
                            new Blob([artifact.content], {
                              type: "text/plain",
                            }),
                          );
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = "demo-working-brief.txt";
                          link.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                    <pre>{artifact.content}</pre>
                  </article>
                ) : null;
              })()}
            </div>
          )}
          {tab === "Tasks" && (
            <div className={styles.rows}>
              {!team.tasks.length && (
                <p className={styles.empty}>No tasks yet.</p>
              )}
              {team.tasks.map((task) => (
                <div className={styles.row} key={task.id}>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      aria-label={`Mark ${task.title} done`}
                      disabled={readOnly || busy}
                      checked={task.status === "Done"}
                      onChange={(e) =>
                        void mutate({
                          action: "task",
                          taskId: task.id,
                          status: e.target.checked ? "Done" : "Proposed",
                        })
                      }
                    />
                    <span>
                      {task.title}
                      <small>{task.owner} · Demo task</small>
                    </span>
                  </label>
                  <span>{task.status}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "Approvals" && (
            <div className={styles.rows}>
              <p className={styles.muted}>
                Decisions record review of demo proposals. Approval does not
                execute work.
              </p>
              {!team.approvals.length && (
                <p className={styles.empty}>No approvals pending.</p>
              )}
              {team.approvals.map((approval) => (
                <div className={styles.row} key={approval.id}>
                  <div>
                    {approval.title}
                    <small>{approval.status}</small>
                  </div>
                  {approval.status === "Pending" && (
                    <div className={styles.actions}>
                      <button
                        disabled={readOnly || busy}
                        onClick={() =>
                          void mutate({
                            action: "decide",
                            approvalId: approval.id,
                            decision: "Rejected",
                          })
                        }
                      >
                        <X size={16} />
                        Reject
                      </button>
                      <button
                        disabled={readOnly || busy}
                        onClick={() =>
                          void mutate({
                            action: "decide",
                            approvalId: approval.id,
                            decision: "Approved",
                          })
                        }
                      >
                        <Check size={16} />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default BotPortal;
