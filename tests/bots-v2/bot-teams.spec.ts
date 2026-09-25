import { test, expect } from "@playwright/test";
import {
  applyTeamCommand,
  canManageBots,
  configSchema,
  createTeam,
  teamSchema,
  type TeamRecord,
} from "../../src/lib/bot-teams";
import { createBotTeamHandlers } from "../../src/app/api/bot-teams/handlers";

const spaceId = "10000000-0000-4000-8000-000000000001";
const otherSpace = "10000000-0000-4000-8000-000000000002";
const itemId = "20000000-0000-4000-8000-000000000001";

test("templates and blank organisations validate without a fixed workflow", () => {
  for (const template of ["blank", "product", "research"] as const) {
    const team = createTeam("Test", template);
    expect(teamSchema.safeParse(team).success).toBeTruthy();
    expect(team.chats).toEqual([]);
    expect(team.config.bots.filter((b) => b.kind === "user")).toHaveLength(1);
  }
  expect(createTeam("Blank", "blank").config.bots).toHaveLength(1);
});

test("schema rejects dangling relationships, duplicate IDs, self edges and missing users", () => {
  const { config } = createTeam("Test", "product");
  expect(
    configSchema.safeParse({
      ...config,
      relationships: [
        {
          id: "bad",
          source: "other-team",
          target: config.bots[0].id,
          label: "Bad",
        },
      ],
    }).success,
  ).toBeFalsy();
  expect(
    configSchema.safeParse({
      ...config,
      bots: [...config.bots, config.bots[1]],
    }).success,
  ).toBeFalsy();
  expect(
    configSchema.safeParse({ ...config, bots: config.bots.slice(1) }).success,
  ).toBeFalsy();
  expect(
    configSchema.safeParse({
      ...config,
      relationships: [
        {
          id: "bad",
          source: config.bots[0].id,
          target: config.bots[0].id,
          label: "Bad",
        },
      ],
    }).success,
  ).toBeFalsy();
});

test("team demo respects permissions, follows bounded edges, and preserves original data", () => {
  const initial = createTeam("Product", "product");
  let team = applyTeamCommand(
    initial,
    { action: "new-chat", target: "team" },
    "actor",
  );
  team = applyTeamCommand(
    team,
    { action: "send", chatId: team.chats[0].id, text: "Improve onboarding" },
    "actor",
  );
  expect(initial.chats).toHaveLength(0);
  expect(
    team.chats[0].messages.filter((m) => m.type === "handoff"),
  ).toHaveLength(6);
  expect(team.chats[0].messages[1].text).toContain(
    "No tools, model calls, or code execution occurred",
  );
  expect(team.artifacts).toHaveLength(1);
  expect(team.tasks[0].status).toBe("Proposed");
  const decided = applyTeamCommand(
    team,
    {
      action: "decide",
      approvalId: team.approvals[0].id,
      decision: "Approved",
    },
    "reviewer",
  );
  expect(decided.approvals[0].decidedBy).toBe("reviewer");
  expect(decided.chats).toEqual(team.chats);
  expect(() =>
    applyTeamCommand(
      decided,
      {
        action: "decide",
        approvalId: team.approvals[0].id,
        decision: "Approved",
      },
      "reviewer",
    ),
  ).toThrow();
  team.config.bots[1].permissions = [];
  team = applyTeamCommand(
    team,
    { action: "new-chat", target: "team" },
    "actor",
  );
  team = applyTeamCommand(
    team,
    { action: "send", chatId: team.chats[0].id, text: "Another request" },
    "actor",
  );
  expect(team.chats[0].messages).toHaveLength(2);
  expect(team.artifacts).toHaveLength(1);
});

test("direct chats stay direct and removed Bots cannot receive new messages", () => {
  let team = createTeam("Product", "product");
  const target = team.config.bots[2].id;
  team = applyTeamCommand(team, { action: "new-chat", target }, "actor");
  team = applyTeamCommand(
    team,
    { action: "send", chatId: team.chats[0].id, text: "Review scope" },
    "actor",
  );
  expect(team.chats[0].messages.some((m) => m.type === "handoff")).toBeFalsy();
  team.config.bots = team.config.bots.filter((b) => b.id !== target);
  expect(() =>
    applyTeamCommand(
      team,
      { action: "send", chatId: team.chats[0].id, text: "Review again" },
      "actor",
    ),
  ).toThrow("available Bot");
  expect(() =>
    applyTeamCommand(
      createTeam("Blank", "blank"),
      { action: "new-chat", target: "foreign-bot" },
      "actor",
    ),
  ).toThrow();
});

