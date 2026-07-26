# Vercel: public event pages & share links

Guest-facing event links (`/e/[slug]`) must be reachable **without** logging in. If visitors see a **Vercel sign-in** page, that is almost never an EventPilot bug — it is **Vercel Deployment Protection**.

---

## Symptom

WhatsApp sends a link like:

```text
https://eventpilot-ai-ev5i.vercel.app/e/zion-s-1st-birthday-celebration-0372252b
```

Opening it shows **Vercel Authentication** / “Log in to Vercel” instead of the event page.

---

## Fix: disable protection on Production

1. [vercel.com](https://vercel.com) → project **eventpilot-ai-ev5i**
2. **Settings** → **Deployment Protection**
3. For **Production**:
   - Turn **off** “Vercel Authentication”
   - Turn **off** password protection (if enabled)
   - Or restrict protection to **Preview** deployments only
4. Redeploy if prompted

Preview URLs (`*-git-*.vercel.app`) may stay protected — that is fine. **Production** must be public for guest links.

---

## Required env: canonical app URL

Share links are built in `lib/env/app-url.ts`. Set this on **Vercel Production**:

```text
NEXT_PUBLIC_APP_URL=https://eventpilot-ai-ev5i.vercel.app
```

Also add to `.env.local` for local testing of publish replies:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If unset, Vercel falls back to `VERCEL_URL` at runtime (usually correct on Production).

After changing env vars → **Redeploy**.

---

## Verify

### 1. Public page (incognito browser)

```text
https://eventpilot-ai-ev5i.vercel.app/e/<your-event-slug>
```

Expected: event title, date, time, venue. HTTP **200**.

### 2. Publish from WhatsApp

Message the test business number:

```text
publish my event
```

Expected reply includes the same `/e/...` link.

### 3. Event must be published

Only events with `status = 'published'` render on `/e/[slug]`. Draft events return **404** (not Vercel login).

---

## Code reference

| Piece | Location |
|--------|----------|
| Share URL builder | `lib/env/app-url.ts` |
| Publish handler | `features/whatsapp/server/publish-event.ts` |
| Public page | `app/e/[slug]/page.tsx` |
| Publish intent | `features/whatsapp/server/detect-publish-intent.ts` |

EventPilot middleware does **not** require auth for `/e/*`. No app login gate exists on public event pages.

---

## Checklist before sharing links with real guests

- [ ] Production Deployment Protection disabled (or Preview-only)
- [ ] `NEXT_PUBLIC_APP_URL` set on Vercel Production
- [ ] Latest code deployed (publish flow + `/e/[slug]` route)
- [ ] Event published via WhatsApp (`publish my event`)
- [ ] Link opens in incognito without Vercel login

---

## Production reference (EventPilot)

| Item | Value |
|------|--------|
| Production URL | `https://eventpilot-ai-ev5i.vercel.app` |
| Example public page | `/e/zion-s-1st-birthday-celebration-0372252b` |
| Health | `/api/health` |
