"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, KeyRound, LoaderCircle, Plus, RefreshCw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import type { ConnectionSummary, ProviderKind, ProviderListing, ProviderModel } from "../../lib/providers/types";
import styles from "./providers.module.css";

const names: Record<ProviderKind, string> = { openai: "OpenAI", anthropic: "Anthropic", openrouter: "OpenRouter", ollama: "Ollama", custom: "Custom endpoint" };
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data as T;
}

export function AIProvidersPanel({ spaceId, role }: { spaceId: string; role: string }) {
  // Remount on workspace change to discard credentials and in-flight UI state.
  return <ProviderWorkspace key={spaceId} spaceId={spaceId} role={role} />;
}
export default AIProvidersPanel;

function ProviderWorkspace({ spaceId, role }: { spaceId: string; role: string }) {
  const [listing, setListing] = useState<ProviderListing | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState<ConnectionSummary | "new" | null>(null);
  const [catalog, setCatalog] = useState<{ label: string; models: ProviderModel[] } | null>(null);
  const [search, setSearch] = useState("");
  const mounted = useRef(true);
  const query = `spaceId=${encodeURIComponent(spaceId)}`;
  const canManage = Boolean(listing?.canManage && ["Owner", "Admin"].includes(role));
  async function reload() {
    const data = await api<ProviderListing>(`/api/providers?${query}`);
    if (mounted.current) setListing(data);
  }
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    api<ProviderListing>(`/api/providers?spaceId=${encodeURIComponent(spaceId)}`, { signal: controller.signal }).then(setListing).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => { mounted.current = false; controller.abort(); };
  }, [spaceId]);
  async function run(key: string, action: () => Promise<void>) {
    setBusy(key); setError(""); setNotice("");
    try { await action(); } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : "Request failed."); }
    finally { if (mounted.current) setBusy(""); }
  }
  return <section className={styles.panel} aria-label="AI Providers">
    <header className={styles.header}><div><div className={styles.eyebrow}><ShieldCheck size={15} /> Workspace settings</div><h2>AI Providers</h2><p>Manage your workspace’s model connections.</p></div>
      <button className={styles.primary} disabled={!canManage || !listing?.available || Boolean(busy)} onClick={() => setEditing("new")}><Plus size={16} /> Add provider</button></header>
    {error && <div className={styles.error} role="alert">{error}<button title="Dismiss error" aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}
    {notice && <div className={styles.notice} role="status"><Check size={16} />{notice}</div>}
    {!listing && !error && <div className={styles.empty} role="status"><LoaderCircle className={styles.spin} size={22} /> Loading connections</div>}
    {!listing && error && <button onClick={() => run("reload", reload)} disabled={Boolean(busy)}><RefreshCw size={16} /> Retry</button>}
    {listing && !listing.available && <div className={styles.unavailable}><KeyRound size={24} /><h3>Provider management unavailable</h3><p>{listing.reason}</p><button onClick={() => run("reload", reload)} disabled={Boolean(busy)}><RefreshCw size={16} /> Check again</button></div>}
    {listing?.available && <>
      <div className={styles.bar}><span>{listing.connections.length} {listing.connections.length === 1 ? "connection" : "connections"}</span><span>{canManage ? "Owner / Admin access" : "Read-only access"}</span></div>
      {!listing.connections.length && <div className={styles.empty}><KeyRound size={26} /><h3>No providers connected</h3><p>{canManage ? "Add your first API connection." : "An Owner or Admin can add a provider."}</p></div>}
      <div className={styles.connections}>{listing.connections.map(connection => <article key={connection.id} className={styles.connection}>
        <div className={styles.identity}><span className={`${styles.mark} ${styles[connection.provider]}`} aria-hidden="true">{names[connection.provider].slice(0, 1)}</span><div><h3>{connection.label}</h3><p>{names[connection.provider]} <span aria-hidden="true">·</span> {connection.hasCredential ? "Credential saved" : "No API key"}</p><span className={styles.endpoint}>{connection.baseUrl}</span></div></div>
        <div className={styles.actions}>
          <button disabled={Boolean(busy)} onClick={() => run(`catalog-${connection.id}`, async () => { const result = await api<{ models: ProviderModel[] }>(`/api/providers/${connection.id}/catalog?${query}`); if (mounted.current) { setCatalog({ label: connection.label, models: result.models }); setSearch(""); } })}><ChevronDown size={16} /> Models</button>
          {canManage && <><button disabled={Boolean(busy)} onClick={() => run(`test-${connection.id}`, async () => { const result = await api<{ modelCount: number }>(`/api/providers/${connection.id}/test?${query}`, { method: "POST" }); if (mounted.current) setNotice(`Connected to ${connection.label}. ${result.modelCount} models discovered.`); })}>{busy === `test-${connection.id}` ? <LoaderCircle size={16} className={styles.spin} /> : <RefreshCw size={16} />} Test</button>
          <button disabled={Boolean(busy)} title="Edit connection or replace API key" aria-label={`Edit ${connection.label}`} onClick={() => setEditing(connection)}><KeyRound size={16} /></button>
          <button disabled={Boolean(busy)} title="Remove connection" aria-label={`Remove ${connection.label}`} onClick={() => { if (window.confirm(`Remove ${connection.label} from this workspace?`)) void run(`delete-${connection.id}`, async () => { await api(`/api/providers/${connection.id}?${query}`, { method: "DELETE" }); await reload(); setCatalog(null); }); }}><Trash2 size={16} /></button></>}
        </div>
      </article>)}</div>
      {busy && <p className={styles.progress} role="status"><LoaderCircle size={14} className={styles.spin} /> Contacting provider service…</p>}
      {catalog && <section className={styles.catalog} aria-label={`${catalog.label} models`}><div className={styles.catalogHeading}><h3>{catalog.label} models <span>{catalog.models.length}</span></h3><button title="Close catalog" aria-label="Close catalog" onClick={() => setCatalog(null)}><X size={16} /></button></div><label className={styles.search}><Search size={16} /><input aria-label="Search models" placeholder="Search models" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <ul>{catalog.models.filter(m => `${m.name} ${m.id}`.toLowerCase().includes(search.toLowerCase())).map(m => <li key={m.id}><div><strong>{m.name}</strong><code>{m.id}</code></div>{m.contextLength && <span>{m.contextLength.toLocaleString()} context</span>}</li>)}</ul>
        {!catalog.models.some(m => `${m.name} ${m.id}`.toLowerCase().includes(search.toLowerCase())) && <p className={styles.empty}>No matching models.</p>}
      </section>}
    </>}
    {editing && <ConnectionForm connection={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSave={async value => { await api("/api/providers", { method: "POST", body: JSON.stringify({ ...value, spaceId }) }); await reload(); setEditing(null); setNotice("Connection saved. Test it to verify provider access."); }} />}
  </section>;
}

