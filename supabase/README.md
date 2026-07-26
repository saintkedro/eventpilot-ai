# Supabase (`supabase/`)

Database schema, migrations, and local development via [Supabase CLI](https://supabase.com/docs/guides/cli).

## Apply migrations (remote project)

EventPilot project: `jczrjwuockbjcsosznln`

### Option A — Supabase Dashboard (no CLI)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/jczrjwuockbjcsosznln/sql/new)
2. Paste contents of each migration in `migrations/` (in order), e.g.:
   - `20260725160000_whatsapp_core_schema.sql`
   - `20260726140000_event_rsvps.sql`
3. Run

### Option B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref jczrjwuockbjcsosznln
supabase db push
supabase gen types typescript --linked > types/database.ts
```

## Required env vars

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (WhatsApp webhook) |

Get the service role key from **Project Settings → API** (never expose to the browser).

## Schema (MVP core)

| Table | Purpose |
|---|---|
| `profiles` | Person (organizer/guest) |
| `whatsapp_identities` | Meta `wa_id` → profile |
| `organizations` | Tenant; auto `"Personal"` org on first message |
| `events` | Event records (draft → published → …) |
| `event_rsvps` | Guest RSVPs (yes / no / maybe) for published events |
| `whatsapp_sessions` | Conversation / AI intake state |

## Security

- RLS enabled on all tables.
- WhatsApp webhook uses **service role** via `lib/supabase/admin.ts`.
- Dashboard policies expand when auth ships.

See also: [`../docs/product/06-MVP.md`](../docs/product/06-MVP.md)
