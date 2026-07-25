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
const model = env.OPENAI_MODEL ?? "gpt-4o-mini";

const system = `You are EventPilot. Always respond with valid JSON only:
{"reply":"string","draft":{},"ready_to_create":false,"missing_fields":[]}`;

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: "Birthday party August 15 at 2pm Lagos" },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  }),
});

console.log("status:", response.status);
console.log(await response.text());
