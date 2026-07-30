-- Per-conversation / per-request cost and token usage (OpenAI, WhatsApp, etc.)

create type public.usage_event_kind as enum (
  'openai_chat',
  'whatsapp_outbound'
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  kind public.usage_event_kind not null,
  session_id uuid references public.whatsapp_sessions (id) on delete set null,
  wa_id text,
  event_id uuid references public.events (id) on delete set null,
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  estimated_usd numeric(12, 6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index usage_events_session_id_idx on public.usage_events (session_id);
create index usage_events_wa_id_idx on public.usage_events (wa_id);
create index usage_events_event_id_idx on public.usage_events (event_id);
create index usage_events_created_at_idx on public.usage_events (created_at desc);
create index usage_events_kind_idx on public.usage_events (kind);

alter table public.usage_events enable row level security;

-- Reads/writes via service role only for MVP.
