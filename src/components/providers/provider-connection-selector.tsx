"use client";
import { useEffect, useState } from "react";
import type { ConnectionSummary, ProviderListing } from "../../lib/providers/types";
import styles from "./providers.module.css";

export function ProviderConnectionSelector({ spaceId, value, onChange, disabled = false, compact = false }: {
  spaceId: string; value: string; onChange: (connectionId: string, connection: ConnectionSummary | null) => void; disabled?: boolean; compact?: boolean;
}) {
  const [state, setState] = useState<{ spaceId: string; listing?: ProviderListing; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/providers?spaceId=${encodeURIComponent(spaceId)}`, { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw Error(data.error || "Could not load providers."); return data as ProviderListing; })
      .then(listing => setState({ spaceId, listing }))
      .catch(error => { if (!controller.signal.aborted) setState({ spaceId, error: error.message }); });
    return () => controller.abort();
  }, [spaceId]);
  const current = state?.spaceId === spaceId ? state : null;
  const connections = current?.listing?.connections || [];
  const unavailable = current?.error || (current?.listing?.available === false ? current.listing.reason : "");
  return <label className={`${styles.selector} ${compact ? styles.compactSelector : ""}`}><span className={compact ? styles.visuallyHidden : undefined}>Provider connection</span>
    <select aria-label="Provider connection" value={value} disabled={disabled || !current} onChange={e => onChange(e.target.value, connections.find(c => c.id === e.target.value) || null)}>
      <option value="">Platform OpenRouter</option>
      {value && !connections.some(c => c.id === value) && <option value={value} disabled>Connection unavailable</option>}
      {connections.map(c => <option key={c.id} value={c.id}>{c.label} ({c.provider})</option>)}
    </select>
    {!current && <span role="status">Loading connections…</span>}
    {unavailable && <span role="status">{unavailable}</span>}
  </label>;
}
