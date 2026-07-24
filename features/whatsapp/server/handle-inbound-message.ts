import "server-only";

import { sendTextMessage } from "@/lib/whatsapp/client";
import type { InboundWhatsAppMessage } from "@/lib/whatsapp/types";

function buildReply(inboundText: string): string {
  const trimmed = inboundText.trim();

  if (/^(hi|hello|hey|start)\b/i.test(trimmed)) {
    return [
      "Hi! I'm EventPilot — your event coordinator on WhatsApp.",
      "",
      "Tell me about the event you're planning, and I'll help you set it up.",
    ].join("\n");
  }

  return [
    `You said: "${trimmed}"`,
    "",
    "I'm connected and listening. Full event setup via chat is coming next — thanks for testing!",
  ].join("\n");
}

/** Handles a single inbound WhatsApp message (echo bot for Sprint 1). */
export async function handleInboundWhatsAppMessage(
  message: InboundWhatsAppMessage,
): Promise<void> {
  if (message.type === "text" && message.text) {
    await sendTextMessage(message.from, buildReply(message.text));
    return;
  }

  await sendTextMessage(
    message.from,
    "Thanks for reaching out! I can read text messages for now — tell me about the event you're planning.",
  );
}
