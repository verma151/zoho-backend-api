import Groq from "groq-sdk";

import { executeTool, toolDefinitions } from "./tools.js";
import { SYSTEM_PROMPT } from "./prompt.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type GroqMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
};

export interface AgentResult {
  response: string;
  stage: string | null;
}

export async function runAgent(
  message: string,
  history: any[] = []
): Promise<AgentResult> {
  const normalizedHistory: GroqMessage[] = history
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role,
      content:
        msg.content ??
        msg.parts?.map((part: any) => part.text || "").join("") ??
        "",
    }));

  const messages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...normalizedHistory,
    { role: "user", content: message },
  ];

  let latestStage: string | null = null;

  while (true) {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const assistantMessage = completion.choices[0].message;

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return { response: assistantMessage.content || "", stage: latestStage };
    }

    messages.push({
      role: "assistant",
      content: assistantMessage.content || null,
      tool_calls: assistantMessage.tool_calls,
    });

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      let args: any;

      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: "Invalid tool arguments" }),
        });
        continue;
      }

      try {
        const result = await executeTool(toolName, args);
        if (result.stage) latestStage = result.stage;

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } catch (error: any) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            success: false,
            error: `Tool ${toolName} failed`,
          }),
        });
      }
    }
  }
}