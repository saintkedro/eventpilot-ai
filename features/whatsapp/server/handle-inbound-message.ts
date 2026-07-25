import "server-only";

import { runEventIntake } from "@/features/whatsapp/server/event-intake/run-event-intake";
import {
  resolveOrCreateWhatsAppUser,
  touchWhatsAppSessionOutbound,
} from "@/features/whatsapp/server/resolve-or-create-user";
import { tryGetOpenAIEnv } from "@/lib/env/server";
import { logInfo } from "@/lib/logger";
import { sendTextMessage } from "@/lib/whatsapp/client";
import type { InboundWhatsAppMessage } from "@/lib/whatsapp/types";

/** Handles a single inbound WhatsApp message via AI event intake. */
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

  if (message.type !== "text" || !message.text?.trim()) {
    await sendTextMessage(
      message.from,
      "I can help you plan events over text for now — tell me what you're organizing!",
    );
    await touchWhatsAppSessionOutbound(message.from);
    return;
  }

  const openai = tryGetOpenAIEnv();

  if (!openai) {
    await sendTextMessage(
      message.from,
      "EventPilot is almost ready — the AI coordinator isn't configured yet. Please add OPENAI_API_KEY and try again.",
    );
    await touchWhatsAppSessionOutbound(message.from);
    return;
  }

  const result = await runEventIntake({
    userMessage: message.text,
    context,
  });

  if (result.eventCreated) {
    logInfo("whatsapp.event_created", {
      eventId: result.eventId,
      waId: message.from,
    });
  }

  await sendTextMessage(message.from, result.reply);
  await touchWhatsAppSessionOutbound(message.from);
}
