import "server-only";

import { getRsvpSummaryForEvent } from "@/features/events/server/rsvp";
import type { WhatsAppUserContext } from "@/features/whatsapp/server/resolve-or-create-user";
import { createAdminClient } from "@/lib/supabase/admin";

export type RsvpQueryResult = {
  reply: string;
};

function formatSummaryReply(
  title: string,
  summary: Awaited<ReturnType<typeof getRsvpSummaryForEvent>>,
): string {
  const lines = [
    `RSVP summary for *${title}*:`,
    "",
    `✅ Yes: ${summary.yes}`,
    `🤔 Maybe: ${summary.maybe}`,
    `❌ No: ${summary.no}`,
  ];

  if (summary.capacity !== null) {
    lines.push(
      "",
      `Capacity: ${summary.capacity}${summary.spotsLeft !== null ? ` (${summary.spotsLeft} spots left)` : ""}`,
    );
  }

  if (summary.total === 0) {
    lines.push("", "No RSVPs yet — share your event link with guests!");
  }

  return lines.join("\n");
}

/** Returns RSVP counts for the organizer's active event. */
export async function handleRsvpQuery(
  context: WhatsAppUserContext,
): Promise<RsvpQueryResult> {
  const eventId = context.session.active_event_id;

  if (!eventId) {
    return {
      reply:
        "You don't have an active event yet. Create and publish an event first, then share the link to collect RSVPs.",
    };
  }

  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, status")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    throw new Error(`Event load failed: ${error?.message ?? "not found"}`);
  }

  if (event.status !== "published") {
    return {
      reply:
        "Your event isn't published yet. Say *publish my event* first, then share the link to collect RSVPs.",
    };
  }

  const summary = await getRsvpSummaryForEvent(event.id);

  return {
    reply: formatSummaryReply(event.title ?? "Your event", summary),
  };
}
