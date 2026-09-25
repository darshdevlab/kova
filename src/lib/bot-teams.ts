import { z } from "zod";

const id = z.string().min(1).max(80);
const position = z.object({
  x: z.number().finite().min(-10000).max(10000),
  y: z.number().finite().min(-10000).max(10000),
});
export const botSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["bot", "coordinator", "user"]),
  instructions: z.string().max(12000),
  model: z.string().trim().min(1).max(160),
  permissions: z.array(z.enum(["draft", "handoff", "request-approval"])).max(3),
  memoryScope: z.enum(["none", "conversation", "team"]),
  position,
});
export const configSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    bots: z.array(botSchema).min(1).max(50),
    relationships: z
      .array(
        z.object({
          id,
          source: id,
          target: id,
          label: z.string().trim().min(1).max(100),
        }),
      )
      .max(150),
  })
  .superRefine((value, ctx) => {
    const ids = new Set(value.bots.map((bot) => bot.id));
    if (
      ids.size !== value.bots.length ||
      value.bots.filter((bot) => bot.kind === "user").length !== 1
    )
      ctx.addIssue({
        code: "custom",
        message: "Use unique Bot IDs and exactly one user node.",
      });
    const edges = new Set<string>();
    for (const edge of value.relationships) {
      if (
        !ids.has(edge.source) ||
        !ids.has(edge.target) ||
        edge.source === edge.target ||
        edges.has(edge.id)
      )
        ctx.addIssue({
          code: "custom",
          message:
            "Relationships must connect distinct team members and have unique IDs.",
        });
      edges.add(edge.id);
    }
  });
export const messageSchema = z.object({
  id,
  sender: id,
  senderName: z.string(),
  recipient: z.string(),
  text: z.string().max(20000),
  at: z.string(),
  type: z.enum(["user", "demo", "handoff"]),
});
export const teamSchema = z.object({
  schema: z.literal("bot-team-v2"),
  title: z.string(),
  config: configSchema,
  chats: z
    .array(
      z.object({
        id,
        title: z.string().max(100),
        target: id,
        messages: z.array(messageSchema).max(500),
      }),
    )
    .max(100),
  artifacts: z
    .array(
      z.object({
        id,
        chatId: id,
        title: z.string(),
        content: z.string(),
        source: z.literal("Demo execution"),
      }),
    )
    .max(500),
  tasks: z
    .array(
      z.object({
        id,
        chatId: id,
        title: z.string(),
        owner: z.string(),
        status: z.enum(["Proposed", "Done"]),
      }),
    )
    .max(500),
  approvals: z
    .array(
      z.object({
        id,
        chatId: id,
        title: z.string(),
        status: z.enum(["Pending", "Approved", "Rejected"]),
        decidedBy: z.string().optional(),
      }),
    )
    .max(500),
});
export type Bot = z.infer<typeof botSchema>;
export type TeamConfig = z.infer<typeof configSchema>;
export type BotTeam = z.infer<typeof teamSchema>;
export type TeamRecord = {
  id: string;
  space_id: string;
  revision: number;
  data: BotTeam;
};
export const templates = [
  { id: "blank", name: "Blank organisation" },
  { id: "product", name: "Product team" },
  { id: "research", name: "Research team" },
] as const;
export function canManageBots(role: string) {
  return ["Owner", "Admin", "PM", "Developer", "QA"].includes(role);
}
export function makeBot(
  name = "New Bot",
  kind: Bot["kind"] = "bot",
  index = 0,
): Bot {
  return {
    id: crypto.randomUUID(),
    name,
    kind,
    instructions:
      "Clarify the request, state assumptions, and propose a bounded next step.",
    model: "openai/gpt-4.1-mini",
    permissions: ["draft", "handoff", "request-approval"],
    memoryScope: "conversation",
    position: {
      x: 80 + (index % 3) * 250,
      y: 80 + Math.floor(index / 3) * 170,
    },
  };
}
export function createTeam(
  title: string,
  template: (typeof templates)[number]["id"],
): BotTeam {
  const user = {
    ...makeBot("You", "user"),
    permissions: [] as Bot["permissions"],
    memoryScope: "none" as const,
  };
  const bots: Bot[] = [user];
  if (template !== "blank") {
    bots.push(makeBot("Coordinator", "coordinator", 1));
    for (const name of template === "product"
      ? ["Product", "Engineering", "Quality"]
      : ["Research", "Evidence review"])
      bots.push({
        ...makeBot(name, "bot", bots.length),
        instructions: `Work from supplied context as the ${name.toLowerCase()} Bot. Identify missing evidence before proposing work.`,
      });
    const center = ((bots.length - 3) * 170) / 2 + 30;
    bots[0].position = { x: 30, y: center };
    bots[1].position = { x: 330, y: center };
    bots.slice(2).forEach((bot, i) => {
      bot.position = { x: 650, y: 30 + i * 170 };
    });
  }
  return {
    schema: "bot-team-v2",
    title,
    config: {
      title,
      bots,
      relationships: bots
        .slice(1)
        .map((bot, i) => ({
          id: crypto.randomUUID(),
          source: i === 0 ? user.id : bots[1].id,
          target: bot.id,
          label: i === 0 ? "Request" : "Handoff",
        })),
    },
    chats: [],
    artifacts: [],
    tasks: [],
    approvals: [],
  };
}
export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("configure"), config: configSchema }),
  z.object({ action: z.literal("new-chat"), target: id }),
  z.object({
    action: z.literal("send"),
    chatId: id,
    text: z.string().trim().min(1).max(6000),
  }),
  z.object({
    action: z.literal("decide"),
    approvalId: id,
    decision: z.enum(["Approved", "Rejected"]),
  }),
  z.object({
    action: z.literal("task"),
    taskId: id,
    status: z.enum(["Proposed", "Done"]),
  }),
]);
export type TeamCommand = z.infer<typeof commandSchema>;

