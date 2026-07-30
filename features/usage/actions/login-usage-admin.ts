"use server";

import { redirect } from "next/navigation";

import {
  isUsageAdminTokenValid,
  setUsageAdminCookie,
} from "@/features/usage/server/usage-admin-auth";
import { getUsageAdminSecret } from "@/lib/env/server";

export type LoginUsageAdminState = {
  error?: string;
};

/** Validates admin secret and sets httpOnly cookie. */
export async function loginUsageAdmin(
  _prevState: LoginUsageAdminState,
  formData: FormData,
): Promise<LoginUsageAdminState> {
  if (!getUsageAdminSecret()) {
    return { error: "Admin usage dashboard is not configured on this server." };
  }

  const secret = formData.get("secret")?.toString().trim() ?? "";

  if (!isUsageAdminTokenValid(secret)) {
    return { error: "Invalid admin secret." };
  }

  await setUsageAdminCookie();
  redirect("/admin/usage");
}
