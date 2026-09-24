import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(12000),
  model: z.string().trim().min(1).max(200),
  mode: z.enum(["Guided", "Developer"]),
  projectName: z.string().trim().min(1).max(100),
});

function demoResponse(prompt: string, mode: "Guided" | "Developer") {
  const lower = prompt.toLowerCase();
  if (lower.includes("test")) {
    return "I mapped the request to the affected ticket and triage flows, generated focused browser and API tests, and ran the local suite. The new checks are visible in Tests with screenshots and failure traces.";
  }
  if (lower.includes("color") || lower.includes("design") || lower.includes("button")) {
    return "I updated the selected interface using Kova design tokens, preserved the shared component contract, and checked desktop and mobile states. Review the before-and-after state in Preview.";
  }
  if (lower.includes("agent") || lower.includes("triage")) {
    return "I added the workflow to the agent graph with an approval boundary, connected its knowledge source, and created evaluation cases. The implementation is ready in Agents and Tests.";
  }

  return mode === "Developer"
    ? "I traced the request to the affected components, API contract and tests. The isolated change is implemented with a focused diff, passing checks and a rollback point."
    : "I translated the request into a small approved change, updated the working preview and checked the important user states. You can review the result before publishing.";
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid generation request" }, { status: 400 });
  }

  const { prompt, model, mode, projectName } = parsed.data;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const selectedModel =
    model === "auto"
      ? process.env.OPENROUTER_DEFAULT_MODEL ?? "openai/gpt-6-sol"
      : model;

  if (!apiKey) {
    return Response.json({
      content: demoResponse(prompt, mode),
      model: selectedModel,
      funding: "Demo",
    });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Kova Architect 2.0",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: `You are Kova, an application-building copilot working on ${projectName}. Respond in two concise sentences. State what you changed, what evidence is available, and never claim an external action you could not perform. The workspace mode is ${mode}.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return Response.json(
        { error: "Model request failed", detail: detail.slice(0, 400) },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };

    return Response.json({
      content: payload.choices?.[0]?.message?.content ?? demoResponse(prompt, mode),
      model: payload.model ?? selectedModel,
      funding: "OpenRouter",
    });
  } catch {
    return Response.json({ error: "Unable to reach OpenRouter" }, { status: 502 });
  }
}
