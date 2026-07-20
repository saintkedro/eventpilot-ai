# Feature slices (`features/`)

Domain-driven folders. Each feature owns its UI, hooks, server modules, and types.

## Standard layout

```
features/<name>/
  components/   # Feature UI
  hooks/        # Client hooks
  server/       # Server-only modules, actions, data access
  types/        # Feature-specific types
```

## Import boundaries

```
app/           → features/, components/, lib/, config/
features/X/    → lib/, components/ui, other features via public barrels only
components/    → must NOT import features/
lib/           → must NOT import features/ or app/
```

## Features

| Folder | Domain |
|--------|--------|
| `auth/` | Sessions, roles, invitations |
| `organizations/` | Tenants, membership, org settings |
| `events/` | Event lifecycle and configuration |
| `attendees/` | Registration and attendee records |
| `communications/` | Cross-channel messaging orchestration |
| `whatsapp/` | Meta WhatsApp Cloud API integration |
| `ai/` | OpenAI workflows and prompts |
| `billing/` | Subscriptions and usage (future) |
