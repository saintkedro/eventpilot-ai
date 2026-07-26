const PUBLISH_PATTERN =
  /\b(publish(?:\s+(?:my|the)\s+event)?|go\s+live|make\s+it\s+public|share\s+(?:the\s+)?link)\b/i;

/** True when the organizer wants to publish their active event. */
export function isPublishIntent(message: string): boolean {
  return PUBLISH_PATTERN.test(message.trim());
}
