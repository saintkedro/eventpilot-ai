export type UsageFilterParams = {
  since?: string;
  waId?: string;
  sessionId?: string;
  limit?: string;
};

/** Builds /admin/usage URL with optional filters. */
export function buildUsageAdminUrl(filters: UsageFilterParams = {}): string {
  const params = new URLSearchParams();

  if (filters.since?.trim()) {
    params.set("since", filters.since.trim());
  }

  if (filters.waId?.trim()) {
    params.set("waId", filters.waId.trim());
  }

  if (filters.sessionId?.trim()) {
    params.set("sessionId", filters.sessionId.trim());
  }

  if (filters.limit?.trim()) {
    params.set("limit", filters.limit.trim());
  }

  const query = params.toString();
  return query ? `/admin/usage?${query}` : "/admin/usage";
}

type DatePreset = {
  label: string;
  since?: string;
};

/** Quick date-range presets for the usage admin dashboard. */
export function getUsageDatePresets(now = new Date()): DatePreset[] {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return [
    { label: "Last 7 days", since: sevenDaysAgo.toISOString() },
    { label: "This month", since: monthStart.toISOString() },
    { label: "All time" },
  ];
}

/** True when the current since filter matches a preset label. */
export function isActiveDatePreset(
  filters: UsageFilterParams,
  preset: DatePreset,
): boolean {
  if (!preset.since) {
    return !filters.since?.trim();
  }

  if (!filters.since?.trim()) {
    return false;
  }

  const current = new Date(filters.since).getTime();
  const expected = new Date(preset.since).getTime();

  if (Number.isNaN(current) || Number.isNaN(expected)) {
    return false;
  }

  return Math.abs(current - expected) < 60_000;
}
