import type { UsageReport } from "@/features/usage/server/get-usage-report";
import {
  formatTokens,
  formatUsd,
  formatUsageTimestamp,
  shortenId,
} from "@/features/usage/lib/format-usage";

type SpendBarChartProps = {
  items: Array<{ label: string; value: number; sublabel?: string }>;
};

export function SpendBarChart({ items }: SpendBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 0.000001);

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No usage data yet. Send a WhatsApp message that triggers AI intake.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = Math.max((item.value / max) * 100, 4);

        return (
          <div key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                {item.sublabel ? (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {item.sublabel}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {formatUsd(item.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  hint?: string;
};

function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

type UsageDashboardProps = {
  report: UsageReport;
  filters: {
    since?: string;
    waId?: string;
    sessionId?: string;
    limit?: string;
  };
};

export function UsageDashboard({ report, filters }: UsageDashboardProps) {
  const openAi = report.summary.byKind.openai_chat;
  const avgPerSession =
    report.bySession.length > 0
      ? report.summary.totalEstimatedUsd / report.bySession.length
      : 0;

  const chartItems = report.byWaId.slice(0, 8).map((row) => ({
    label: row.waId ? `wa_id ${row.waId}` : "Unknown",
    sublabel: `${row.eventCount} AI call${row.eventCount === 1 ? "" : "s"}`,
    value: row.estimatedUsd,
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Estimated spend"
          value={formatUsd(report.summary.totalEstimatedUsd)}
          hint={`${report.summary.totalEvents} recorded events`}
        />
        <SummaryCard
          label="OpenAI calls"
          value={String(openAi?.count ?? 0)}
          hint={openAi ? formatUsd(openAi.estimatedUsd) : "No AI usage yet"}
        />
        <SummaryCard
          label="Tokens (prompt / completion)"
          value={`${formatTokens(report.summary.promptTokens)} / ${formatTokens(report.summary.completionTokens)}`}
        />
        <SummaryCard
          label="Avg per session"
          value={formatUsd(avgPerSession)}
          hint={`${report.bySession.length} sessions with usage`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Spend by organizer</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Top WhatsApp IDs by estimated OpenAI cost
          </p>
          <div className="mt-5">
            <SpendBarChart items={chartItems} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Filters</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Narrow the report (GET params)
          </p>
          <form className="mt-5 space-y-3" method="get">
            <label className="block text-sm">
              <span className="font-medium">Since (ISO date)</span>
              <input
                name="since"
                type="datetime-local"
                defaultValue={filters.since?.slice(0, 16) ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">WhatsApp ID</span>
              <input
                name="waId"
                type="text"
                defaultValue={filters.waId ?? ""}
                placeholder="2348012345678"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Session ID</span>
              <input
                name="sessionId"
                type="text"
                defaultValue={filters.sessionId ?? ""}
                placeholder="uuid"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Limit</span>
              <input
                name="limit"
                type="number"
                min={1}
                max={200}
                defaultValue={filters.limit ?? "50"}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Apply
              </button>
              <a
                href="/admin/usage"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Reset
              </a>
            </div>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">By session</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">WhatsApp ID</th>
                <th className="px-4 py-3">Calls</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Est. USD</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {report.bySession.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No session data yet.
                  </td>
                </tr>
              ) : (
                report.bySession.map((row) => (
                  <tr
                    key={row.sessionId ?? row.waId ?? "unknown"}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.sessionId ? shortenId(row.sessionId) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.waId ?? "—"}
                    </td>
                    <td className="px-4 py-3">{row.eventCount}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatTokens(row.promptTokens + row.completionTokens)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatUsd(row.estimatedUsd)}
                    </td>
                    <td className="px-4 py-3">
                      {formatUsageTimestamp(row.lastAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Recent usage events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Est. USD</th>
                <th className="px-4 py-3">Session</th>
              </tr>
            </thead>
            <tbody>
              {report.recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No events recorded yet.
                  </td>
                </tr>
              ) : (
                report.recent.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      {formatUsageTimestamp(row.created_at)}
                    </td>
                    <td className="px-4 py-3">{row.kind}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.model ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.total_tokens != null
                        ? formatTokens(row.total_tokens)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatUsd(Number(row.estimated_usd))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.session_id ? shortenId(row.session_id) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
