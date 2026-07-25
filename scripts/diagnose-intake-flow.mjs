/**
 * Simulates runEventIntake for a wa_id using local .env.local (no WhatsApp send).
 * Usage: node scripts/diagnose-intake-flow.mjs [message]
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
const userMessage = process.argv[2] ?? "Hi";
const waId = "2348063840685";
const model = env.OPENAI_MODEL ?? "gpt-4o-mini";

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: identity } = await supabase
  .from("whatsapp_identities")
  .select("profile_id")
  .eq("wa_id", waId)
  .single();

const { data: session } = await supabase
  .from("whatsapp_sessions")
  .select("*")
  .eq("wa_id", waId)
  .single();

const { data: org } = await supabase
  .from("organizations")
  .select("*")
  .eq("owner_profile_id", identity.profile_id)
  .limit(1)
  .single();

console.log("Message:", userMessage);
console.log("Session step:", session?.state?.step ?? "(none)");
console.log("Draft title:", session?.state?.draft?.title ?? "(none)");

const GREETING = /^(hi|hello|hey|start)\b/i;
const state = session.state ?? { step: "idle", draft: {}, history: [] };

if (GREETING.test(userMessage.trim()) && state.step === "idle") {
  console.log("\n→ Greeting path (no OpenAI)");
  console.log("Would reply: Welcome back message");
  process.exit(0);
}

console.log("\n→ OpenAI intake path");

const referenceDate = new Date();
const systemPrompt = `You are EventPilot. Respond JSON only with reply, draft, ready_to_create, missing_fields.
Reference: ${referenceDate.toISOString()}. Default timezone Africa/Lagos.`;

const messages = [
  { role: "system", content: systemPrompt },
  ...((state.history ?? []).map((t) => ({ role: t.role, content: t.content }))),
  {
    role: "user",
    content: JSON.stringify({
      user_message: userMessage,
      current_draft: state.draft ?? {},
    }),
  },
];

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages,
    temperature: 0.4,
    response_format: { type: "json_object" },
  }),
});

if (!response.ok) {
  console.error("OpenAI FAIL:", response.status, await response.text());
  process.exit(1);
}

const data = await response.json();
const raw = data.choices?.[0]?.message?.content ?? "";
console.log("OpenAI OK, raw length:", raw.length);

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error("Parse FAIL:", e.message);
  console.error("Raw:", raw.slice(0, 500));
  process.exit(1);
}

console.log("reply preview:", parsed.reply?.slice(0, 120));
console.log("ready_to_create:", parsed.ready_to_create);
console.log("draft.title:", parsed.draft?.title);
console.log("draft.starts_at:", parsed.draft?.starts_at);

const merged = { ...(state.draft ?? {}), ...(parsed.draft ?? {}) };
const canCreate = Boolean(merged.title?.trim()) && Boolean(merged.starts_at?.trim());

if (!canCreate && !parsed.ready_to_create) {
  console.log("\n→ Would save session only (no event create)");
  process.exit(0);
}

const slugBase = (merged.title ?? "event")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48);
const publicSlug = `${slugBase}-${org.id.replace(/-/g, "").slice(0, 8)}`;

console.log("\n→ Would create event, slug:", publicSlug);

const { data: existingSlug } = await supabase
  .from("events")
  .select("id, title")
  .eq("public_slug", publicSlug)
  .maybeSingle();

if (existingSlug) {
  console.log("SLUG CONFLICT with existing event:", existingSlug.id, existingSlug.title);
}

const { data: event, error: insertError } = await supabase
  .from("events")
  .insert({
    organization_id: org.id,
    created_by: identity.profile_id,
    title: merged.title.trim(),
    status: "draft",
    starts_at: merged.starts_at,
    ends_at: merged.ends_at ?? null,
    timezone: merged.timezone ?? "Africa/Lagos",
    venue_name: merged.venue_name ?? null,
    public_slug: publicSlug,
    metadata: { source: "diagnose_script" },
  })
  .select("id, title")
  .single();

if (insertError) {
  console.error("Event insert FAIL:", insertError.message, insertError.code, insertError.details);
  process.exit(1);
}

console.log("Event insert OK:", event.id, event.title);

await supabase.from("events").delete().eq("id", event.id);
console.log("(test event deleted)");
