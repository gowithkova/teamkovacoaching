# Architecture & product decisions

Short log of decisions and tradeoffs, not an essay. Dated entries, newest
last.

## 2026-10-12 — Repo placement

Built inside `gowithkova/teamkovacoaching` (the existing KOVA marketing-site
repo) at `/support-os`, as a sibling to the static marketing `index.html`,
rather than a new repo. Chosen by the product owner over creating a
dedicated `kova-support-os` repo. Kept as an independently deployable
subdirectory (own `package.json`, own Vercel project root) so the live
marketing site is untouched.

## 2026-10-12 — Gate 1 has no backend by design

The blueprint's own Gate 1 pass criteria ("clickable, synthetic
demonstration... no live data") argue against standing up Supabase/Postgres
this early. State lives in a single React context (`src/lib/store.tsx`)
seeded from `fixtures.ts`, with plain `useState` — no `localStorage`
persistence. Rationale: fixture dates are computed relative to "today" at
module load (`src/lib/dates.ts`), so persisting a stale snapshot across days
would silently corrupt the demo (a "today" session would quietly become
"yesterday"). Resetting on reload is an explicit, documented tradeoff for
this gate, not an oversight.

## 2026-10-12 — Hand-built UI primitives, no component library

Blueprint suggests shadcn/ui. The `shadcn` CLI needs a registry fetch and a
build-time wizard; for a handful of primitives (Button, Card, Badge, Tabs,
Modal, Field) hand-written Tailwind + semantic HTML + ARIA is less surface
area and no extra dependency. Native `<dialog>` is used for Modal — free
focus trap, Esc-to-close and backdrop.

## 2026-10-12 — Calendar: List + Week, not List + Week + Day

The blueprint asks for day/week/list views. List view already groups
sessions by day with full detail, so a dedicated single-day view would be
~90% the same code rendering one day instead of many. Shipped List (default,
mobile-first agenda) and Week (7-day grid) and skipped the third view rather
than building a near-duplicate. Revisit if real use shows people specifically
want a single-day focused view.

## 2026-10-12 — Session note fields follow the data model, not the UI copy

Blueprint §5.6 lists five note prompts (Activities / Participation /
Changes / Actions / Client feedback) but §8.10's `service_notes` schema has
four columns (`activities`, `participant_response`, `factual_observations`,
`next_steps`). Followed the schema: "client feedback if appropriate" is
folded into the Participation/response field's label and placeholder text
rather than adding a fifth stored column with no home in the data model.

## 2026-10-12 — Cents-flat rate vs hourly rate must be explicit per engagement

`engagement.rateUnit` is `"hour"` or `"visit"`. Found and fixed two bugs
during Gate 1 build where a per-visit flat rate (M. Tran, $85/visit) was
being silently multiplied by session duration as if it were hourly —
once in the seed invoice fixtures, once in the live
`createDraftInvoiceFromSessions`/`forecastByLaneCents` calculation path.
Both now branch on `rateUnit`. This is exactly the kind of billing-math bug
the blueprint's acceptance tests are designed to catch — worth a note here
so Gate 3 doesn't reintroduce it when wiring a real price book.

## 2026-10-12 — Priority queue is computed, not a stored task list

`src/lib/priority.ts` derives the "Do next" queue from live data
(credentials, engagement blockers, calendar conflicts, unsent invoices,
overdue ageing, lead follow-ups due) every render, sorted into the
blueprint's five tiers and capped to 5. Nothing about "what needs doing" is
hand-authored in fixtures — it falls out of the same data every other
screen reads, so marking a session reviewed or issuing an invoice
immediately changes the queue without extra wiring.

## 2026-10-12 — Fixture schedule is weekday-anchored, not offset-anchored

Early fixtures put recurring sessions at fixed day-offsets from "today"
(e.g. "today, +2, +4"). Found during visual QA that this silently produces
different, sometimes colliding, weekdays depending on what day the demo
happens to be viewed — on a Monday it accidentally put two different
clients' sessions in the same hour. Every recurring client session is now
pinned to an actual weekday (`nextDayOffsetForWeekday`) with a
time-of-day slot chosen so no two clients' weekday+time combinations (and
none of the operator's own recurring availability blocks) can ever overlap,
regardless of which real-world day the app is opened on. The one deliberate
exception is the Saturday prospect-booking-vs-"Family day" conflict, which
exists specifically to demonstrate the blueprint's Example D.
