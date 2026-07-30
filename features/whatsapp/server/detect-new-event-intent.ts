const NEW_EVENT_PATTERN =
  /\b(new event|another event|different event|start over|start fresh|plan (?:a )?new|create (?:a )?new(?:\s+event)?|plan something else)\b/i;

/** True when the organizer wants to discard the active event and plan a new one. */
export function isNewEventIntent(message: string): boolean {
  return NEW_EVENT_PATTERN.test(message.trim());
}
