import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

/** Counts inbound user messages vs delivery status events in a webhook payload. */
export function summarizeWebhookPayload(payload: unknown): {
  messageCount: number;
  statusCount: number;
} {
  if (typeof payload !== "object" || payload === null) {
    return { messageCount: 0, statusCount: 0 };
  }

  const body = payload as WhatsAppWebhookPayload;
  let messageCount = 0;
  let statusCount = 0;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      messageCount += change.value?.messages?.length ?? 0;
      statusCount += change.value?.statuses?.length ?? 0;
    }
  }

  return { messageCount, statusCount };
}
