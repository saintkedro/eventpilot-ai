# Configuration (`config/`)

Static, typed application configuration (not secrets).

- `site.ts` — site metadata, canonical URLs, support links
- `features.ts` — feature flags and rollout toggles

Secrets and environment-specific values belong in `lib/env/`.
