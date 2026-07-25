/**
 * Verifies WhatsApp access token type, expiry, scopes, and send permission.
 * Usage: node scripts/verify-whatsapp-token.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const token = env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
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
  return { response, body: await response.json() };
}

console.log("=== EventPilot WhatsApp token check ===\n");

const { response: debugRes, body: debugBody } = await graph(
  `debug_token?input_token=${encodeURIComponent(token)}`,
);

if (!debugRes.ok) {
  console.error("debug_token failed:", debugBody.error?.message ?? debugRes.status);
  process.exit(1);
}

const data = debugBody.data ?? {};
const scopes = data.scopes ?? [];
const expiresAt = data.expires_at ? new Date(data.expires_at * 1000) : null;
const type = data.type ?? "unknown";

console.log("App ID:        ", data.app_id);
console.log("Token type:    ", type);
console.log("Expires:       ", expiresAt ? expiresAt.toISOString() : "Never / not set");
console.log("Scopes:        ", scopes.join(", ") || "(none)");

const hasMessaging = scopes.includes("whatsapp_business_messaging");
const hasManagement = scopes.includes("whatsapp_business_management");

console.log("\nPermissions:");
console.log("  whatsapp_business_messaging: ", hasMessaging ? "OK" : "MISSING");
console.log("  whatsapp_business_management:", hasManagement ? "OK" : "MISSING");

if (type === "USER") {
  console.log("\n⚠️  This is a temporary USER token (~24h). Create a System User token for production.");
}

if (expiresAt && expiresAt.getTime() - Date.now() < 48 * 60 * 60 * 1000) {
  console.log("\n⚠️  Token expires within 48 hours — replace with a System User token.");
}

const { response: phoneRes, body: phoneBody } = await graph(
  `${phoneNumberId}?fields=display_phone_number,verified_name`,
);

console.log("\nPhone number API:");
if (phoneRes.ok) {
  console.log("  Read access:   OK");
  console.log("  Number:        ", phoneBody.display_phone_number);
} else {
  console.log("  Read access:   FAIL —", phoneBody.error?.message);
}

const probe = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    to: "1000000000000",
    type: "text",
    text: { body: "probe" },
  }),
});

const probeBody = await probe.json();
const probeCode = probeBody.error?.code;

console.log("\nSend API probe:");
if (probe.ok) {
  console.log("  Can send:      OK");
} else if (probeCode === 131030 || probeCode === 131026 || probeCode === 1006) {
  console.log("  Can send:      OK (recipient blocked — expected for probe number)");
} else {
  console.log("  Can send:      FAIL —", probeBody.error?.message ?? probe.status);
  if (probeCode === 131005) {
    console.log("  Fix: regenerate token with whatsapp_business_messaging");
  }
}

const ok =
  hasMessaging &&
  hasManagement &&
  phoneRes.ok &&
  (probe.ok || probeCode === 131030 || probeCode === 131026 || probeCode === 1006) &&
  type !== "USER";

console.log(ok ? "\n✅ Token looks good for production." : "\n❌ Fix issues above before deploying.");
process.exit(ok ? 0 : 1);
