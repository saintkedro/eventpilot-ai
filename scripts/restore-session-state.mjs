/** One-off: restore wa session state from active event after diagnostic reset. */
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

const { data: session } = await supabase.from("whatsapp_sessions").select("active_event_id").eq("wa_id", waId).single();
const eventId = session?.active_event_id;
if (!eventId) {
  console.log("No active event to restore from");
  process.exit(0);
}

const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
if (!event) process.exit(1);

const state = {
  step: "event_created",
  draft: {
    title: event.title,
    description: event.description,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    timezone: event.timezone,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    capacity: event.capacity,
  },
  history: [],
};

const { error } = await supabase.from("whatsapp_sessions").update({ state }).eq("wa_id", waId);
console.log(error ? `FAIL: ${error.message}` : `Restored session for ${event.title}`);
