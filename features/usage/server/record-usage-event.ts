import "server-only";

import { estimateOpenAIChatCostUsd } from "@/lib/openai/pricing";
import { logError, logInfo } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/types/database";

type RecordOpenAIChatUsageInput = {
  sessionId: string;
  waId: string;
  eventId?: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, unknown>;
};

/** Persists OpenAI token usage for a WhatsApp conversation turn. */
export async function recordOpenAIChatUsage(
  input: RecordOpenAIChatUsageInput,
): Promise<void> {
  const estimatedUsd = estimateOpenAIChatCostUsd(
    input.model,
    input.promptTokens,
    input.completionTokens,
  );

  const row: TablesInsert<"usage_events"> = {
    kind: "openai_chat",
    session_id: input.sessionId,
    wa_id: input.waId,
    event_id: input.eventId ?? null,
    model: input.model,
    prompt_tokens: input.promptTokens,
    completion_tokens: input.completionTokens,
    total_tokens: input.totalTokens,
    estimated_usd: estimatedUsd,
    metadata: (input.metadata ?? {}) as Json,
  };

  const supabase = createAdminClient();
  const { error } = await supabase.from("usage_events").insert(row);

  if (error) {
    logError("usage.record_failed", {
      kind: "openai_chat",
      sessionId: input.sessionId,
      error: error.message,
    });
    return;
  }

  logInfo("usage.recorded", {
    kind: "openai_chat",
    sessionId: input.sessionId,
    waId: input.waId,
    model: input.model,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    estimatedUsd,
  });
}
