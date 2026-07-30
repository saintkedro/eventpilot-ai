import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, UsageEventKind } from "@/types/database";

export type UsageReportFilters = {
  since?: string;
  sessionId?: string;
  waId?: string;
  limit?: number;
};

type KindSummary = {
  count: number;
  estimatedUsd: number;
  promptTokens: number;
  completionTokens: number;
};

type GroupSummary = {
  sessionId: string | null;
  waId: string | null;
  eventCount: number;
  estimatedUsd: number;
  promptTokens: number;
  completionTokens: number;
  lastAt: string;
};

export type UsageReport = {
  summary: {
    totalEvents: number;
    totalEstimatedUsd: number;
    promptTokens: number;
    completionTokens: number;
    byKind: Partial<Record<UsageEventKind, KindSummary>>;
  };
  bySession: GroupSummary[];
  byWaId: GroupSummary[];
  recent: Tables<"usage_events">[];
};

function roundUsd(value: number): number {
  return Number(value.toFixed(6));
}

function aggregateByKey(
  rows: Tables<"usage_events">[],
  key: "session_id" | "wa_id",
): GroupSummary[] {
  const map = new Map<string, GroupSummary>();

  for (const row of rows) {
    const id = row[key];
    if (!id) {
      continue;
    }

    const existing = map.get(id);
    const estimatedUsd = Number(row.estimated_usd ?? 0);
    const promptTokens = row.prompt_tokens ?? 0;
    const completionTokens = row.completion_tokens ?? 0;

    if (!existing) {
      map.set(id, {
        sessionId: key === "session_id" ? id : row.session_id,
        waId: key === "wa_id" ? id : row.wa_id,
        eventCount: 1,
        estimatedUsd,
        promptTokens,
        completionTokens,
        lastAt: row.created_at,
      });
      continue;
    }

    existing.eventCount += 1;
    existing.estimatedUsd = roundUsd(existing.estimatedUsd + estimatedUsd);
    existing.promptTokens += promptTokens;
    existing.completionTokens += completionTokens;
    if (row.created_at > existing.lastAt) {
      existing.lastAt = row.created_at;
    }
  }

  return [...map.values()].sort((a, b) => b.estimatedUsd - a.estimatedUsd);
}

/** Loads usage events and returns rollups for admin reporting. */
export async function getUsageReport(
  filters: UsageReportFilters = {},
): Promise<UsageReport> {
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const supabase = createAdminClient();

  let query = supabase
    .from("usage_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters.since) {
    query = query.gte("created_at", filters.since);
  }

  if (filters.sessionId) {
    query = query.eq("session_id", filters.sessionId);
  }

  if (filters.waId) {
    query = query.eq("wa_id", filters.waId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Usage report query failed: ${error.message}`);
  }

  const rows = data ?? [];
  const byKind: Partial<Record<UsageEventKind, KindSummary>> = {};
  let totalEstimatedUsd = 0;
  let promptTokens = 0;
  let completionTokens = 0;

  for (const row of rows) {
    const usd = Number(row.estimated_usd ?? 0);
    totalEstimatedUsd = roundUsd(totalEstimatedUsd + usd);
    promptTokens += row.prompt_tokens ?? 0;
    completionTokens += row.completion_tokens ?? 0;

    const kind = row.kind as UsageEventKind;
    const current = byKind[kind] ?? {
      count: 0,
      estimatedUsd: 0,
      promptTokens: 0,
      completionTokens: 0,
    };

    byKind[kind] = {
      count: current.count + 1,
      estimatedUsd: roundUsd(current.estimatedUsd + usd),
      promptTokens: current.promptTokens + (row.prompt_tokens ?? 0),
      completionTokens: current.completionTokens + (row.completion_tokens ?? 0),
    };
  }

  return {
    summary: {
      totalEvents: rows.length,
      totalEstimatedUsd,
      promptTokens,
      completionTokens,
      byKind,
    },
    bySession: aggregateByKey(rows, "session_id").slice(0, limit),
    byWaId: aggregateByKey(rows, "wa_id").slice(0, limit),
    recent: rows.slice(0, limit),
  };
}
