import "server-only";

import { buildEventSyncReply } from "@/features/events/server/build-event-sync-reply";
import { updateProfileDisplayName } from "@/features/profiles/server/update-display-name";
import {
  clearSessionActiveEvent,
  createDraftEventFromIntake,
  linkSessionToEvent,
  updateDraftEventFromIntake,
} from "@/features/whatsapp/server/event-intake/persist-event";
import {
  buildIntakeUserPayload,
  buildEventIntakeSystemPrompt,
} from "@/features/whatsapp/server/event-intake/prompts";
import {
  DEFAULT_TIMEZONE,
  enrichDraftDates,
} from "@/features/whatsapp/server/event-intake/resolve-relative-date";
import { formatEventDateTimeForWhatsApp } from "@/features/whatsapp/server/event-intake/format-event-datetime";
import type {
  ChatTurn,
  IntakeModelResponse,
  IntakeSessionState,
} from "@/features/whatsapp/server/event-intake/types";
import {
  intakeStateToJson,
} from "@/features/whatsapp/server/event-intake/types";
import type { WhatsAppUserContext } from "@/features/whatsapp/server/resolve-or-create-user";
import { createChatCompletion } from "@/lib/openai/client";
import { logError, logInfo } from "@/lib/logger";
import { loadIntakeSessionState } from "@/features/whatsapp/server/event-intake/load-session-state";
import { createAdminClient } from "@/lib/supabase/admin";

const GREETING_PATTERN = /^(hi|hello|hey|start)\b/i;

type RunEventIntakeInput = {
  userMessage: string;
  context: WhatsAppUserContext;
};

type RunEventIntakeResult = {
  reply: string;
  state: IntakeSessionState;
  eventCreated: boolean;
  eventId?: string;
};

function welcomeMessage(isNewUser: boolean): string {
  if (isNewUser) {
    return [
      "Hi! I'm EventPilot — your event coordinator on WhatsApp.",
      "",
      "Tell me about the event you're planning (e.g. \"Birthday party for my son on August 15 at 2pm\").",
    ].join("\n");
  }

  return [
    "Welcome back! I'm EventPilot.",
    "",
    "Tell me about the event you're planning, or share updates to your current draft.",
  ].join("\n");
}

function parseModelResponse(raw: string): IntakeModelResponse {
  const parsed = JSON.parse(raw) as Partial<IntakeModelResponse>;

  if (!parsed.reply || typeof parsed.reply !== "string") {
    throw new Error("OpenAI response missing reply");
  }

  return {
    reply: parsed.reply.trim(),
    draft: parsed.draft ?? {},
    ready_to_create: Boolean(parsed.ready_to_create),
    missing_fields: Array.isArray(parsed.missing_fields)
      ? parsed.missing_fields.filter((field): field is string => typeof field === "string")
      : [],
    organizer_name:
      typeof parsed.organizer_name === "string" ? parsed.organizer_name.trim() : null,
  };
}

function mergeDraft(
  current: IntakeSessionState["draft"],
  incoming: IntakeSessionState["draft"],
): IntakeSessionState["draft"] {
  return {
    title: incoming.title ?? current.title,
    description: incoming.description ?? current.description,
    starts_at: incoming.starts_at ?? current.starts_at,
    ends_at: incoming.ends_at ?? current.ends_at,
    timezone: incoming.timezone ?? current.timezone,
    venue_name: incoming.venue_name ?? current.venue_name,
    venue_address: incoming.venue_address ?? current.venue_address,
    capacity: incoming.capacity ?? current.capacity,
  };
}

function appendHistory(
  state: IntakeSessionState,
  userMessage: string,
  assistantReply: string,
): IntakeSessionState["history"] {
  const userTurn: ChatTurn = { role: "user", content: userMessage };
  const assistantTurn: ChatTurn = { role: "assistant", content: assistantReply };

  return [...state.history, userTurn, assistantTurn].slice(-12);
}

