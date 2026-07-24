# Product Requirements Document (PRD)

Version: 4.0

Status: Living Document

Last Updated: July 2026

**Owner:** Everyday Digital Services (EDS)

---

# 1. Product Overview

## Product Name

**EventPilot** *(working name)*

## Product Category

WhatsApp-native event management platform with conversational AI

## One-Line Description

The event coordinator in your WhatsApp chat.

## Vision

Organize any event through a simple conversation on WhatsApp.

## Mission

Enable anyone — from a family hosting a birthday to an organization running a conference — to set up and manage events through natural conversation, without learning new software.

---

# 2. Product Philosophy

EventPilot is **not** traditional event management software with a WhatsApp add-on.

EventPilot **is** event management on WhatsApp.

## WhatsApp Is the Platform

Organizers should be able to create, manage, and run events without leaving WhatsApp.

## Conversation Is the Interface

Users describe events in natural language. EventPilot asks follow-up questions, remembers context, and takes action.

## Human, Not Robotic

EventPilot must feel like a capable coordinator — not an IVR bot, not a rigid menu tree, not a form disguised as chat.

Characteristics:

- Remembers prior messages and event context
- Asks one or two questions at a time
- Understands incomplete or messy input
- Proactively suggests next steps
- Uses clear, warm, natural language

## Web Is Supporting, Not Central

The web application exists only where WhatsApp is insufficient:

- Shareable public event links
- Guest RSVP/ticket flows (when guest is not in WhatsApp thread)
- Payment checkout
- QR display/scanning where needed

The organizer dashboard is **optional** — for users who want a visual overview, exports, or team management. It is not required for MVP success.

---

# 3. Product Principles

1. **WhatsApp First** — If it can be done in chat, it should be done in chat.
2. **Conversation Before Forms** — Gather information through dialogue, not long forms.
3. **Human Experience** — Replies should feel personal, helpful, and context-aware.
4. **Mobile First** — Every flow must work on a phone.
5. **Every Guest Matters** — Guests receive a polished, timely experience.
6. **Progressive Disclosure** — Start simple; reveal complexity only when needed.
7. **Organizer Stays in Control** — EventPilot recommends and automates; the organizer approves.

---

# 4. Problem Statement

Organizers already use WhatsApp to coordinate events, but WhatsApp alone cannot:

- Structure an event
- Track RSVPs reliably
- Manage tickets
- Send targeted reminders
- Run check-in
- Produce reports

They patch the gap with spreadsheets, third-party links, and manual follow-ups — which breaks down as events grow.

---

# 5. Solution

EventPilot is a WhatsApp-based event coordinator powered by AI.

Organizers chat with EventPilot. The platform:

- Understands the event being described
- Creates and updates event records
- Generates shareable event pages when needed
- Manages guest lists and RSVPs
- Handles free and paid ticketing
- Sends reminders and updates
- Supports check-in on event day
- Provides summaries and reports on request

Example organizer interactions:

- "Create a birthday party for my son on March 15"
- "Invite these 20 numbers"
- "Who hasn't RSVP'd yet?"
- "Remind everyone tomorrow at 10am"
- "How many people checked in?"
- "Mark the event as completed"

---

# 6. Target Customers

## Personal Events

Weddings, birthdays, dedications, anniversaries, reunions, memorials

## Community Events

Churches, schools, alumni groups, NGOs, youth groups

## Business Events

Conferences, seminars, workshops, product launches, networking events

## Enterprise

Internal meetings, employee events, multi-day conferences

**Primary audience (MVP):** families, churches, schools, NGOs, small businesses — people who already coordinate on WhatsApp.

---

# 7. User Roles

## Organizer

Creates and manages events through WhatsApp conversation.

## Guest / Attendee

Receives invitations and updates via WhatsApp and/or web link. Can RSVP, buy tickets, receive reminders, check in.

## Team Member (Post-MVP / Optional Dashboard)

Delegated access for co-organizers (e.g., check-in staff, communications lead).

---

# 8. Core Product Surfaces

## 1. WhatsApp Assistant (Primary — Required)

The core product. All organizer workflows start and usually finish here.

Capabilities:

- Event creation and editing via conversation
- Guest invitations
- RSVP tracking and queries
- Ticketing setup and status
- Reminders and announcements
- Check-in support
- Reports on demand ("How did we do?")
- Proactive nudges ("3 days to go — 12 guests haven't replied")

## 2. Public Event Page (Supporting — Required for MVP)

Auto-generated shareable link for:

- Event details
- RSVP / registration
- Ticket purchase
- Location and schedule
- FAQs

