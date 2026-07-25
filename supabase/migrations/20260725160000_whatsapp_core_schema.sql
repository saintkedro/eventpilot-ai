-- EventPilot core schema: WhatsApp identity, organizations, events, sessions

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- whatsapp_identities — phone (wa_id) → profile
-- ---------------------------------------------------------------------------

create table public.whatsapp_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  wa_id text not null,
  phone_e164 text,
  verified_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint whatsapp_identities_wa_id_key unique (wa_id)
);

create index whatsapp_identities_profile_id_idx
  on public.whatsapp_identities (profile_id);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  owner_profile_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_key unique (slug)
);

create index organizations_owner_profile_id_idx
  on public.organizations (owner_profile_id);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create type public.event_status as enum (
  'draft',
  'published',
  'completed',
  'archived',
  'cancelled'
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text,
  description text,
  status public.event_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'Africa/Lagos',
  venue_name text,
  venue_address text,
  capacity integer check (capacity is null or capacity > 0),
  public_slug text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_public_slug_key unique (public_slug)
);

create index events_organization_id_idx on public.events (organization_id);
create index events_created_by_idx on public.events (created_by);
create index events_status_idx on public.events (status);

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- whatsapp_sessions — conversation / intake state
-- ---------------------------------------------------------------------------

create table public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  wa_id text not null,
  active_event_id uuid references public.events (id) on delete set null,
  state jsonb not null default '{}'::jsonb,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_sessions_wa_id_key unique (wa_id)
);

create index whatsapp_sessions_profile_id_idx
  on public.whatsapp_sessions (profile_id);

create trigger whatsapp_sessions_set_updated_at
before update on public.whatsapp_sessions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.whatsapp_identities enable row level security;
alter table public.organizations enable row level security;
alter table public.events enable row level security;
alter table public.whatsapp_sessions enable row level security;

-- Authenticated users can read/update their own profile (dashboard future)
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = auth_user_id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = auth_user_id);

-- Service role bypasses RLS; anon has no direct access to WhatsApp tables.
-- Future: org-scoped policies when dashboard auth ships.
