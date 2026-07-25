import "server-only";

import { slugSuffixFromId } from "@/features/whatsapp/server/phone-utils";
import type { EventDraft } from "@/features/whatsapp/server/event-intake/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { logInfo } from "@/lib/logger";
import type { Tables } from "@/types/database";

type CreateDraftEventInput = {
  organizationId: string;
  profileId: string;
  draft: EventDraft;
};

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildPublicSlug(title: string, organizationId: string): string {
  const base = slugifyTitle(title) || "event";
  return `${base}-${slugSuffixFromId(organizationId)}`;
}

function isDuplicateSlugError(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" && (error.message?.includes("public_slug") ?? false);
}

function draftToEventRow(
  draft: EventDraft,
  organizationId: string,
  profileId: string,
  publicSlug: string,
) {
  return {
    organization_id: organizationId,
    created_by: profileId,
    title: draft.title!.trim(),
    description: draft.description?.trim() || null,
    status: "draft" as const,
    starts_at: draft.starts_at!,
    ends_at: draft.ends_at ?? null,
    timezone: draft.timezone?.trim() || "Africa/Lagos",
    venue_name: draft.venue_name?.trim() || null,
    venue_address: draft.venue_address?.trim() || null,
    capacity: draft.capacity ?? null,
    public_slug: publicSlug,
    metadata: {
      source: "whatsapp_intake",
      intake_completed_at: new Date().toISOString(),
    },
  };
}

/** Persists a draft event from intake and returns the created row. */
export async function createDraftEventFromIntake(
  input: CreateDraftEventInput,
): Promise<Tables<"events">> {
  const { organizationId, profileId, draft } = input;

  if (!draft.title?.trim()) {
    throw new Error("Cannot create event without a title");
  }

  if (!draft.starts_at?.trim()) {
    throw new Error("Cannot create event without a start date/time");
  }

  const supabase = createAdminClient();
  const baseSlug = buildPublicSlug(draft.title, organizationId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { data: event, error } = await supabase
      .from("events")
      .insert(draftToEventRow(draft, organizationId, profileId, publicSlug))
      .select("*")
      .single();

    if (!error && event) {
      logInfo("event.created_from_intake", {
        eventId: event.id,
        organizationId,
        profileId,
        publicSlug,
      });
      return event;
    }

    if (error && isDuplicateSlugError(error)) {
      continue;
    }

    throw new Error(`Event create failed: ${error?.message ?? "unknown"}`);
  }

  throw new Error("Event create failed: could not allocate a unique public slug");
}

/** Updates an existing draft event from continued intake conversation. */
export async function updateDraftEventFromIntake(
  eventId: string,
  draft: EventDraft,
): Promise<Tables<"events">> {
  if (!draft.title?.trim()) {
    throw new Error("Cannot update event without a title");
  }

  if (!draft.starts_at?.trim()) {
    throw new Error("Cannot update event without a start date/time");
  }

  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .update({
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      starts_at: draft.starts_at,
      ends_at: draft.ends_at ?? null,
      timezone: draft.timezone?.trim() || "Africa/Lagos",
      venue_name: draft.venue_name?.trim() || null,
      venue_address: draft.venue_address?.trim() || null,
      capacity: draft.capacity ?? null,
      metadata: {
        source: "whatsapp_intake",
        intake_updated_at: new Date().toISOString(),
      },
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error || !event) {
    throw new Error(`Event update failed: ${error?.message ?? "unknown"}`);
  }

  logInfo("event.updated_from_intake", { eventId: event.id });

  return event;
}

/** Links the active draft event on the WhatsApp session. */
export async function linkSessionToEvent(
  waId: string,
  eventId: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("whatsapp_sessions")
    .update({ active_event_id: eventId })
    .eq("wa_id", waId);

  if (error) {
    throw new Error(`Session event link failed: ${error.message}`);
  }
}

/** Clears the active event when the organizer starts planning a new one. */
export async function clearSessionActiveEvent(waId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("whatsapp_sessions")
    .update({ active_event_id: null })
    .eq("wa_id", waId);

  if (error) {
    throw new Error(`Session active event clear failed: ${error.message}`);
  }
}
