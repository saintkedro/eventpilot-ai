import "server-only";

import { getPublishedEventBySlug } from "@/features/events/server/get-published-event-by-slug";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RsvpStatus } from "@/types/database";

export type RsvpSummary = {
  eventId: string;
  eventTitle: string;
  yes: number;
  no: number;
  maybe: number;
  total: number;
  capacity: number | null;
  spotsLeft: number | null;
};

const RSVP_STATUSES: RsvpStatus[] = ["yes", "no", "maybe"];

function isRsvpStatus(value: string): value is RsvpStatus {
  return RSVP_STATUSES.includes(value as RsvpStatus);
}

/** Aggregates RSVP counts for an event. */
export async function getRsvpSummaryForEvent(eventId: string): Promise<RsvpSummary> {
  const supabase = createAdminClient();

  const [{ data: event, error: eventError }, { data: rows, error: rsvpError }] =
    await Promise.all([
      supabase.from("events").select("id, title, capacity").eq("id", eventId).single(),
      supabase.from("event_rsvps").select("status").eq("event_id", eventId),
    ]);

  if (eventError || !event) {
    throw new Error(`Event load failed: ${eventError?.message ?? "not found"}`);
  }

  if (rsvpError) {
    throw new Error(`RSVP load failed: ${rsvpError.message}`);
  }

  let yes = 0;
  let no = 0;
  let maybe = 0;

  for (const row of rows ?? []) {
    if (row.status === "yes") yes += 1;
    if (row.status === "no") no += 1;
    if (row.status === "maybe") maybe += 1;
  }

  const capacity = event.capacity;
  const spotsLeft = capacity === null ? null : Math.max(capacity - yes, 0);

  return {
    eventId: event.id,
    eventTitle: event.title ?? "Your event",
    yes,
    no,
    maybe,
    total: yes + no + maybe,
    capacity,
    spotsLeft,
  };
}

export type SubmitRsvpInput = {
  publicSlug: string;
  guestName: string;
  guestPhone?: string | null;
  status: RsvpStatus;
};

export type SubmitRsvpResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function normalizePhone(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Records a guest RSVP for a published event. */
export async function submitEventRsvp(
  input: SubmitRsvpInput,
): Promise<SubmitRsvpResult> {
  const guestName = input.guestName.trim();

  if (!guestName) {
    return { ok: false, message: "Please enter your name." };
  }

  if (guestName.length > 120) {
    return { ok: false, message: "Name is too long." };
  }

  if (!isRsvpStatus(input.status)) {
    return { ok: false, message: "Please choose Yes, No, or Maybe." };
  }

  const event = await getPublishedEventBySlug(input.publicSlug);

  if (!event) {
    return { ok: false, message: "This event is not available for RSVP." };
  }

  if (input.status === "yes" && event.capacity !== null) {
    const summary = await getRsvpSummaryForEvent(event.id);

    if (summary.yes >= event.capacity) {
      return {
        ok: false,
        message: "Sorry — this event is at capacity. You can still RSVP as Maybe or No.",
      };
    }
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("event_rsvps").insert({
    event_id: event.id,
    guest_name: guestName,
    guest_phone: normalizePhone(input.guestPhone),
    status: input.status,
    source: "web",
  });

  if (error) {
    throw new Error(`RSVP save failed: ${error.message}`);
  }

  const statusLabel =
    input.status === "yes" ? "Yes" : input.status === "no" ? "No" : "Maybe";

  return {
    ok: true,
    message: `Thanks, ${guestName}! Your RSVP (${statusLabel}) is recorded.`,
  };
}

/** Parses and validates RSVP form data from a server action. */
export function parseRsvpFormData(formData: FormData): SubmitRsvpInput | SubmitRsvpResult {
  const publicSlug = String(formData.get("publicSlug") ?? "").trim();
  const guestName = String(formData.get("guestName") ?? "");
  const guestPhone = String(formData.get("guestPhone") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!publicSlug) {
    return { ok: false, message: "Invalid event." };
  }

  if (!isRsvpStatus(status)) {
    return { ok: false, message: "Please choose Yes, No, or Maybe." };
  }

  return {
    publicSlug,
    guestName,
    guestPhone: guestPhone || null,
    status,
  };
}
