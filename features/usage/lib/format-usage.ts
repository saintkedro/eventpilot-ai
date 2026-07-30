/** Formats USD for micro-costs (OpenAI per-turn). */
export function formatUsd(value: number): string {
  if (value === 0) {
    return "$0.00";
  }

  if (value < 0.01) {
    return `$${value.toFixed(6)}`;
  }

  return `$${value.toFixed(4)}`;
}

/** Formats token counts with grouping. */
export function formatTokens(value: number): string {
  return value.toLocaleString("en-US");
}

/** Formats ISO timestamps for the admin dashboard. */
export function formatUsageTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

/** Shortens UUIDs for table display. */
export function shortenId(id: string, visible = 8): string {
  if (id.length <= visible * 2 + 1) {
    return id;
  }

  return `${id.slice(0, visible)}…${id.slice(-4)}`;
}
