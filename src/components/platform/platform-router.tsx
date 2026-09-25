"use client";

import { usePathname } from "next/navigation";
import { Platform, type View } from "./platform";

const sections = new Set([
  "projects",
  "bots",
  "approvals",
  "credits",
  "company",
  "integrations",
  "settings",
]);

// Mounted in the root layout: section navigation must not discard workspace state.
export function PlatformRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, section, id] = pathname.split("/");
  if (!sections.has(section)) return children;
  return <Platform view={section as View} itemId={id} />;
}
