import Link from "next/link";

import { getEventPilotWhatsAppUrl, getMarketingHomeUrl } from "@/lib/env/marketing";

export function EventPilotFooter() {
  const homeUrl = getMarketingHomeUrl();
  const whatsappUrl = getEventPilotWhatsAppUrl();

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

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href={homeUrl}
          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Visit EventPilot
        </Link>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Message on WhatsApp
          </a>
        ) : null}
      </div>
    </footer>
  );
}
