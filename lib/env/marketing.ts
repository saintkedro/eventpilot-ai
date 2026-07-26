/** Public marketing / contact URLs (safe for client components). */
export function getMarketingHomeUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "https://eventpilot-ai-ev5i.vercel.app";
}

/** WhatsApp click-to-chat link for EventPilot (digits only, no +). */
export function getEventPilotWhatsAppUrl(): string | null {
  const waId = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_WA_ID?.trim();

  if (!waId) {
    return null;
  }

  const digits = waId.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
}
