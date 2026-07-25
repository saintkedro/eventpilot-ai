# Permanent WhatsApp access token (System User)

EventPilot on Vercel needs a **long-lived** Meta token. Temporary tokens from **WhatsApp → API Setup** expire in ~24 hours and break send/receive.

Official reference: [Meta access tokens](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/)

---

## EventPilot values (for reference)

| Item | Value |
|---|---|
| Meta app | **EventPilot** |
| App ID | `1466314575572084` |
| WABA ID | `3657012274439941` |
| Phone Number ID | `1144972028709705` |
| Vercel env var | `WHATSAPP_ACCESS_TOKEN` |

---

## Part 1 — Open Business Settings

1. Go to [business.facebook.com/settings](https://business.facebook.com/settings)
2. Use the Business Portfolio linked to your EventPilot app
3. You need **Admin** access on the portfolio

---

## Part 2 — Create a system user

1. Left sidebar → **Users** → **System users**
2. Click **Add**
3. Name: `EventPilot Production`
4. Role: **Admin**
5. **Create system user**

---

## Part 3 — Assign assets

Select **EventPilot Production**, then **Add assets**:

### Apps tab
- Select **EventPilot**
- Permission: **Full control** (Manage app)

### WhatsApp accounts tab
- Select your WhatsApp Business Account
- Permission: **Full control** (Manage WhatsApp Business accounts)

Click **Save changes**.

---

## Part 4 — Generate the permanent token

1. Select the system user → **Generate token**
2. Select app: **EventPilot**
3. Expiration: **Never** (if shown)
4. Enable permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `business_management` (recommended)
5. **Generate token**
6. **Copy immediately** — shown only once (`EAA...`)

Store in a password manager. Never commit to git.

---

## Part 5 — Update EventPilot

### Local (`.env.local`)

```env
WHATSAPP_ACCESS_TOKEN=EAA...paste-here...
```

Optional (helps diagnostics):

```env
WHATSAPP_BUSINESS_ACCOUNT_ID=3657012274439941
```

### Vercel (production)

1. [vercel.com](https://vercel.com) → **eventpilot-ai-ev5i**
2. **Settings → Environment Variables**
3. Edit **`WHATSAPP_ACCESS_TOKEN`** → paste new token
4. Scope: **Production** (and Preview if you use it)
5. **Save**
6. **Deployments → Redeploy**

Updating `.env.local` alone does **not** change production.

---

## Part 6 — Verify

### Script (local)

```powershell
node scripts/verify-whatsapp-token.mjs
```

Expected:

```
tokenType: SYSTEM_USER (or no expiry)
expiresAt: (none / far future)
canSendMessages: true
scopes: whatsapp_business_messaging, whatsapp_business_management
```

### Production health

```text
https://eventpilot-ai-ev5i.vercel.app/api/health/whatsapp?deep=1
```

Look for:

```json
"canSendMessages": true
"tokenType": "SYSTEM_USER"
```

`tokenType: "USER"` with a tonight expiry means you still have a temp token.

### WhatsApp smoke test

Message **+1 555-193-2991** with `Hi` — you should get a reply.

---

## Part 7 — WABA subscription (usually already done)

If webhooks stop after token swap, confirm EventPilot is subscribed:

```powershell
node scripts/fix-waba-subscription.mjs
```

Or Graph API: `GET /3657012274439941/subscribed_apps` — App `1466314575572084` should appear.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Can't find System users | Need Business Portfolio admin; try [business.facebook.com/settings](https://business.facebook.com/settings) |
| Generate token disabled | Assign **App** + **WhatsApp account** to system user first |
| `#131005` after update | Token missing `whatsapp_business_messaging` — regenerate with that permission |
| `#190` expired | Old token still on Vercel — redeploy after env update |
| `canSendMessages: false` | Regenerate token; check permissions |
| Webhooks work, no replies | Run `fix-waba-subscription.mjs` |

---

## Checklist

- [ ] System user created
- [ ] EventPilot app assigned (Full control)
- [ ] WhatsApp Business Account assigned (Full control)
- [ ] Token generated with **Never** expiry + WhatsApp permissions
- [ ] `WHATSAPP_ACCESS_TOKEN` updated in `.env.local`
- [ ] `WHATSAPP_ACCESS_TOKEN` updated in Vercel Production
- [ ] Vercel redeployed
- [ ] `node scripts/verify-whatsapp-token.mjs` passes
- [ ] `/api/health/whatsapp?deep=1` → `canSendMessages: true`
- [ ] WhatsApp `Hi` test works
