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

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** OpenAI credentials for conversational event intake. */
export function getOpenAIEnv() {
  return {
    apiKey: requireEnv("OPENAI_API_KEY"),
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
  } as const;
}

/** Returns OpenAI env when configured; undefined otherwise. */
export function tryGetOpenAIEnv():
  | { apiKey: string; model: string }
  | undefined {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return undefined;
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
  };
}

/** Secret for GET /api/admin/usage (Bearer or ?secret=). */
export function getUsageAdminSecret(): string | undefined {
  const secret = process.env.USAGE_ADMIN_SECRET?.trim();
  return secret || undefined;
}
