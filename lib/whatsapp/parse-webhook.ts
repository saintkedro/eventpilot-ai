import type {
  InboundWhatsAppMessage,
  WhatsAppWebhookPayload,
} from "@/lib/whatsapp/types";

function isWebhookPayload(value: unknown): value is WhatsAppWebhookPayload {
  return typeof value === "object" && value !== null;
}

/** Extracts inbound user messages from a Meta WhatsApp webhook payload. */
export function parseInboundMessages(payload: unknown): InboundWhatsAppMessage[] {
  if (!isWebhookPayload(payload) || payload.object !== "whatsapp_business_account") {
    return [];
  }

  const messages: InboundWhatsAppMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") {
        continue;
      }

      for (const message of change.value?.messages ?? []) {
        messages.push({
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text?.body,
        });
      }
    }
  }

  return messages;
}
