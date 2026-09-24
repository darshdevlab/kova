import type { ChatMessage, KovaProject, ModelChoice } from "@/lib/types";

export const DEMO_PROJECTS: KovaProject[] = [
  {
    id: "relaydesk",
    name: "RelayDesk",
    description: "AI support operations workspace with triage, knowledge and analytics.",
    status: "Ready",
    updatedAt: "12 min ago",
    source: "Prompt",
    mode: "Guided",
    accent: "ember",
    progress: 86,
  },
  {
    id: "checkout-analytics",
    name: "Checkout analytics",
    description: "Imported storefront funnel with conversion diagnostics and experiments.",
    status: "Building",
    updatedAt: "Yesterday",
    source: "GitHub",
    mode: "Developer",
    accent: "blue",
    progress: 62,
  },
  {
    id: "policy-agent",
    name: "Policy answer agent",
    description: "Internal policy assistant grounded in approved HR documentation.",
    status: "Live",
    updatedAt: "Sep 22",
    source: "Template",
    mode: "Guided",
    accent: "green",
    progress: 100,
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content:
      "Build a support operations app with ticket triage, an agent-assisted queue, knowledge resources and performance analytics.",
    meta: "Initial brief",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "I mapped the brief into four journeys and built the first working slice. The inbox, AI triage state, knowledge panel and analytics overview are ready to review.",
    meta: "Built with Auto · 8 files changed",
  },
];

export const FALLBACK_MODELS: ModelChoice[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "Kova router",
    description: "Selects the best permitted model for the task.",
    speed: "Balanced",
  },
  {
    id: "openai/gpt-6-sol",
    name: "GPT-6 Sol",
    provider: "OpenAI",
    description: "Strong coding and everyday product work.",
    speed: "Balanced",
  },
  {
    id: "anthropic/claude-opus-5.5",
    name: "Claude Opus 5.5",
    provider: "Anthropic",
    description: "Deep reasoning for complex architecture and review.",
    speed: "Deep",
  },
  {
    id: "openai/gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "OpenAI",
    description: "Fast iteration for UI and smaller changes.",
    speed: "Fast",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    description: "High-throughput implementation and debugging.",
    speed: "Fast",
  },
];

export const CODE_FILES = [
  "app/dashboard/page.tsx",
  "components/ticket-queue.tsx",
  "components/triage-panel.tsx",
  "lib/agents/triage.ts",
  "lib/data/tickets.ts",
  "app/globals.css",
];

export const CODE_SAMPLE = `export function TicketQueue({ tickets }: Props) {
  const visible = tickets.filter((ticket) => ticket.status !== "resolved");

  return (
    <section aria-labelledby="queue-title">
      <QueueHeader count={visible.length} />
      <TicketTable tickets={visible} onSelect={openTriagePanel} />
    </section>
  );
}`;
