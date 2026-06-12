# Zinzino Connect AI

AI-powered CRM and customer engagement platform for independent Zinzino Partners —
a blend of HubSpot, Notion, Apple Reminders, ChatGPT, and Contacts with an
Apple-inspired interface.

Stay in touch with every customer and prospect automatically: birthdays,
follow-ups, product check-ins, and BalanceTest reminders — with AI drafting the
messages and **you approving every send**.

## Features

- **AI Contact Import** — scan handwritten forms, upload photos/PDFs/screenshots,
  or paste forwarded emails. AI extracts name, phone, email, address, birthday,
  products, BalanceTest date, notes, interests, and communication preferences —
  shown for review and editing before anything is saved.
- **Smart Customer Timeline** — every contact has a history feed (imports, orders,
  messages, notes, tests) plus an AI next-action recommendation
  (*"Mary has not been contacted for 62 days. Recommend sending a friendly check-in."*).
- **AI Follow-up Assistant** — personalized SMS / email / WhatsApp drafts, all
  editable before sending.
- **Automation Engine** — birthday, 30/60/90-day follow-ups, 6-month BalanceTest
  reminder, reorder reminder, inactive-customer reminder, lead nurture.
  **Approval mode**: automations only create drafts and reminders; nothing sends
  without explicit sign-off.
- **Dashboard** — customers, today's birthdays, follow-ups due, messages awaiting
  approval, recent imports, upcoming reminders, review tasks.
- **AI Copilot** — *"Who hasn't heard from me in 90 days?"*, *"Generate follow-ups
  for all BalanceOil customers."* The copilot searches and proposes; drafts land
  in the approval queue.
- **Safety built in** — never gives medical advice, never diagnoses, never promises
  health outcomes. Medical questions are flagged, create a human review task, and
  get a safe "talk to your healthcare professional" template.

## Quick start

```bash
npm install
cp .env.example .env       # works out of the box — no API keys needed
npm run db:push            # create the SQLite database
npm run db:seed            # load demo contacts
npm run dev                # http://localhost:3000
```

Without `ANTHROPIC_API_KEY` the app runs on a deterministic **mock AI provider**
so every feature is demoable offline. Set the key in `.env` to enable Claude for
real extraction (vision/PDF), drafting, and the conversational copilot.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:seed` | Load demo data |
| `npm run db:reset` | Wipe and reseed |

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma + SQLite (Postgres-ready) · Anthropic SDK behind an AI provider
abstraction · messaging provider abstraction (Twilio/email slots included).

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design: system
diagram, database schema, API surface, AI/messaging/OCR abstraction layers,
safety model, and the Phase 2 roadmap seams (Postgres, Twilio, schedulers,
teams).
