import "server-only";

import {
  getUsageAdminTokenFromRequest,
  isUsageAdminTokenValid,
} from "@/features/usage/server/usage-admin-auth";

/** Validates Bearer token, ?secret=, or admin cookie for the usage admin API. */
export function verifyUsageAdminAuth(request: Request): boolean {
  return isUsageAdminTokenValid(getUsageAdminTokenFromRequest(request));
}
