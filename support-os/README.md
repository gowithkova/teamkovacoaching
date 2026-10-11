# KOVA Support OS

A mobile-first operating system for a solo independent Australian support
worker: pipeline, calendar, service delivery and money in one place. Built
from `KOVA_SUPPORT_OS_MASTER_BLUEPRINT.md` — see that document for the full
product specification, business rules and regulatory assumptions this app
encodes.

**Current stage: Gate 1 — clickable, synthetic demonstration.** Every
figure, name, suburb and rate on screen is invented. There is no backend,
no authentication and no persistence yet — the app holds its data in memory
for the browser tab's lifetime and resets on reload. See `docs/DECISIONS.md`
for what's deliberately deferred to Gate 2 onward.

## What's here

- **Today** — command centre: next visit, this week's money, a computed
  "do next" priority queue (blockers → today's service → money → leads →
  admin), confirmed vs proposed income forecast, a 4-day calendar strip.
- **Leads** — pipeline across NDIS/Support at Home/private-pay/provider
  prospects, a 100-point fit rubric (commercial/logistics only, never
  protected traits), advertised/proposed/agreed rate kept visibly distinct,
  copy-first message templates, convert-to-client.
- **Clients** — engagement readiness (red/amber/green) with explicit
  blockers, approved vs excluded scope, contacts, schedule, sessions &
  notes, invoices, safety.
- **Calendar** — list and week views, recurring availability blocks
  (parenting / other employment / personal / unavailable), live conflict
  detection against both other sessions and the operator's own blocked
  time — a proposed booking that clashes is never shown as confirmable.
- **Sessions** — the live-session flow: pre-visit brief → start → a
  60-second guided note → complete → (if the engagement is actually ready)
  create a draft invoice. Includes cancellation recording and a "report a
  concern" quick action that opens a factual incident record.
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

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
npx tsc --noEmit # typecheck
```

No environment variables are required yet — see `.env.example` for what
Gate 2 (Supabase auth + Postgres) will need.

## Known limitations (by design, for this gate)

- No auth, no database — data is synthetic, in-memory, and resets on
  reload. Don't treat anything you enter as saved.
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
    fixtures.ts         SYNTHETIC seed data only
    store.tsx           in-memory React context + mutators (no backend yet)
    dates.ts money.ts   Brisbane-time and integer-cent helpers
    invoicing.ts forecast.ts conflicts.ts priority.ts leadFit.ts templates.ts
docs/
  DECISIONS.md DATA_PRIVACY.md REGULATORY_ASSUMPTIONS.md TEST_PLAN.md
```

## Next gates

See `docs/TEST_PLAN.md` and the blueprint's §14 for the full gate list.
Gate 2 adds real auth, Postgres + RLS and persistence for everything this
prototype currently only holds in memory.
