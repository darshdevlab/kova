import { z } from "zod";

export const onboardingKey = "kova:auth:pending-intent:v1";
const schema = z.object({
  version: z.literal(1),
  id: z.uuid(),
  intent: z.enum(["individual", "organisation"]),
  action: z.enum(["create-company", "select-workspace"]),
  organisationName: z.string().trim().min(1).max(80).nullable(),
  email: z.email().nullable(),
  createdAt: z.number(),
});
export function parseOnboardingIntent(
  raw: string | null,
  verifiedEmail: string,
  now = Date.now(),
) {
  if (!raw) return null;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const v = result.data;
    if (
      v.createdAt > now + 60000 ||
      now - v.createdAt > 86400000 ||
      (v.email && v.email.toLowerCase() !== verifiedEmail.toLowerCase())
    )
      return null;
    if (v.action === "create-company" && !v.organisationName) return null;
    return v;
  } catch {
    return null;
  }
}
