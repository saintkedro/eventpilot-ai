import { buildWhatsAppLink, formatPhoneForDisplay } from "@/lib/phone/format-display";

type EventOrganizerSectionProps = {
  name: string | null;
  phone: string | null;
};

export function EventOrganizerSection({ name, phone }: EventOrganizerSectionProps) {
  const displayPhone = formatPhoneForDisplay(phone);
  const displayName = name?.trim() || "Event organizer";

  if (!displayPhone && !name?.trim()) {
    return null;
  }

  const phoneHref = phone ? buildWhatsAppLink(phone) : null;

  return (
    <section className="mt-8 space-y-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/20">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Organizer
      </p>
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{displayName}</p>
      {displayPhone && phoneHref ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <a
            href={phoneHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {displayPhone}
          </a>
        </p>
      ) : null}
    </section>
  );
}
