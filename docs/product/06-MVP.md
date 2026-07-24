# MVP

The MVP is not "the smallest product."

The MVP is the **smallest complete WhatsApp-first event experience**.

---

# Goal

An organizer can successfully run an event from start to finish through WhatsApp — without needing a dashboard.

---

# MVP Workflow

```
Open WhatsApp
      ↓
Message EventPilot
      ↓
Describe your event
      ↓
Answer a few natural follow-ups
      ↓
Event is created + shareable link generated
      ↓
Invite guests via WhatsApp / share link
      ↓
Track RSVPs by asking in chat
      ↓
Sell tickets (optional)
      ↓
Schedule reminders in chat
      ↓
Check in guests on event day
      ↓
Get summary report in chat
```

---

# Feature Requirements

## WhatsApp Assistant (P0 — Core Product)

| Capability | Requirement |
|---|---|
| Onboarding | Link phone / start conversation |
| Event creation | Natural language → structured event |
| Event updates | "Change date to...", "Add 50 more seats" |
| Queries | "Who's coming?", "How many tickets sold?" |
| Invitations | Send to guest phone numbers |
| Reminders | Schedule via natural language |
| Tone | Human, context-aware, proactive |

## Event Engine (P0 — Backend)

| Capability | Requirement |
|---|---|
| Events | Draft → Published → Completed → Archived / Cancelled |
| Guests | Invite, RSVP states, plus-one |
| Ticketing | Free & paid, capacity, QR codes |
| Check-in | QR scan, manual search, attendance count |

## Public Event Page (P0 — Supporting)

| Capability | Requirement |
|---|---|
| Auto-generated | Created from conversation, no manual setup |
| RSVP | Accept / Decline / Maybe |
| Tickets | Purchase flow where applicable |
| Content | Location, schedule, FAQs |

## Auth (P1 — Minimal)

| Method | Purpose |
|---|---|
| WhatsApp / phone | Primary identity |
| Email / Google | Optional — dashboard, recovery |

## Reports (P1 — Via Chat)

| Report | Delivery |
|---|---|
| Attendance, revenue, RSVPs, no-shows | Summarized in WhatsApp |
| CSV export | Link in chat or optional dashboard |

## Dashboard (P2 — Optional)

Not required for MVP validation. Include only if time allows:

- Guest list view
- Basic analytics
- Team access

---

# MVP Success Criteria

1. First-time organizer creates event in WhatsApp in under 10 minutes
2. Organizer never needs to open dashboard to complete workflow
3. Guests can RSVP via WhatsApp message or web link
4. Check-in works on event day
5. Organizer can ask "give me a summary" and get useful answer
