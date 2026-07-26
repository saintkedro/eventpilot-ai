/** WhatsApp click-to-chat link for EventPilot (digits only, no +). */
export function getEventPilotWhatsAppUrl(text?: string): string | null {
  const waId = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_WA_ID?.trim();

  if (!waId) {
    return null;
  }

  const digits = waId.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const base = `https://wa.me/${digits}`;

  if (!text?.trim()) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(text.trim())}`;
}
