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
- **Multi-user accounts** — Clerk-powered sign-up/sign-in (email/password,
  Google, Apple, …). Every contact, message, and automation is private to the
  Partner who owns it.
- **Safety built in** — never gives medical advice, never diagnoses, never promises
  health outcomes. Medical questions are flagged, create a human review task, and
  get a safe "talk to your healthcare professional" template.

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL + Clerk keys
npm run db:push             # create the Postgres schema
npm run dev                 # http://localhost:3000
```

You need:
1. A Postgres database (free: [Neon](https://neon.tech), [Supabase](https://supabase.com)).
2. A free Clerk account ([clerk.com](https://clerk.com)) — copy
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into `.env`.

Without `ANTHROPIC_API_KEY` the app runs on a deterministic **mock AI provider**
so every feature is demoable offline. Set the key in `.env` to enable Claude for
real extraction (vision/PDF), drafting, and the conversational copilot.

Each new Clerk sign-up auto-seeds 3 demo contacts and the 8 automation rules
so the dashboard isn't empty on first login.

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new).
2. **Add a Postgres database** — Vercel dashboard → **Storage → Create Database
   → Neon Postgres**. This injects `DATABASE_URL` automatically.
3. **Add Clerk env vars** — Settings → Environment Variables, paste:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from clerk.com → API Keys)
   - `CLERK_SECRET_KEY` (same place)
4. (Optional) **Add `ANTHROPIC_API_KEY`** to switch from the mock AI provider
   to live Claude for extraction, drafting, and the copilot.
5. **Redeploy** — the build runs `prisma db push` against the new database to
   create the schema, then `next build`.

On an iPhone, open the deployed URL in Safari and use **Share → Add to Home
Screen** — the app installs with its icon and runs full-screen like a native
app.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:reset` | Wipe and recreate the schema (dev only) |

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma + Postgres · Clerk authentication · Anthropic SDK behind an AI provider
abstraction · messaging provider abstraction (Twilio/email slots included).

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design: system
diagram, database schema, API surface, AI/messaging/OCR abstraction layers,
safety model, and the Phase 2 roadmap seams (Twilio, schedulers, teams).
