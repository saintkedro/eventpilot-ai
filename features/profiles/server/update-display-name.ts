import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Saves the organizer display name on their profile when provided in chat. */
export async function updateProfileDisplayName(
  profileId: string,
  displayName: string,
): Promise<void> {
  const trimmed = displayName.trim();

  if (!trimmed || trimmed.length > 120) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", profileId)
    .is("display_name", null);

  if (error) {
    throw new Error(`Profile name update failed: ${error.message}`);
  }
}
