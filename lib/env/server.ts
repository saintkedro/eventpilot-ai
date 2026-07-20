import "server-only";

import { getSupabasePublicEnv } from "@/lib/env/client";

export { getSupabasePublicEnv };

/**
 * Optional service-role key for trusted server jobs (never expose to the client).
 */
export function getSupabaseServiceRoleKey(): string | undefined {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || undefined;
}