async function saveSessionState(
  sessionId: string,
  state: IntakeSessionState,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("whatsapp_sessions")
    .update({ state: intakeStateToJson(state) })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Session state update failed: ${error.message}`);
  }
}

/** Runs conversational event intake for a WhatsApp text message. */
export async function runEventIntake(
  input: RunEventIntakeInput,
): Promise<RunEventIntakeResult> {
  const { userMessage, context } = input;
  const trimmed = userMessage.trim();
  let state = await loadIntakeSessionState(context.session.id);

  logInfo("event_intake.start", {
    sessionId: context.session.id,
    step: state.step,
    historyLength: state.history.length,
  });

  if (GREETING_PATTERN.test(trimmed) && state.step === "idle") {
    const reply = welcomeMessage(context.isNewUser);
    state = {
      ...state,
      step: "intake",
      history: appendHistory(state, trimmed, reply),
    };

    await saveSessionState(context.session.id, state);

    return { reply, state, eventCreated: false };
  }

  if (state.step === "event_created" && GREETING_PATTERN.test(trimmed)) {
    const reply = welcomeMessage(false);
    state = {
      step: "intake",
      draft: {},
      history: [{ role: "assistant", content: reply }],
    };
    await clearSessionActiveEvent(context.session.wa_id);
    await saveSessionState(context.session.id, state);
    return { reply, state, eventCreated: false };
  }

  const referenceDate = new Date();

  const completion = await createChatCompletion([
    { role: "system", content: buildEventIntakeSystemPrompt(referenceDate) },
    ...state.history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: "user",
      content: buildIntakeUserPayload(trimmed, state.draft, referenceDate),
    },
  ]);

  let model: IntakeModelResponse;

  try {
    model = parseModelResponse(completion.content);
  } catch (error) {
    logError("event_intake.parse_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Failed to parse AI intake response");
  }

  if (model.organizer_name && !context.profile.display_name?.trim()) {
    try {
      await updateProfileDisplayName(context.profile.id, model.organizer_name);
    } catch (error) {
      logError("profile.display_name_update_failed", {
        profileId: context.profile.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const aiDraft = mergeDraft(state.draft, model.draft);
  const hadStartsAt = Boolean(aiDraft.starts_at?.trim());
  const mergedDraft = enrichDraftDates(
    aiDraft,
    trimmed,
    state.history,
    referenceDate,
  );
  const dateResolvedByServer =
    !hadStartsAt && Boolean(mergedDraft.starts_at?.trim());
  let reply = model.reply;
  let eventCreated = false;
  let eventId: string | undefined;
  const activeEventId = context.session.active_event_id;

  state = {
    step: "intake",
    draft: mergedDraft,
    history: appendHistory(state, trimmed, reply),
  };

  const hasCoreFields =
    Boolean(mergedDraft.title?.trim()) && Boolean(mergedDraft.starts_at?.trim());

  const shouldCreateNew =
    hasCoreFields &&
    !activeEventId &&
    (model.ready_to_create || dateResolvedByServer);

  const shouldSyncExisting = hasCoreFields && Boolean(activeEventId);

  if (shouldSyncExisting && activeEventId) {
    const event = await updateDraftEventFromIntake(activeEventId, mergedDraft);

    eventId = event.id;
    state.step = "event_created";
    state.draft = mergedDraft;
    reply = buildEventSyncReply(event, model.reply);

    state.history[state.history.length - 1] = {
      role: "assistant",
      content: reply,
    };

    logInfo("event_intake.updated", {
      eventId: event.id,
      profileId: context.profile.id,
      waId: context.session.wa_id,
      published: event.status === "published",
    });
  } else if (shouldCreateNew) {
    const event = await createDraftEventFromIntake({
      organizationId: context.organization.id,
      profileId: context.profile.id,
      draft: mergedDraft,
    });

    await linkSessionToEvent(context.session.wa_id, event.id);

    eventId = event.id;
    eventCreated = true;
    state.step = "event_created";
    state.draft = mergedDraft;

    const { date: eventDate, time: eventTime } = formatEventDateTimeForWhatsApp(
      event.starts_at,
      event.timezone ?? DEFAULT_TIMEZONE,
    );

    reply = [
      model.reply,
      "",
      `✅ Draft event created: *${event.title}*`,
      `📅 ${eventDate}`,
      `🕐 ${eventTime}`,
      event.venue_name ? `📍 ${event.venue_name}` : "",
      "",
      "You can keep refining details here, or ask me to publish when you're ready.",
    ]
      .filter(Boolean)
      .join("\n");

    state.history[state.history.length - 1] = {
      role: "assistant",
      content: reply,
    };

    logInfo("event_intake.completed", {
      eventId: event.id,
      profileId: context.profile.id,
      waId: context.session.wa_id,
    });
  }

  await saveSessionState(context.session.id, state);

  return { reply, state, eventCreated, eventId };
}
