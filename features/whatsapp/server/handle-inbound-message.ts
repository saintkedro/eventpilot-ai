import "server-only";

import { isPublishIntent } from "@/features/whatsapp/server/detect-publish-intent";
import { isRsvpQueryIntent } from "@/features/whatsapp/server/detect-rsvp-query-intent";
import { runEventIntake } from "@/features/whatsapp/server/event-intake/run-event-intake";
import { handlePublishEvent } from "@/features/whatsapp/server/publish-event";
import { handleRsvpQuery } from "@/features/whatsapp/server/handle-rsvp-query";
import {
  resolveOrCreateWhatsAppUser,
  touchWhatsAppSessionOutbound,
} from "@/features/whatsapp/server/resolve-or-create-user";
import { tryGetOpenAIEnv } from "@/lib/env/server";
import { logError, logInfo } from "@/lib/logger";
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
      "I can help you plan events over text — send Hi to get started, or use this format:\n\n*[Event name]* on *[date]* at *[time]*. I'm *[your name]*.",
    );
    await touchWhatsAppSessionOutbound(message.from);
    return;
  }

  const text = message.text.trim();

  if (isPublishIntent(text)) {
    try {
      const result = await handlePublishEvent(context);

      if (result.published) {
        logInfo("whatsapp.event_published", {
          eventId: result.eventId,
          waId: message.from,
        });
      }

      await sendTextMessage(message.from, result.reply);
      await touchWhatsAppSessionOutbound(message.from);
      return;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logError("event_publish.failed", { reason, waId: message.from });

      await sendTextMessage(
        message.from,
        "Sorry — I couldn't publish your event right now. Please try again in a moment.",
      );
      await touchWhatsAppSessionOutbound(message.from);
      return;
    }
  }

  if (isRsvpQueryIntent(text)) {
    try {
      const result = await handleRsvpQuery(context);
      await sendTextMessage(message.from, result.reply);
      await touchWhatsAppSessionOutbound(message.from);
      return;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logError("rsvp_query.failed", { reason, waId: message.from });

      await sendTextMessage(
        message.from,
        "Sorry — I couldn't fetch RSVP stats right now. Please try again in a moment.",
      );
      await touchWhatsAppSessionOutbound(message.from);
      return;
    }
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

  try {
    const result = await runEventIntake({
      userMessage: text,
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
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logError("event_intake.failed", { reason, waId: message.from });

    await sendTextMessage(
      message.from,
      "Sorry — I hit a snag processing that. Please try again in a moment, or send Hi to start over.",
    );
    await touchWhatsAppSessionOutbound(message.from);
  }
}
