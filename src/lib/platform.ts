import { getSupabaseBrowserClient } from "./supabase/client";

export type Space = {
  id: string;
  name: string;
  kind: "personal" | "company";
  owner_id: string;
};
export type Role = "Owner" | "Admin" | "PM" | "Developer" | "QA" | "Viewer";
export type RecordKind =
  | "project"
  | "bot"
  | "run"
  | "document"
  | "question"
  | "credit"
  | "setting"
  | "activity";
export type RecordData = {
  title: string;
  deliveryMode?: string;
  description?: string;
  status?: string;
  mode?: string;
  model?: string;
  providerConnectionId?: string;
  instructions?: string;
  steps?: string[];
  completed?: number;
  amount?: number;
  source?: string;
  url?: string;
  content?: string;
  projectId?: string;
  botId?: string;
  archived?: boolean;
  stage?: string;
  answers?: string[];
  failure?: string;
  workspace?: import("./workspace-state").WorkspaceState;
};
export type PlatformRecord = {
  id: string;
  space_id: string;
  kind: RecordKind;
  data: RecordData;
  revision: number;
  created_at: string;
  updated_at: string;
};
export function database() {
  const db = getSupabaseBrowserClient();
  if (!db) throw Error("Cloud connection unavailable.");
  return db;
}
export async function saveRecord(
  space: string,
  kind: RecordKind,
  data: RecordData,
  current?: PlatformRecord,
) {
  if (current) {
    const { data: row, error } = await database()
      .from("kova_records")
      .update({
        data,
        revision: current.revision + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id)
      .eq("space_id", space)
      .eq("revision", current.revision)
      .select()
      .single();
    if (error)
      throw Error(
        "Could not save. This item may have changed or your access expired. Refresh before retrying.",
      );
    return row as PlatformRecord;
  }
  const { data: row, error } = await database()
    .from("kova_records")
    .insert({ space_id: space, kind, data })
    .select()
    .single();
  if (error)
    throw Error(
      "Could not save. Check your connection and workspace permissions.",
    );
  return row as PlatformRecord;
}
export const BOT_STEPS = [
  "Journey analysis",
  "Improvement proposal",
  "PM approval",
  "PRD draft",
  "Developer approval",
  "TRD draft",
  "Build",
  "Tests",
  "QA review",
  "Release approval",
];
export function canEdit(role: Role) {
  return role !== "Viewer";
}
export function isAdmin(role: Role) {
  return role === "Owner" || role === "Admin";
}
