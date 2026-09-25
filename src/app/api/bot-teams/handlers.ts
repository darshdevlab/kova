import { z } from "zod";
import { serverDatabase } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/request-origin";
import {
  applyTeamCommand,
  canManageBots,
  commandSchema,
  createTeam,
  teamSchema,
} from "@/lib/bot-teams";

const scopeSchema = z.object({
  spaceId: z.uuid(),
  itemId: z.uuid().optional(),
});
const createSchema = z.object({
  spaceId: z.uuid(),
  title: z.string().trim().min(1).max(160),
  template: z.enum(["blank", "product", "research"]),
});
const updateSchema = scopeSchema.extend({
  itemId: z.uuid(),
  revision: z.number().int().positive(),
  command: commandSchema,
});
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export function createBotTeamHandlers(
  database: typeof serverDatabase = serverDatabase,
) {
  async function access(spaceId: string, write: boolean) {
    const db = await database();
    const {
      data: { user },
      error,
    } = await db.auth.getUser();
    if (error || !user)
      return { response: reply({ error: "Sign in to open Bot teams." }, 401) };
    const { data: member } = await db
      .from("kova_members")
      .select("role")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .single();
    if (!member || (write && !canManageBots(member.role)))
      return { response: reply({ error: "Workspace access denied." }, 403) };
    return { db, user, role: member.role as string };
  }

  async function GET(request: Request) {
    const parsed = scopeSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success)
      return reply({ error: "Invalid workspace or team ID." }, 400);
    try {
      const auth = await access(parsed.data.spaceId, false);
      if (auth.response) return auth.response;
      let query = auth.db
        .from("kova_records")
        .select("id,space_id,revision,data")
        .eq("space_id", parsed.data.spaceId)
        .eq("kind", "bot")
        .eq("data->>schema", "bot-team-v2");
      if (parsed.data.itemId) query = query.eq("id", parsed.data.itemId);
      const { data, error } = await query.order("updated_at", {
        ascending: false,
      });
      if (error) return reply({ error: "Could not load Bot teams." }, 503);
      if (parsed.data.itemId && !data?.length)
        return reply({ error: "Team not found in this workspace." }, 404);
      const records = (data ?? []).map((row) => ({
        ...row,
        data: teamSchema.parse(row.data),
      }));
      return reply({ records, role: auth.role });
    } catch {
      return reply({ error: "Bot teams are unavailable. Retry shortly." }, 503);
    }
  }

  async function POST(request: Request) {
    if (!isSameOrigin(request))
      return reply({ error: "Origin not allowed." }, 403);
    const parsed = createSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return reply({ error: "Enter a team name and valid workspace." }, 400);
    try {
      const auth = await access(parsed.data.spaceId, true);
      if (auth.response) return auth.response;
      const { data, error } = await auth.db
        .from("kova_records")
        .insert({
          space_id: parsed.data.spaceId,
          kind: "bot",
          data: createTeam(parsed.data.title, parsed.data.template),
        })
        .select("id,space_id,revision,data")
        .single();
      if (error) return reply({ error: "Team could not be saved." }, 503);
      return reply({ record: data }, 201);
    } catch {
      return reply({ error: "Cloud connection unavailable." }, 503);
    }
  }

  async function PUT(request: Request) {
    if (!isSameOrigin(request))
      return reply({ error: "Origin not allowed." }, 403);
    const parsed = updateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return reply(
        { error: "Invalid team change. Check all fields and relationships." },
        400,
      );
    try {
      const { spaceId, itemId, revision, command } = parsed.data;
      const auth = await access(spaceId, true);
      if (auth.response) return auth.response;
      const { data: current, error: readError } = await auth.db
        .from("kova_records")
        .select("data,revision")
        .eq("space_id", spaceId)
        .eq("id", itemId)
        .eq("kind", "bot")
        .eq("data->>schema", "bot-team-v2")
        .single();
      if (readError || !current)
        return reply({ error: "Team not found in this workspace." }, 404);
      if (current.revision !== revision)
        return reply(
          { error: "This team changed elsewhere. Reload before retrying." },
          409,
        );
      let next;
      try {
        next = applyTeamCommand(
          teamSchema.parse(current.data),
          command,
          auth.user.id,
        );
      } catch (error) {
        return reply(
          {
            error:
              error instanceof z.ZodError
                ? "Team capacity reached or configuration invalid."
                : error instanceof Error
                  ? error.message
                  : "Invalid change.",
          },
          400,
        );
      }
      const { data, error } = await auth.db
        .from("kova_records")
        .update({
          data: next,
          revision: revision + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("space_id", spaceId)
        .eq("id", itemId)
        .eq("kind", "bot")
        .eq("revision", revision)
        .select("id,space_id,revision,data")
        .single();
      if (error || !data)
        return reply(
          {
            error:
              "Save failed or team changed elsewhere. Reload before retrying.",
          },
          409,
        );
      return reply({ record: data });
    } catch {
      return reply({ error: "Cloud connection unavailable." }, 503);
    }
  }

  return { GET, POST, PUT };
}
