/** Template showing required fields for one-shot event creation. */
export function eventIntakeTemplateMessage(): string {
  return [
    "Send your event in one message like this:",
    "",
    "*[Event name]* on *[date]* at *[time]* at *[venue]*.",
    "I'm *[your name]*.",
    "",
    "Example:",
    "Baby shower for Amaka on 15 August at 3pm at Terra Kulture, Lagos.",
    "I'm Chioma.",
  ].join("\n");
}

type WelcomeMessageInput = {
  isNewUser: boolean;
  activeEventTitle?: string | null;
  organizerName?: string | null;
};

/** First message or return greeting for EventPilot intake. */
export function buildWelcomeMessage(input: WelcomeMessageInput): string {
  const { isNewUser, activeEventTitle, organizerName } = input;

  if (activeEventTitle?.trim()) {
    return [
      "Welcome back! I'm EventPilot.",
      "",
      `You're working on *${activeEventTitle.trim()}*.`,
      "Share updates, say *publish my event* to go live, or *new event* to plan something different.",
      "",
      eventIntakeTemplateMessage(),
    ].join("\n");
  }

  if (isNewUser) {
    return [
      "Hi! I'm EventPilot — your event coordinator on WhatsApp.",
      "",
      eventIntakeTemplateMessage(),
    ].join("\n");
  }

  const nameLine = organizerName?.trim()
    ? `Welcome back, ${organizerName.trim()}!`
    : "Welcome back! I'm EventPilot.";

  return [nameLine, "", eventIntakeTemplateMessage()].join("\n");
}

/** Reply after the organizer asks to start a new event. */
export function buildNewEventResetMessage(): string {
  return ["Got it — let's plan a new event.", "", eventIntakeTemplateMessage()].join(
    "\n",
  );
}
