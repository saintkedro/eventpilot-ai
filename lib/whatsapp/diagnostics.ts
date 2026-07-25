import { getWhatsAppEnv } from "@/lib/env/server";

type WhatsAppDiagnostics = {
  ok: boolean;
  phoneNumberId: string;
  tokenValid: boolean;
  displayNumber?: string;
  verifiedName?: string;
  error?: string;
};

/** Validates WhatsApp Cloud API credentials against Meta Graph API. */
export async function checkWhatsAppCredentials(): Promise<WhatsAppDiagnostics> {
  const { accessToken, phoneNumberId, graphApiVersion } = getWhatsAppEnv();

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const body = (await response.json()) as {
    display_phone_number?: string;
    verified_name?: string;
    error?: { message?: string; code?: number; type?: string };
  };

  if (!response.ok) {
    return {
      ok: false,
      phoneNumberId,
      tokenValid: false,
      error: body.error?.message ?? `HTTP ${response.status}`,
    };
  }

  return {
    ok: true,
    phoneNumberId,
    tokenValid: true,
    displayNumber: body.display_phone_number,
    verifiedName: body.verified_name,
  };
}
