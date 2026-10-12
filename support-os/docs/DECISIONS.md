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

## 2026-10-12 — Gate 2 architecture: Server Components + Server Actions, not a client store

Gate 1's `DataStoreProvider` (client-side React context + `useState`) was
the right call for a backend-less synthetic prototype, but it's the wrong
foundation for real persistence — a client-side global store fed by
client-side Supabase calls would mean every screen re-fetches on mount,
loses the benefit of server-side rendering, and has to hand-roll its own
cache invalidation. Gate 2 instead follows the blueprint's own suggested
stack: pages that need real data become `async` Server Components that
fetch via `src/lib/supabase/server.ts`; mutations are Server Actions
(`"use server"` modules under `src/lib/db/`) that write to Supabase and
call `revalidatePath` so the next render picks up fresh data. Client
components stay responsible only for interactivity (tabs, forms, optimistic
pending state via `useTransition`), not for owning the data.

This means a screen is migrated or it isn't — there's no in-between where
part of a screen reads the old store and part reads Postgres for the *same*
entity. Leads is now fully on the new pattern; every other screen is fully
on the old one. See the next two entries for what that split currently
costs.

## 2026-10-12 — Leads-only migration leaves a known, bounded inconsistency

Converting a lead to a client is disabled in the UI (`LeadDetailClient`'s
"Convert to client" button), not implemented against the old in-memory
store. The alternative — writing the new client into `useStore()`'s fixture
array — would create a persisted Postgres lead pointing at a client that
exists only in one browser tab's memory, which is worse than not offering
the feature yet. It comes back once Clients is also migrated.

Today's priority queue, income forecast and the top summary bar still read
leads from `useStore()` (Gate 1 fixtures), not the real `leads` table —
so a lead created or updated via the new Postgres-backed Leads screens
will not yet show up in Today's "follow up this lead" tasks. This is a
deliberate, bounded scope decision for the reference-implementation slice,
not an oversight: Today pulls data from six Gate-1 entities
(sessions/engagements/clients/leads/invoices/credentials), and migrating
just its lead-sourced tasks while the other five stay on fixtures would be
more confusing than leaving all of Today on Gate 1 until the broader
migration (task: "Migrate Clients, Calendar, Sessions") lands and Today can
move over as a whole.

## 2026-10-12 — Schema verified directly against Postgres; live Supabase round-trip still unverified

`supabase/schema.sql` was run against a real local PostgreSQL 16 instance
(not just read for syntax), with Supabase's `auth.users`/`auth.uid()`
stood in by a minimal stub (`stub_auth.sql`, not committed — a throwaway
test fixture) and the `authenticated` role granted the same table
privileges Supabase grants by default, so RLS was exercised for real, not
assumed. Checks that actually ran and passed:

- The `handle_new_user` trigger auto-creates an `operator_profiles` row on
  signup, and picks up `trading_name` from signup metadata when present.
- Two simulated accounts: account B sees zero of account A's rows across
  every table, including `operator_profiles` — RLS cross-account isolation
  holds, not just "looks right" on paper.
- `service_notes` has no UPDATE policy: an UPDATE from the owning account
  affects 0 rows and the original text survives — the "can't tamper with a
  written note" guarantee is enforced at the database, not just hidden in
  the UI.
- The `planned_end > planned_start` CHECK constraint actually rejects a
  backwards session.
- Deleting a client cascades correctly through engagements → sessions →
  service_notes, under RLS (not just as the bypassing table owner).
- `append_lead_activity(uuid, text)` appends atomically and in order
  under the `authenticated` role, with `last_contact_at` updated alongside.

