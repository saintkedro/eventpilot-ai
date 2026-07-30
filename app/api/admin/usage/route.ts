import { getUsageReport } from "@/features/usage/server/get-usage-report";
import { verifyUsageAdminAuth } from "@/features/usage/server/verify-usage-admin-auth";
import { getUsageAdminSecret } from "@/lib/env/server";

export const runtime = "nodejs";

/** Admin usage rollups (OpenAI tokens + estimated USD per session). */
export async function GET(request: Request) {
  if (!getUsageAdminSecret()) {
    return Response.json(
      { error: "Usage admin API is not configured (set USAGE_ADMIN_SECRET)" },
      { status: 503 },
    );
  }

  if (!verifyUsageAdminAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get("since")?.trim() || undefined;
  const sessionId = url.searchParams.get("sessionId")?.trim() || undefined;
  const waId = url.searchParams.get("waId")?.trim() || undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const report = await getUsageReport({
      since,
      sessionId,
      waId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
