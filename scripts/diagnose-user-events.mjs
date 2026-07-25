import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const waId = "2348063840685";
const { data: session } = await supabase.from("whatsapp_sessions").select("*").eq("wa_id", waId).single();
const { data: identity } = await supabase.from("whatsapp_identities").select("profile_id").eq("wa_id", waId).single();

console.log("Session state:", JSON.stringify(session?.state, null, 2));
console.log("active_event_id:", session?.active_event_id);

const { data: events } = await supabase
  .from("events")
  .select("id, title, public_slug, status, starts_at, created_at")
  .eq("created_by", identity.profile_id)
  .order("created_at", { ascending: false });

console.log("\nEvents:", events?.length ?? 0);
for (const e of events ?? []) {
  console.log("-", e.id, e.title, e.public_slug, e.status);
}
