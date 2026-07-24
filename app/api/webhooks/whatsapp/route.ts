import type { NextRequest } from "next/server";

import { handleInboundWhatsAppMessage } from "@/features/whatsapp/server/handle-inbound-message";
import { getWhatsAppEnv } from "@/lib/env/server";
import { parseInboundMessages } from "@/lib/whatsapp/parse-webhook";
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
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const messages = parseInboundMessages(payload);

  await Promise.allSettled(
    messages.map((message) => handleInboundWhatsAppMessage(message)),
  );

  return new Response("OK", { status: 200 });
}
