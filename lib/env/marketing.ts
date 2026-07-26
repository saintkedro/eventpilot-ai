/** Default EventPilot business WhatsApp id (Meta test / production number). */
const DEFAULT_WHATSAPP_CONTACT_WA_ID = "15551932991";

/** WhatsApp click-to-chat link for EventPilot. */
export function getEventPilotWhatsAppUrl(text?: string): string {
  const configured = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_WA_ID?.trim();
  const digits = (configured || DEFAULT_WHATSAPP_CONTACT_WA_ID).replace(/\D/g, "");

  const base = `https://wa.me/${digits}`;

  if (!text?.trim()) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(text.trim())}`;
}
