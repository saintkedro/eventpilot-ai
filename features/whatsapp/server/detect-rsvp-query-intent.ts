const RSVP_QUERY_PATTERN =
  /\b(how many (?:rsvps?|guests|people|attendees)|rsvp(?:s)?(?:\s+(?:count|summary|status|update))?|who(?:'s|\s+is)\s+coming|attendance(?:\s+count)?|guest\s+count)\b/i;

/** True when the organizer is asking for RSVP stats on their event. */
export function isRsvpQueryIntent(message: string): boolean {
  return RSVP_QUERY_PATTERN.test(message.trim());
}
