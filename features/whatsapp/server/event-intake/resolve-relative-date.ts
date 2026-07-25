import type { EventDraft } from "@/features/whatsapp/server/event-intake/types";
const DEFAULT_TIMEZONE = "Africa/Lagos";
const DEFAULT_OFFSET = "+01:00";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type ResolveOptions = {
  text: string;
  referenceDate?: Date;
  defaultHour?: number;
  defaultMinute?: number;
};

type LagosParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
};

function getLagosParts(date: Date): LagosParts {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  const weekdayShort = get("weekday").toLowerCase();
  const weekday = WEEKDAYS.findIndex((day) => weekdayShort.startsWith(day.slice(0, 3)));

  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekday >= 0 ? weekday : 0,
    hour,
    minute: Number(get("minute")) || 0,
  };
}

function lagosPartsToIso(
  parts: Omit<LagosParts, "weekday">,
  offset: string = DEFAULT_OFFSET,
): string {
  const { year, month, day, hour, minute } = parts;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offset}`;
}

function addDays(parts: Omit<LagosParts, "weekday">, days: number): Omit<LagosParts, "weekday"> {
  const anchor = new Date(
    `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T12:00:00${DEFAULT_OFFSET}`,
  );
  anchor.setUTCDate(anchor.getUTCDate() + days);
  const next = getLagosParts(anchor);
  return {
    year: next.year,
    month: next.month,
    day: next.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

function parseTimeFromText(text: string, fallbackHour: number, fallbackMinute: number) {
  const lower = text.toLowerCase();

  const atTime = lower.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (atTime) {
    let hour = Number(atTime[1]);
    const minute = atTime[2] ? Number(atTime[2]) : 0;
    const meridiem = atTime[3];

    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    return { hour, minute };
  }

  const meridiemTime = lower.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (meridiemTime) {
    let hour = Number(meridiemTime[1]);
    if (meridiemTime[2] === "pm" && hour < 12) hour += 12;
    if (meridiemTime[2] === "am" && hour === 12) hour = 0;
    return { hour, minute: 0 };
  }

  return { hour: fallbackHour, minute: fallbackMinute };
}

function daysUntilWeekday(currentWeekday: number, targetWeekday: number, minDays: number): number {
  let delta = (targetWeekday - currentWeekday + 7) % 7;
  if (delta < minDays) delta += 7;
  return delta;
}

function findWeekdayInText(text: string): number | null {
  const lower = text.toLowerCase();
  for (let index = 0; index < WEEKDAYS.length; index += 1) {
    if (new RegExp(`\\b${WEEKDAYS[index]}\\b`, "i").test(lower)) {
      return index;
    }
  }
  return null;
}

/** Builds a calendar hint for the next 14 days to anchor relative language. */
export function buildCalendarHint(
  referenceDate: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lines: string[] = [];

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(referenceDate.getTime() + offset * 86_400_000);
    lines.push(`  ${dayFormatter.format(date)}`);
  }

  return lines.join("\n");
}

export function buildReferenceNow(
  referenceDate: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  }).format(referenceDate);
}

/**
 * Parses common relative date phrases when the model leaves starts_at empty.
 * Supports: tomorrow, next Saturday, next week Saturday, this Friday, etc.
 */
export function resolveRelativeDateFromText(
  options: ResolveOptions,
): string | null {
  const {
    text,
    referenceDate = new Date(),
    defaultHour = 14,
    defaultMinute = 0,
  } = options;

  const lower = text.toLowerCase();
  if (!lower.trim()) {
    return null;
  }

  const time = parseTimeFromText(lower, defaultHour, defaultMinute);
  const today = getLagosParts(referenceDate);
  const base = {
    year: today.year,
    month: today.month,
    day: today.day,
    hour: time.hour,
    minute: time.minute,
  };

  if (/\btomorrow\b/.test(lower)) {
    return lagosPartsToIso(addDays(base, 1));
  }

  if (/\btoday\b/.test(lower)) {
    return lagosPartsToIso(base);
  }

  const targetWeekday = findWeekdayInText(lower);
  if (targetWeekday === null) {
    return null;
  }

  if (/next week (?:on )?/.test(lower)) {
    const days = daysUntilWeekday(today.weekday, targetWeekday, 7);
    return lagosPartsToIso(addDays(base, days));
  }

  if (/\bthis\b/.test(lower)) {
    let days = (targetWeekday - today.weekday + 7) % 7;
    if (days === 0) days = 7;
    return lagosPartsToIso(addDays(base, days));
  }

  if (/\bnext\b/.test(lower)) {
    let days = (targetWeekday - today.weekday + 7) % 7;
    if (days === 0) days = 7;
    return lagosPartsToIso(addDays(base, days));
  }

  // Bare weekday name → next occurrence (including today if same day name and future time implied)
  let days = (targetWeekday - today.weekday + 7) % 7;
  if (days === 0) days = 7;
  return lagosPartsToIso(addDays(base, days));
}

/** Collects user text from the latest message and recent history for date parsing. */
export function buildTextForDateParsing(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
): string {
  const recentUserLines = history
    .filter((turn) => turn.role === "user")
    .slice(-3)
    .map((turn) => {
      try {
        const parsed = JSON.parse(turn.content) as { user_message?: string };
        return parsed.user_message ?? turn.content;
      } catch {
        return turn.content;
      }
    });

  return [...recentUserLines, userMessage].join(". ");
}

function enrichDraftDates(
  draft: EventDraft,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  referenceDate: Date,
): EventDraft {
  if (draft.starts_at?.trim()) {
    return draft;
  }

  const combined = buildTextForDateParsing(userMessage, history);
  const resolved = resolveRelativeDateFromText({
    text: combined,
    referenceDate,
  });

  if (!resolved) {
    return draft;
  }

  return {
    ...draft,
    starts_at: resolved,
    timezone: draft.timezone ?? DEFAULT_TIMEZONE,
  };
}

export { enrichDraftDates, DEFAULT_TIMEZONE };
