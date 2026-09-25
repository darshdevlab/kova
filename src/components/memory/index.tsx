"use client";

import { useEffect, useId, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { canApproveMemory, canProposeMemory, type MemoryRecord } from "@/lib/project-memory";
import styles from "./memory.module.css";

export type MemoryPanelProps = { spaceId: string; projectId?: string; botId?: string; role: string };
export function MemoryPanel(props: MemoryPanelProps) {
  // Remount on context changes so an old scope's results or draft cannot leak into another scope.
  return <ScopedMemoryPanel key={`${props.spaceId}:${props.projectId}:${props.botId}:${props.role}`} {...props} />;
}
function ScopedMemoryPanel({ spaceId, projectId, botId, role }: MemoryPanelProps) {
  const formId = useId();
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [serverRole, setServerRole] = useState("Viewer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<MemoryRecord | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [expiry, setExpiry] = useState("");
  const [stale, setStale] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const writable = canProposeMemory(role) && canProposeMemory(serverRole);
  const approver = canApproveMemory(role) && canApproveMemory(serverRole);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ spaceId, ...(projectId ? { projectId } : {}), ...(botId ? { botId } : {}) });
    fetch(`/api/memory?${params}`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Could not load memory.");
      setRecords(body.records); setServerRole(body.role); setError(""); setNow(Date.now());
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [spaceId, projectId, botId, reload]);

  function edit(record: MemoryRecord | "new") {
    setEditing(record); setTitle(record === "new" ? "" : record.title); setContent(record === "new" ? "" : record.content);
    setSource(record === "new" ? "" : record.source); setExpiry(record === "new" || !record.expires_at ? "" : record.expires_at.slice(0, 16));
    setStale(record === "new" ? false : record.stale);
  }
  async function mutate(action: "edit" | "approve" | "revoke" | "delete", record?: MemoryRecord) {
    setBusy(true); setError("");
    try {
      const draft = { title, content, source, stale, expiresAt: expiry ? new Date(`${expiry}Z`).toISOString() : null };
      const create = !record;
      const response = await fetch("/api/memory", { method: create ? "POST" : "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(create ? { spaceId, projectId, botId, draft } : { spaceId, id: record.id, version: record.version, action, ...(action === "edit" ? { draft } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Could not save memory.");
      setEditing(null); setLoading(true); setReload((value) => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not save memory."); }
    finally { setBusy(false); }
  }
  return <section className={styles.panel} aria-label="Scoped memory">
    <header className={styles.header}><div><h2>Memory</h2><p>{botId ? "Bot lessons" : projectId ? "Project lessons" : "Workspace lessons"}</p></div>
      <div className={styles.actions}><button type="button" title="Refresh memory" aria-label="Refresh memory" disabled={busy || loading} onClick={() => { setLoading(true); setReload((value) => value + 1); }}><RefreshCw size={16} /></button>
        {writable && <button type="button" disabled={busy || loading} onClick={() => edit("new")}><Plus size={16} />Propose lesson</button>}</div></header>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.toolbar}><label>Status <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All</option><option value="proposed">Proposed</option><option value="approved">Approved</option><option value="revoked">Revoked</option></select></label>{!writable && <span>Read only</span>}</div>
    {editing && <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void mutate("edit", editing === "new" ? undefined : editing); }}>
      <h3>{editing === "new" ? "Propose lesson" : `Edit version ${editing.version}`}</h3>
      <div className={styles.field}><label htmlFor={`${formId}-title`}>Title</label><input id={`${formId}-title`} required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
      <div className={styles.field}><label htmlFor={`${formId}-lesson`}>Lesson</label><textarea id={`${formId}-lesson`} required rows={4} maxLength={3000} value={content} onChange={(event) => setContent(event.target.value)} /></div>
      <div className={styles.field}><label htmlFor={`${formId}-source`}>Source</label><input id={`${formId}-source`} required maxLength={500} value={source} onChange={(event) => setSource(event.target.value)} /></div>
      <label>Expires at (UTC)<input type="datetime-local" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label>
      <label className={styles.check}><input type="checkbox" checked={stale} onChange={(event) => setStale(event.target.checked)} />Stale</label>
      <div className={styles.actions}><button disabled={busy} type="submit"><Check size={16} />{busy ? "Saving..." : "Save proposal"}</button><button disabled={busy} type="button" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    {loading ? <p role="status">Loading lessons...</p> : <div className={styles.list}>
      {records.filter((record) => filter === "all" || record.status === filter).map((record) => {
        const expired = Boolean(record.expires_at && Date.parse(record.expires_at) <= now);
        return <article key={record.id} className={styles.lesson}>
          <div className={styles.header}><h3>{record.title}</h3><span className={styles.status}>{record.status} · v{record.version}{record.stale ? " · stale" : ""}{expired ? " · expired" : ""}</span></div>
          <p className={styles.content}>{record.content}</p><p className={styles.meta}>Source: {record.source}</p>
          {record.expires_at && <p className={styles.meta}>Expires: {record.expires_at}</p>}
          {record.approved_by && <p className={styles.meta}>Approved by {record.approved_by} · {record.approved_at}</p>}
          <div className={styles.actions}>
            {writable && <button disabled={busy} title="Edit lesson" aria-label={`Edit ${record.title}`} onClick={() => edit(record)}><Pencil size={16} /></button>}
            {approver && <><button disabled={busy || record.status === "approved" || record.stale || expired} onClick={() => void mutate("approve", record)}><Check size={16} />Approve</button>
              <button disabled={busy || record.status === "revoked"} onClick={() => void mutate("revoke", record)}><X size={16} />Revoke</button>
              <button disabled={busy} title="Delete lesson" aria-label={`Delete ${record.title}`} onClick={() => { if (window.confirm(`Delete "${record.title}"? Version history will be retained.`)) void mutate("delete", record); }}><Trash2 size={16} /></button></>}
          </div>
          {record.history.length > 0 && <details><summary>Version history ({record.history.length})</summary>{[...record.history].reverse().map((version) => <div className={styles.version} key={version.version}><strong>v{version.version} · {version.status} · {version.title}</strong><p className={styles.content}>{version.content}</p><p>Source: {version.source}</p></div>)}</details>}
        </article>;
      })}
      {!records.some((record) => filter === "all" || record.status === filter) && <p className={styles.empty}>No {filter === "all" ? "" : `${filter} `}lessons in this scope.</p>}
    </div>}
  </section>;
}
