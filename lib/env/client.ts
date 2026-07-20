/**
 * Supabase public credentials (safe for browser bundles).
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (see .env.example).",
    );
  }
  if (!anonKey?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local (see .env.example).",
    );
  }

  return { url: url.trim(), anonKey: anonKey.trim() } as const;
}
