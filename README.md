# EventPilot

AI-powered Event Operating System — Next.js application.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase (auth, database, storage)
- OpenAI, Meta WhatsApp Cloud API
- Vercel

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [.env.example](./.env.example) for required variable names. Do not commit secrets.

## Documentation

- Product and architecture foundations: [`../EventPilot_Foundation/`](../EventPilot_Foundation/)
- App conventions: [`app/README.md`](./app/README.md), [`features/README.md`](./features/README.md)

## Folder overview

| Path | Purpose |
|------|---------|
| `app/` | Routes, layouts, API route handlers |
| `features/` | Domain slices (events, messaging, AI, …) |
| `components/` | Shared UI shell and providers |
| `lib/` | Integrations and cross-cutting utilities |
| `supabase/` | Migrations and local Supabase config |
