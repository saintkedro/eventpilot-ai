import "server-only";

import { getOpenAIEnv } from "@/lib/env/server";
import { logError } from "@/lib/logger";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResult = {
  content: string;
};

/** Calls OpenAI chat completions and returns the assistant message text. */
export async function createChatCompletion(
  messages: ChatMessage[],
): Promise<ChatCompletionResult> {
  const { apiKey, model } = getOpenAIEnv();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logError("openai.chat_failed", {
      status: response.status,
      error: errorBody,
    });
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return { content };
}
