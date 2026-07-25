import { getWhatsAppEnv } from "@/lib/env/server";

type GraphError = {
  message?: string;
  code?: number;
  type?: string;
};

type WhatsAppDiagnostics = {
  ok: boolean;
  phoneNumberId: string;
  tokenValid: boolean;
  displayNumber?: string;
  verifiedName?: string;
  error?: string;
};

type TokenDebugInfo = {
  appId?: string;
  type?: string;
  expiresAt?: number;
  scopes: string[];
  granularScopes: Array<{ scope?: string; target_ids?: string[] }>;
};

export type WhatsAppDeepDiagnostics = WhatsAppDiagnostics & {
  appId?: string;
  wabaId?: string;
  tokenType?: string;
  tokenExpiresAt?: string;
  tokenScopes: string[];
  canSendMessages: boolean;
  sendProbeError?: string;
  subscribedAppIds: string[];
  appSubscribedToWaba: boolean;
  issues: string[];
  fixes: string[];
};

async function graphGet<T>(
  path: string,
  accessToken: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(`https://graph.facebook.com/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const body = (await response.json()) as T & { error?: GraphError };

  if (!response.ok) {
    return {
      ok: false,
      error: body.error?.message ?? `HTTP ${response.status}`,
    };
  }

  return { ok: true, data: body };
}

/** Validates WhatsApp Cloud API credentials against Meta Graph API. */
export async function checkWhatsAppCredentials(): Promise<WhatsAppDiagnostics> {
  const { accessToken, phoneNumberId, graphApiVersion } = getWhatsAppEnv();

  const result = await graphGet<{
    display_phone_number?: string;
    verified_name?: string;
    error?: GraphError;
  }>(
    `${graphApiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
    accessToken,
  );

  if (!result.ok) {
    return {
      ok: false,
      phoneNumberId,
      tokenValid: false,
      error: result.error,
    };
  }

  return {
    ok: true,
    phoneNumberId,
    tokenValid: true,
    displayNumber: result.data.display_phone_number,
    verifiedName: result.data.verified_name,
  };
}

async function getTokenDebugInfo(
  accessToken: string,
  graphApiVersion: string,
): Promise<TokenDebugInfo> {
  const result = await graphGet<{
    data?: {
      app_id?: string;
      type?: string;
      expires_at?: number;
      scopes?: string[];
      granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
    };
  }>(
    `${graphApiVersion}/debug_token?input_token=${encodeURIComponent(accessToken)}`,
    accessToken,
  );

  if (!result.ok) {
    return { scopes: [], granularScopes: [] };
  }

  const data = result.data.data;

  return {
    appId: data?.app_id,
    type: data?.type,
    expiresAt: data?.expires_at,
    scopes: data?.scopes ?? [],
    granularScopes: data?.granular_scopes ?? [],
  };
}

/**
 * Probes the messages endpoint. 131030 = token can send (recipient blocked).
 * 131005/10/200 = token lacks whatsapp_business_messaging permission.
 */
async function probeMessagingPermission(
  accessToken: string,
  phoneNumberId: string,
  graphApiVersion: string,
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: "1000000000000",
        type: "text",
        text: { body: "permission-probe" },
      }),
    },
  );

  if (response.ok) {
    return { ok: true };
  }

  const body = (await response.json()) as {
    error?: { code?: number; message?: string };
  };
  const code = body.error?.code;

  // Recipient errors mean the token is allowed to call the send API.
  if (code === 131030 || code === 131026 || code === 1006) {
    return { ok: true };
  }

  return {
    ok: false,
    error: body.error?.message ?? `HTTP ${response.status}`,
  };
}

function wabaIdFromDebugToken(data: {
  granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
}): string | undefined {
  for (const scope of data.granular_scopes ?? []) {
    if (
      scope.scope === "whatsapp_business_management" ||
      scope.scope === "whatsapp_business_messaging"
    ) {
      const id = scope.target_ids?.[0];
      if (id) {
        return id;
      }
    }
  }

  return undefined;
}

async function getWabaIdFromToken(
  accessToken: string,
  graphApiVersion: string,
): Promise<string | undefined> {
  const configured = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  if (configured) {
    return configured;
  }

  const result = await graphGet<{
    data?: {
      granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
    };
  }>(
    `${graphApiVersion}/debug_token?input_token=${encodeURIComponent(accessToken)}`,
    accessToken,
  );

  return result.ok ? wabaIdFromDebugToken(result.data.data ?? {}) : undefined;
}

async function getSubscribedAppIds(
  wabaId: string,
  accessToken: string,
  graphApiVersion: string,
): Promise<string[]> {
  const result = await graphGet<{
    data?: Array<{ whatsapp_business_api_data?: { id?: string } }>;
  }>(`${graphApiVersion}/${wabaId}/subscribed_apps`, accessToken);

  if (!result.ok) {
    return [];
  }

  return (result.data.data ?? [])
    .map((entry) => entry.whatsapp_business_api_data?.id)
    .filter((id): id is string => Boolean(id));
}

