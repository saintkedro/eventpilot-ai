import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

/** Lists change.field values present in a webhook payload (for debugging). */
export function extractWebhookFields(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const body = payload as WhatsAppWebhookPayload;
  const fields = new Set<string>();

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field) {
        fields.add(change.field);
      }
    }
  }

  return [...fields];
}
