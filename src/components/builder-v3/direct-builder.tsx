"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Activity, ArrowUp, Check, Code2, Download, Eye, History, LoaderCircle, MessageSquare, Monitor, Play, RefreshCw, Save, ShieldCheck, Smartphone, Undo2 } from "lucide-react";
import type { PlatformRecord, Role } from "@/lib/platform";
import { ModelSelector } from "@/components/platform/model-selector";
import { ProviderConnectionSelector } from "@/components/providers/provider-connection-selector";
import { initialBuilder, MAX_HTML, isDeliveryProject, deliveryReady, prdApproved } from "@/lib/build-context";
import type { ApprovedMemory, BuilderState } from "@/lib/build-context";
import { previewDocument, validateLocalHtml } from "./preview";
import styles from "./builder.module.css";
import { DeliveryReview, type ArtifactMutation } from "./delivery-review";
import Link from "next/link";

export type DirectBuilderProps = { project: PlatformRecord; role: Role; onSaved: (record: PlatformRecord) => void };
type Model = { id: string; name: string; provider?: string };
type Tab = "Preview" | "Code" | "Activity" | "Memory" | "PRD" | "TRD";
type RunState = "idle" | "requesting" | "saving" | "saved" | "error";
function clearHomeIntent(id: string) {
  try { sessionStorage.removeItem(`kova:build-start:${id}`); } catch { /* Storage may be disabled. */ }
}

export function DirectBuilder(props: DirectBuilderProps) {
  return <BuilderSession key={props.project.id} {...props} />;
}

