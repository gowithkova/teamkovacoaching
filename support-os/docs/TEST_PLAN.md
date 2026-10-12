# Test plan

## How to run everything

```bash
npm install
npx tsc --noEmit   # typecheck — zero errors required
npm run lint       # eslint — zero warnings required (--max-warnings 0 in CI)
npm test           # unit tests (node:test via tsx) — tests/unit/*.test.ts
npm run build      # production build — must succeed with no prerender errors
```

All four currently pass clean on this build.

## Unit tests (`tests/unit/`)

26 tests across money math, invoice totals/ageing, revenue forecasting and
calendar conflict detection — the parts of the blueprint's acceptance
tests (§15) that are pure functions and don't need a browser:

- `money.test.ts` — `formatCents`/`sumCents`/`hoursToCents`, including the
  literal "2 hours at $95/h = $190" and "7h Sunday NDIS shift =
  $934.50 (hypothetical only)" acceptance examples.
- `invoicing.test.ts` — the literal "$570 total / $380 paid / $190
  outstanding" acceptance example; a draft invoice is never counted as
  outstanding; ageing bucket boundaries (0-7/8-14/15-30/30+); effective
  hourly rate including the divide-by-zero guard.
- `forecast.test.ts` — hourly vs per-visit engagement revenue (the exact
  class of bug found and fixed during this build, see `DECISIONS.md`);
  confirmed/proposed/excluded session classification.
- `conflicts.test.ts` — direct double-booking, insufficient travel buffer,
  safe back-to-back bookings, and the blueprint's Example D (a proposed
  booking against the operator's own "unavailable" block is flagged, never
  shown as conflict-free); cancelled/no-show sessions are excluded from
  conflict checks.
- `leadFit.test.ts` — the 100-point rubric sums correctly; an unscored
  lead returns `null`, never a fabricated 0; the rubric's own field set
  contains no medical/protected-trait keys.

## Browser/manual smoke check (this session's verification)

Run `npm run dev`, then at both 390px (mobile) and 1440px (desktop) widths,
confirmed:

- [x] Today shows next visit, this week's confirmed money, and the top
  "do next" item within the blueprint's 60-second pass criterion (Gate 1).
- [x] Mobile bottom nav (Today/Leads/Calendar/Money/More) and the
  floating "+" quick-add work; "More" opens Clients/Sessions/
  Documents/Settings.
- [x] Leads: pipeline tab, Providers tab, Declined tab; lead detail shows
  fit rubric, advertised/proposed/agreed rate kept in separate rows, status
  change, templates with working "copy to clipboard".
- [x] Clients: 8-tab detail (Overview/Service/Contacts/Schedule/
  Sessions & notes/Invoices/Documents/Safety); approved scope in green,
  excluded scope in red.
- [x] Calendar: List and Week views; the Saturday prospect booking against
  the recurring "Family day" block is visibly flagged as a conflict.
- [x] Sessions: live-session flow (confirm → start → 60-second note →
  complete); invoice creation is blocked with an explanation when the
  engagement has an open readiness blocker, and allowed when it's green.
- [x] Money: this-week stats, 4-week forecast by funding lane, ageing
  table: invoice detail modal shows the $570/$380/$190 example correctly;
  recording a payment updates status (part-paid → paid) live.
- [x] Documents & Safety: credential vault status colours (valid / expiring
  soon / expired / pending); incident register.
- [x] Settings: weekly target and privacy-screen toggle are editable, not
  hard-coded.

Screenshots from this pass aren't committed to the repo (they're
throwaway verification artifacts, not product assets) — rerun `npm run
dev` and click through to reproduce.

## Deliberately not yet tested (because not yet built)

- Anything requiring auth, a database, or persistence — Gate 2.
- RLS / cross-account isolation — Gate 4, once there's a database to scope.
- PDF/CSV export — not implemented yet.
- End-to-end/browser automation (Playwright) — worth adding once Gate 2
  gives the app real, stable state to assert against; before that, every
  "journey" test would really just be testing the in-memory fixture data.

## Gate 3 pass-criteria readiness

The blueprint's Gate 3 pass criterion — "Invoice values match precise test
fixtures, and paid/unpaid/forecast do not get mixed up" — is already
exercised by `invoicing.test.ts` and `forecast.test.ts` against the exact
numbers in the blueprint's own acceptance tests (§15), ahead of Gate 3's
real price-book wiring. Keep these tests green when Gate 3 replaces the
fixture price book with a persisted one.
