import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(12000),
  model: z.string().trim().min(1).max(200),
  mode: z.enum(["Guided", "Developer"]),
  projectName: z.string().trim().min(1).max(100),
});

function demoResponse(prompt: string, mode: "Guided" | "Developer") {
  const subject = prompt.toLowerCase().includes("agent")
    ? "agent workflow"
    : prompt.toLowerCase().includes("test")
      ? "verification plan"
      : "project brief";
  return `Your request is saved in this conversation. A useful next step is to update the ${subject} and its acceptance criteria. ${mode === "Developer" ? "Repository execution and code generation require connected services." : "Connect an AI provider to get a model-generated response."} This local response did not change the application or run tests.`;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid generation request" },
      { status: 400 },
    );
  }

  const { prompt, model, mode, projectName } = parsed.data;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const selectedModel =
    model === "auto"
      ? (process.env.OPENROUTER_DEFAULT_MODEL ?? "openai/gpt-6-sol")
      : model;

  if (!apiKey) {
    return Response.json({
      content: demoResponse(prompt, mode),
      model: selectedModel,
      funding: "Demo",
    });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "Kova Architect 2.0",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: `You are Kova, a planning copilot for ${projectName}. You have NO tools, file access, repository execution, test runner, or deployment access in this conversation. Give useful concise guidance or code, but never say you changed files, built an application, ran checks, or deployed anything. The workspace mode is ${mode}.`,
            },
            { role: "user", content: prompt },
          ],
        }),
      },
    );

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
      content:
        payload.choices?.[0]?.message?.content ?? demoResponse(prompt, mode),
      model: payload.model ?? selectedModel,
      funding: "OpenRouter",
    });
  } catch {
    return Response.json(
      { error: "Unable to reach OpenRouter" },
      { status: 502 },
    );
  }
}