Organizer does not manage this page manually — it is created and updated from chat.

## 3. Organizer Dashboard (Optional — Secondary)

Web view for power users:

- Visual event overview
- Guest list and filters
- Team management
- Exports and analytics

**Not required for MVP completion.** An organizer who never opens the dashboard should still succeed.

---

# 9. Event Lifecycle

Every feature must support one or more stages:

1. Inspiration
2. Planning
3. Creation
4. Promotion
5. Registration
6. Preparation
7. Event Day
8. Guest Experience
9. Follow-up
10. Analytics
11. Continuous Improvement

In the WhatsApp-first model, most stages are driven by conversation and automated follow-through.

---

# 10. MVP Scope

## MVP Definition

The MVP is the **smallest complete WhatsApp-first experience**:

> An organizer can set up and run an event end-to-end through WhatsApp conversation, with web used only where necessary.

## MVP Workflow

```
Message EventPilot on WhatsApp
        ↓
Describe event in conversation
        ↓
EventPilot creates event + shareable page
        ↓
Invite guests (WhatsApp + link)
        ↓
Collect RSVPs
        ↓
Sell tickets (optional)
        ↓
Send reminders
        ↓
Check in guests on event day
        ↓
Ask for summary / export report
```

## MVP Features

### WhatsApp Assistant (Core)

- Connect organizer via WhatsApp (phone verification / linking)
- Natural language event creation
- Context-aware follow-up questions
- Event updates via chat ("Change venue to...")
- Query event status ("Who is coming?")
- Guest invitation via WhatsApp messages
- Reminder scheduling via chat
- Human-feeling responses (not menu-driven bot)

### Event Backend (Invisible to User)

- User & organization model
- Event records with lifecycle states: Draft, Published, Completed, Archived, Cancelled
- Guest list and RSVP states: Accept, Decline, Maybe, Plus-one
- Ticketing: free, paid, capacity, QR codes
- Check-in: QR validation, manual lookup, attendance count

### Public Event Page (Supporting)

- Auto-generated responsive event page
- RSVP and registration
- Ticket purchase (where applicable)
- Location, schedule, FAQs

### Auth (Minimal)

- Phone/WhatsApp identity as primary
- Email/Google optional for dashboard access and account recovery

### Reports (Via Chat)

- Attendance, registrations, revenue, no-shows — requested in conversation
- CSV export (link sent in WhatsApp or via optional dashboard)

### Explicitly Not Required for MVP

- Full-featured organizer dashboard
- Vendor marketplace
- Team collaboration UI
- Native mobile apps
- Marketing automation beyond basic reminders

---

# 11. WhatsApp Interaction Guidelines

These are product requirements, not just UX preferences.

## Do

- Remember conversation and event context across sessions
- Confirm important actions before executing ("Should I send this reminder to all 85 guests?")
- Offer smart defaults ("I'll set RSVP deadline to 2 days before the event — okay?")
- Send concise summaries when asked
- Use natural language; support voice notes (future)

## Don't

- Force numbered menu options as the primary interaction
- Redirect to dashboard for core tasks
- Ask for information already provided
- Send walls of text
- Feel like a call center IVR

---

# 12. Future Features

- Voice note input and replies
- Multi-language conversation
- Co-organizer management via WhatsApp
- Vendor recommendations and marketplace
- AI marketing copy and flyer generation
- Seating planner
- Live event engagement (polls, Q&A)
- Enterprise admin and white-label
- Public API
- Optional native apps

---

# 13. Success Metrics

**North Star:** Events successfully completed via WhatsApp-first workflow.

| Category | Metrics |
|---|---|
| Adoption | Organizers linked on WhatsApp, WAUs/MAUs |
| Conversation | Events created via chat, messages per event, completion rate |
| Outcomes | Events published, RSVP rate, check-in rate, events completed |
| Quality | Organizer satisfaction, guest satisfaction, "felt human" rating |
| Reliability | WhatsApp delivery rate, AI response time, uptime |

**Key MVP validation question:**
Can a first-time organizer complete an event without opening the dashboard?

---

# 14. Monetization

Core platform remains free for most users.

Revenue from:

- Premium AI capabilities
- Paid ticketing fees
- Enterprise / white-label
- Marketplace commissions
- Advanced analytics and integrations

Monetization must not break the WhatsApp-first experience.

---

# 15. Guiding Statement

> **EventPilot is a WhatsApp-native event management platform. Organizers set up and manage any event through simple, human conversation. The web supports guests and payments where chat is not enough. The dashboard is optional — WhatsApp is the product.**

---
