/** USD per 1M tokens — update when OpenAI changes list prices. */
const MODEL_PRICING_USD_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-2024-08-06": { input: 2.5, output: 10 },
};

const DEFAULT_PRICING = MODEL_PRICING_USD_PER_MILLION["gpt-4o-mini"];

/** Estimates OpenAI chat cost from token counts and model name. */
export function estimateOpenAIChatCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing =
    MODEL_PRICING_USD_PER_MILLION[model] ??
    MODEL_PRICING_USD_PER_MILLION[model.split(":")[0] ?? ""] ??
    DEFAULT_PRICING;

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return Number((inputCost + outputCost).toFixed(6));
}
