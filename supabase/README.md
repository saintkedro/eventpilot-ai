# Supabase (`supabase/`)

Database schema, migrations, and local development via [Supabase CLI](https://supabase.com/docs/guides/cli).

## Workflow (when implemented)

1. `supabase init` / use existing `config.toml`
2. Author migrations in `migrations/`
3. Apply locally: `supabase db reset` or `supabase migration up`
4. Generate types into `types/database.ts`

## Security

- Enable Row Level Security (RLS) on all tenant-scoped tables.
- Document policies alongside migrations or in ADRs under `docs/architecture/`.

See also: [`../EventPilot_Foundation/docs/05-Database.md`](../EventPilot_Foundation/docs/05-Database.md)
