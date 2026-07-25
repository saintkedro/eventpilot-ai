import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { tryGetSupabasePublicEnv } from "@/lib/env/client";
import { logError } from "@/lib/logger";

export async function updateSession(request: NextRequest) {
  const supabaseEnv = tryGetSupabasePublicEnv();

  if (!supabaseEnv) {
    logError("middleware.supabase_env_missing", {
      path: request.nextUrl.pathname,
    });
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(
      supabaseEnv.url,
      supabaseEnv.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    await supabase.auth.getUser();
  } catch (error) {
    logError("middleware.session_refresh_failed", {
      path: request.nextUrl.pathname,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  return supabaseResponse;
}