// Demo output is deterministic, bounded, and never calls a model or a tool.
export function applyTeamCommand(
  current: BotTeam,
  command: TeamCommand,
  actor: string,
): BotTeam {
  const team = structuredClone(current);
  if (command.action === "configure") {
    team.config = configSchema.parse(command.config);
    team.title = team.config.title;
  } else if (command.action === "new-chat") {
    if (
      command.target !== "team" &&
      !team.config.bots.some(
        (b) => b.id === command.target && b.kind !== "user",
      )
    )
      throw Error("Bot unavailable.");
    if (team.chats.length >= 100)
      throw Error("This team has reached its 100-conversation limit.");
    team.chats.unshift({
      id: crypto.randomUUID(),
      title: "New chat",
      target: command.target,
      messages: [],
    });
  } else if (command.action === "send") {
    const chat = team.chats.find((c) => c.id === command.chatId);
    if (!chat) throw Error("Conversation unavailable.");
    if (chat.messages.length > 490)
      throw Error("Start a new chat to continue.");
    const bot =
      chat.target === "team"
        ? (team.config.bots.find((b) => b.kind === "coordinator") ??
          team.config.bots.find((b) => b.kind === "bot"))
        : team.config.bots.find(
            (b) => b.id === chat.target && b.kind !== "user",
          );
    if (!bot)
      throw Error("Add a Bot or select an available Bot before sending.");
    const at = new Date().toISOString();
    chat.messages.push({
      id: crypto.randomUUID(),
      sender: actor,
      senderName: "You",
      recipient: bot.name,
      text: command.text,
      at,
      type: "user",
    });
    if (chat.title === "New chat") chat.title = command.text.slice(0, 80);
    const subject = command.text.slice(0, 180);
    chat.messages.push({
      id: crypto.randomUUID(),
      sender: bot.id,
      senderName: bot.name,
      recipient: "You",
      text: `Demo proposal for: “${subject}”\n\nConfirm the intended outcome, supplied inputs, and acceptance criteria before starting. No tools, model calls, or code execution occurred.`,
      at,
      type: "demo",
    });
    if (chat.target === "team" && bot.permissions.includes("handoff")) {
      for (const edge of team.config.relationships
        .filter((e) => e.source === bot.id)
        .slice(0, 3)) {
        const target = team.config.bots.find(
          (b) => b.id === edge.target && b.kind !== "user",
        );
        if (!target) continue;
        chat.messages.push({
          id: crypto.randomUUID(),
          sender: bot.id,
          senderName: bot.name,
          recipient: target.name,
          text: `Proposed ${edge.label.toLowerCase()}: ask ${target.name} to review the supplied request and identify missing inputs. This handoff is simulated.`,
          at,
          type: "handoff",
        });
        chat.messages.push({
          id: crypto.randomUUID(),
          sender: target.id,
          senderName: target.name,
          recipient: bot.name,
          text: "Demo response: review is pending. Please supply source material and acceptance criteria; no external evidence has been checked.",
          at,
          type: "handoff",
        });
      }
    }
    if (bot.permissions.includes("draft")) {
      team.artifacts.unshift({
        id: crypto.randomUUID(),
        chatId: chat.id,
        title: "Draft working brief",
        content: `Demo execution\n\nRequest: ${command.text}\n\nProposed next steps:\n- Confirm scope and acceptance criteria.\n- Supply relevant source material.\n- Assign review before any execution.\n\nThis is a template draft, not researched or executed work.`,
        source: "Demo execution",
      });
      team.tasks.unshift({
        id: crypto.randomUUID(),
        chatId: chat.id,
        title: `Confirm scope: ${subject}`,
        owner: bot.name,
        status: "Proposed",
      });
    }
    if (bot.permissions.includes("request-approval"))
      team.approvals.unshift({
        id: crypto.randomUUID(),
        chatId: chat.id,
        title: `Review demo proposal: ${subject}`,
        status: "Pending",
      });
  } else if (command.action === "decide") {
    const approval = team.approvals.find((a) => a.id === command.approvalId);
    if (!approval || approval.status !== "Pending")
      throw Error("Approval is no longer pending.");
    approval.status = command.decision;
    approval.decidedBy = actor;
  } else {
    const task = team.tasks.find((t) => t.id === command.taskId);
    if (!task) throw Error("Task unavailable.");
    task.status = command.status;
  }
  return teamSchema.parse(team);
}
