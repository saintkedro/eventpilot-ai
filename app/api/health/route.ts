import { tryGetSupabasePublicEnv } from "@/lib/env/client";

export const runtime = "nodejs";

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/** Liveness + config check (never returns secret values). */
export async function GET() {
  const supabase = tryGetSupabasePublicEnv();

  return Response.json({
    status: "ok",
    checks: {
      supabase: {
        url: envPresent("NEXT_PUBLIC_SUPABASE_URL"),
        anonKey:
          envPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
          envPresent("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
        configured: supabase !== null,
      },
      whatsapp: {
        accessToken: envPresent("WHATSAPP_ACCESS_TOKEN"),
        phoneNumberId: envPresent("WHATSAPP_PHONE_NUMBER_ID"),
        verifyToken: envPresent("WHATSAPP_VERIFY_TOKEN"),
        appSecret: envPresent("WHATSAPP_APP_SECRET"),
      },
      supabaseServiceRole: envPresent("SUPABASE_SERVICE_ROLE_KEY"),
    },
  });
}
