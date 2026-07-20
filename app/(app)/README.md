# Authenticated app (`(app)/`)

Routes under this group require an authenticated user. Organization (tenant) context is scoped by **`[orgSlug]`**.

## URL patterns

- `/dashboard` — org picker or default landing (placeholder)
- `/[orgSlug]` — tenant home
- `/[orgSlug]/events`, `/[orgSlug]/events/[eventId]`, … — event workspace

## Conventions

- Resolve org membership and roles in server layouts or middleware before rendering tenant UI.
- Pass tenant id via server context or props from layouts; avoid leaking cross-tenant data.
- Feature UI and data access live in `features/`, not in page files.
