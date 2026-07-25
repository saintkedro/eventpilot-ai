import { getWhatsAppEnv } from "@/lib/env/server";
import { checkWhatsAppCredentials } from "@/lib/whatsapp/diagnostics";

export const runtime = "nodejs";

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/** WhatsApp integration diagnostics (no secrets returned). */
export async function GET() {
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

  try {
    const credentials = await checkWhatsAppCredentials();

    return Response.json({
      status: credentials.ok ? "ok" : "token_invalid",
      env: envChecks,
      credentials,
      troubleshooting: {
        noReplyChecklist: [
          "Meta webhook Callback URL must be https://YOUR-APP.vercel.app/api/webhooks/whatsapp (not ngrok)",
          "Webhook field 'messages' must be subscribed",
          "Your phone must be on Meta test recipient list (API Setup)",
          "Message the Meta TEST business number, not your own number",
          "After env changes in Vercel, redeploy",
          "Check Vercel Runtime Logs for whatsapp.webhook.reply_failed",
        ],
        commonErrors: {
          "131030": "Recipient not on Meta test list — add your phone in API Setup",
          "190": "Access token expired — regenerate in Meta API Setup and update Vercel",
          signature_invalid: "WHATSAPP_APP_SECRET mismatch between Vercel and Meta app",
          status_only_webhook:
            "Payload has statuses only (delivery receipt), not your message — send a new Hi",
        },
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
