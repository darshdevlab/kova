"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import {
  Bot,
  Check,
  FileText,
  GitBranch,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-state";
import { useTheme } from "@/lib/theme";
import { SurfaceHeader, NextStep } from "@/components/ui";
import "@xyflow/react/dist/style.css";

type FlowData = {
  label: string;
  kind: string;
  description: string;
  instructions?: string;
  citations?: boolean;
  humanReview?: boolean;
};
type FlowNode = Node<FlowData, "workflow">;
const ICONS = {
  Trigger: Zap,
  Agent: Bot,
  Approval: ShieldCheck,
  Tool: FileText,
};
const initialNodes: FlowNode[] = [
  {
    id: "trigger",
    type: "workflow",
    position: { x: 0, y: 120 },
    data: {
      label: "New request",
      kind: "Trigger",
      description: "Webhook received",
    },
  },
  {
    id: "classify",
    type: "workflow",
    position: { x: 250, y: 0 },
    data: {
      label: "Classify intent",
      kind: "Agent",
      description: "Identify intent & priority",
    },
  },
  {
    id: "triage",
    type: "workflow",
    selected: true,
    position: { x: 250, y: 240 },
    data: {
      label: "Triage agent",
      kind: "Agent",
      description: "Search approved knowledge",
    },
  },
  {
    id: "gate",
    type: "workflow",
    position: { x: 500, y: 120 },
    data: {
      label: "Risk gate",
      kind: "Approval",
      description: "Confidence below 82%",
    },
  },
  {
    id: "draft",
    type: "workflow",
    position: { x: 750, y: 0 },
    data: {
      label: "Draft response",
      kind: "Tool",
      description: "Grounded answer",
    },
  },
  {
    id: "escalate",
    type: "workflow",
    position: { x: 750, y: 240 },
    data: {
      label: "Human review",
      kind: "Approval",
      description: "Assign to support team",
    },
  },
];
const initialEdges: Edge[] = [
  ["trigger", "classify"],
  ["trigger", "triage"],
  ["classify", "gate"],
  ["triage", "gate"],
  ["gate", "draft"],
  ["gate", "escalate"],
].map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  type: "smoothstep",
  pathOptions: { borderRadius: 6 },
  label:
    target === "draft"
      ? "Approved"
      : target === "escalate"
        ? "Needs review"
        : undefined,
}));
function WorkflowNode({ data, selected }: NodeProps<FlowNode>) {
  const Icon = ICONS[data.kind as keyof typeof ICONS] || Bot;
  return (
    <div className={`flow-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="flow-node-type">
        <Icon />
        <span>{data.kind}</span>
        <i />
      </div>
      <strong>{data.label}</strong>
      <p>{data.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { workflow: WorkflowNode };

export function AgentFlow() {
  const { preset, tokens } = useTheme();
  const { project, state, update, notify, log, navigate } = useWorkspace();
  const key = `kova:graph:v2:${project.id}`;
  const [saved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") as {
        nodes: FlowNode[];
        edges: Edge[];
      } | null;
    } catch {
      return null;
    }
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(
    saved?.nodes || initialNodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    saved?.edges || initialEdges,
  );
  const [selected, setSelected] = useState("triage");
  const [testResult, setTestResult] = useState("");
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ nodes, edges }));
  }, [key, nodes, edges]);
  const active = nodes.find((node) => node.id === selected);
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        addEdge({ ...connection, type: "smoothstep" }, current),
      ),
    [setEdges],
  );
  const save = () => {
    localStorage.setItem(key, JSON.stringify({ nodes, edges }));
    update({ verifiedVersion: 0, reviewVersion: 0 });
    log(
      "Agent workflow saved",
      `${nodes.length} nodes, ${edges.length} connections`,
      "Agents",
    );
    notify("Workflow and agent settings saved");
  };
  function testGraph() {
    const reachable = new Set(["trigger"]);
    for (let i = 0; i < nodes.length; i++)
      edges.forEach((edge) => {
        if (reachable.has(edge.source)) reachable.add(edge.target);
      });
    const orphaned = nodes.filter((node) => !reachable.has(node.id));
    const result = orphaned.length
      ? `${orphaned.length} disconnected node(s): ${orphaned.map((node) => node.data.label).join(", ")}`
      : `Graph valid: ${nodes.length} reachable nodes. Model execution requires a connected runtime.`;
    setTestResult(result);
    log("Workflow validation", result, "Agents");
  }
  return (
    <div className="surface-page agent-page">
      <SurfaceHeader
        eyebrow="Intelligence"
        title="Agents"
        description="Support triage workflow"
      >
        <button className="button quiet" onClick={testGraph}>
          <Play />
          Validate flow
        </button>
        <button className="button primary" onClick={save}>
          <Save />
          Save workflow
        </button>
      </SurfaceHeader>
      <div className="agent-toolbar">
        <div className="inline-label">
          <span className="status-dot" />
          Draft workflow<span className="tag">{nodes.length} nodes</span>
        </div>
        <label>
          Framework
          <select
            value={state.framework}
            onChange={(e) => update({ framework: e.target.value })}
          >
            {[
              "LangGraph",
              "CrewAI",
              "AutoGen",
              "OpenAI Agents SDK",
              "Custom",
            ].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <button
          className="button quiet compact"
          onClick={() => {
            const id = crypto.randomUUID();
            setNodes((current) => [
              ...current,
              {
                id,
                type: "workflow",
                position: { x: 280, y: 420 },
                data: {
                  label: "New agent",
                  kind: "Agent",
                  description: "Configure instructions",
                },
              },
            ]);
            setSelected(id);
          }}
        >
          <Plus />
          Add node
        </button>
      </div>
      <div className="agent-layout">
        <div className="agent-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelected(node.id)}
            fitView
            fitViewOptions={{ padding: 0.12, minZoom: 0.75, maxZoom: 1 }}
            minZoom={0.3}
            maxZoom={1.5}
            snapToGrid
            snapGrid={[20, 20]}
            colorMode={preset.mode}
            defaultEdgeOptions={{ type: "smoothstep" }}
          >
            <Background gap={24} size={1} color={tokens.border} />
            <Controls showInteractive={false} />
          </ReactFlow>
          <div className="graph-caption">
            <GitBranch size={14} />
            Support triage / v{state.version}
          </div>
        </div>
        <aside className="agent-inspector">
          {active ? (
            <>
              <div className="inspector-heading">
                <span className="resource-icon">
                  <Bot />
                </span>
                <div>
                  <span className="eyebrow">{active.data.kind}</span>
                  <h2>{active.data.label}</h2>
                </div>
              </div>
              <label className="field">
                <span>Selected node</span>
                <select
                  aria-label="Selected node"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.data.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Node name</span>
                <input
                  value={active.data.label}
                  onChange={(e) =>
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === selected
                          ? {
                              ...node,
                              data: { ...node.data, label: e.target.value },
                            }
                          : node,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Instructions</span>
                <textarea
                  rows={5}
                  value={active.data.instructions ?? state.instructions}
                  onChange={(e) =>
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === selected
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                instructions: e.target.value,
                              },
                            }
                          : node,
                      ),
                    )
                  }
                />
              </label>
              <div className="section-heading">
                <h3>Guardrails</h3>
                <ShieldCheck />
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={active.data.citations ?? state.citations}
                  onChange={(e) =>
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === selected
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                citations: e.target.checked,
                              },
                            }
                          : node,
                      ),
                    )
                  }
                />
                <span>Require source citations</span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={active.data.humanReview ?? state.humanReview}
                  onChange={(e) =>
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === selected
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                humanReview: e.target.checked,
                              },
                            }
                          : node,
                      ),
                    )
                  }
                />
                <span>Review sensitive actions</span>
              </label>
              <div className="inspector-resource">
                <FileText />
                <span>
                  Project brief<small>Connected context</small>
                </span>
                <Check />
              </div>
              <button
                className="button quiet wide danger"
                disabled={selected === "trigger"}
                onClick={() => {
                  setNodes((current) =>
                    current.filter((node) => node.id !== selected),
                  );
                  setEdges((current) =>
                    current.filter(
                      (edge) =>
                        edge.source !== selected && edge.target !== selected,
                    ),
                  );
                  setSelected("trigger");
                }}
              >
                <Trash2 />
                Remove node
              </button>
            </>
          ) : (
            <p>Select a node to configure it.</p>
          )}
        </aside>
      </div>
      {testResult && (
        <div className="notice" role="status">
          {testResult}
        </div>
      )}
      <NextStep
        title="Verify the workflow"
        detail="Check the project configuration before preparing a release."
        action="Continue to tests"
        onClick={() => {
          save();
          navigate("tests");
        }}
      />
    </div>
  );
}
