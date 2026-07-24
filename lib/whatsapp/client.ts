import { getWhatsAppEnv } from "@/lib/env/server";

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
    throw new Error(
      `WhatsApp send failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };

  return { messageId: data.messages?.[0]?.id };
}
