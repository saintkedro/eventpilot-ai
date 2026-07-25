import {
  checkWhatsAppCredentials,
  checkWhatsAppDeep,
  type WhatsAppDeepDiagnostics,
} from "@/lib/whatsapp/diagnostics";

export const runtime = "nodejs";

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/** WhatsApp integration diagnostics (no secrets returned). */
export async function GET(request: Request) {
  const envChecks = {
    accessToken: envPresent("WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: envPresent("WHATSAPP_PHONE_NUMBER_ID"),
    verifyToken: envPresent("WHATSAPP_VERIFY_TOKEN"),
    appSecret: envPresent("WHATSAPP_APP_SECRET"),
  };

  const envReady = Object.values(envChecks).every(Boolean);

  if (!envReady) {
    return Response.json({
      status: "misconfigured",
      env: envChecks,
      meta: {
        hint: "Add missing WHATSAPP_* vars in Vercel, then redeploy.",
      },
    });
  }

  const deep = new URL(request.url).searchParams.get("deep") === "1";

  try {
    const credentials = deep
      ? await checkWhatsAppDeep()
      : await checkWhatsAppCredentials();

    const deepCredentials = deep
      ? (credentials as WhatsAppDeepDiagnostics)
      : null;

    const status = credentials.ok
      ? deepCredentials &&
          (deepCredentials.issues.length > 0 || !deepCredentials.canSendMessages)
        ? deepCredentials.canSendMessages === false
          ? "cannot_send_messages"
          : "webhook_misconfigured"
        : "ok"
      : "token_invalid";

    return Response.json({
      status,
      env: envChecks,
      credentials,
      troubleshooting: {
        noReplyChecklist: [
          "Meta webhook Callback URL: https://eventpilot-ai-ev5i.vercel.app/api/webhooks/whatsapp",
          "Webhook field 'messages' must be subscribed",
          "Run POST /{WABA_ID}/subscribed_apps if deep check shows app not subscribed",
          "Your phone must be on Meta test recipient list (Try it out → manage phone numbers)",
          "Message the Meta TEST business number +1 555-193-2991, not your own number",
          "403 on bare webhook URL in browser is normal — not an error",
          "Check Vercel Runtime Logs for whatsapp.inbound, reply_sent, or reply_failed",
        ],
        commonErrors: {
          "131030":
            "Recipient not on Meta test list — add your phone in API Setup / Try it out",
          "131005":
            "Token lacks whatsapp_business_messaging — regenerate token with send permission, update Vercel",
          "190": "Access token expired — regenerate in Meta API Setup and update Vercel",
          signature_invalid:
            "WHATSAPP_APP_SECRET mismatch between Vercel and Meta app",
          status_only_webhook:
            "Payload has statuses only (delivery receipt), not your message — send a new Hi",
          webhook_misconfigured:
            "Token OK but WABA not linked to app — run scripts/fix-waba-subscription.mjs",
        },
        deepCheckUrl:
          "https://eventpilot-ai-ev5i.vercel.app/api/health/whatsapp?deep=1",
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        env: envChecks,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
