/** Formats E.164 or raw digits for readable display, e.g. +234 806 384 0685. */
export function formatPhoneForDisplay(phone: string | null | undefined): string | null {
  if (!phone?.trim()) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("234") && digits.length >= 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`.trim();
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  if (digits.length > 10) {
    return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`;
  }

  return `+${digits}`;
}

/** Builds a wa.me link from digits-only WhatsApp id / phone. */
export function buildWhatsAppLink(waIdOrPhone: string): string {
  const digits = waIdOrPhone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
