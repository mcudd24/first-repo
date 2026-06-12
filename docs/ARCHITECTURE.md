# Zinzino Connect AI — Architecture

AI-powered CRM and customer engagement platform for independent Zinzino Partners.
This document explains every structural decision in the MVP. It is the source of
truth for how the system is put together and why.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                       │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │  UI (React   │   │  Route Handlers  │   │  AI Copilot    │   │
│  │  Server +    │──▶│  /app/api/*      │──▶│  (tool-use     │   │
│  │  Client)     │   │  thin HTTP layer │   │   loop)        │   │
│  └──────────────┘   └────────┬─────────┘   └───────┬────────┘   │
│                              │                     │            │
│                     ┌────────▼─────────────────────▼────────┐   │
│                     │      Service layer (src/server)       │   │
│                     │  contacts · imports · messages ·      │   │
│                     │  automations · timeline · dashboard   │   │
│                     └──┬──────────────┬──────────────┬──────┘   │
│                        │              │              │          │
│             ┌──────────▼───┐  ┌───────▼──────┐  ┌────▼──────┐   │
│             │ Prisma ORM   │  │ AI provider  │  │ Messaging │   │
│             │ (SQLite now, │  │ abstraction  │  │ provider  │   │
│             │  PG-ready)   │  │ Claude/mock  │  │ abstraction│  │
│             └──────────────┘  └──────────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Decisions and rationale

**Single Next.js app, no separate backend.** The MVP serves one partner at a
time. Route Handlers + a service layer give us a clean API surface without the
operational cost of a second deployable. When the app grows (Phase 2 teams,
push notifications), the service layer lifts out into a standalone API with
minimal churn because *no business logic lives in route handlers* — they only
parse/validate input and call services.

**Service layer owns all business logic.** Every feature (contacts, imports,
messages, automations) is a module in `src/server/services`. Route handlers and
the copilot's tools both call the same services, so "the AI did it" and "the
user clicked it" go through identical code paths — one place to enforce the
approval-before-send rule.

**Everything the AI does is a proposal.** The core safety invariant of the MVP:
no AI-initiated outbound communication is ever sent directly. AI output lands
as a `Message` row with status `PENDING_APPROVAL` or a `Reminder`/`ReviewTask`.
The only transition to `SENT` is a human clicking Approve. This is enforced in
the message service, not in prompts, so it cannot be prompt-injected away.

**Adapters for every external dependency.** AI, messaging (SMS/email/WhatsApp),
and OCR are each behind a TypeScript interface with a working default
implementation and stubs ready for the real providers:

| Concern   | Interface              | MVP implementation              | Production-ready slot     |
|-----------|------------------------|---------------------------------|---------------------------|
| LLM       | `AIProvider`           | `ClaudeProvider` (Anthropic SDK), `MockProvider` fallback when no API key | OpenAI provider drop-in |
| Messaging | `MessagingProvider`    | `LogMessagingProvider` (records sends, no real delivery) | `TwilioProvider`, `EmailProvider` stubs included |
| OCR       | part of `AIProvider.extractContacts` | Claude vision (images + PDFs natively) | dedicated OCR service if volume demands |

`MockProvider` matters: the app must be fully demoable with zero API keys. It
returns deterministic, realistic drafts and extractions so every screen works
out of the box.

---

## 2. Database Design

SQLite via Prisma for the MVP; the schema uses only Postgres-compatible types
(no SQLite-isms), so migrating is a one-line datasource change plus
`prisma migrate`. JSON-ish fields are stored as `String` containing JSON —
Prisma's `Json` type maps cleanly on Postgres later; a typed accessor in the
service layer hides the encoding either way.

### Entity-relationship overview

```
Contact 1──* Purchase *──1 Product
Contact 1──* BalanceTest
Contact 1──* Message
Contact 1──* Reminder
Contact 1──* TimelineEvent
Contact 1──* ReviewTask
ImportJob (standalone; produces Contacts on approval)
Automation (singleton rows per automation type)
```

### Tables and key decisions

- **Contact** — the hub. `status` enum (`LEAD | CUSTOMER | INACTIVE`),
  `lastContactedAt` is denormalized (updated whenever a message is sent or a
  manual touch is logged) so "who hasn't heard from me in N days" is a single
  indexed query instead of an aggregate over messages.
- **TimelineEvent** — append-only feed per contact (`type` enum: IMPORTED,
  NOTE, MESSAGE_SENT, PURCHASE, BALANCE_TEST, REMINDER, AI_SUGGESTION, …).
  Purchases/messages/tests also live in their own tables; the timeline event is
  written alongside them by the service layer. Duplication is deliberate: the
  timeline is a *view of history* and must stay cheap to render and stable even
  if source rows are edited.
- **Message** — `status` state machine:
  `DRAFT → PENDING_APPROVAL → APPROVED → SENT` (or `REJECTED`).
  `aiGenerated` flag for analytics. `channel` enum (`SMS | EMAIL | WHATSAPP`).
- **Reminder** — typed (`BIRTHDAY | FOLLOW_UP | BALANCE_TEST | REORDER | CUSTOM`),
  due-dated, with `autoGenerated` provenance.
- **Automation** — one row per rule type with `enabled` + JSON `config`
  (e.g. `{"days": 30}`). The engine reads these rows; turning a rule off is a
  data change, not a deploy.
- **ImportJob** — holds the raw input (text or file reference), the AI's
  `extractedJson`, and `status` (`PENDING_REVIEW | APPROVED | REJECTED`). The
  approval step materializes Contacts; nothing is written to Contact until a
  human approves.
- **ReviewTask** — created when the safety layer flags a conversation
  (e.g. customer asked a medical question). Surfaced on the dashboard.

---

## 3. API Design

All routes under `/app/api`, JSON in/out, Zod-validated at the boundary.
Errors are `{ error: string }` with proper status codes.

| Route | Methods | Purpose |
|---|---|---|
| `/api/contacts` | GET, POST | List (search, status filter, "not contacted in N days"), create |
| `/api/contacts/[id]` | GET, PATCH, DELETE | Profile (incl. timeline, purchases, tests, reminders, AI suggestions) |
| `/api/contacts/[id]/notes` | POST | Add note (writes timeline event) |
| `/api/imports` | GET, POST | List jobs; submit text/photo/PDF/screenshot → AI extraction |
| `/api/imports/[id]` | POST | Approve (creates contacts) or reject, with user-edited data |
| `/api/messages` | GET, POST | List by status; generate AI draft for a contact |
| `/api/messages/[id]` | PATCH | Edit body, approve+send, reject |
| `/api/reminders` | GET, POST, PATCH | Upcoming reminders; complete/dismiss |
| `/api/automations` | GET, PATCH | Rule list, toggle/configure |
| `/api/automations/run` | POST | Evaluate all enabled rules now → creates draft messages + reminders |
| `/api/dashboard` | GET | Aggregated stats for the dashboard |
| `/api/copilot` | POST | Chat turn → answer + proposed actions (drafts created, never sent) |

**Why an explicit `automations/run` endpoint instead of a cron:** the MVP has
no long-lived server guarantee (SQLite, single user). A "Run automations"
action (also triggered on dashboard load, throttled to once per hour) keeps the
behavior deterministic and testable. Swapping in a real scheduler later is a
one-call change.

**Copilot contract:** `POST /api/copilot` runs a Claude tool-use loop with
read tools (`search_contacts`, `get_contact`, `get_due_reminders`) and
propose-only write tools (`draft_message`, `create_reminder`). The response is
`{ reply, actions[] }` where actions reference the draft rows created — the UI
links straight to the approval queue.

---

## 4. AI Layer Design

`src/server/ai/` —

- `provider.ts` — the `AIProvider` interface: `extractContacts(files|text)`,
  `draftMessage(context)`, `copilot(messages, tools)`, `suggestNextAction(contact)`.
- `claude.ts` — Anthropic SDK implementation. Model: `claude-opus-4-8`
  (overridable via `AI_MODEL` env). Uses:
  - **vision + document blocks** for scanned forms, photos, screenshots, PDFs;
  - **structured outputs** (`output_config.format` with a JSON schema mirrored
    by a Zod schema) for extraction — guarantees parseable contact data;
  - **tool use** for the copilot loop.
- `mock.ts` — deterministic fallback (no key required).
- `safety.ts` — guardrails applied to *every* AI call:
  - system-prompt rules: never give medical advice, never diagnose, never
    promise health outcomes;
  - post-generation scan of inbound text for medical questions → creates a
    `ReviewTask` and the draft is replaced with a "suggest consulting a
    healthcare professional" template.

Defense in depth: prompts instruct, but code enforces (approval gate +
ReviewTask creation are service-layer, not model-layer).

---

## 5. UI Design

Apple HIG-inspired: translucent glass cards (`backdrop-blur` + low-alpha
backgrounds), `rounded-2xl`, SF-style system font stack, a single blue accent
(`#0A84FF` family), generous whitespace, subtle fade/slide entrance animations,
full dark-mode via the `dark` class with `prefers-color-scheme` default.
Mobile-first: bottom tab bar on small screens, sidebar on desktop — the iOS
app feel falls out of this naturally.

Screens:

1. **Dashboard `/`** — stat cards (customers, birthdays today, follow-ups due,
   messages awaiting approval), recent imports, upcoming reminders, review
   tasks. Cards animate in with a staggered fade-up.
2. **Contacts `/contacts`** — searchable, filterable list; avatar initials,
   "last contacted" pills with traffic-light coloring.
3. **Contact profile `/contacts/[id]`** — header card with photo/initials and
   quick actions (Call, Text, Email, Reminder, Generate message), then
   timeline, product history, BalanceTest history, notes, upcoming reminders,
   AI suggestion card.
4. **Import `/import`** — drag-and-drop / paste zone → extraction review table
   (editable before approval) → approve.
5. **Approvals `/approvals`** — the outbox: every pending message with channel
   badge, editable body, Approve & Send / Reject.
6. **Automations `/automations`** — rule cards with iOS-style toggles and
   config (days offsets).
7. **Copilot `/copilot`** — chat panel; assistant replies render proposed
   actions as cards linking to the drafts it created.

Component kit in `src/components/ui`: `GlassCard`, `Button`, `Badge`, `Toggle`,
`Avatar`, `Input`, `EmptyState`, `StatCard` — small, dependency-free, Tailwind
only.

---

## 6. Folder Structure

```
zinzino-connect-ai/
├── docs/ARCHITECTURE.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  # rich demo data so the app demos instantly
├── src/
│   ├── app/
│   │   ├── layout.tsx           # shell: sidebar/tab bar, dark mode
│   │   ├── globals.css          # Tailwind v4 theme tokens, animations
│   │   ├── page.tsx             # dashboard
│   │   ├── contacts/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── import/page.tsx
│   │   ├── approvals/page.tsx
│   │   ├── automations/page.tsx
│   │   ├── copilot/page.tsx
│   │   └── api/                 # route handlers (thin)
│   ├── components/
│   │   ├── ui/                  # design-system primitives
│   │   └── ...feature components
│   ├── server/
│   │   ├── db.ts                # Prisma singleton
│   │   ├── ai/                  # provider abstraction (claude, mock, safety)
│   │   ├── messaging/           # provider abstraction (log, twilio stub, email stub)
│   │   └── services/            # all business logic
│   └── lib/                     # shared utils (dates, json fields, formatting)
├── .env.example
└── package.json
```

**Why `src/server` is separate from `src/app/api`:** route files are wiring;
services are the product. This split keeps the Postgres/standalone-API
migration path open and makes services unit-testable without HTTP.

---

## 7. Safety Model (summary)

1. **No autonomous sends.** Message service refuses `SENT` transitions except
   from `APPROVED`, and approval is a user-only API action.
2. **No medical advice.** System prompts forbid it; the safety scanner flags
   medical questions in inbound/context text, creates a `ReviewTask`, and
   substitutes a safe referral template.
3. **Import approval.** Extracted contacts are staged in `ImportJob` and only
   materialized on explicit approval, with user edits applied.

---

## 8. Phase 2 seams (already in place)

- Postgres: datasource swap, JSON-string fields → `Json` columns.
- Twilio/email: implement the existing `MessagingProvider` interface.
- Scheduler: point a cron at `POST /api/automations/run`.
- Teams/multi-user: add `User`/`Team` tables; every query already funnels
  through services where a tenant filter slots in.
- Push notifications, calendar sync, voice notes: new services + adapters,
  same pattern.
