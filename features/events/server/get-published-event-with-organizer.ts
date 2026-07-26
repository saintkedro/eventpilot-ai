import "server-only";

import { getPublishedEventBySlug } from "@/features/events/server/get-published-event-by-slug";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export type PublicEventOrganizer = {
  name: string | null;
  phone: string | null;
};

export type PublicEventWithOrganizer = {
  event: Tables<"events">;
  organizer: PublicEventOrganizer;
};

/** Loads a published event and its organizer contact details. */
export async function getPublishedEventWithOrganizer(
  slug: string,
): Promise<PublicEventWithOrganizer | null> {
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    return null;
  }

  const supabase = createAdminClient();

  const [profileResult, identityResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", event.created_by)
      .maybeSingle(),
    supabase
      .from("whatsapp_identities")
      .select("phone_e164")
      .eq("profile_id", event.created_by)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw new Error(`Organizer profile load failed: ${profileResult.error.message}`);
  }

  if (identityResult.error) {
    throw new Error(`Organizer phone load failed: ${identityResult.error.message}`);
  }

  return {
    event,
    organizer: {
      name: profileResult.data?.display_name?.trim() || null,
      phone: identityResult.data?.phone_e164?.trim() || null,
    },
  };
}
