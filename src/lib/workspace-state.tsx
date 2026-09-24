"use client";

import { createContext, useContext } from "react";
import type { ChatMessage, KovaProject, WorkspaceView } from "./types";

export type ActivityEntry = {
  id: string;
  title: string;
  detail: string;
  time: string;
  category: string;
};
export type WorkspaceState = {
  brief: string;
  approved: boolean;
  messages: ChatMessage[];
  draft: string;
  model: string;
  version: number;
  verifiedVersion: number;
  reviewVersion: number;
  releasedVersion: number;
  branch: string;
  baseBranch: string;
  branchStrategy: string;
  environment: string;
  instructions: string;
  citations: boolean;
  humanReview: boolean;
  framework: string;
  tables: {
    name: string;
    rows: { id: string; name: string; status: string }[];
  }[];
  authProviders: string[];
  connections: string[];
  activities: ActivityEntry[];
  members: { email: string; role: string }[];
  requirements: string[];
  context: string[];
  sourceCode: string;
};

export function initialWorkspace(project: KovaProject): WorkspaceState {
  return {
    brief: project.description,
    approved: false,
    messages: [],
    draft: "",
    model: "auto",
    version: 1,
    verifiedVersion: 0,
    reviewVersion: 0,
    releasedVersion: 0,
    branch: "feature/initial-build",
    baseBranch: "main",
    branchStrategy: "GitHub flow",
    environment: "Preview",
    instructions:
      "Classify priority and intent. Use approved knowledge before drafting. Escalate sensitive requests for human review.",
    citations: true,
    humanReview: true,
    framework: "LangGraph",
    tables: [
      {
        name: "tickets",
        rows: [
          {
            id: "T-101",
            name: "Checkout verification",
            status: "Needs review",
          },
          { id: "T-102", name: "Workspace invitation", status: "Open" },
        ],
      },
      {
        name: "customers",
        rows: [{ id: "C-001", name: "Maya Chen", status: "Active" }],
      },
      { name: "agent_runs", rows: [] },
    ],
    authProviders: ["Email"],
    connections: [],
    activities: [],
    members: [{ email: "darsh@example.com", role: "Owner" }],
    requirements: [
      "Users can search and filter records",
      "Sensitive agent actions require approval",
      "The application works on desktop and mobile",
    ],
    context: ["Project brief"],
    sourceCode:
      "export default function App() {\n  return <main><h1>Welcome to your app</h1></main>;\n}\n",
  };
}

type WorkspaceContextValue = {
  project: KovaProject;
  state: WorkspaceState;
  update: (patch: Partial<WorkspaceState>) => void;
  log: (title: string, detail?: string, category?: string) => void;
  navigate: (view: WorkspaceView) => void;
  notify: (message: string) => void;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workspace provider is required");
  return context;
}

export function downloadFile(
  name: string,
  content: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
