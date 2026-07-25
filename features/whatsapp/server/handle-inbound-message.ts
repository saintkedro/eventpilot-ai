import "server-only";

import {
  resolveOrCreateWhatsAppUser,
  touchWhatsAppSessionOutbound,
} from "@/features/whatsapp/server/resolve-or-create-user";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { logInfo } from "@/lib/logger";
import type { WhatsAppUserContext } from "@/features/whatsapp/server/resolve-or-create-user";
import type { InboundWhatsAppMessage } from "@/lib/whatsapp/types";

function buildReply(
  inboundText: string,
  context: WhatsAppUserContext,
): string {
  const trimmed = inboundText.trim();

  if (context.isNewUser && /^(hi|hello|hey|start)\b/i.test(trimmed)) {
    return [
      "Hi! I'm EventPilot — your event coordinator on WhatsApp.",
      "",
      "Tell me about the event you're planning, and I'll help you set it up.",
    ].join("\n");
  }

  if (/^(hi|hello|hey|start)\b/i.test(trimmed)) {
    return [
      "Welcome back! I'm EventPilot.",
      "",
      "Tell me about the event you're planning, or ask me to update an existing one.",
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
  logInfo("whatsapp.inbound", {
    from: message.from,
    type: message.type,
    messageId: message.messageId,
  });

  const context = await resolveOrCreateWhatsAppUser({
    waId: message.from,
    inboundAt: message.timestamp
      ? new Date(Number(message.timestamp) * 1000)
      : undefined,
  });

  logInfo("whatsapp.user.resolved", {
    profileId: context.profile.id,
    organizationId: context.organization.id,
    sessionId: context.session.id,
    isNewUser: context.isNewUser,
  });

  const replyText =
    message.type === "text" && message.text
      ? buildReply(message.text, context)
      : "Thanks for reaching out! I can read text messages for now — tell me about the event you're planning.";

  await sendTextMessage(message.from, replyText);
  await touchWhatsAppSessionOutbound(message.from);
}
