"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  Check,
  ChevronDown,
  Clipboard,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
  History,
  ImagePlus,
  LoaderCircle,
  Maximize2,
  MessageSquareText,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Paperclip,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Undo2,
  X,
} from "lucide-react";
import { CODE_FILES, CODE_SAMPLE, FALLBACK_MODELS, INITIAL_MESSAGES } from "@/lib/demo-data";
import type { ChatMessage, KovaProject, ModelChoice } from "@/lib/types";
import { ProductPreview } from "@/components/workspace/product-preview";

type BuildWorkspaceProps = { project: KovaProject };
type BuildStage = "Understanding" | "Planning" | "Building" | "Testing" | "Complete";

const STAGES: BuildStage[] = ["Understanding", "Planning", "Building", "Testing", "Complete"];

export function BuildWorkspace({ project }: BuildWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<ModelChoice[]>(FALLBACK_MODELS);
  const [model, setModel] = useState("auto");
  const [showModels, setShowModels] = useState(false);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<BuildStage>("Complete");
  const [workspaceTab, setWorkspaceTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [version, setVersion] = useState(1);
  const [selection, setSelection] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState(CODE_FILES[0]);
  const abortRef = useRef<AbortController | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((response) => response.json())
      .then((payload: { models?: ModelChoice[] }) => {
        if (payload.models?.length) setModels(payload.models);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const selectedModel = useMemo(
    () => models.find((item) => item.id === model) ?? FALLBACK_MODELS[0],
    [model, models],
  );

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function sendPrompt() {
    const value = prompt.trim();
    if (!value || running) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: value, meta: "Just now" };
    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setRunning(true);
    setStage("Understanding");
    abortRef.current = new AbortController();

    const request = fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortRef.current.signal,
      body: JSON.stringify({ prompt: value, model, mode: project.mode, projectName: project.name }),
    }).then(async (response) => {
      const payload = (await response.json()) as { content?: string; model?: string; funding?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Build request failed");
      return payload;
    });

    try {
      for (const nextStage of STAGES.slice(1, -1)) {
        await wait(320);
        if (abortRef.current?.signal.aborted) return;
        setStage(nextStage);
      }
      const result = await request;
      setStage("Complete");
      setVersion((current) => current + 1);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content ?? "The requested change is ready to review.",
        meta: `${result.model ?? selectedModel.name} · ${result.funding ?? "Demo"} · 6 files changed`,
      }]);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: "The model request did not complete. Your project remains unchanged; retry when the connection is ready.", meta: "No changes applied" }]);
      }
      setStage("Complete");
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stopBuild() {
    abortRef.current?.abort();
    setRunning(false);
    setStage("Complete");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: "Build stopped. No incomplete changes were applied.", meta: "Restored last checkpoint" }]);
  }

  return (
    <div className={`build-workspace ${selection ? "has-selection" : ""}`}>
      <section className="conversation-panel" aria-label="Build conversation">
        <header className="panel-header"><div><MessageSquareText aria-hidden="true" /><span><strong>Build</strong><small>Project conversation</small></span></div><div><button className="icon-button ghost" type="button" aria-label="Conversation history"><History aria-hidden="true" /></button><button className="icon-button ghost" type="button" aria-label="More conversation actions"><MoreHorizontal aria-hidden="true" /></button></div></header>
        <div className="conversation-scroll">
          <div className="conversation-date"><span>Today</span></div>
          {messages.map((message) => (
            <article className={`chat-message ${message.role}`} key={message.id}>
              <div className="message-author">{message.role === "assistant" ? <span className="assistant-avatar"><Sparkles aria-hidden="true" /></span> : <span className="user-avatar">D</span>}<strong>{message.role === "assistant" ? "Kova" : "You"}</strong><time>{message.role === "assistant" ? "Agent" : "Member"}</time></div>
              <p>{message.content}</p>
              {message.meta ? <div className="message-meta">{message.meta}</div> : null}
              {message.role === "assistant" ? <div className="message-actions"><button type="button"><Copy aria-hidden="true" />Copy</button><button type="button"><RotateCcw aria-hidden="true" />Retry</button></div> : null}
            </article>
          ))}
          {running ? <div className="build-progress" aria-live="polite"><div className="build-progress-head"><span><LoaderCircle className="spin" aria-hidden="true" />Kova is building</span><strong>{stage}</strong></div><div className="build-stage-list">{STAGES.slice(0, -1).map((item, index) => { const currentIndex = STAGES.indexOf(stage); return <div key={item} className={index < currentIndex ? "is-done" : index === currentIndex ? "is-active" : ""}><span>{index < currentIndex ? <Check aria-hidden="true" /> : index + 1}</span><p><strong>{item}</strong><small>{item === "Understanding" ? "Mapping intent and context" : item === "Planning" ? "Identifying affected resources" : item === "Building" ? "Updating the product slice" : "Running focused checks"}</small></p></div>; })}</div></div> : null}
          <div ref={conversationEndRef} />
        </div>
        <div className="composer-wrap">
          <div className="composer-context"><button type="button"><AtSign aria-hidden="true" />2 context items</button><span>Draft saved</span></div>
          <div className="composer">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendPrompt(); } }} placeholder="Ask Kova to build, change, diagnose or test…" rows={3} aria-label="Build prompt" />
            <div className="composer-toolbar">
              <div><button className="composer-icon" type="button" aria-label="Attach file" title="Attach file"><Paperclip aria-hidden="true" /></button><button className="composer-icon" type="button" aria-label="Attach screenshot" title="Attach screenshot"><ImagePlus aria-hidden="true" /></button></div>
              <div className="composer-send-group">
                <div className="model-picker">
                  <button type="button" onClick={() => setShowModels((value) => !value)} aria-expanded={showModels}><Sparkles aria-hidden="true" /><span>{selectedModel.name}</span><ChevronDown aria-hidden="true" /></button>
                  {showModels ? <div className="model-menu"><div className="model-menu-head"><strong>Select build model</strong><small>OpenRouter catalog</small></div><label><Search aria-hidden="true" /><input placeholder="Search models" /></label>{models.slice(0, 8).map((item) => <button type="button" key={item.id} className={model === item.id ? "is-selected" : ""} onClick={() => { setModel(item.id); setShowModels(false); }}><span><strong>{item.name}</strong><small>{item.provider} · {item.description}</small></span><em>{item.speed}</em>{model === item.id ? <Check aria-hidden="true" /> : null}</button>)}</div> : null}
                </div>
                {running ? <button className="send-button stop" type="button" onClick={stopBuild} aria-label="Stop build"><Square aria-hidden="true" /></button> : <button className="send-button" type="button" onClick={() => void sendPrompt()} disabled={!prompt.trim()} aria-label="Send prompt"><Send aria-hidden="true" /></button>}
              </div>
            </div>
          </div>
          <p className="composer-help">Kova can make mistakes. Review diffs and evidence before shipping.</p>
        </div>
      </section>

      <section className="canvas-panel" aria-label="Project output">
        <header className="canvas-header">
          <div className="canvas-tabs" role="tablist"><button type="button" className={workspaceTab === "preview" ? "is-active" : ""} onClick={() => setWorkspaceTab("preview")}><Eye aria-hidden="true" />Preview</button><button type="button" className={workspaceTab === "code" ? "is-active" : ""} onClick={() => setWorkspaceTab("code")}><Code2 aria-hidden="true" />Code</button></div>
          <div className="canvas-actions">
            {workspaceTab === "preview" ? <div className="device-picker" role="group" aria-label="Preview device"><button type="button" className={device === "desktop" ? "is-active" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop preview"><Monitor aria-hidden="true" /></button><button type="button" className={device === "tablet" ? "is-active" : ""} onClick={() => setDevice("tablet")} aria-label="Tablet preview"><Tablet aria-hidden="true" /></button><button type="button" className={device === "mobile" ? "is-active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile preview"><Smartphone aria-hidden="true" /></button></div> : null}
            <button className="icon-button ghost" type="button" aria-label="Undo"><Undo2 aria-hidden="true" /></button><button className="icon-button ghost" type="button" aria-label="Refresh"><RefreshCw aria-hidden="true" /></button><button className="icon-button ghost" type="button" aria-label="Open preview"><ExternalLink aria-hidden="true" /></button><button className="icon-button ghost" type="button" aria-label="Full screen"><Maximize2 aria-hidden="true" /></button>
          </div>
        </header>
        {workspaceTab === "preview" ? (
          <div className="preview-stage">
            <div className="preview-address"><span><i />relaydesk.kova-preview.app</span><button type="button"><Clipboard aria-hidden="true" /></button></div>
            <div className={`preview-frame ${device}`}><ProductPreview version={version} onSelect={setSelection} /></div>
            <div className="preview-status"><span><i />Preview ready</span><span>Viewport {device === "desktop" ? "1440" : device === "tablet" ? "768" : "390"}px</span><button type="button"><MousePointer2 aria-hidden="true" />Select to edit</button></div>
          </div>
        ) : (
          <div className="code-workspace"><aside><div className="code-sidebar-title"><span>Explorer</span><button type="button">•••</button></div><strong>RELAYDESK</strong>{CODE_FILES.map((file) => <button type="button" key={file} className={activeFile === file ? "is-active" : ""} onClick={() => setActiveFile(file)}><FileCode2 aria-hidden="true" /><span>{file}</span></button>)}</aside><section><header><span><FileCode2 aria-hidden="true" />{activeFile}</span><span>TypeScript React</span></header><pre aria-label="Source code"><code>{CODE_SAMPLE.split("\n").map((line, index) => <span key={`${index}-${line}`}><i>{index + 1}</i>{line}{"\n"}</span>)}</code></pre><footer><span>main*</span><span>Ln 8, Col 12</span><span>UTF-8</span></footer></section></div>
        )}
      </section>

      {selection ? <aside className="selection-panel" aria-label="Selected preview element"><header><div><MousePointer2 aria-hidden="true" /><span><strong>Context Lens</strong><small>Selected in preview</small></span></div><button className="icon-button ghost" type="button" onClick={() => setSelection(null)} aria-label="Close selection"><X aria-hidden="true" /></button></header><div className="selection-summary"><span className="eyebrow">Selected element</span><h2>{selection}</h2><p>Connected to <code>components/ticket-queue.tsx</code> and 3 verification checks.</p></div><div className="scope-control"><span>Change scope</span><div><button className="is-active" type="button">This element</button><button type="button">Component</button><button type="button">Journey</button></div></div><div className="selection-actions"><button type="button" onClick={() => { setPrompt(`Change ${selection} to make its status clearer without changing the shared design system.`); setSelection(null); }}><Sparkles aria-hidden="true" /><span><strong>Ask a change</strong><small>Describe the desired outcome</small></span></button><button type="button"><Play aria-hidden="true" /><span><strong>Test this</strong><small>Run linked verification</small></span></button><button type="button"><Code2 aria-hidden="true" /><span><strong>Open code</strong><small>Jump to implementation</small></span></button></div><div className="truth-state"><span><Check aria-hidden="true" />Tested</span><p>3/3 linked checks passed on this version.</p></div></aside> : null}
    </div>
  );
}
