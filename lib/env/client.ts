/**
 * Supabase public credentials (safe for browser bundles).
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export function getSupabasePublicEnv() {
  const env = tryGetSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }
  return env;
}

/** Returns null instead of throwing — for middleware and other optional paths. */
export function tryGetSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey } as const;
}
