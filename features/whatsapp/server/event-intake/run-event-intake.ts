import "server-only";

import { buildEventSyncReply } from "@/features/events/server/build-event-sync-reply";
import { setProfileDisplayName } from "@/features/profiles/server/update-display-name";
import { isNewEventIntent } from "@/features/whatsapp/server/detect-new-event-intent";
import {
  clearSessionActiveEvent,
  createDraftEventFromIntake,
  linkSessionToEvent,
  updateDraftEventFromIntake,
} from "@/features/whatsapp/server/event-intake/persist-event";
import {
  buildNewEventResetMessage,
  buildWelcomeMessage,
} from "@/features/whatsapp/server/event-intake/intake-messages";
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
import { intakeStateToJson } from "@/features/whatsapp/server/event-intake/types";
import type { WhatsAppUserContext } from "@/features/whatsapp/server/resolve-or-create-user";
import { recordOpenAIChatUsage } from "@/features/usage/server/record-usage-event";
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

async function loadActiveEventTitle(
  activeEventId: string | null,
): Promise<string | null> {
  if (!activeEventId) {
    return null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("events")
    .select("title")
    .eq("id", activeEventId)
    .maybeSingle();

  return data?.title?.trim() ?? null;
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

async function resetForNewEvent(
  context: WhatsAppUserContext,
  state: IntakeSessionState,
  userMessage: string,
  reply: string,
): Promise<RunEventIntakeResult> {
  await clearSessionActiveEvent(context.session.wa_id);

  const nextState: IntakeSessionState = {
    step: "intake",
    draft: {},
    history: appendHistory(
      { ...state, draft: {}, history: [] },
      userMessage,
      reply,
    ),
  };

  await saveSessionState(context.session.id, nextState);

  return { reply, state: nextState, eventCreated: false };
}

/** Runs conversational event intake for a WhatsApp text message. */
export async function runEventIntake(
  input: RunEventIntakeInput,
): Promise<RunEventIntakeResult> {
  const { userMessage, context } = input;
  const trimmed = userMessage.trim();
  let state = await loadIntakeSessionState(context.session.id);
  let activeEventId = context.session.active_event_id;
  let activeEventTitle = await loadActiveEventTitle(activeEventId);
  const organizerNameOnFile = context.profile.display_name?.trim() ?? null;

  logInfo("event_intake.start", {
    sessionId: context.session.id,
    step: state.step,
    historyLength: state.history.length,
    activeEventId,
  });

  if (isNewEventIntent(trimmed)) {
    return resetForNewEvent(
      context,
      state,
      trimmed,
      buildNewEventResetMessage(),
    );
  }

  if (GREETING_PATTERN.test(trimmed) && state.step === "idle") {
    const reply = buildWelcomeMessage({
      isNewUser: context.isNewUser,
      activeEventTitle,
      organizerName: organizerNameOnFile,
    });

    state = {
      ...state,
      step: "intake",
      history: appendHistory(state, trimmed, reply),
    };

    await saveSessionState(context.session.id, state);

    return { reply, state, eventCreated: false };
  }

  if (state.step === "event_created" && GREETING_PATTERN.test(trimmed)) {
    return resetForNewEvent(
      context,
      state,
      trimmed,
      buildWelcomeMessage({
        isNewUser: false,
        organizerName: organizerNameOnFile,
      }),
    );
  }

  const referenceDate = new Date();
  const promptContext = {
    referenceDate,
    activeEventTitle,
    organizerName: organizerNameOnFile,
  };

  const completion = await createChatCompletion([
    { role: "system", content: buildEventIntakeSystemPrompt(promptContext) },
    ...state.history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: "user",
      content: buildIntakeUserPayload({
        userMessage: trimmed,
        currentDraft: state.draft,
        referenceDate,
        activeEventId,
        activeEventTitle,
        organizerName: organizerNameOnFile,
      }),
    },
  ]);

  if (completion.usage) {
    void recordOpenAIChatUsage({
      sessionId: context.session.id,
      waId: context.session.wa_id,
      eventId: activeEventId,
      model: completion.model,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
      metadata: {
        intakeStep: state.step,
        historyLength: state.history.length,
      },
    });
  }

  let model: IntakeModelResponse;

  try {
    model = parseModelResponse(completion.content);
  } catch (error) {
    logError("event_intake.parse_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Failed to parse AI intake response");
  }

  if (model.organizer_name) {
    try {
      await setProfileDisplayName(context.profile.id, model.organizer_name);
    } catch (error) {
      logError("profile.display_name_update_failed", {
        profileId: context.profile.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const resolvedOrganizerName =
    model.organizer_name?.trim() || organizerNameOnFile;
  const hasOrganizerName = Boolean(resolvedOrganizerName?.trim());

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

  state = {
    step: "intake",
    draft: mergedDraft,
    history: appendHistory(state, trimmed, reply),
  };

  const hasCoreFields =
    Boolean(mergedDraft.title?.trim()) && Boolean(mergedDraft.starts_at?.trim());

  const modelReady = model.ready_to_create || dateResolvedByServer;
  const readyForPersist = hasCoreFields && hasOrganizerName && modelReady;

  const shouldSyncExisting = readyForPersist && Boolean(activeEventId);
  const shouldCreateNew = readyForPersist && !activeEventId;

  if (hasCoreFields && !hasOrganizerName && modelReady) {
    reply = [
      model.reply,
      "",
      "What's your name as the event organizer? (e.g. \"I'm Chioma\")",
    ].join("\n");

    state.history[state.history.length - 1] = {
      role: "assistant",
      content: reply,
    };
  }

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
    activeEventId = event.id;

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
      resolvedOrganizerName ? `👤 Organizer: ${resolvedOrganizerName}` : "",
      "",
      "You can keep refining details here, say *publish my event* when ready, or *new event* to plan something else.",
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
