import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

/** Loads a published event by its public slug (server-only). */
export async function getPublishedEventBySlug(
  slug: string,
): Promise<Tables<"events"> | null> {
  const normalized = slug.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("public_slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Event lookup failed: ${error.message}`);
  }

  return data;
}
