/**
 * Checks Supabase tables + a minimal intake session read/write cycle.
 * Usage: node scripts/diagnose-intake-db.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  "profiles",
  "whatsapp_identities",
  "organizations",
  "events",
  "whatsapp_sessions",
];

console.log("=== Supabase intake DB check ===\n");
console.log("Project:", url.replace(/^https:\/\//, "").split(".")[0]);

for (const table of tables) {
  const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
  console.log(
    table + ":",
    error ? `ERROR — ${error.message} (${error.code})` : "OK",
  );
}

const waId = "2348063840685";
const { data: session, error: sessionError } = await supabase
  .from("whatsapp_sessions")
  .select("id, wa_id, state, step:state->step")
  .eq("wa_id", waId)
  .maybeSingle();

console.log("\nSession for wa_id", waId + ":");
if (sessionError) {
  console.log("  ERROR:", sessionError.message, sessionError.code);
} else if (!session) {
  console.log("  (none — first contact not persisted yet)");
} else {
  console.log("  id:", session.id);
  console.log("  state:", JSON.stringify(session.state)?.slice(0, 200));
}

if (session?.id) {
  const testState = {
    step: "idle",
    draft: {},
    history: [],
  };

  const { error: updateError } = await supabase
    .from("whatsapp_sessions")
    .update({ state: testState })
    .eq("id", session.id);

  console.log("\nSession state write test:", updateError ? `FAIL — ${updateError.message}` : "OK");
}
