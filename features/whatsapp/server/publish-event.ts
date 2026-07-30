import "server-only";

import {
  formatEventDateTimeForWhatsApp,
} from "@/features/whatsapp/server/event-intake/format-event-datetime";
import { DEFAULT_TIMEZONE } from "@/features/whatsapp/server/event-intake/resolve-relative-date";
import type { WhatsAppUserContext } from "@/features/whatsapp/server/resolve-or-create-user";
import { buildEventPublicUrl } from "@/lib/env/app-url";
import { logInfo } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/types/database";

export type PublishEventResult = {
  reply: string;
  published: boolean;
  alreadyPublished: boolean;
  eventId?: string;
};

function buildPublishReply(event: Tables<"events">, alreadyPublished: boolean): string {
  if (!event.public_slug) {
    throw new Error("Event is missing a public slug");
  }

  const { date, time } = formatEventDateTimeForWhatsApp(
    event.starts_at,
    event.timezone ?? DEFAULT_TIMEZONE,
  );
  const link = buildEventPublicUrl(event.public_slug);

  const headline = alreadyPublished
    ? "Your event is already live!"
    : "🎉 Your event is live!";

  return [
    headline,
    "",
    `*${event.title ?? "Your event"}*`,
    `📅 ${date}`,
    `🕐 ${time}`,
    event.venue_name ? `📍 ${event.venue_name}` : "",
    event.venue_address ? `   ${event.venue_address}` : "",
    "",
    alreadyPublished ? "Share with guests:" : "Share this link with guests:",
    link,
    "",
    "Say *new event* when you want to plan another.",
  ]
    .filter(Boolean)
    .join("\n");
}

function mergePublishedMetadata(metadata: Json): Json {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : {};

  return {
    ...base,
    published_at: new Date().toISOString(),
    published_via: "whatsapp",
  };
}

/** Publishes the organizer's active event and returns a WhatsApp reply with the link. */
export async function handlePublishEvent(
  context: WhatsAppUserContext,
): Promise<PublishEventResult> {
  const eventId = context.session.active_event_id;

  if (!eventId) {
    return {
      reply:
        "You don't have an event to publish yet. Tell me what you're planning and I'll create a draft first.",
      published: false,
      alreadyPublished: false,
    };
  }

  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    throw new Error(`Event load failed: ${error?.message ?? "not found"}`);
  }

  if (!event.title?.trim()) {
    return {
      reply: "Your event needs a title before it can go live. Tell me what to call it.",
      published: false,
      alreadyPublished: false,
      eventId: event.id,
    };
  }

  if (!event.starts_at?.trim()) {
    return {
      reply: "Your event needs a date and time before publishing. When is it happening?",
      published: false,
      alreadyPublished: false,
      eventId: event.id,
    };
  }

  if (!event.public_slug?.trim()) {
    throw new Error("Event is missing a public slug");
  }

  if (event.status === "published") {
    return {
      reply: buildPublishReply(event, true),
      published: false,
      alreadyPublished: true,
      eventId: event.id,
    };
  }

  if (event.status !== "draft") {
    return {
      reply: `This event is ${event.status} and can't be published from chat right now.`,
      published: false,
      alreadyPublished: false,
      eventId: event.id,
    };
  }

  const { data: published, error: updateError } = await supabase
    .from("events")
    .update({
      status: "published",
      metadata: mergePublishedMetadata(event.metadata),
    })
    .eq("id", event.id)
    .select("*")
    .single();

  if (updateError || !published) {
    throw new Error(`Event publish failed: ${updateError?.message ?? "unknown"}`);
  }

  logInfo("event.published", {
    eventId: published.id,
    publicSlug: published.public_slug,
    profileId: context.profile.id,
    waId: context.session.wa_id,
  });

  return {
    reply: buildPublishReply(published, false),
    published: true,
    alreadyPublished: false,
    eventId: published.id,
  };
}
