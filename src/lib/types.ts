export type WorkspaceView =
  | "build"
  | "plan"
  | "agents"
  | "data"
  | "tests"
  | "git"
  | "deploy"
  | "activity"
  | "settings";

export type ProjectStatus = "Draft" | "Building" | "Ready" | "Live";

export type KovaProject = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  updatedAt: string;
  source: "Prompt" | "GitHub" | "Work item" | "Template";
  mode: "Guided" | "Developer";
  accent: "ember" | "blue" | "green";
  progress: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

export type ModelChoice = {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: "Fast" | "Balanced" | "Deep";
};

export type KovaSession = {
  email: string;
  name: string;
  mode: "demo" | "supabase";
};
