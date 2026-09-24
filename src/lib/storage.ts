import { DEMO_PROJECTS } from "@/lib/demo-data";
import type { KovaProject, KovaSession } from "@/lib/types";

const PROJECTS_KEY = "kova:projects:v1";
const SESSION_KEY = "kova:session:v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readProjects(): KovaProject[] {
  if (!canUseStorage()) return DEMO_PROJECTS;
  const raw = window.localStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEMO_PROJECTS));
    return DEMO_PROJECTS;
  }

  try {
    return JSON.parse(raw) as KovaProject[];
  } catch {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEMO_PROJECTS));
    return DEMO_PROJECTS;
  }
}

export function writeProjects(projects: KovaProject[]) {
  if (canUseStorage()) window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function readSession(): KovaSession | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as KovaSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function writeSession(session: KovaSession) {
  if (canUseStorage()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (canUseStorage()) window.localStorage.removeItem(SESSION_KEY);
}
