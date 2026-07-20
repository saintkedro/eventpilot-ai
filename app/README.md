# App Router (`app/`)

EventPilot uses Next.js App Router with **route groups** to separate concerns:

| Group | URL | Purpose |
|-------|-----|---------|
| `(marketing)` | `/`, `/pricing`, `/legal/*` | Public marketing site |
| `(auth)` | `/login`, `/signup`, … | Authentication flows |
| `(app)` | `/dashboard`, `/[orgSlug]/*` | Authenticated product |

## Conventions

- **Pages and layouts** stay thin; domain logic lives under `features/`.
- **Route Handlers** under `app/api/` are HTTP adapters only (webhooks, health, versioned REST).
- Use root `layout.tsx` for global HTML, fonts, and metadata.
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` for UX boundaries where needed.

## Related

- Tenant routing: [`(app)/README.md`](./(app)/README.md)
- API surface: [`api/README.md`](./api/README.md)
