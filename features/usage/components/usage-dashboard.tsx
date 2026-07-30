import type { UsageReport } from "@/features/usage/server/get-usage-report";
import {
  formatTokens,
  formatUsd,
  formatUsageTimestamp,
  shortenId,
} from "@/features/usage/lib/format-usage";
import {
  buildUsageAdminUrl,
  getUsageDatePresets,
  isActiveDatePreset,
  type UsageFilterParams,
} from "@/features/usage/lib/usage-filter-url";

type SpendBarChartProps = {
  items: Array<{ label: string; value: number; sublabel?: string }>;
  emptyMessage?: string;
};

export function SpendBarChart({
  items,
  emptyMessage = "No usage data yet.",
}: SpendBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 0.000001);

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
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
  filters: UsageFilterParams;
};

function DatePresetLinks({ filters }: { filters: UsageFilterParams }) {
  const presets = getUsageDatePresets();

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const href = buildUsageAdminUrl({
          ...filters,
          since: preset.since,
        });
        const active = isActiveDatePreset(filters, preset);

        return (
          <a
            key={preset.label}
            href={href}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-emerald-600 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {preset.label}
          </a>
        );
      })}
    </div>
  );
}

export function UsageDashboard({ report, filters }: UsageDashboardProps) {
  const openAi = report.summary.byKind.openai_chat;
  const whatsapp = report.summary.byKind.whatsapp_outbound;
  const avgPerSession =
    report.bySession.length > 0
      ? report.summary.totalEstimatedUsd / report.bySession.length
      : 0;

  const organizerChartItems = report.byWaId.slice(0, 8).map((row) => ({
    label: row.waId ? `wa_id ${row.waId}` : "Unknown",
    sublabel: `${row.eventCount} usage event${row.eventCount === 1 ? "" : "s"}`,
    value: row.estimatedUsd,
  }));

  const eventChartItems = report.byEvent.slice(0, 8).map((row) => ({
    label: row.eventTitle ?? shortenId(row.eventId),
    sublabel: row.publicSlug ? `/e/${row.publicSlug}` : undefined,
    value: row.estimatedUsd,
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Estimated spend"
          value={formatUsd(report.summary.totalEstimatedUsd)}
          hint={`${report.summary.totalEvents} recorded events`}
        />
        <SummaryCard
          label="OpenAI"
          value={String(openAi?.count ?? 0)}
          hint={openAi ? formatUsd(openAi.estimatedUsd) : "No AI usage yet"}
        />
        <SummaryCard
          label="WhatsApp outbound"
          value={String(whatsapp?.count ?? 0)}
          hint={
            whatsapp
              ? formatUsd(whatsapp.estimatedUsd)
              : "No outbound messages logged"
          }
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
            Top WhatsApp IDs by total estimated cost
          </p>
          <div className="mt-5">
            <SpendBarChart
              items={organizerChartItems}
              emptyMessage="No organizer usage yet."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Spend by event</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            OpenAI + WhatsApp tied to an active event
          </p>
          <div className="mt-5">
            <SpendBarChart
              items={eventChartItems}
              emptyMessage="No event-linked usage yet. Usage appears when a session has an active event."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Filters</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Date presets and advanced filters
            </p>
          </div>
          <DatePresetLinks filters={filters} />
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" method="get">
          <label className="block text-sm">
            <span className="font-medium">Since</span>
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
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
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
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">By event</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">OpenAI</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Total USD</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {report.byEvent.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No event-linked usage yet.
                  </td>
                </tr>
              ) : (
                report.byEvent.map((row) => (
                  <tr
                    key={row.eventId}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 font-medium">
                      {row.eventTitle ?? shortenId(row.eventId)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.publicSlug ? (
                        <a
                          href={`/e/${row.publicSlug}`}
                          className="text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {row.publicSlug}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{row.usageCount}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatUsd(row.openaiUsd)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatUsd(row.whatsappUsd)}
                    </td>
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
          <h2 className="text-lg font-semibold">By session</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">WhatsApp ID</th>
                <th className="px-4 py-3">Events</th>
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
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Session</th>
              </tr>
            </thead>
            <tbody>
              {report.recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                      {row.event_id ? shortenId(row.event_id) : "—"}
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