What this does **not** cover: the actual Supabase Auth (GoTrue) sign-up/
sign-in flow, or the real PostgREST HTTP layer that `@supabase/supabase-js`
talks to — Docker is unavailable in this environment (the daemon can't
start under the sandbox's restrictions), which ruled out running the full
local Supabase stack (`supabase start`) to test those end-to-end. The
`src/lib/supabase/{client,server,middleware}.ts` files follow the same
pattern already proven working in the sibling `pt-readiness-scorecard`
repo's Family Wizard app (same org, same stack), which is meaningful but
not a substitute for testing this project's own schema against it. This is
the reason Gate 2 paused after the Leads slice: verify the live round-trip
on one screen with real credentials before replicating the same schema/RLS
pattern across Clients, Calendar and Sessions.

## 2026-10-12 — Clients, Calendar and Sessions migrated to the same Server
Component + Server Action pattern as Leads

Followed the reference pattern established for Leads exactly, rather than
inventing a second approach: `src/lib/db/{clients,engagements,contacts,
availability,sessions,serviceNotes}.ts` as `"use server"` modules, pages
rewritten as `async` Server Components, client components adapted
case-by-case —

- `ClientDetailClient` and the Clients/Sessions list pages had no real
  interactivity of their own and dropped `"use client"` entirely, taking
  typed props instead of `useStore()`.
- `CalendarClient` and `SessionDetailClient` genuinely need client-side
  state (view toggle, week navigation, note draft, pending transitions) and
  stayed client components, but now source their initial data from
  server-fetched props instead of the old store.

`LeadDetailClient`'s "Convert to client" button is re-enabled, calling the
`convert_lead_to_client` Postgres function and navigating to the resulting
client record — the inconsistency flagged in the previous entry is now
closed.

Two deliberate, bounded leftovers from this slice (not oversights):

- On Clients, the Invoices and Safety(incidents) tabs now show "lands with
  Gate 3/4" placeholder text instead of reading Gate 1's fixture invoices/
  incidents — those fixtures reference Gate 1's fixture client IDs, which
  don't exist as real UUIDs, so cross-referencing them would be actively
  wrong, not just incomplete.
- On Sessions, "report a concern" still calls `useStore().addIncident` —
  harmless, since incidents aren't persisted anywhere yet regardless of
  which store they land in — and draft-invoice creation was replaced with
  the same kind of placeholder text, since invoicing isn't linked to real
  sessions until the Money migration (Gate 3).

Today's priority queue, income forecast and top summary bar remain on
Gate 1 fixtures entirely (per the previous entry's reasoning) — they still
don't reflect real leads, clients or sessions. That migration is deferred
until Money is also on the new pattern, so Today can move as a whole
rather than partially.

## 2026-10-12 — Mid-session credential handling: secret key never persisted,
`.env.local` deleted once proven unreachable

The user pasted a live Supabase project's full settings screen into chat,
including the project's secret (service-role) API key. That key was never
written to any file in this session, committed or not — only the project
URL and the publishable (anon) key went into `.env.local` (git-ignored via
the existing `.env*` rule, confirmed with `git check-ignore -v`). Once it
became clear this sandbox's egress policy blocks outbound connections to
`*.supabase.co` (see the next entry), `.env.local` served no purpose here
and was deleted rather than left on disk. This wasn't an explicit user
instruction — it's the standing rule applied by default and worth
recording so it isn't re-litigated: the secret key must never be written
anywhere, and credential files should not be kept once they're unusable in
the current environment.

## 2026-10-12 — Live Supabase verification blocked by sandbox network policy

`curl https://dmjyouwkvrwwohkxdehu.supabase.co/auth/v1/health` returned
`CONNECT tunnel failed, response 403` — confirmed via the proxy's status
endpoint as a deliberate `connect_rejected` policy decision (this cloud
environment's Network access setting), not a transient failure. Docker is
also unavailable in this sandbox (`service docker start` fails with a
`ulimit` permission error), which ruled out running a full local Supabase
stack as a substitute. The schema was instead verified against genuine
local Postgres + RLS (see the earlier verification entry) — real, but not
a substitute for exercising Supabase's actual Auth and PostgREST layers.

Two independent next steps, neither blocked on the other:

1. The user can apply `supabase/schema.sql` via their own project's SQL
   editor at any time — this doesn't need this session's network access.
2. If live verification from this session is wanted, the environment's
   Network access level needs widening (or `*.supabase.co` added to
   Allowed domains) from the environment settings, not from inside the
   session.

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
