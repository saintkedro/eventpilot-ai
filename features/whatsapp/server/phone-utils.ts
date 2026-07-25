import "server-only";

/** Normalizes Meta WhatsApp `from` id to E.164 when possible. */
export function waIdToE164(waId: string): string | null {
  const digits = waId.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `+${digits}`;
}

/** Slug-safe suffix from a UUID (first 8 hex chars). */
export function slugSuffixFromId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toLowerCase();
}

/** Builds a unique organization slug for a new profile. */
export function buildPersonalOrgSlug(profileId: string): string {
  return `personal-${slugSuffixFromId(profileId)}`;
}