// Enforce query predicates to catch missing workspace, kind, and revision filters.
function fakeDatabase(
  role: string | null = "Owner",
  signedIn = true,
  race = false,
) {
  const record: TeamRecord & { kind: string } = {
    id: itemId,
    space_id: spaceId,
    revision: 1,
    kind: "bot",
    data: createTeam("Product", "product"),
  };
  const rows = [record];
  const db = {
    auth: {
      getUser: async () => ({
        data: { user: signedIn ? { id: "actor" } : null },
        error: null,
      }),
    },
    from(table: string) {
      const filters: [string, unknown][] = [];
      let update: Partial<typeof record> | undefined;
      let insert: Partial<typeof record> | undefined;
      const query = {
        select() {
          return query;
        },
        eq(key: string, value: unknown) {
          filters.push([key, value]);
          return query;
        },
        order() {
          return query;
        },
        update(value: Partial<typeof record>) {
          update = value;
          return query;
        },
        insert(value: Partial<typeof record>) {
          insert = value;
          return query;
        },
        async single() {
          const result = run();
          return { ...result, data: result.data[0] ?? null };
        },
        then(resolve: (value: ReturnType<typeof run>) => unknown) {
          return Promise.resolve(run()).then(resolve);
        },
      };
      function run() {
        if (table === "kova_members")
          return {
            data:
              role &&
              filters.some(([k, v]) => k === "space_id" && v === spaceId)
                ? [{ role }]
                : [],
            error: null,
          };
        if (insert) {
          const created = { ...record, ...insert };
          rows.push(created);
          return { data: [created], error: null };
        }
        const matched = rows.filter((row) =>
          filters.every(([key, value]) =>
            key === "data->>schema"
              ? row.data.schema === value
              : row[key as keyof typeof row] === value,
          ),
        );
        if (update && race) return { data: [], error: { message: "Conflict" } };
        if (update) matched.forEach((r) => Object.assign(r, update));
        return { data: matched, error: null };
      }
      return query;
    },
  };
  return {
    record,
    handlers: createBotTeamHandlers(
      (async () => db) as unknown as Parameters<
        typeof createBotTeamHandlers
      >[0],
    ),
  };
}
function request(method: string, body?: unknown, origin?: string) {
  return new Request("http://localhost/api/bot-teams", {
    method,
    headers: {
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const command = {
  spaceId,
  itemId,
  revision: 1,
  command: { action: "new-chat", target: "team" },
};

test("API requires authentication and derives write authority from membership", async () => {
  expect(canManageBots("Viewer")).toBeFalsy();
  expect(canManageBots("unknown")).toBeFalsy();
  expect(
    (await fakeDatabase("Owner", false).handlers.PUT(request("PUT", command)))
      .status,
  ).toBe(401);
  const viewer = fakeDatabase("Viewer").handlers;
  expect(
    (
      await viewer.GET(
        new Request(`http://localhost/api/bot-teams?spaceId=${spaceId}`),
      )
    ).status,
  ).toBe(200);
  expect(
    (await viewer.PUT(request("PUT", { ...command, role: "Owner" }))).status,
  ).toBe(403);
  expect(
    (
      await viewer.POST(
        request("POST", { spaceId, title: "x", template: "blank" }),
      )
    ).status,
  ).toBe(403);
});

test("API blocks foreign workspace, old records, stale revisions, race writes and origins", async () => {
  const { handlers, record } = fakeDatabase();
  expect(
    (
      await handlers.GET(
        new Request(
          `http://localhost/api/bot-teams?spaceId=${otherSpace}&itemId=${itemId}`,
        ),
      )
    ).status,
  ).toBe(403);
  expect(
    (await handlers.PUT(request("PUT", { ...command, itemId: otherSpace })))
      .status,
  ).toBe(404);
  expect(
    (await handlers.PUT(request("PUT", { ...command, revision: 2 }))).status,
  ).toBe(409);
  expect(
    (await handlers.PUT(request("PUT", command, "https://other.example")))
      .status,
  ).toBe(403);
  expect(
    (
      await fakeDatabase("Owner", true, true).handlers.PUT(
        request("PUT", command),
      )
    ).status,
  ).toBe(409);
  record.kind = "project";
  expect((await handlers.PUT(request("PUT", command))).status).toBe(404);
});

test("API accepts the public Host when Next uses an internal localhost URL", async () => {
  const { handlers } = fakeDatabase();
  const request = new Request("http://localhost:3100/api/bot-teams", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      host: "127.0.0.1:3100",
      origin: "http://127.0.0.1:3100",
    },
    body: JSON.stringify(command),
  });
  expect((await handlers.PUT(request)).status).toBe(200);
  const crossSite = new Request("http://localhost:3100/api/bot-teams", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      host: "127.0.0.1:3100",
      origin: "http://evil.example",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify(command),
  });
  expect((await handlers.PUT(crossSite)).status).toBe(403);
});

test("API persists and reloads a versioned team conversation", async () => {
  const { handlers, record } = fakeDatabase();
  expect((await handlers.PUT(request("PUT", command))).status).toBe(200);
  expect(record.revision).toBe(2);
  const sent = await handlers.PUT(
    request("PUT", {
      ...command,
      revision: 2,
      command: {
        action: "send",
        chatId: record.data.chats[0].id,
        text: "Plan onboarding",
      },
    }),
  );
  expect(sent.status).toBe(200);
  const response = await handlers.GET(
    new Request(
      `http://localhost/api/bot-teams?spaceId=${spaceId}&itemId=${itemId}`,
    ),
  );
  const body = await response.json();
  expect(body.records[0].data.chats[0].messages).toHaveLength(8);
  expect(body.records[0].revision).toBe(3);
});
