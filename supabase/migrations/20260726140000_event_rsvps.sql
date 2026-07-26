-- Event RSVPs for published events (web + future WhatsApp guest flow)

create type public.rsvp_status as enum (
  'yes',
  'no',
  'maybe'
);

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  guest_name text not null,
  guest_phone text,
  guest_email text,
  status public.rsvp_status not null,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_rsvps_guest_name_not_blank check (char_length(trim(guest_name)) > 0)
);

create index event_rsvps_event_id_idx on public.event_rsvps (event_id);
create index event_rsvps_event_id_status_idx on public.event_rsvps (event_id, status);

create trigger event_rsvps_set_updated_at
before update on public.event_rsvps
for each row execute function public.set_updated_at();

alter table public.event_rsvps enable row level security;

-- Inserts/reads go through service role (server actions) for MVP.
-- Future: anon insert policy scoped to published events.
