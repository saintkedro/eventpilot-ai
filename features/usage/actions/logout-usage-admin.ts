"use server";

import { redirect } from "next/navigation";

import { clearUsageAdminCookie } from "@/features/usage/server/usage-admin-auth";

/** Clears admin cookie and returns to login screen. */
export async function logoutUsageAdmin(): Promise<void> {
  await clearUsageAdminCookie();
  redirect("/admin/usage");
}
