import { FALLBACK_MODELS } from "@/lib/demo-data";

export const runtime = "nodejs";

type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
};

function providerName(id: string) {
  const provider = id.split("/")[0].replace(/^~/, "");
  return provider
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Model catalog unavailable");

    const payload = (await response.json()) as { data?: OpenRouterModel[] };
    const models = (payload.data ?? [])
      .filter((model) => !model.id.includes(":batch"))
      .map((model) => ({
        id: model.id,
        name: model.name ?? model.id,
        provider: providerName(model.id),
        description: model.context_length
          ? `${Math.round(model.context_length / 1000)}k context through OpenRouter.`
          : "Available through OpenRouter.",
        speed: "Balanced" as const,
      }));

    return Response.json({
      models: [FALLBACK_MODELS[0], ...models],
      live: true,
    });
  } catch {
    return Response.json({ models: FALLBACK_MODELS, live: false });
  }
}
