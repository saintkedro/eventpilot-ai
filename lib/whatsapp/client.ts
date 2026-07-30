import { getWhatsAppEnv } from "@/lib/env/server";
import { logError } from "@/lib/logger";
import { recordWhatsAppOutboundUsage } from "@/features/usage/server/record-usage-event";

type SendTextMessageResult = {
  messageId?: string;
};

/** Sends a plain text message via the Meta WhatsApp Cloud API. */
export async function sendTextMessage(
  to: string,
  body: string,
): Promise<SendTextMessageResult> {
  const { accessToken, phoneNumberId, graphApiVersion } = getWhatsAppEnv();

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
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let metaCode: number | undefined;
    let metaMessage: string | undefined;

    try {
      const parsed = JSON.parse(errorBody) as {
        error?: { code?: number; message?: string };
      };
      metaCode = parsed.error?.code;
      metaMessage = parsed.error?.message;
    } catch {
      // keep raw body
    }

    logError("whatsapp.send_failed", {
      status: response.status,
      metaCode,
      metaMessage,
      error: errorBody,
      hint:
        metaCode === 131030
          ? "Add your phone to Meta test recipient list (Try it out → manage phone numbers)"
          : metaCode === 131005
            ? "Token lacks whatsapp_business_messaging — regenerate in Meta API Setup or use System User token"
            : undefined,
    });
    throw new Error(
      metaMessage
        ? `WhatsApp send failed (${metaCode ?? response.status}): ${metaMessage}`
        : `WhatsApp send failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };

  const messageId = data.messages?.[0]?.id;

  void recordWhatsAppOutboundUsage({
    waId: to,
    messageId,
    bodyLength: body.length,
  });

  return { messageId };
}
