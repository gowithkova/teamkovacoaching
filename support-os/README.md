# KOVA Support OS

A mobile-first operating system for a solo independent Australian support
worker: pipeline, calendar, service delivery and money in one place. Built
from `KOVA_SUPPORT_OS_MASTER_BLUEPRINT.md` — see that document for the full
product specification, business rules and regulatory assumptions this app
encodes.

**Current stage: Gate 2 in progress.** Gate 1 (clickable synthetic
prototype — every figure, name and rate invented) is done. Gate 2 is adding
real auth + Postgres persistence screen by screen. **Leads, Clients,
Calendar and Sessions are now fully backed by Supabase + Postgres with
row-level security** — see "Gate 2 setup" below. **Money, Documents and
Settings are still Gate 1's in-memory synthetic data** (this matches the
blueprint's own Gate 2 scope — invoicing and document storage land in
Gates 3–4), and every screen sits behind the same login. See
`docs/DECISIONS.md` for the migration plan and what's deliberately
transitional about this in-between state.

The app's own schema has been verified directly against a real local
Postgres (RLS, triggers, functions — see `docs/DECISIONS.md`), but **not
yet against the live Supabase project** — this session's sandbox blocks
outbound network access to `*.supabase.co`. Apply `supabase/schema.sql` via
your project's own SQL editor and the real round-trip (signup, login, every
Server Action) still needs to be exercised against the live project before
trusting it with real client data.

## What's here

- **Today** — command centre: next visit, this week's money, a computed
  "do next" priority queue (blockers → today's service → money → leads →
  admin), confirmed vs proposed income forecast, a 4-day calendar strip.
- **Leads** *(persisted — Supabase + RLS)* — pipeline across NDIS/Support at
  Home/private-pay/provider prospects, a 100-point fit rubric
  (commercial/logistics only, never protected traits), advertised/proposed/
  agreed rate kept visibly distinct, copy-first message templates.
  Convert-to-client now writes a real client + engagement via the
  `convert_lead_to_client` Postgres function and navigates to the new
  client record.
- **Clients** *(persisted — Supabase + RLS)* — engagement readiness
  (red/amber/green) with explicit blockers, approved vs excluded scope,
  contacts, schedule, sessions & notes. Invoices and safety/incidents tabs
  show explanatory placeholder text — those stay on Gate 1 data until the
  Money (Gate 3) and Documents & Safety (Gate 4) migrations.
- **Calendar** *(persisted — Supabase + RLS)* — list and week views,
  recurring availability blocks (parenting / other employment / personal /
  unavailable), live conflict detection against both other sessions and the
  operator's own blocked time — a proposed booking that clashes is never
  shown as confirmable.
- **Sessions** *(persisted — Supabase + RLS)* — the live-session flow:
  pre-visit brief → start → a 60-second guided note → complete, via the
  atomic `complete_session_with_note` Postgres function. Includes
  cancellation recording and a "report a concern" quick action (still
  writes to the Gate 1 store — incidents land with Gate 4). Draft-invoice
  creation shows a "lands with Gate 3" placeholder instead of linking to
  Gate 1's synthetic invoices.
- **Money** — this week's earned/invoiced/received/overdue, a 4-week
  forecast split by funding lane, an ageing table, a price book that keeps
  NDIS schedule caps, a provider's retail price and the operator's actually
  agreed rate in clearly separate fields, a quoted-value/effective-hourly-rate
  calculator, and an invoice builder (draft → approve → issue → payments).
- **Documents & Safety** — credential vault with expiry status, incident
  register. Full secure upload lands in Gate 4.
- **Settings** — business profile, an adjustable (never hard-coded) weekly
  income target, privacy screen toggle.

## Business rules enforced in this prototype

- Four funding lanes (Support at Home subcontractor / NDIS / private-pay /
  premium private) stay structurally separate — a client has exactly one
  lane and one contracted payer.
- A registered provider's advertised retail price is never used as the
  worker's rate; the two are separate fields everywhere they appear.
- An engagement cannot be marked "ready" while it has open blockers
  (e.g. missing provider approval); the UI surfaces the blocker and the
  session screen refuses to let you create an invoice until it's resolved.
