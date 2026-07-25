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
  const publicSlug = buildPublicSlug(draft.title, organizationId);

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organization_id: organizationId,
      created_by: profileId,
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      status: "draft",
      starts_at: draft.starts_at,
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
    })
    .select("*")
    .single();

  if (error || !event) {
    throw new Error(`Event create failed: ${error?.message ?? "unknown"}`);
  }

  logInfo("event.created_from_intake", {
    eventId: event.id,
    organizationId,
    profileId,
    publicSlug,
  });

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
