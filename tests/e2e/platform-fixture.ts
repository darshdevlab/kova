import type { Page } from "@playwright/test";
import { initialWorkspace } from "../../src/lib/workspace-state";
import type { PlatformRecord, Space, Role } from "../../src/lib/platform";
export const PROJECT_ID = "b0000000-0000-4000-8000-000000000001";
export const USER_ID = "c0000000-0000-4000-8000-000000000001";
export const SPACE_ID = "d0000000-0000-4000-8000-000000000001";
export async function platformFixture(page: Page, role: Role = "Owner") {
  const spaces: Space[] = [
    {
      id: SPACE_ID,
      name: "Personal workspace",
      kind: "personal",
      owner_id: USER_ID,
    },
  ];
  const project = {
    id: PROJECT_ID,
    name: "RelayDesk",
    description: "Track tasks with clear approvals",
    status: "Draft" as const,
    updatedAt: "Just now",
    source: "Prompt" as const,
    mode: "Guided" as const,
    accent: "green" as const,
    progress: 0,
  };
  const records: PlatformRecord[] = [
    {
      id: PROJECT_ID,
      space_id: SPACE_ID,
      kind: "project",
      data: {
        title: project.name,
        description: project.description,
        source: "Prompt",
        stage: "Build",
        status: "Approved",
        workspace: { ...initialWorkspace(project), approved: true },
      },
      revision: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  const invites: {
    id: string;
    space_id: string;
    email: string;
    role: string;
  }[] = [];
  const user = {
    id: USER_ID,
    email: "qa@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { full_name: "Quality reviewer" },
    app_metadata: {},
    created_at: new Date().toISOString(),
  };
  await page.addInitScript(
    ({ user }) => {
      const session = JSON.stringify({
        access_token: "fixture-token",
        refresh_token: "fixture-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user,
      });
      document.cookie = `sb-rdcjmsiehmbsymsuzobq-auth-token=base64-${btoa(session)}; path=/; SameSite=Lax`;
    },
    { user },
  );
  await page.route("https://*.supabase.co/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname;
    const body = request.postDataJSON();
    const single = request.headers()["accept"]?.includes("object+json");
    const json = (value: unknown, status = 200) =>
      route.fulfill({ status, json: value });
    if (path.endsWith("/user")) return json(user);
    if (path.endsWith("/logout")) return json({});
    if (path.endsWith("/kova_accept_invites")) return json(null);
    if (path.endsWith("/kova_create_space")) {
      if (body.space_kind === "personal") return json(SPACE_ID);
      const id = crypto.randomUUID();
      spaces.push({
        id,
        name: body.space_name,
        kind: "company",
        owner_id: USER_ID,
      });
      return json(id);
    }
    if (path.endsWith("/kova_spaces")) return json(spaces);
    if (path.endsWith("/kova_members")) {
      const members = [{ space_id: SPACE_ID, user_id: USER_ID, role }];
      return json(single ? members[0] : members);
    }
    if (path.endsWith("/kova_invites")) {
      if (request.method() === "POST") {
        invites.push({ ...body, id: crypto.randomUUID() });
        return json(null, 201);
      }
      if (request.method() === "DELETE") {
        const index = invites.findIndex(
          (r) => `eq.${r.id}` === url.searchParams.get("id"),
        );
        invites.splice(index, 1);
        return json(null);
      }
      return json(
        invites.filter(
          (i) => `eq.${i.space_id}` === url.searchParams.get("space_id"),
        ),
      );
    }
    if (path.endsWith("/kova_records")) {
      if (request.method() === "POST") {
        if (role === "Viewer") return json({ message: "Denied" }, 403);
        const record = {
          ...body,
          id: crypto.randomUUID(),
          revision: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        records.push(record);
        return json(single ? record : [record], 201);
      }
      let selected = records.filter((r) =>
        ["id", "space_id", "kind", "revision"].every(
          (key) =>
            !url.searchParams.has(key) ||
            `eq.${r[key as keyof PlatformRecord]}` ===
              url.searchParams.get(key),
        ),
      );
      if (request.method() === "PATCH") {
        selected = selected.map((r) => {
          Object.assign(r, body);
          return r;
        });
      }
      return json(single ? selected[0] || null : selected);
    }
    return json({ message: "Unmocked endpoint" }, 404);
  });
  return { records, spaces, invites };
}
