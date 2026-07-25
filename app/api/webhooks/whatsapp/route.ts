import type { NextRequest } from "next/server";

import { handleInboundWhatsAppMessage } from "@/features/whatsapp/server/handle-inbound-message";
import { getWhatsAppEnv } from "@/lib/env/server";
import { logError, logInfo } from "@/lib/logger";
import { parseInboundMessages } from "@/lib/whatsapp/parse-webhook";
import { summarizeWebhookPayload } from "@/lib/whatsapp/summarize-webhook";
import { verifyWhatsAppSignature } from "@/lib/whatsapp/verify-signature";

export const runtime = "nodejs";

/** Meta webhook verification (subscribe challenge). */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const { verifyToken } = getWhatsAppEnv();

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

/** Inbound WhatsApp messages and status updates from Meta. */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const { appSecret } = getWhatsAppEnv();

  if (!verifyWhatsAppSignature(rawBody, signature, appSecret)) {
    logError("whatsapp.webhook.signature_invalid");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    logError("whatsapp.webhook.invalid_json");
    return new Response("Bad Request", { status: 400 });
  }

  const summary = summarizeWebhookPayload(payload);
  const messages = parseInboundMessages(payload);

  logInfo("whatsapp.webhook.received", {
    inboundMessages: summary.messageCount,
    statusUpdates: summary.statusCount,
    parsedMessages: messages.length,
  });

  if (messages.length === 0 && summary.statusCount > 0) {
    logInfo("whatsapp.webhook.status_only", {
      note: "Delivery/read receipt — no reply sent",
    });
  }

  const results = await Promise.allSettled(
    messages.map((message) => handleInboundWhatsAppMessage(message)),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      logError("whatsapp.webhook.reply_failed", { reason });
    }
  }

  const sent = results.filter((result) => result.status === "fulfilled").length;
  if (sent > 0) {
    logInfo("whatsapp.webhook.reply_sent", { count: sent });
  }

  return new Response("OK", { status: 200 });
}
