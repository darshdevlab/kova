"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  AtSign,
  Bot,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  History,
  Maximize2,
  Monitor,
  MousePointer2,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  X,
} from "lucide-react";
import { FALLBACK_MODELS } from "@/lib/demo-data";
import type { KovaProject, ModelChoice } from "@/lib/types";
import { downloadFile, useWorkspace } from "@/lib/workspace-state";
import { Modal } from "@/components/ui";
import { ProductPreview } from "./product-preview";

export function BuildWorkspace({ project }: { project: KovaProject }) {
  const { state, update, notify, log, navigate } = useWorkspace();
  const [models, setModels] = useState<ModelChoice[]>(FALLBACK_MODELS);
  const [showModels, setShowModels] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">(
    project.mode === "Developer" ? "code" : "preview",
  );
  const [device, setDevice] = useState("desktop");
  const [selection, setSelection] = useState<string | null>(null);
  const [scope, setScope] = useState("Element");
  const [context, setContext] = useState(false);
  const [history, setHistory] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("Preview");
  const [previewKey, setPreviewKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/models", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.models?.length) setModels(payload.models);
      })
      .catch(() => undefined);
    return () => {
      controller.abort();
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state.messages.length, running]);
  const selectedModel =
    models.find((item) => item.id === state.model) || FALLBACK_MODELS[0];
  async function send(
    value = state.draft.trim(),
    task: "chat" | "ui" = "chat",
  ) {
    if (!value || running) return;
    const nextMessages = [
      ...state.messages,
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: value,
        meta: `${selectedModel.name}${attachments.length ? ` / ${attachments.length} attachments` : ""}`,
      },
    ];
    update({ messages: nextMessages, draft: "" });
    setRunning(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: value,
          model: state.model,
          mode: project.mode,
          projectName: project.name,
          projectId: project.id,
          task,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "The model request failed");
      if (controller.signal.aborted) return;
      update({
        ...(result.html
          ? {
              previewHtml: result.html,
              previousPreviewHtml: state.previewHtml,
              sourceCode: result.html,
            }
          : {}),
        messages: [
          ...nextMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.content,
            meta:
              result.funding === "Demo"
                ? "Local prototype response / no repository changes"
                : `${result.model} / ${result.html ? "Generated HTML prototype" : "AI response only"}`,
          },
        ],
        version: state.version + 1,
        verifiedVersion: 0,
        reviewVersion: 0,
      });
      log(
        "Build conversation updated",
        `Version ${state.version + 1}. ${result.funding === "Demo" ? "Local response" : "OpenRouter response"}.`,
        "Build",
      );
      setAttachments([]);
      if (result.html) setTab("preview");
    } catch (error) {
      update({ draft: value });
      if ((error as Error).name !== "AbortError")
        notify((error as Error).message);
    } finally {
      setRunning(false);
      abort.current = null;
    }
  }
  return (
    <div
      className={`build-workspace ${expanded ? "preview-expanded" : ""}`}
      data-mobile-panel={mobilePanel}
    >
      <div className="mobile-build-tabs">
        {["Preview", "Conversation"].map((item) => (
          <button
            key={item}
            className={mobilePanel === item ? "is-active" : ""}
            onClick={() => setMobilePanel(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="conversation-panel" aria-label="Build conversation">
        <header className="panel-header">
          <div>
            <span className="assistant-symbol">
              <Sparkles />
            </span>
            <strong>Build with Kova</strong>
          </div>
          <button
            className="icon-button ghost"
            onClick={() => setHistory(true)}
            aria-label="Conversation history"
            title="Conversation history"
          >
            <History />
          </button>
        </header>
        <div className="conversation-scroll">
          <div className="conversation-intro">
            <span className="eyebrow">Your starting point</span>
            <h2>{project.name}</h2>
            <p>{state.brief}</p>
            <button className="text-button" onClick={() => navigate("plan")}>
              Review the plan
              <ArrowRight />
            </button>
          </div>
          <article className="chat-message assistant">
            <div className="message-author">
              <span className="assistant-avatar">
                <Sparkles />
              </span>
              <strong>Kova</strong>
              <span>Workspace ready</span>
            </div>
            <p>
              Your project context is in place. Explore the sample preview,
              refine the brief, or configure the agents and data behind your
              application.
            </p>
            <div className="build-artifact">
              <span className="resource-icon">
                <Code2 />
              </span>
              <div>
                <strong>Application preview</strong>
                <small>Interactive sample / v{state.version}</small>
              </div>
              <Check />
            </div>
            <div className="suggestion-list">
              <button onClick={() => navigate("agents")}>
                <Bot />
                Configure agents
                <ArrowRight />
              </button>
              <button onClick={() => navigate("data")}>
                <AtSign />
                Set up data
                <ArrowRight />
              </button>
            </div>
          </article>
          {state.messages.map((message) => (
            <article
              className={`chat-message ${message.role}`}
              key={message.id}
            >
              <div className="message-author">
                <span
                  className={
                    message.role === "assistant"
                      ? "assistant-avatar"
                      : "user-avatar"
                  }
                >
                  {message.role === "assistant" ? <Sparkles /> : "D"}
                </span>
                <strong>{message.role === "assistant" ? "Kova" : "You"}</strong>
              </div>
              <p>{message.content}</p>
              <small className="message-meta">{message.meta}</small>
              {message.role === "assistant" && (
                <div className="message-actions">
                  <button
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(message.content)
                        .then(() => notify("Response copied"))
                        .catch(() => notify("Clipboard unavailable"))
                    }
                  >
                    <Copy />
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      const previous = state.messages
                        .slice(0, state.messages.indexOf(message))
                        .filter((item) => item.role === "user")
                        .at(-1);
                      if (previous) void send(previous.content);
                    }}
                  >
                    <RotateCcw />
                    Retry
                  </button>
                </div>
              )}
            </article>
          ))}
          {running && (
            <div className="building-indicator" role="status">
              <span className="pulse-dot" />
              Kova is responding
              <button
                className="text-button"
                onClick={() => {
                  abort.current?.abort();
                  setRunning(false);
                  notify("Response stopped");
                }}
              >
                Stop
              </button>
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="composer-wrap">
          <div className="composer-context">
            <button onClick={() => setContext(true)}>
              <AtSign />
              {state.context.length} context sources
            </button>
            <button
              disabled={running}
              onClick={() =>
                void send(
                  state.draft.trim() ||
                    `Build a responsive HTML prototype for: ${state.brief}`,
                  "ui",
                )
              }
            >
              <Sparkles />
              Generate UI
            </button>
          </div>
          <div className="composer">
            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((name) => (
                  <span key={name}>
                    <Paperclip size={12} />
                    {name}
                    <button
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item !== name),
                        )
                      }
                      aria-label={`Remove attachment ${name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              value={state.draft}
              onChange={(e) => update({ draft: e.target.value })}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="What should we work on next?"
              aria-label="Build prompt"
              rows={3}
            />
            <div className="composer-toolbar">
              <input
                type="file"
                ref={fileInput}
                hidden
                multiple
                accept=".txt,.md,.json,.csv,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.some((file) => file.size > 5_000_000)) {
                    notify("Choose files under 5 MB");
                    return;
                  }
                  const names = files.map((file) => file.name);
                  setAttachments((current) => [
                    ...new Set([...current, ...names]),
                  ]);
                  update({
                    context: [
                      ...new Set([
                        ...state.context,
                        ...names.map((name) => `Attachment reference: ${name}`),
                      ]),
                    ],
                  });
                  notify(
                    "File references attached. File content is not sent to the model.",
                  );
                  e.target.value = "";
                }}
              />
              <button
                className="icon-button ghost"
                onClick={() => fileInput.current?.click()}
                aria-label="Attach file"
                title="Attach file"
              >
                <Paperclip />
              </button>
              <button
                className="model-trigger"
                onClick={() => setShowModels(true)}
              >
                <Sparkles />
                <span>{selectedModel.name}</span>
                <ChevronDown />
              </button>
              <button
                className="send-button"
                onClick={() => (running ? abort.current?.abort() : void send())}
                disabled={!running && !state.draft.trim()}
                aria-label={running ? "Stop response" : "Send prompt"}
              >
                {running ? <Square /> : <ArrowUp />}
              </button>
            </div>
          </div>
          <div className="composer-footnote">
            <span className="status-dot" />
            Cloud project<span>Save project to sync editor changes</span>
          </div>
        </div>
      </section>
      <section className="canvas-panel" aria-label="Project output">
        <header className="canvas-header">
          <div className="canvas-tabs">
            {(["preview", "code"] as const).map((item) => (
              <button
                className={tab === item ? "is-active" : ""}
                key={item}
                onClick={() => setTab(item)}
              >
                {item === "preview" ? <Eye /> : <Code2 />}
                {item === "preview" ? "Preview" : "Code"}
              </button>
            ))}
          </div>
          <div className="canvas-actions">
            <div className="device-picker">
              {[
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  className={device === id ? "is-active" : ""}
                  onClick={() => setDevice(id)}
                  aria-label={`${id} preview`}
                  title={`${id} preview`}
                >
                  <Icon />
                </button>
              ))}
            </div>
            <span className="toolbar-divider" />
            <button
              className="icon-button ghost"
              onClick={() => {
                setPreviewKey((value) => value + 1);
                notify("Preview refreshed");
              }}
              aria-label="Refresh preview"
              title="Refresh preview"
            >
              <RefreshCw />
            </button>
            <button
              className="icon-button ghost"
              onClick={() => setExpanded(!expanded)}
              aria-label="Expand preview"
              title="Expand preview"
            >
              <Maximize2 />
            </button>
          </div>
        </header>
        {tab === "preview" ? (
          <div className="preview-stage">
            <div className="preview-address">
              <LockIcon />
              <span>
                {project.name.toLowerCase().replaceAll(" ", "-")}.preview
              </span>
              <span className="tag">
                {state.previewHtml ? "Generated HTML" : "Sample app"}
              </span>
            </div>
            <div className={`preview-frame ${device}`}>
              {state.previewHtml ? (
                <iframe
                  title="Generated application preview"
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 500,
                    border: 0,
                    background: "white",
                  }}
                  srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none';">${state.previewHtml}`}
                />
              ) : (
                <ProductPreview
                  key={previewKey}
                  version={state.version}
                  onSelect={setSelection}
                />
              )}
            </div>
            <div className="preview-status">
              <span>
                <span className="status-dot" />
                Preview ready
              </span>
              <button
                className="text-button"
                onClick={() => setSelection("Application interface")}
              >
                <MousePointer2 />
                Select to edit
              </button>
              <button className="text-button" onClick={() => navigate("tests")}>
                Continue to verify
                <ArrowRight />
              </button>
            </div>
          </div>
        ) : (
          <div className="code-workspace">
            <header>
              <span>
                <FileCode2 />
                {state.previewHtml ? "index.html" : "app/page.tsx"}
              </span>
              <button
                className="text-button"
                onClick={() =>
                  downloadFile(
                    state.previewHtml ? "index.html" : "page.tsx",
                    state.sourceCode,
                  )
                }
              >
                <Download />
                Export
              </button>
            </header>
            <textarea
              spellCheck={false}
              aria-label="Source code editor"
              value={state.sourceCode}
              onChange={(e) =>
                update({
                  sourceCode: e.target.value,
                  verifiedVersion: 0,
                  reviewVersion: 0,
                })
              }
            />
            <footer>
              <span>
                {state.previewHtml
                  ? "HTML prototype / restricted sandbox"
                  : "Draft / not connected to preview"}
              </span>
              {state.previewHtml && (
                <button
                  className="text-button"
                  onClick={() =>
                    update({
                      previewHtml: state.sourceCode,
                      previousPreviewHtml: state.previewHtml,
                    })
                  }
                >
                  Apply HTML to preview
                </button>
              )}
              {state.previousPreviewHtml && (
                <button
                  className="text-button"
                  onClick={() =>
                    update({
                      previewHtml: state.previousPreviewHtml,
                      sourceCode: state.previousPreviewHtml,
                      previousPreviewHtml: state.previewHtml,
                    })
                  }
                >
                  Restore previous preview
                </button>
              )}
            </footer>
          </div>
        )}
      </section>
      {selection && (
        <Modal title="Context Lens" close={() => setSelection(null)}>
          <div className="selection-summary">
            <span className="eyebrow">Selected element</span>
            <h3>{selection}</h3>
          </div>
          <div className="mode-segment">
            {["Element", "Component", "Journey"].map((item) => (
              <button
                className={scope === item ? "is-active" : ""}
                key={item}
                onClick={() => setScope(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="field lens-prompt">
            <span>Describe the change</span>
            <textarea
              rows={3}
              placeholder="Make this clearer..."
              value={state.draft}
              onChange={(e) => update({ draft: e.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button
              className="button quiet"
              onClick={() => {
                setSelection(null);
                setTab("code");
              }}
            >
              <Code2 />
              Open code
            </button>
            <button
              className="button primary"
              onClick={() => {
                update({
                  draft: `[${scope}: ${selection}] ${state.draft || "Improve this element's clarity and accessibility."}`,
                });
                setSelection(null);
                setExpanded(false);
                setMobilePanel("Conversation");
                notify("Selection added to your prompt");
              }}
            >
              Add to prompt
              <ArrowRight />
            </button>
          </div>
        </Modal>
      )}
      {showModels && (
        <Modal title="Choose a model" close={() => setShowModels(false)}>
          <label className="search-field wide">
            <Search />
            <input
              autoFocus
              placeholder="Search models or providers"
              aria-label="Search models"
              value={modelQuery}
              onChange={(e) => setModelQuery(e.target.value)}
            />
          </label>
          <div className="model-list">
            {models
              .filter((item) =>
                `${item.name} ${item.provider}`
                  .toLowerCase()
                  .includes(modelQuery.toLowerCase()),
              )
              .map((item) => (
                <button
                  className={state.model === item.id ? "is-selected" : ""}
                  key={item.id}
                  onClick={() => {
                    update({ model: item.id });
                    setShowModels(false);
                  }}
                >
                  <span className="resource-icon">
                    <Bot />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.provider}</small>
                  </span>
                  {state.model === item.id && <Check />}
                </button>
              ))}
          </div>
        </Modal>
      )}
      {context && (
        <Modal title="Project context" close={() => setContext(false)}>
          {state.context.map((item) => (
            <div className="resource-row" key={item}>
              <FileCode2 />
              <span>{item}</span>
              {item !== "Project brief" && (
                <button
                  className="icon-button ghost"
                  aria-label={`Remove ${item}`}
                  onClick={() =>
                    update({
                      context: state.context.filter((value) => value !== item),
                    })
                  }
                >
                  <X />
                </button>
              )}
            </div>
          ))}
          <button
            className="button quiet"
            onClick={() => {
              setContext(false);
              navigate("settings");
            }}
          >
            Add source
            <LinkIcon />
          </button>
        </Modal>
      )}
      {history && (
        <Modal title="Conversation history" close={() => setHistory(false)}>
          {state.messages.length ? (
            <div className="command-results">
              {state.messages
                .filter((item) => item.role === "user")
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      update({ draft: item.content });
                      setHistory(false);
                    }}
                  >
                    <History />
                    <span>{item.content}</span>
                    <ArrowRight />
                  </button>
                ))}
            </div>
          ) : (
            <p className="muted">
              Your prompts will appear here after your first message.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function LockIcon() {
  return <Check size={12} />;
}
function LinkIcon() {
  return <ArrowRight />;
}
