# Shared libraries (`lib/`)

Cross-cutting infrastructure and third-party clients. **Server-only** modules must not be imported from client components.

## Modules

| Path | Purpose |
|------|---------|
| `env/` | Validated environment variables (client vs server) |
| `supabase/` | Browser, server, middleware, and admin clients |
| `openai/` | OpenAI client factory |
| `whatsapp/` | Meta WhatsApp Cloud API client |
| `logger/` | Structured logging |
| `errors/` | Application error types |
| `utils/` | Generic helpers |

## Rules

- Do not import `features/` or `app/` from `lib/`.
- Mark server-only files with `import "server-only"` when implementation is added.