function ConnectionForm({ connection, onClose, onSave }: { connection?: ConnectionSummary; onClose: () => void; onSave: (value: { id?: string; provider: ProviderKind; label: string; baseUrl?: string; apiKey?: string }) => Promise<void> }) {
  const [provider, setProvider] = useState<ProviderKind>(connection?.provider || "openai");
  const [label, setLabel] = useState(connection?.label || "");
  const [endpoint, setEndpoint] = useState(connection?.baseUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const secret = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const custom = provider === "custom" || provider === "ollama";
  return <dialog ref={dialog} className={styles.dialog} onCancel={e => { if (saving) e.preventDefault(); else onClose(); }} aria-labelledby="provider-form-title">
    <form onSubmit={async e => {
      e.preventDefault(); setSaving(true); setError("");
      const apiKey = secret.current?.value || undefined;
      if (secret.current) secret.current.value = "";
      try { await onSave({ id: connection?.id, provider, label, ...(custom ? { baseUrl: endpoint } : {}), apiKey }); }
      catch (e) { setError(e instanceof Error ? e.message : "Save failed."); }
      finally { setSaving(false); }
    }}>
      <div className={styles.catalogHeading}><h3 id="provider-form-title">{connection ? "Edit connection" : "Add provider"}</h3><button type="button" disabled={saving} aria-label="Close form" title="Close form" onClick={onClose}><X size={18} /></button></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <label>Provider<select value={provider} disabled={Boolean(connection) || saving} onChange={e => setProvider(e.target.value as ProviderKind)}>{Object.entries(names).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label>Connection name<input autoFocus required maxLength={80} value={label} disabled={saving} onChange={e => setLabel(e.target.value)} placeholder="Production workspace" /></label>
      {custom && <><label>HTTPS API base URL<input type="url" required value={endpoint} disabled={Boolean(connection) || saving} onChange={e => setEndpoint(e.target.value)} placeholder={provider === "ollama" ? "https://models.example.com" : "https://api.example.com/v1"} /></label><p className={styles.hint}>Public HTTPS endpoints only. Private-network and localhost connections are unavailable.</p></>}
      <label>{connection ? "Replace API key (optional)" : provider === "ollama" ? "API key (optional)" : "API key"}<input ref={secret} type="password" autoComplete="new-password" spellCheck={false} maxLength={8192} required={!connection && provider !== "ollama"} disabled={saving} placeholder={connection ? "Leave blank to keep current key" : "Enter API key"} /></label>
      <div className={styles.formFooter}><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button className={styles.primary} disabled={saving} type="submit">{saving ? <LoaderCircle size={16} className={styles.spin} /> : <Check size={16} />} Save connection</button></div>
    </form>
  </dialog>;
}
