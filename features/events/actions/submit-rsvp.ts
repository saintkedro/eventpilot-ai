"use server";

import {
  isRsvpValidationError,
  parseRsvpFormData,
  submitEventRsvp,
} from "@/features/events/server/rsvp";
import { logError } from "@/lib/logger";

export type RsvpFormState = {
  ok: boolean;
  message: string;
};

const INITIAL_STATE: RsvpFormState = { ok: false, message: "" };

export async function submitEventRsvpAction(
  _prevState: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  const parsed = parseRsvpFormData(formData);

  if (isRsvpValidationError(parsed)) {
    return parsed;
  }

  try {
    return await submitEventRsvp(parsed);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logError("rsvp.submit_failed", { reason });

    if (reason.includes("event_rsvps") || reason.includes("does not exist")) {
      return {
        ok: false,
        message: "RSVP is not set up yet. The organizer needs to enable RSVPs for this event.",
      };
    }

    if (reason.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        ok: false,
        message: "RSVP is temporarily unavailable. Please try again later.",
      };
    }

    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

export { INITIAL_STATE as rsvpFormInitialState };
