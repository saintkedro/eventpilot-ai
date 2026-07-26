const DEFAULT_TIMEZONE = "Africa/Lagos";

export type EventDateTimeLabels = {
  date: string;
  time: string;
};

function parseEventInstant(
  iso: string | null | undefined,
  timezone: string,
): { date: Date; timezone: string } | null {
  if (!iso?.trim()) {
    return null;
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return { date, timezone };
}

/** Formats the date portion only, e.g. "29-07-2026". */
export function formatEventDateForWhatsApp(
  iso: string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const parsed = parseEventInstant(iso, timezone);

  if (!parsed) {
    return iso?.trim() || "Date TBD";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: parsed.timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(parsed.date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("day")}-${get("month")}-${get("year")}`;
}

/** Formats the time portion only, e.g. "5:00 PM". */
export function formatEventTimeForWhatsApp(
  iso: string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const parsed = parseEventInstant(iso, timezone);

  if (!parsed) {
    return "Time TBD";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: parsed.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(parsed.date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const minute = get("minute").padStart(2, "0");
  const period = get("dayPeriod").toUpperCase();

  return `${get("hour")}:${minute} ${period}`;
}

/** Returns separate date and time labels for WhatsApp display. */
export function formatEventDateTimeForWhatsApp(
  iso: string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): EventDateTimeLabels {
  if (!iso?.trim()) {
    return { date: "Date TBD", time: "Time TBD" };
  }

  return {
    date: formatEventDateForWhatsApp(iso, timezone),
    time: formatEventTimeForWhatsApp(iso, timezone),
  };
}
