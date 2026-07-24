import { createHmac, timingSafeEqual } from "crypto";

/**
 * Validates `X-Hub-Signature-256` from Meta using the raw request body.
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const received = signatureHeader.slice("sha256=".length);
  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (received.length !== expected.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(received, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
