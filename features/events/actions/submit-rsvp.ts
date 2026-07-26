"use server";

import {
  parseRsvpFormData,
  submitEventRsvp,
} from "@/features/events/server/rsvp";

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

  if ("ok" in parsed) {
    return parsed;
  }

  try {
    return await submitEventRsvp(parsed);
  } catch {
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

export { INITIAL_STATE as rsvpFormInitialState };
