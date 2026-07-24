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

const DEFAULT_GRAPH_API_VERSION = "v21.0";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local.`);
  }
  return value;
}

/** Credentials for Meta WhatsApp Cloud API calls and webhook verification. */
export function getWhatsAppEnv() {
  return {
    accessToken: requireEnv("WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: requireEnv("WHATSAPP_PHONE_NUMBER_ID"),
    verifyToken: requireEnv("WHATSAPP_VERIFY_TOKEN"),
    appSecret: requireEnv("WHATSAPP_APP_SECRET"),
    graphApiVersion:
      process.env.WHATSAPP_GRAPH_API_VERSION?.trim() ||
      DEFAULT_GRAPH_API_VERSION,
  } as const;
}
