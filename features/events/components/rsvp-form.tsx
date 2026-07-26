"use client";

import { useActionState, useRef } from "react";

import {
  rsvpFormInitialState,
  submitEventRsvpAction,
  type RsvpFormState,
} from "@/features/events/actions/submit-rsvp";
import type { RsvpStatus } from "@/types/database";

type RsvpFormProps = {
  publicSlug: string;
  capacity: number | null;
};

const STATUS_BUTTONS: Array<{ status: RsvpStatus; label: string; className: string }> = [
  { status: "yes", label: "Yes", className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  { status: "maybe", label: "Maybe", className: "bg-amber-500 hover:bg-amber-600 text-white" },
  { status: "no", label: "No", className: "bg-zinc-600 hover:bg-zinc-700 text-white" },
];

export function RsvpForm({ publicSlug, capacity }: RsvpFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState<RsvpFormState, FormData>(
    submitEventRsvpAction,
    rsvpFormInitialState,
  );

  function submitWithStatus(status: RsvpStatus) {
    if (!formRef.current) {
      return;
    }

    if (statusRef.current) {
      statusRef.current.value = status;
    }

    formRef.current.requestSubmit();
  }

  if (state.ok) {
    return (
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          RSVP received
        </p>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{state.message}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">RSVP</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Let the organizer know if you&apos;re coming.
        {capacity ? ` (${capacity} spots)` : ""}
      </p>

      <form ref={formRef} action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="publicSlug" value={publicSlug} />
        <input ref={statusRef} type="hidden" name="status" defaultValue="" />

        <div>
          <label
            htmlFor="guestName"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Your name
          </label>
          <input
            id="guestName"
            name="guestName"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="Full name"
          />
        </div>

        <div>
          <label
            htmlFor="guestPhone"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Phone (optional)
          </label>
          <input
            id="guestPhone"
            name="guestPhone"
            type="tel"
            maxLength={20}
            autoComplete="tel"
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="08012345678"
          />
        </div>

        {state.message ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.message}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2 pt-1">
          {STATUS_BUTTONS.map(({ status, label, className }) => (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => submitWithStatus(status)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:opacity-60 ${className}`}
            >
              {label}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}
