/**
 * Local webhook test — simulates Meta POST with valid signature.
 * Usage: node scripts/test-whatsapp-webhook.mjs [recipient_wa_id]
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

const recipient = process.argv[2] ?? "2340000000000";
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
              display_phone_number: "15550000000",
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

const response = await fetch("http://localhost:3000/api/webhooks/whatsapp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Hub-Signature-256": signature,
  },
  body,
});

const text = await response.text();
console.log("Webhook status:", response.status);
console.log("Webhook body:", text || "(empty)");
console.log("Check npm run dev terminal for whatsapp.* log lines.");
