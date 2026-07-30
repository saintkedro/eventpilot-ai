import "server-only";

import { cookies } from "next/headers";

import { getUsageAdminSecret } from "@/lib/env/server";

export const USAGE_ADMIN_COOKIE = "ep_usage_admin";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

/** Reads admin token from Authorization, ?secret=, or admin cookie. */
export function getUsageAdminTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const bearer =
    authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  const querySecret = new URL(request.url).searchParams.get("secret")?.trim();
  const cookieSecret = parseCookieValue(
    request.headers.get("cookie"),
    USAGE_ADMIN_COOKIE,
  );

  return bearer ?? querySecret ?? cookieSecret;
}

/** True when request carries a valid usage admin secret. */
export function isUsageAdminTokenValid(token: string | null | undefined): boolean {
  const secret = getUsageAdminSecret();
  return Boolean(secret && token && token === secret);
}

/** True when the current browser session has a valid admin cookie. */
export async function isUsageAdminAuthenticated(): Promise<boolean> {
  const secret = getUsageAdminSecret();
  if (!secret) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(USAGE_ADMIN_COOKIE)?.value === secret;
}

/** Sets the httpOnly admin cookie after successful login. */
export async function setUsageAdminCookie(): Promise<void> {
  const secret = getUsageAdminSecret();
  if (!secret) {
    throw new Error("USAGE_ADMIN_SECRET is not configured");
  }

  const cookieStore = await cookies();
  cookieStore.set(USAGE_ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/** Clears the admin cookie on logout. */
export async function clearUsageAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USAGE_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
}
