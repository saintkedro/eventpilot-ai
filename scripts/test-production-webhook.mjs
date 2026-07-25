/**
 * Simulates Meta POST to your Vercel webhook with a valid signature.
 * Usage: node scripts/test-production-webhook.mjs [vercel-base-url] [recipient_wa_id]
 *
 * Example:
 *   node scripts/test-production-webhook.mjs https://eventpilot-ai-ev5i.vercel.app 2348012345678
 */
import { createHmac } from "crypto";
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

const baseUrl = (process.argv[2] ?? "https://eventpilot-ai-ev5i.vercel.app").replace(/\/$/, "");
const recipient = process.argv[3] ?? "2340000000000";
const env = loadEnv();
const appSecret = env.WHATSAPP_APP_SECRET;

if (!appSecret) {
  console.error("Missing WHATSAPP_APP_SECRET in .env.local");
  process.exit(1);
}

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "TEST_WABA",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15551932991",
              phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID,
            },
            messages: [
              {
                from: recipient,
                id: `wamid.test.${Date.now()}`,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: "text",
                text: { body: "Hi" },
              },
            ],
          },
        },
      ],
    },
  ],
};

const body = JSON.stringify(payload);
const signature =
  "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex");

const url = `${baseUrl}/api/webhooks/whatsapp`;

console.log("POST", url);
console.log("Recipient (from):", recipient);
console.log("Note: use YOUR real WhatsApp ID (no +) for an actual reply on your phone.");

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Hub-Signature-256": signature,
  },
  body,
});

const text = await response.text();
console.log("Status:", response.status);
console.log("Body:", text || "(empty)");

if (response.status === 401) {
  console.error("\n401 = WHATSAPP_APP_SECRET on Vercel does not match Meta App Secret.");
}

if (response.status === 200) {
  console.log("\nWebhook accepted. Check Vercel Logs for whatsapp.inbound / reply_sent / reply_failed.");
  console.log("If reply_failed mentions 131030, add your phone to Meta test recipient list.");
}