/** Subscribes the current app to receive WABA webhooks (fixes silent inbound). */
export async function subscribeAppToWaba(wabaId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const { accessToken, graphApiVersion } = getWhatsAppEnv();

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${wabaId}/subscribed_apps`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const body = (await response.json()) as { success?: boolean; error?: GraphError };

  if (!response.ok || !body.success) {
    return {
      ok: false,
      error: body.error?.message ?? `HTTP ${response.status}`,
    };
  }

  return { ok: true };
}

/** Extended checks: WABA subscription, app linkage, actionable fixes. */
export async function checkWhatsAppDeep(): Promise<WhatsAppDeepDiagnostics> {
  const credentials = await checkWhatsAppCredentials();
  const issues: string[] = [];
  const fixes: string[] = [];

  if (!credentials.ok) {
    return {
      ...credentials,
      tokenScopes: [],
      canSendMessages: false,
      subscribedAppIds: [],
      appSubscribedToWaba: false,
      issues: ["Access token invalid or expired"],
      fixes: [
        "Regenerate WHATSAPP_ACCESS_TOKEN in Meta API Setup, update Vercel, redeploy",
      ],
    };
  }

  const { accessToken, phoneNumberId, graphApiVersion } = getWhatsAppEnv();

  const [tokenDebug, wabaId, sendProbe] = await Promise.all([
    getTokenDebugInfo(accessToken, graphApiVersion),
    getWabaIdFromToken(accessToken, graphApiVersion),
    probeMessagingPermission(accessToken, phoneNumberId, graphApiVersion),
  ]);

  const appId = tokenDebug.appId;
  const tokenScopes = tokenDebug.scopes;
  const hasMessagingScope = tokenScopes.includes("whatsapp_business_messaging");

  if (!hasMessagingScope) {
    issues.push(
      "Access token is missing whatsapp_business_messaging permission — sends will fail with #131005",
    );
    fixes.push(
      "Meta → WhatsApp → API Setup → Generate token with whatsapp_business_messaging checked",
      "Or create a System User token with whatsapp_business_messaging + whatsapp_business_management",
      "Update WHATSAPP_ACCESS_TOKEN on Vercel and redeploy",
    );
  }

  if (!sendProbe.ok) {
    issues.push(`Token cannot send messages: ${sendProbe.error ?? "access denied"}`);
    if (!fixes.some((fix) => fix.includes("whatsapp_business_messaging"))) {
      fixes.push(
        "Regenerate token in Meta with whatsapp_business_messaging permission",
        "Ensure token is for the EventPilot app that owns phone number 1144972028709705",
        "Debug token: https://developers.facebook.com/tools/debug/accesstoken/",
      );
    }
  }

  if (tokenDebug.type === "USER") {
    issues.push(
      "Token is a temporary USER token (~24h) — use a System User permanent token for production",
    );
    fixes.push(
      "Meta Business Settings → System Users → Generate token (Never expire) with WhatsApp permissions",
    );
  }

  if (!wabaId) {
    issues.push("Could not resolve WhatsApp Business Account ID (WABA)");
    fixes.push(
      "Add WHATSAPP_BUSINESS_ACCOUNT_ID to Vercel env (from Meta API Setup page)",
    );
  }

  let subscribedAppIds: string[] = [];
  let appSubscribedToWaba = false;

  if (wabaId) {
    subscribedAppIds = await getSubscribedAppIds(
      wabaId,
      accessToken,
      graphApiVersion,
    );
    appSubscribedToWaba = Boolean(appId && subscribedAppIds.includes(appId));

    if (!appSubscribedToWaba) {
      issues.push(
        "Your Meta app is NOT subscribed to the WhatsApp Business Account — Meta will not deliver inbound message webhooks",
      );
      fixes.push(
        `Run: node scripts/fix-waba-subscription.mjs`,
        `Or Graph API Explorer: POST /${wabaId}/subscribed_apps`,
        "Then redeploy is not required — retry sending Hi from your phone",
      );
    }
  }

  if (issues.length === 0) {
    fixes.push(
      "Deep checks passed — if still no reply: confirm Meta webhook URL is https://eventpilot-ai-ev5i.vercel.app/api/webhooks/whatsapp",
      "Confirm your phone is on Meta test recipient list (Try it out → manage phone numbers)",
      "Message TO +1 555-193-2991, then check Vercel Runtime Logs for whatsapp.inbound or reply_failed",
    );
  }

  const uniqueIssues = [...new Set(issues)];
  const uniqueFixes = [...new Set(fixes)];

  return {
    ...credentials,
    appId,
    wabaId,
    tokenType: tokenDebug.type,
    tokenExpiresAt: tokenDebug.expiresAt
      ? new Date(tokenDebug.expiresAt * 1000).toISOString()
      : undefined,
    tokenScopes,
    canSendMessages: sendProbe.ok,
    sendProbeError: sendProbe.ok ? undefined : sendProbe.error,
    subscribedAppIds,
    appSubscribedToWaba,
    issues: uniqueIssues,
    fixes: uniqueFixes,
  };
}
