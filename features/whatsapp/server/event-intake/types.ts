import type { Json } from "@/types/database";

/** Fields collected during WhatsApp event intake. */
export type EventDraft = {
  title?: string | null;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  timezone?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  capacity?: number | null;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type IntakeStep = "idle" | "intake" | "event_created";

/** Stored in whatsapp_sessions.state jsonb. */
export type IntakeSessionState = {
  step: IntakeStep;
  draft: EventDraft;
  history: ChatTurn[];
};

export type IntakeModelResponse = {
  reply: string;
  draft: EventDraft;
  ready_to_create: boolean;
  missing_fields: string[];
};

export function emptyIntakeState(): IntakeSessionState {
  return {
    step: "idle",
    draft: {},
    history: [],
  };
}

export function parseIntakeSessionState(value: Json | null): IntakeSessionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyIntakeState();
  }

  const record = value as Record<string, unknown>;
  const rawStep = record.step;
  const normalizedStep =
    rawStep === "welcome" ? "idle" : rawStep;

  return {
    step:
      normalizedStep === "intake" ||
      normalizedStep === "event_created" ||
      normalizedStep === "idle"
        ? normalizedStep
        : "idle",
    draft: parseDraft(record.draft),
    history: parseHistory(record.history),
  };
}

function parseDraft(value: unknown): EventDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    title: asOptionalString(record.title),
    description: asOptionalString(record.description),
    starts_at: asOptionalString(record.starts_at),
    ends_at: asOptionalString(record.ends_at),
    timezone: asOptionalString(record.timezone),
    venue_name: asOptionalString(record.venue_name),
    venue_address: asOptionalString(record.venue_address),
    capacity: asOptionalNumber(record.capacity),
  };
}

function parseHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is ChatTurn =>
        typeof item === "object" &&
        item !== null &&
        "role" in item &&
        "content" in item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .slice(-12);
}

function asOptionalString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

function asOptionalNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function intakeStateToJson(state: IntakeSessionState): Json {
  return state as unknown as Json;
}