- Calendar conflict detection checks proposed/tentative/confirmed sessions
  against each other *and* against the operator's own availability blocks,
  including travel buffers — see `src/lib/conflicts.ts`.
- Money is integer cents throughout (`src/lib/money.ts`); confirmed and
  proposed revenue are always kept in separate fields, never summed into
  one "income" number.
- Invoice totals/paid/outstanding are always derived from `lines` and
  `payments` (`src/lib/invoicing.ts`), never stored as a separate mutable
  total that could drift.

## Gate 2 setup (required — the app now needs auth to load at all)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open its SQL editor and run the contents of `supabase/schema.sql` —
   this creates every Gate 2 table, enables RLS scoped to
   `owner_id = auth.uid()` on each one, and sets up the
   auto-create-profile-on-signup trigger.
3. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Project Settings → API.
4. `npm run dev`, then visit `/signup` once to create your single operator
   account (this is not a public signup page — see `docs/DATA_PRIVACY.md`).
   You'll land on `/today`.

The schema itself has been verified directly against a real local
Postgres — RLS cross-account isolation, the signup trigger, check
constraints, cascading deletes and the service-notes no-update guard were
all exercised and passed (`docs/DECISIONS.md` has the detail). What has
**not** been verified yet is the live round-trip through Supabase's actual
Auth + PostgREST services, since that needs a real project.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000 — needs .env.local, see above
npm run build    # production build
npm run lint
npx tsc --noEmit # typecheck
npm test         # unit tests — don't need Supabase credentials
```

## Known limitations (by design, for this gate)

- Leads, Clients, Calendar and Sessions are persisted. Money, Documents and
  Settings are still Gate 1's in-memory synthetic data — don't treat
  anything you enter there as saved, and expect it to reset on reload.
- A new account's data starts genuinely empty (no synthetic seed data ships
  into a real database) — `supabase/seed.sql` has optional synthetic demo
  rows if you want something to look at.
- There is also a comprehensive Google Sheets companion
  (`KOVA Support OS — Data Tracker`) mirroring every Gate 2 table 1:1,
  built as an interim workaround while the live Supabase project was being
  set up. It is **not wired to the app** — see its README tab — and should
  not be treated as a second source of truth once the live database is in
  regular use.
- No PDF/CSV export yet (Money → Invoices has the data model ready for it).
- Credential/document files aren't actually uploaded anywhere.
- Day-view calendar was folded into List view (which already groups by day)
  rather than building a third near-duplicate view — see DECISIONS.md.
- Travel time is never computed live; it's a manual/editable estimate by
  design (the blueprint explicitly prohibits inventing real-time routing).

## Repository layout

```
src/
  app/(app)/...        route group: Today, Leads, Clients, Calendar,
                        Sessions, Money, Documents, Settings
  components/
    shell/              nav, top summary bar, quick-add
    ui/                 hand-built accessible primitives (no external UI kit)
    leads/ clients/ calendar/ sessions/ money/ today/ shared/
  lib/
    types.ts            domain types (mirrors blueprint §8, simplified)
    fixtures.ts         SYNTHETIC seed data only (still backs Money/Docs/Settings)
    store.tsx           in-memory React context + mutators (Money/Docs/Settings only)
    db/                 "use server" data-access layer — Supabase reads + Server Action mutations
    supabase/           browser/server/middleware Supabase clients + generated types
    dates.ts money.ts   Brisbane-time and integer-cent helpers
    invoicing.ts forecast.ts conflicts.ts priority.ts leadFit.ts templates.ts
supabase/
  schema.sql seed.sql   Postgres schema (tables, RLS, triggers, functions) + optional demo data
docs/
  DECISIONS.md DATA_PRIVACY.md REGULATORY_ASSUMPTIONS.md TEST_PLAN.md
```

## Next gates

See `docs/TEST_PLAN.md` and the blueprint's §14 for the full gate list.
Gate 2 adds real auth, Postgres + RLS and persistence for everything this
prototype currently only holds in memory — Leads, Clients, Calendar and
Sessions are done; Money and Documents & Safety are next (Gates 3–4).
