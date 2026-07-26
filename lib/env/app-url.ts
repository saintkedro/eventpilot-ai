import "server-only";

/** Canonical app origin for share links (no trailing slash). */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();

  if (vercel) {
    return `https://${vercel}`;
  }

  return "http://localhost:3000";
}

/** Public event page URL for a slug. */
export function buildEventPublicUrl(publicSlug: string): string {
  return `${getAppBaseUrl()}/e/${publicSlug}`;
}
