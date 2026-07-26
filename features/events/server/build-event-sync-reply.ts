import "server-only";

import { formatEventDateTimeForWhatsApp } from "@/features/whatsapp/server/event-intake/format-event-datetime";
import { DEFAULT_TIMEZONE } from "@/features/whatsapp/server/event-intake/resolve-relative-date";
import { buildEventPublicUrl } from "@/lib/env/app-url";
import type { Tables } from "@/types/database";

/** WhatsApp confirmation after syncing event changes to the database. */
export function buildEventSyncReply(
  event: Tables<"events">,
  modelReply: string,
): string {
  const { date, time } = formatEventDateTimeForWhatsApp(
    event.starts_at,
    event.timezone ?? DEFAULT_TIMEZONE,
  );

  const lines = [
    modelReply,
    "",
    `✅ Updated *${event.title ?? "your event"}*`,
    `📅 ${date}`,
    `🕐 ${time}`,
    event.venue_name ? `📍 ${event.venue_name}` : "",
    event.venue_address ? `   ${event.venue_address}` : "",
  ];

  if (event.status === "published" && event.public_slug) {
    lines.push(
      "",
      "Your event page (same link — refresh to see updates):",
      buildEventPublicUrl(event.public_slug),
    );
  } else {
    lines.push("", "Say *publish my event* when you're ready to share.");
  }

  return lines.filter(Boolean).join("\n");
}
