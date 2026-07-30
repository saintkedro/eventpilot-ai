/** Default utility-message estimate for Nigeria (USD). Override via env. */
const DEFAULT_WHATSAPP_UTILITY_MESSAGE_USD = 0.0067;

/** Reads configured WhatsApp per-message cost estimate (USD). */
export function getWhatsAppUtilityMessageUsd(): number {
  const raw = process.env.WHATSAPP_ESTIMATED_USD_PER_MESSAGE?.trim();
  if (!raw) {
    return DEFAULT_WHATSAPP_UTILITY_MESSAGE_USD;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_WHATSAPP_UTILITY_MESSAGE_USD;
}

/** Estimates outbound WhatsApp utility message cost (approximate). */
export function estimateWhatsAppOutboundCostUsd(): number {
  return getWhatsAppUtilityMessageUsd();
}
