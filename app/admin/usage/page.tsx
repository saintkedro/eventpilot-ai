import type { Metadata } from "next";

import { logoutUsageAdmin } from "@/features/usage/actions/logout-usage-admin";
import { UsageAdminLoginForm } from "@/features/usage/components/usage-admin-login-form";
import { UsageDashboard } from "@/features/usage/components/usage-dashboard";
import { getUsageReport } from "@/features/usage/server/get-usage-report";
import { isUsageAdminAuthenticated } from "@/features/usage/server/usage-admin-auth";
import { getUsageAdminSecret } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "Usage admin · EventPilot",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type UsageAdminPageProps = {
  searchParams: Promise<{
    since?: string;
    waId?: string;
    sessionId?: string;
    limit?: string;
  }>;
};

function normalizeSince(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export default async function UsageAdminPage({ searchParams }: UsageAdminPageProps) {
  if (!getUsageAdminSecret()) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <h1 className="text-lg font-semibold">Usage admin not configured</h1>
        <p className="mt-2 text-sm">
          Set <code className="font-mono">USAGE_ADMIN_SECRET</code> in your
          environment, redeploy, then reload this page.
        </p>
      </div>
    );
  }

  const authed = await isUsageAdminAuthenticated();

  if (!authed) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <UsageAdminLoginForm />
      </div>
    );
  }

  const params = await searchParams;
  const since = normalizeSince(params.since);
  const limit = params.limit ? Number(params.limit) : undefined;

  let report;
  let loadError: string | undefined;

  try {
    report = await getUsageReport({
      since,
      waId: params.waId?.trim() || undefined,
      sessionId: params.sessionId?.trim() || undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load usage report.";
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Internal ops
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Usage dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            OpenAI token usage and estimated spend per WhatsApp conversation.
            Estimates use list prices in{" "}
            <code className="font-mono text-xs">lib/openai/pricing.ts</code>.
          </p>
        </div>

        <form action={logoutUsageAdmin}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-950"
          >
            Sign out
          </button>
        </form>
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {loadError}
          <p className="mt-2">
            If the table is missing, apply{" "}
            <code className="font-mono">
              supabase/migrations/20260730120000_usage_events.sql
            </code>
            .
          </p>
        </div>
      ) : report ? (
        <UsageDashboard
          report={report}
          filters={{
            since: params.since,
            waId: params.waId,
            sessionId: params.sessionId,
            limit: params.limit,
          }}
        />
      ) : null}
    </div>
  );
}
