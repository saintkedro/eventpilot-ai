import { getEventPilotWhatsAppUrl } from "@/lib/env/marketing";

export function EventPilotFooter() {
  const whatsappHiUrl = getEventPilotWhatsAppUrl("Hi");

  return (
    <footer className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Powered by EventPilot
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Your event coordinator on WhatsApp
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        Create and manage any event — no app required.
      </p>

      {whatsappHiUrl ? (
        <a
          href={whatsappHiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Say Hi to EventPilot
        </a>
      ) : null}
    </footer>
  );
}
