"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type NodeProps,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  Bot as BotIcon,
  User,
  Network,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { makeBot, type Bot, type TeamConfig } from "@/lib/bot-teams";
import styles from "./bot-portal.module.css";

type BotNode = Node<{ label: string; kind: Bot["kind"]; model: string }>;
function MemberNode({ data, selected }: NodeProps<BotNode>) {
  const Icon =
    data.kind === "user"
      ? User
      : data.kind === "coordinator"
        ? Network
        : BotIcon;
  return (
    <div className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}>
      <Handle type="target" position={Position.Left} />
      <Icon size={18} />
      <div>
        <strong>{data.label}</strong>
        <small>
          {data.kind === "user"
            ? "Human review"
            : data.kind === "coordinator"
              ? "Coordinator"
              : data.model}
        </small>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { member: MemberNode };

export function TeamGraph({
  config,
  onChange,
  readOnly,
  onSave,
  dirty,
  busy,
}: {
  config: TeamConfig;
  onChange: (config: TeamConfig) => void;
  readOnly: boolean;
  onSave: () => void;
  dirty: boolean;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<string | undefined>(
    config.bots[0]?.id,
  );
  const [edgeId, setEdgeId] = useState<string>();
  const flow = useRef<ReactFlowInstance<BotNode> | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void flow.current?.fitView({ padding: 0.15 });
    });
    return () => cancelAnimationFrame(frame);
  }, [config.bots.length]);
  const member = config.bots.find((b) => b.id === selected);
  const edge = config.relationships.find((e) => e.id === edgeId);
  const nodes: BotNode[] = useMemo(
    () =>
      config.bots.map((b) => ({
        id: b.id,
        type: "member",
        position: b.position,
        selected: b.id === selected,
        data: { label: b.name, kind: b.kind, model: b.model },
      })),
    [config.bots, selected],
  );
  const edges: Edge[] = config.relationships.map((e) => ({
    ...e,
    type: "smoothstep",
    pathOptions: { borderRadius: 4 },
    selected: e.id === edgeId,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "var(--text-muted, #87988c)", strokeWidth: 1.5 },
    labelStyle: { fill: "var(--text, #eff1ed)", fontSize: 11 },
    labelBgStyle: { fill: "var(--surface, #1b1d1f)" },
  }));
  function updateBot(patch: Partial<Bot>) {
    if (!readOnly && member)
      onChange({
        ...config,
        bots: config.bots.map((b) =>
          b.id === member.id ? { ...b, ...patch } : b,
        ),
      });
  }
  function addBot() {
    const bot = makeBot("New Bot", "bot", config.bots.length);
    bot.position = {
      x: 650,
      y: Math.min(
        9800,
        Math.max(...config.bots.map((b) => b.position.y)) + 170,
      ),
    };
    onChange({ ...config, bots: [...config.bots, bot] });
    setSelected(bot.id);
    setEdgeId(undefined);
  }
  return (
    <div>
      <div className={styles.toolbar}>
        <label className={styles.teamName}>
          Team name
          <input
            aria-label="Team name"
            value={config.title}
            maxLength={160}
            disabled={readOnly || busy}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
          />
        </label>
        <button
          disabled={readOnly || busy || config.bots.length >= 50}
          onClick={addBot}
        >
          <Plus size={16} />
          Add Bot
        </button>
        <button
          className={styles.primary}
          disabled={readOnly || busy || !dirty}
          onClick={onSave}
        >
          <Save size={16} />
          Save organisation
        </button>
        <small role="status">{dirty ? "Unsaved changes" : "Saved"}</small>
      </div>
      <div className={styles.graphLayout}>
        <div className={styles.graph} aria-label="Bot organisation graph">
          <ReactFlow
            onInit={(instance) => {
              flow.current = instance;
            }}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.25}
            maxZoom={1.6}
            nodesDraggable={!readOnly && !busy}
            nodesConnectable={!readOnly && !busy}
            deleteKeyCode={null}
            onNodeClick={(_, node) => {
              setSelected(node.id);
              setEdgeId(undefined);
            }}
            onEdgeClick={(_, edge) => {
              setEdgeId(edge.id);
              setSelected(undefined);
            }}
            onNodesChange={(changes) => {
              if (readOnly || busy) return;
              let bots = config.bots;
              for (const change of changes)
                if (change.type === "position" && change.position)
                  bots = bots.map((b) =>
                    b.id === change.id
                      ? { ...b, position: change.position! }
                      : b,
                  );
              if (bots !== config.bots) onChange({ ...config, bots });
            }}
            onConnect={(connection) => {
              if (
                readOnly ||
                busy ||
                connection.source === connection.target ||
                config.relationships.length >= 150
              )
                return;
              onChange({
                ...config,
                relationships: [
                  ...config.relationships,
                  {
                    id: crypto.randomUUID(),
                    source: connection.source,
                    target: connection.target,
                    label: "Handoff",
                  },
                ],
              });
            }}
          >
            <Background gap={24} size={1} color="var(--border, #303537)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className={styles.inspector}>
          <label>
            Team member
            <select
              value={selected ?? ""}
              onChange={(e) => {
                setSelected(e.target.value);
                setEdgeId(undefined);
              }}
            >
              <option value="" disabled>
                Select a member
              </option>
              {config.bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          {member && (
            <fieldset disabled={readOnly || busy}>
              <label>
                Name
                <input
                  value={member.name}
                  maxLength={80}
                  onChange={(e) => updateBot({ name: e.target.value })}
                />
              </label>
              {member.kind !== "user" && (
                <>
                  <label>
                    Role
                    <select
                      value={member.kind}
                      onChange={(e) =>
                        updateBot({ kind: e.target.value as Bot["kind"] })
                      }
                    >
                      <option value="bot">Bot</option>
                      <option value="coordinator">Coordinator</option>
                    </select>
                  </label>
                  <label>
                    Model
                    <input
                      value={member.model}
                      maxLength={160}
                      onChange={(e) => updateBot({ model: e.target.value })}
                    />
                  </label>
                  <label>
                    Instructions
                    <textarea
                      aria-label="Instructions"
                      rows={6}
                      value={member.instructions}
                      maxLength={12000}
                      onChange={(e) =>
                        updateBot({ instructions: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Memory scope
                    <select
                      value={member.memoryScope}
                      onChange={(e) =>
                        updateBot({
                          memoryScope: e.target.value as Bot["memoryScope"],
                        })
                      }
                    >
                      <option value="none">None</option>
                      <option value="conversation">Conversation</option>
                      <option value="team">Team</option>
                    </select>
                  </label>
                  <span className={styles.fieldTitle}>Permissions</span>
                  {(["draft", "handoff", "request-approval"] as const).map(
                    (permission) => (
                      <label className={styles.check} key={permission}>
                        <input
                          type="checkbox"
                          checked={member.permissions.includes(permission)}
                          onChange={(e) =>
                            updateBot({
                              permissions: e.target.checked
                                ? [...member.permissions, permission]
                                : member.permissions.filter(
                                    (p) => p !== permission,
                                  ),
                            })
                          }
                        />
                        {permission === "draft"
                          ? "Draft artifacts"
                          : permission === "handoff"
                            ? "Propose handoffs"
                            : "Request approval"}
                      </label>
                    ),
                  )}
                  <button
                    className={styles.danger}
                    onClick={() => {
                      onChange({
                        ...config,
                        bots: config.bots.filter((b) => b.id !== member.id),
                        relationships: config.relationships.filter(
                          (e) =>
                            e.source !== member.id && e.target !== member.id,
                        ),
                      });
                      setSelected(config.bots[0].id);
                    }}
                  >
                    <Trash2 size={16} />
                    Remove Bot
                  </button>
                </>
              )}
            </fieldset>
          )}
          {edge && (
            <fieldset disabled={readOnly || busy}>
              <label>
                Relationship label
                <input
                  value={edge.label}
                  maxLength={100}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      relationships: config.relationships.map((r) =>
                        r.id === edge.id ? { ...r, label: e.target.value } : r,
                      ),
                    })
                  }
                />
              </label>
              <button
                className={styles.danger}
                onClick={() => {
                  onChange({
                    ...config,
                    relationships: config.relationships.filter(
                      (r) => r.id !== edge.id,
                    ),
                  });
                  setEdgeId(undefined);
                }}
              >
                <Trash2 size={16} />
                Remove relationship
              </button>
            </fieldset>
          )}
          <details>
            <summary>Relationships ({config.relationships.length})</summary>
            {config.relationships.map((r) => (
              <button
                className={styles.relationship}
                key={r.id}
                onClick={() => {
                  setEdgeId(r.id);
                  setSelected(undefined);
                }}
              >
                {config.bots.find((b) => b.id === r.source)?.name} →{" "}
                {config.bots.find((b) => b.id === r.target)?.name}
                <small>{r.label}</small>
              </button>
            ))}
          </details>
        </aside>
      </div>
    </div>
  );
}
