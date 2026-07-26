/** Verifies event_rsvps table and test insert against local .env Supabase. */
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

console.log("Project:", env.NEXT_PUBLIC_SUPABASE_URL);

const { error: headError } = await supabase
  .from("event_rsvps")
  .select("id", { count: "exact", head: true });

console.log("event_rsvps table:", headError ? `FAIL ${headError.message} (${headError.code})` : "OK");

const { data: event } = await supabase
  .from("events")
  .select("id, title, public_slug, status")
  .eq("status", "published")
  .limit(1)
  .maybeSingle();

console.log("Sample published event:", event ?? "(none)");

if (event) {
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert({
      event_id: event.id,
      guest_name: "RSVP Diagnostic",
      status: "yes",
      source: "diagnostic",
    })
    .select("id")
    .single();

  if (error) {
    console.log("Test insert FAIL:", error.message, error.code, error.details);
  } else {
    console.log("Test insert OK:", data.id);
    await supabase.from("event_rsvps").delete().eq("id", data.id);
    console.log("(test row deleted)");
  }
}
