import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

function normalizeDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  if (!trimmed || trimmed.length > 120) {
    return null;
  }
  return trimmed;
}

/** Sets the organizer display name (always updates when valid). */
export async function setProfileDisplayName(
  profileId: string,
  displayName: string,
): Promise<void> {
  const trimmed = normalizeDisplayName(displayName);
  if (!trimmed) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Profile name update failed: ${error.message}`);
  }
}

/** Saves the organizer display name only when the profile has no name yet. */
export async function updateProfileDisplayName(
  profileId: string,
  displayName: string,
): Promise<void> {
  const trimmed = normalizeDisplayName(displayName);
  if (!trimmed) {
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