function BuilderSession({ project, role, onSaved }: DirectBuilderProps) {
  const [record, setRecord] = useState(project);
  const [state, setState] = useState<BuilderState>(() => initialBuilder(project));
  const [draft, setDraft] = useState(() => initialBuilder(project).html);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>(() => isDeliveryProject(project) ? "PRD" : "Preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState(() => initialBuilder(project).routing?.requestedModel || initialBuilder(project).model || project.data.model || "auto");
  const [catalogStatus, setCatalogStatus] = useState("Loading model catalog...");
  const [connectionId, setConnectionId] = useState(() => initialBuilder(project).connectionId || "");
  const [memory, setMemory] = useState<ApprovedMemory[]>([]);
  const [memoryStatus, setMemoryStatus] = useState("Loading approved memory...");
  const [reviewLoaded, setReviewLoaded] = useState(!isDeliveryProject(project));
  const [contextVerified, setContextVerified] = useState(false);
  const [run, setRun] = useState<RunState>("idle");
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [previewKey, setPreviewKey] = useState(0);
  const busyRef = useRef(false);
  const onSavedRef = useRef(onSaved);
  const logEnd = useRef<HTMLDivElement>(null);
  const canEdit = role !== "Viewer";
  const busy = run === "requesting" || run === "saving";
  const dirty = draft !== state.html;
  const delivery = isDeliveryProject(record);
  const projectDelivery = isDeliveryProject(project);
  const ready = deliveryReady(state);
  const canBuild = canEdit && (!delivery || (reviewLoaded && ready && ["Owner", "Admin", "Developer"].includes(role)));
  const started = state.messages.some((entry) => entry.role === "assistant");
  const latest = state.messages.at(-1);
  const questions = latest?.role === "assistant" ? latest.questions || [] : [];
  const available = !catalogStatus && (model === "auto" && !connectionId ? models.length > 0 : models.some((entry) => entry.id === model));
  if (project.revision > record.revision && !busy) {
    const next = initialBuilder(project);
    setRecord(project); setState(next);
    if (!dirty) setDraft(next.html);
  }

  useEffect(() => { onSavedRef.current = onSaved; }, [onSaved]);
  useEffect(() => { logEnd.current?.scrollIntoView({ block: "nearest" }); }, [state.messages, run]);
  useEffect(() => {
    const controller = new AbortController();
    const url = connectionId ? `/api/providers/${encodeURIComponent(connectionId)}/catalog?spaceId=${encodeURIComponent(project.space_id)}` : "/api/models";
    void fetch(url, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw Error();
      const payload = await response.json();
      if ((!connectionId && !payload.live) || !Array.isArray(payload.models)) throw Error();
      const choices = payload.models.filter((entry: Model) => entry.id && entry.id !== "auto");
      setModels(choices);
      if (connectionId) setModel((current) => current || choices[0]?.id || "");
      setCatalogStatus("");
    }).catch(() => { if (!controller.signal.aborted) { clearHomeIntent(project.id); setCatalogStatus("Live model catalog unavailable. AI is unavailable until it returns."); } });
    return () => controller.abort();
  }, [connectionId, project.space_id, project.id]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/build-chat?projectId=${encodeURIComponent(project.id)}`, { signal: controller.signal }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Approved memory unavailable.");
      setMemory(payload.memory || []);
      setMemoryStatus("");
      setContextVerified(true);
      if (projectDelivery && !busyRef.current) {
        setRecord(payload.project); setState(initialBuilder(payload.project)); setReviewLoaded(true);
      }
    }).catch((reason) => { if (!controller.signal.aborted) { clearHomeIntent(project.id); setMemoryStatus(reason instanceof Error ? reason.message : "Approved memory unavailable."); } });
    return () => controller.abort();
  }, [project.id, project.space_id, projectDelivery]);

  function accept(saved: PlatformRecord) {
    const next = initialBuilder(saved);
    setRecord(saved); setState(next); setDraft(next.html); setValidation(null);
    onSavedRef.current(saved);
  }

  async function reload() {
    if (busyRef.current) return;
    busyRef.current = true;
    setRun("saving"); setError("");
    try {
      const response = await fetch(`/api/build-chat?projectId=${encodeURIComponent(project.id)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Reload failed.");
      // Preserve an unsaved draft so a conflict can be resolved without losing manual work.
      const preservedDraft = dirty ? draft : null;
      accept(payload.project);
      if (preservedDraft !== null) setDraft(preservedDraft);
      setMemory(payload.memory || []); setMemoryStatus(""); setRun("idle");
      setReviewLoaded(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Reload failed."); setRun("error"); }
    finally { busyRef.current = false; }
  }

  async function send(intent?: "build" | "draft-prd" | "draft-trd") {
    if (busyRef.current || !canEdit || !available || dirty) return;
    const answerText = questions.map((question) => answers[question.id]?.trim() ? `${question.text}\n${answers[question.id].trim()}` : "").filter(Boolean).join("\n\n");
    const prompt = [answerText, message.trim()].filter(Boolean).join("\n\n");
    if (started && !prompt && !intent) return;
    clearHomeIntent(record.id);
    busyRef.current = true;
    setRun("requesting"); setError("");
    try {
      const response = await fetch("/api/build-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: record.id, revision: record.revision, model, ...(connectionId ? { connectionId } : {}), intent: intent || (started ? "message" : "start"), ...(prompt ? { prompt } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Builder request failed.");
      accept(payload.project); setMemory(payload.memory || []); setMemoryStatus("");
      setMessage(""); setAnswers({}); setRun("saved");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Connection interrupted. Reload to check the saved state."); setRun("error"); }
    finally { busyRef.current = false; }
  }

  const startFromHome = useEffectEvent(() => { void send(); });
  useEffect(() => {
    if (!contextVerified || !available || busy || !canEdit) return;
    const timer = setTimeout(() => {
      const key = `kova:build-start:${project.id}`;
      try {
        if (!sessionStorage.getItem(key)) return;
        sessionStorage.removeItem(key);
      } catch { return; }
      if (!started) startFromHome();
    }, 0);
    return () => clearTimeout(timer);
  }, [contextVerified, available, busy, canEdit, started, project.id]);

  async function saveCode(snapshotId?: string) {
    if (busyRef.current || !canBuild) return;
    busyRef.current = true;
    setRun("saving"); setError("");
    try {
      const response = await fetch("/api/build-chat", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: record.id, revision: record.revision, ...(snapshotId ? { action: "rollback", snapshotId } : { action: "edit", html: draft }) }),
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Code could not be saved.");
      accept(payload.project); setRun("saved");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Code could not be saved."); setRun("error"); }
    finally { busyRef.current = false; }
  }

  async function saveArtifact(mutation: ArtifactMutation) {
    if (busyRef.current) return;
    busyRef.current = true; setRun("saving"); setError("");
    try {
      const response = await fetch("/api/build-chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: record.id, revision: record.revision, ...mutation }) });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Document update failed.");
      accept(payload.project); setRun("saved");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Document update failed."); setRun("error"); }
    finally { busyRef.current = false; }
  }

  function exportHtml() {
    const url = URL.createObjectURL(new Blob([previewDocument(draft)], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${record.data.title.replace(/[^a-z0-9_-]+/gi, "-") || "project"}.html`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const status = run === "requesting" ? "Waiting for AI response" : run === "saving" ? "Saving / loading project" : run === "saved" ? "Saved" : run === "error" ? "Request failed" : "Ready";
  return <section className={styles.root} aria-label="Direct builder">
    <aside className={styles.conversation}>
      <header className={styles.heading}><div><span className={styles.eyebrow}>{["delivery", "product"].includes((record.data as { deliveryMode?: string }).deliveryMode || "direct") ? "PRODUCT DELIVERY" : "DIRECT BUILD"}</span><h2>{record.data.title}</h2>{record.data.workspace && <Link className={styles.toolsLink} href={`/workspace/${record.id}`}>Project tools</Link>}</div><MessageSquare size={19} /></header>
      <div className={styles.messages} role="log" aria-label="Build conversation">
        {state.messages.map((entry) => <article key={entry.id} className={entry.role === "user" ? styles.userMessage : styles.assistantMessage}>
          <div className={styles.messageMeta}>{entry.role === "user" ? "You" : "Kova"}{entry.model && <span>{entry.model}</span>}</div>
          <p>{entry.content}</p>
          {entry.action === "build" && <span className={styles.savedTag}><Check size={13} /> HTML saved</span>}
        </article>)}
        {!started && <p className={styles.ready}>Ready when you are.</p>}
        {questions.length > 0 && <div className={styles.questions}>{questions.map((question) => <fieldset key={question.id} disabled={busy || !canEdit}>
          <legend>{question.text}</legend>
          {question.options?.map((option) => <label className={styles.choice} key={option}><input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => setAnswers({ ...answers, [question.id]: option })} />{option}</label>)}
          <input className={styles.answer} aria-label={`Answer: ${question.text}`} placeholder="Your answer" value={answers[question.id] || ""} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} maxLength={2000} />
        </fieldset>)}</div>}
        {run === "requesting" && <p className={styles.waiting}><LoaderCircle size={16} className={styles.spin} /> Waiting for {models.find((entry) => entry.id === model)?.name || model}</p>}
        <div ref={logEnd} />
      </div>
      <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); void send(); }}>
        {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => void reload()} disabled={busy}><RefreshCw size={14} /> Reload saved state</button></div>}
        {dirty && <p className={styles.notice}>Save or discard your code draft before sending.</p>}
        <textarea aria-label="Message to builder" placeholder={started ? "What would you like to change?" : "Anything else to add?"} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={8000} disabled={!canEdit || busy} rows={3} />
        <div className={styles.modelRow}><ProviderConnectionSelector spaceId={project.space_id} value={connectionId} onChange={(id) => { setConnectionId(id); setModel(id ? "" : "auto"); setModels([]); setCatalogStatus("Loading model catalog..."); }} disabled={!canEdit || busy} /></div>
        <div className={styles.modelRow}><label htmlFor={connectionId ? `model-${record.id}` : undefined}>Model</label>
          {!connectionId ? <fieldset disabled={!canEdit || busy} className={styles.modelPicker}><ModelSelector value={model || "Choose a model"} onChange={setModel} /></fieldset> : <select id={`model-${record.id}`} value={model} onChange={(event) => setModel(event.target.value)} disabled={!canEdit || busy || models.length === 0}>
            <option value="">Choose a model</option>
            {model && !available && <option value={model}>{model} (unavailable)</option>}
            {models.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>}
        </div>
        {state.routing && <p className={styles.routing}>Last response: {state.routing.selectedModel}</p>}
        {catalogStatus && <p className={styles.notice} role="status">{catalogStatus}</p>}
        <div className={styles.composerFooter}><span role="status">{busy ? <LoaderCircle size={13} className={styles.spin} /> : <span className={styles.statusDot} />}{canEdit ? status : "View only"}</span>
          <button className={styles.primary} type="submit" disabled={!canEdit || busy || !available || dirty || (started && !message.trim() && !Object.values(answers).some((answer) => answer.trim()))}>
            {started ? <><ArrowUp size={16} /> Send</> : delivery ? <><MessageSquare size={15} /> Discuss requirements</> : <><Play size={15} /> Start building</>}
          </button>
        </div>
      </form>
    </aside>
    <section className={styles.workspace} aria-label="Build output">
      {delivery && <div className={styles.deliveryGate}><span>{reviewLoaded ? `PRD ${prdApproved(state) ? "approved" : "pending"} / TRD ${ready ? "approved" : "pending"}` : "Protected reviews unavailable or loading"}</span><button type="button" className={styles.primary} disabled={!canBuild || busy || !available || dirty} onClick={() => { setTab("Preview"); void send("build"); }}><Play size={15} />Build approved plan</button></div>}
      <header className={styles.toolbar}><div className={styles.tabs} role="tablist" aria-label="Build views">
        {delivery && (["PRD", "TRD"] as const).map((name) => <button type="button" role="tab" aria-selected={tab === name} aria-controls={`builder-${name}`} id={`builder-tab-${name}`} key={name} onClick={() => setTab(name)} className={tab === name ? styles.activeTab : ""}>{name}</button>)}
        {([['Preview', Eye], ['Code', Code2], ['Activity', Activity], ['Memory', ShieldCheck]] as const).map(([name, Icon]) => <button type="button" role="tab" aria-selected={tab === name} aria-controls={`builder-${name}`} id={`builder-tab-${name}`} key={name} onClick={() => setTab(name)} className={tab === name ? styles.activeTab : ""}><Icon size={15} />{name}</button>)}
      </div><button type="button" className={styles.iconButton} title="Export HTML" aria-label="Export HTML" disabled={!draft} onClick={exportHtml}><Download size={17} /></button></header>
      <div className={styles.panel} role="tabpanel" id={`builder-${tab}`} aria-labelledby={`builder-tab-${tab}`}>
        {delivery && (tab === "PRD" || tab === "TRD") && <DeliveryReview key={`${tab}-${state.delivery?.[tab === "PRD" ? "prd" : "trd"]?.version || 0}`} state={state} kind={tab === "PRD" ? "prd" : "trd"} role={role} busy={busy || !reviewLoaded} aiAvailable={available && !dirty} onSave={(mutation) => void saveArtifact(mutation)} onDraft={() => void send(tab === "PRD" ? "draft-prd" : "draft-trd")} />}
        {tab === "Preview" && <>
          <div className={styles.previewToolbar}><span><span className={styles.statusDot} /> Browser preview</span><div>
            <button type="button" className={styles.iconButton} title="Desktop preview" aria-label="Desktop preview" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={16} /></button>
            <button type="button" className={styles.iconButton} title="Mobile preview" aria-label="Mobile preview" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={16} /></button>
            <button type="button" className={styles.iconButton} title="Restart preview" aria-label="Restart preview" onClick={() => setPreviewKey(previewKey + 1)}><RefreshCw size={15} /></button>
          </div></div>
          <div className={styles.previewCanvas}>{state.html ? <iframe key={previewKey} title="Generated app preview" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={previewDocument(state.html)} className={device === "mobile" ? styles.mobileFrame : styles.frame} /> : <div className={styles.empty}><div className={styles.emptyWindow}><div><i /><i /><i /></div><Code2 size={32} strokeWidth={1.2} /></div><h3>Your first version starts here</h3><span>No build yet</span></div>}</div>
          <footer className={styles.previewFooter}><ShieldCheck size={13} /> Sandboxed HTML <span>Backend not connected</span></footer>
        </>}
        {tab === "Code" && <div className={styles.codePanel}>
          <div className={styles.codeToolbar}><span>index.html {dirty && <b>Unsaved</b>}</span><div>
            <button type="button" title="Discard unsaved edits" aria-label="Discard unsaved edits" className={styles.iconButton} disabled={!dirty || busy} onClick={() => { setDraft(state.html); setValidation(null); }}><Undo2 size={16} /></button>
            <button type="button" onClick={() => setValidation(validateLocalHtml(draft))} disabled={!draft}><ShieldCheck size={15} /> Validate HTML</button>
            <button type="button" title="Save code" aria-label="Save code" className={styles.iconButton} disabled={!canBuild || busy || !dirty} onClick={() => void saveCode()}><Save size={16} /></button>
          </div></div>
          <textarea className={styles.code} aria-label="HTML source" spellCheck={false} value={draft} onChange={(event) => { setDraft(event.target.value); setValidation(null); }} maxLength={MAX_HTML} readOnly={!canBuild || busy} />
          {validation !== null && <div className={styles.validation} role="status"><strong>Local HTML checks only</strong><p>These checks do not execute JavaScript or test a backend.</p>{validation.length ? <ul>{validation.map((finding) => <li key={finding}>{finding}</li>)}</ul> : <p>No issues found by the limited document checks.</p>}</div>}
        </div>}
        {tab === "Activity" && <div className={styles.listPanel}><h3>Activity</h3>{state.routing && <p><strong>{state.routing.selectedModel}</strong><br />{state.routing.reason}{state.routing.priceCeiling !== undefined && ` Ceiling: $${state.routing.priceCeiling} per million input/output tokens.`}</p>}{state.activity.length === 0 && <p>No saved activity yet.</p>}
          {[...state.activity].reverse().map((event) => <div className={styles.event} key={event.id}><Check size={16} /><div>{event.label}<time>{new Date(event.createdAt).toLocaleString()}</time></div></div>)}
          <h3>Saved revisions</h3>{state.snapshots.length === 0 && <p>No earlier HTML revisions.</p>}
          {[...state.snapshots].reverse().map((snapshot) => <div className={styles.event} key={snapshot.id}><History size={16} /><div>{snapshot.label}<time>{new Date(snapshot.createdAt).toLocaleString()}</time></div><button type="button" title="Restore this revision" aria-label={`Restore ${snapshot.label}`} className={styles.iconButton} disabled={!canBuild || busy || dirty} onClick={() => void saveCode(snapshot.id)}><Undo2 size={16} /></button></div>)}
        </div>}
        {tab === "Memory" && <div className={styles.listPanel}><h3>Approved project memory</h3>{memoryStatus ? <p role="status">{memoryStatus}</p> : memory.length === 0 ? <p>No approved memory for this project.</p> : memory.map((item) => <article className={styles.memory} key={item.id}><h4><ShieldCheck size={15} />{item.title}</h4><p>{item.content}</p></article>)}</div>}
      </div>
    </section>
  </section>;
}
