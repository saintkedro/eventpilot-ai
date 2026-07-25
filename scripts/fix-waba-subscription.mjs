/**
 * Subscribes your Meta app to the WhatsApp Business Account so inbound
 * message webhooks are delivered. Run after webhook verify succeeds but
 * you still get no replies.
 *
 * Usage: node scripts/fix-waba-subscription.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const env = {};

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }

  return env;
}

const env = loadEnv();
const token = env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
const wabaFromEnv = env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const version = env.WHATSAPP_GRAPH_API_VERSION ?? "v21.0";

if (!token || !phoneNumberId) {
  console.error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env.local");
  process.exit(1);
}

async function graph(path, options = {}) {
  const response = await fetch(`https://graph.facebook.com/${version}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

let wabaId = wabaFromEnv;

if (!wabaId) {
  console.log("Resolving WABA ID from access token...");
  const { response, body } = await graph(
    `debug_token?input_token=${encodeURIComponent(token)}`,
  );

  if (!response.ok) {
    console.error("Failed to resolve WABA:", body.error?.message ?? response.status);
    process.exit(1);
  }

  const scopes = body.data?.granular_scopes ?? [];
  for (const scope of scopes) {
    if (
      scope.scope === "whatsapp_business_management" ||
      scope.scope === "whatsapp_business_messaging"
    ) {
      wabaId = scope.target_ids?.[0];
      if (wabaId) break;
    }
  }
}

if (!wabaId) {
  console.error(
    "No WABA ID found. Add WHATSAPP_BUSINESS_ACCOUNT_ID to .env.local (from Meta API Setup).",
  );
  process.exit(1);
}

console.log("WABA ID:", wabaId);

const { response: listRes, body: listBody } = await graph(`${wabaId}/subscribed_apps`);

if (!listRes.ok) {
  console.error("GET subscribed_apps failed:", listBody.error?.message ?? listRes.status);
  process.exit(1);
}

const appIds = (listBody.data ?? []).map(
  (entry) => entry.whatsapp_business_api_data?.id,
).filter(Boolean);

console.log("Currently subscribed apps:", appIds.length ? appIds.join(", ") : "(none)");

if (appIds.length > 0) {
  console.log("App already subscribed — inbound webhooks should flow if Meta callback URL is correct.");
  process.exit(0);
}

console.log("Subscribing app to WABA...");
const { response: postRes, body: postBody } = await graph(`${wabaId}/subscribed_apps`, {
  method: "POST",
});

if (!postRes.ok || !postBody.success) {
  console.error("POST subscribed_apps failed:", postBody.error?.message ?? postRes.status);
  process.exit(1);
}

console.log("Success! App subscribed to WABA.");
console.log("Next: send Hi to +1 555-193-2991 from a phone on the Meta test recipient list.");
