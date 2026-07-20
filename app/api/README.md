# HTTP API (`app/api/`)

Route Handlers are **thin adapters**: validate input, authenticate, delegate to `features/*/server` or `lib/`.

## Layout

- `health/` — liveness/readiness for Vercel and monitors
- `webhooks/whatsapp/` — Meta WhatsApp Cloud API (verify + inbound)
- `webhooks/supabase/` — optional database or auth webhooks
- `v1/` — versioned REST surface (future)

## Conventions

- Prefer explicit versioning under `v1/` for product APIs; webhooks stay at stable paths.
- Use idempotency keys for webhook processing where applicable.
- Never import client-only modules in route handlers.
