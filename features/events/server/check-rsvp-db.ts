import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Verifies the event_rsvps table is reachable (service role). */
export async function checkRsvpDatabase(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("event_rsvps")
      .select("id", { count: "exact", head: true });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
