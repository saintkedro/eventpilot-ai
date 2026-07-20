# Shared components

| Folder | Purpose |
|--------|---------|
| `ui/` | Design-system primitives (buttons, inputs, dialogs) |
| `layout/` | App shell, navigation, sidebars |
| `providers/` | Client providers (theme, auth session, data fetching) |

## Rules

- **`components/` must not import `features/`** — avoids circular dependencies.
- Feature-specific UI belongs under `features/<name>/components/`.
- Keep server-only helpers out of client components (`"use client"`).
