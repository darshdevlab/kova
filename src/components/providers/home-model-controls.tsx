"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ModelSelector } from "../platform/model-selector";
import { ProviderConnectionSelector } from "./provider-connection-selector";
import type { ProviderModel } from "../../lib/providers/types";
import styles from "./providers.module.css";

export type HomeModelControlsProps = {
  spaceId: string;
  model: string;
  onModelChange: (model: string) => void;
  connectionId: string;
  onConnectionChange: (connectionId: string) => void;
  onReadyChange?: (ready: boolean) => void;
};

export function HomeModelControls(props: HomeModelControlsProps) {
  return <WorkspaceModelControls key={props.spaceId} {...props} />;
}
export default HomeModelControls;

function WorkspaceModelControls({ spaceId, model, onModelChange, connectionId, onConnectionChange, onReadyChange }: HomeModelControlsProps) {
  const [catalog, setCatalog] = useState<{ connectionId: string; models: ProviderModel[]; error?: string; attempt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef({ model, onModelChange });
  useEffect(() => { latest.current = { model, onModelChange }; }, [model, onModelChange]);
  useEffect(() => {
    const controller = new AbortController();
    const url = connectionId
      ? `/api/providers/${encodeURIComponent(connectionId)}/catalog?spaceId=${encodeURIComponent(spaceId)}`
      : "/api/models";
    fetch(url, { signal: controller.signal, cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Model catalog unavailable.");
        if ((!connectionId && !data.live) || !Array.isArray(data.models)) throw Error("Live model catalog unavailable.");
        const models: ProviderModel[] = data.models.filter((entry: ProviderModel) => entry && typeof entry.id === "string" && entry.id.trim() && entry.id !== "auto");
        if (!models.length) throw Error("No models available for this connection.");
        if (controller.signal.aborted) return;
        setCatalog({ connectionId, models, attempt });
        const selected = latest.current.model;
        if (!(selected === "auto" && !connectionId) && !models.some(entry => entry.id === selected)) latest.current.onModelChange(models[0].id);
      })
      .catch(error => {
        if (!controller.signal.aborted) setCatalog({ connectionId, models: [], error: error instanceof Error ? error.message : "Model catalog unavailable.", attempt });
      });
    return () => controller.abort();
  }, [spaceId, connectionId, attempt]);
  const current = catalog?.connectionId === connectionId && catalog.attempt === attempt ? catalog : null;
  const ready = Boolean(current && !current.error && current.models.length &&
    ((!connectionId && model === "auto") || current.models.some(entry => entry.id === model)));
  useEffect(() => { onReadyChange?.(ready); }, [ready, onReadyChange]);

  return <div className={styles.homeControls} aria-busy={!current}>
    <ProviderConnectionSelector compact spaceId={spaceId} value={connectionId} onChange={id => {
      onReadyChange?.(false);
      setCatalog(null);
      onModelChange("");
      onConnectionChange(id);
    }} />
    {!connectionId ? <fieldset className={styles.homeModel} disabled={!current || Boolean(current.error)}><legend className={styles.visuallyHidden}>Model</legend><ModelSelector value={model || "Choose a model"} onChange={onModelChange} /></fieldset> :
      <label className={`${styles.selector} ${styles.compactModel}`}><span className={styles.visuallyHidden}>Model</span><select aria-label="Provider model" value={model} disabled={!current || Boolean(current.error)} onChange={event => onModelChange(event.target.value)}>
        {!current?.models.some(entry => entry.id === model) && <option value={model} disabled>{current?.error ? "Models unavailable" : "Loading models…"}</option>}
        {current?.models.map(entry => <option key={entry.id} value={entry.id}>{entry.name || entry.id}</option>)}
      </select></label>}
    {!current && <span className={styles.homeStatus} role="status">Loading model catalog…</span>}
    {current?.error && <div className={styles.homeStatus} role="alert"><span>{current.error}</span><button type="button" title="Retry model catalog" aria-label="Retry model catalog" onClick={() => { onReadyChange?.(false); setAttempt(value => value + 1); }}><RefreshCw size={16} /></button></div>}
  </div>;
}
