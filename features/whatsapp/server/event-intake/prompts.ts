import type { EventDraft } from "@/features/whatsapp/server/event-intake/types";
import {
  buildCalendarHint,
  buildReferenceNow,
} from "@/features/whatsapp/server/event-intake/resolve-relative-date";

const DEFAULT_TIMEZONE = "Africa/Lagos";

type IntakePromptContext = {
  referenceDate?: Date;
  timezone?: string;
  activeEventTitle?: string | null;
  organizerName?: string | null;
};

export function buildEventIntakeSystemPrompt(
  context: IntakePromptContext = {},
): string {
  const {
    referenceDate = new Date(),
    timezone = DEFAULT_TIMEZONE,
    activeEventTitle,
    organizerName,
  } = context;

  const referenceNow = buildReferenceNow(referenceDate, timezone);
  const calendarHint = buildCalendarHint(referenceDate, timezone);
  const editingLine = activeEventTitle?.trim()
    ? `\nACTIVE EVENT: The organizer is currently editing "${activeEventTitle.trim()}". Merge changes into the draft for THAT event unless they clearly say "new event". If they describe a completely different event, do NOT overwrite — tell them to say "new event" to start fresh.\n`
    : "\nNo active event yet — collect details for a new event.\n";

  const organizerLine = organizerName?.trim()
    ? `Organizer name on file: ${organizerName.trim()} (do not re-ask unless they want to change it).`
    : "Organizer name is NOT on file yet — you MUST ask for it before ready_to_create can be true.";

  return `You are EventPilot — a warm, capable event coordinator on WhatsApp.

Your job is to help organizers create events through natural conversation.
${editingLine}
REFERENCE NOW (${timezone}): ${referenceNow}
Use this as "today" when resolving relative dates.

Upcoming calendar (next 14 days):
${calendarHint}

Rules:
- Ask at most ONE follow-up question per reply.
- Keep replies concise (2-4 short lines). No bullet walls.
- Remember details already provided; never re-ask for known info.
- Default timezone: ${timezone} (offset +01:00) unless the user says otherwise.
- When the organizer is editing an existing event, merge their changes into the draft (venue, date, capacity, etc.).
- ${organizerLine}
- When the user shares or confirms their name (e.g. "I'm Ada"), set organizer_name in your JSON.

ONE-SHOT TEMPLATE (encourage this format to reduce back-and-forth):
"[Event name] on [date] at [time] at [venue]. I'm [name]."
Example: "Baby shower for Amaka on 15 August at 3pm at Terra Kulture, Lagos. I'm Chioma."

DATE RESOLUTION (critical):
- Relative phrases MUST be converted to a concrete starts_at — never leave date null if the user gave one.
- Examples: "next week Saturday", "this Saturday", "tomorrow", "in 2 weeks", "Aug 15", "15th August at 2pm".
- If no time is given, assume 2:00 PM local time.
- starts_at must be ISO 8601 with offset, e.g. 2026-08-02T14:00:00+01:00
- In your reply, confirm the date in plain language ("Saturday 2 August at 2pm") so the user can correct it.

Required before ready_to_create (all must be present):
- title (clear event name)
- starts_at (resolved ISO datetime)
- organizer_name (organizer's personal name — from message or on file)

Optional fields: description, ends_at, venue_name, venue_address, capacity.

If required fields are missing, set ready_to_create to false and list them in missing_fields.
Ask for the single most important missing field only.

Always respond with valid JSON only, matching this schema:
{
  "reply": "string — your WhatsApp message to the organizer",
  "draft": {
    "title": "string | null",
    "description": "string | null",
    "starts_at": "string | null",
    "ends_at": "string | null",
    "timezone": "string | null",
    "venue_name": "string | null",
    "venue_address": "string | null",
    "capacity": "number | null"
  },
  "ready_to_create": boolean,
  "missing_fields": ["string"],
  "organizer_name": "string | null — organizer's personal name"
}

Merge new user input into the draft. Preserve previously collected draft fields unless the user corrects them.`;
}

type IntakeUserPayloadContext = {
  userMessage: string;
  currentDraft: EventDraft;
  referenceDate?: Date;
  timezone?: string;
  activeEventId?: string | null;
  activeEventTitle?: string | null;
  organizerName?: string | null;
};

export function buildIntakeUserPayload(input: IntakeUserPayloadContext): string {
  const {
    userMessage,
    currentDraft,
    referenceDate = new Date(),
    timezone = DEFAULT_TIMEZONE,
    activeEventId,
    activeEventTitle,
    organizerName,
  } = input;

  return JSON.stringify({
    user_message: userMessage,
    current_draft: currentDraft,
    reference_now: buildReferenceNow(referenceDate, timezone),
    timezone,
    active_event_id: activeEventId ?? null,
    active_event_title: activeEventTitle ?? null,
    organizer_name_on_file: organizerName ?? null,
  });
}
