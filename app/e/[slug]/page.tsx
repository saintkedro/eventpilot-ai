import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedEventBySlug } from "@/features/events/server/get-published-event-by-slug";
import {
  formatEventDateForWhatsApp,
  formatEventTimeForWhatsApp,
} from "@/features/whatsapp/server/event-intake/format-event-datetime";

type PublicEventPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PublicEventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event?.title) {
    return { title: "Event not found · EventPilot" };
  }

  return {
    title: `${event.title} · EventPilot`,
    description: event.description ?? `Event details for ${event.title}`,
  };
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const timezone = event.timezone ?? "Africa/Lagos";
  const dateLabel = formatEventDateForWhatsApp(event.starts_at, timezone);
  const timeLabel = formatEventTimeForWhatsApp(event.starts_at, timezone);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        EventPilot
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {event.title}
      </h1>

      {event.description ? (
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          {event.description}
        </p>
      ) : null}

      <section className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Date
          </p>
          <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-100">{dateLabel}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Time
          </p>
          <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-100">{timeLabel}</p>
        </div>

        {event.venue_name ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Venue
            </p>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-100">
              {event.venue_name}
            </p>
            {event.venue_address ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {event.venue_address}
              </p>
            ) : null}
          </div>
        ) : null}

        {event.capacity ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Capacity
            </p>
            <p className="mt-1 text-lg text-zinc-900 dark:text-zinc-100">
              {event.capacity} guests
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          RSVP coming soon
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Guest registration will be available here and via WhatsApp.
        </p>
      </section>
    </main>
  );
}
