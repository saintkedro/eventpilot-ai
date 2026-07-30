"use client";

import { useActionState } from "react";

import {
  loginUsageAdmin,
  type LoginUsageAdminState,
} from "@/features/usage/actions/login-usage-admin";

const initialState: LoginUsageAdminState = {};

export function UsageAdminLoginForm() {
  const [state, formAction, pending] = useActionState(
    loginUsageAdmin,
    initialState,
  );

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold tracking-tight">Usage admin</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your admin secret to view OpenAI usage and estimated spend per
        conversation.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="secret"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Admin secret
          </label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="USAGE_ADMIN_SECRET"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in…" : "View dashboard"}
        </button>
      </form>
    </div>
  );
}
