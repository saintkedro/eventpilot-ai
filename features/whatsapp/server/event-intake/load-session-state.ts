import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseIntakeSessionState,
  type IntakeSessionState,
} from "@/features/whatsapp/server/event-intake/types";

/** Loads the latest intake state from the database (avoids stale session in webhook). */
export async function loadIntakeSessionState(
  sessionId: string,
): Promise<IntakeSessionState> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .select("state")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    throw new Error(
      `Session state load failed: ${error?.message ?? "not found"}`,
    );
  }

  return parseIntakeSessionState(data.state);
}
