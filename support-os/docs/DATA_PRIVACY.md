# Data privacy

This app is designed, from Gate 1 onward, as if it will eventually hold
health-adjacent information about real people (support-work clients). As of
Gate 2 (in progress), Leads, Clients, Calendar and Sessions are backed by a
real database with row-level security; Money, Documents and Settings still
only hold synthetic, in-memory data. This document describes the target
posture and what's actually true today.

## Classification

- **Sensitive**: client support briefs, exclusions, emergency instructions,
  incident records, any future uploaded documents, credential files.
- **Business-confidential**: rates, invoices, provider relationships, lead
  pipeline.
- **Not collected**: diagnoses, NDIS plan PDFs, broad medical history,
  financial statements — the data model (`src/lib/types.ts`,
  `SupportBrief`) deliberately only has room for a minimum-necessary
  approved/excluded activity list and a short instruction string, per
  blueprint §5.3's minimal-data rule.

## Current state (Gate 2, in progress)

- **Leads, Clients, Calendar and Sessions are persisted; Money, Documents
  and Settings are not.** Leads, organisations, clients, contacts,
  engagements, availability blocks, sessions and service notes live in
  Postgres behind Supabase, scoped by Row Level Security to
  `owner_id = auth.uid()` — see `supabase/schema.sql` and the RLS
  verification notes in `docs/DECISIONS.md`. Money, Documents and Settings
  are still `src/lib/store.tsx`, a plain React context backed by
  `useState`: closing the tab or reloading loses that data, and nothing
  there is written to `localStorage`, a database, or any network request.
  Two screens straddle the boundary deliberately: on Clients, the invoices
  and safety/incidents tabs show placeholder text rather than fixture data
  that can't match a real client's UUID; on Sessions, "report a concern"
  still writes to the Gate 1 incident store (harmless, since incidents
  aren't persisted anywhere yet either way) and draft-invoice creation is
  a placeholder until Money is migrated.
- **Authentication is now required for every screen.** `src/proxy.ts` +
  `src/lib/supabase/middleware.ts` redirect any unauthenticated request to
  `/login`, regardless of whether the destination screen's own data is
  real or still synthetic. `/signup` creates the single operator account —
  it is not a public signup flow (see blueprint §5: "No public signup...
  in V1") and should not be linked from anywhere public-facing.
- **RLS, not just UI logic, enforces per-owner isolation** on every
  Gate 2 table. This was verified directly against a real (local) Postgres
  instance before being trusted: a second simulated account could not see,
  update, or delete the first account's rows — see `docs/DECISIONS.md` for
  the specific checks run.
- **No analytics, no logging of content.** No client-side analytics SDK is
  installed. Server Actions don't log request bodies; Supabase's own
  server-side logs are outside this app's control — review Supabase's own
  logging/retention settings before putting real client data in.
- **No outbound network calls carry client data.** The only outbound link
  this app opens is a Google Maps search by *suburb name* (Today's
  "Directions" button) — never a full address, never a client name.
- **The Google Sheets companion holds synthetic data only.** Built as an
  interim workaround while the live Supabase project was being provisioned,
  `KOVA Support OS — Data Tracker` mirrors the Gate 2 schema 1:1 but is
  seeded only from `supabase/seed.sql`'s synthetic rows and is not wired to
  the app or written to by it. It must never be used to store real client
  data — once the live database is in regular use it should be treated as
  a disposable reference, not a second system of record.
- **The live Supabase project's credentials have not touched this app's
  committed history.** The project's secret (service-role) API key was
  shared in chat during setup and was never written to any file, committed
  or not. Only the project URL and the publishable (anon) key — safe for
  browser use under RLS — were ever placed in `.env.local`, which is
  git-ignored (`.env*` in `.gitignore`, with `.env.example` as the only
  tracked exception). That file was later deleted from this session's
  working copy once it became clear the sandbox's network policy blocks
  outbound calls to `*.supabase.co` anyway, so there was no reason to leave
  credentials on disk unused.

## Target state (full Gate 2+ — see blueprint §10)

- MFA support (not yet wired up — Supabase Auth supports TOTP MFA
  natively; enabling it is a Gate 2 follow-up, not blocked on anything
  built so far).
- TLS in transit, managed encryption at rest, encrypted object storage for
  documents; time-limited signed URLs for any document download (Gate 4).
- Client medical/health detail, addresses, banking details and incident
  narratives never logged to analytics, error trackers, terminals, or sent
  to an external AI model by default.
- Append-only audit trail on invoice issuance, document access, status
  approvals, note corrections and incident updates. `service_notes` already
  has a taste of this — its RLS policy only grants `select`/`insert`, no
  `update`/`delete`, so a written note cannot be silently edited through
  the API. A full audit log table is still Gate 4.
- A documented retention/deletion policy, reviewed against Australian
  Privacy Act obligations before go-live (see `REGULATORY_ASSUMPTIONS.md`
  item 9).
- Demo/seed data stays synthetic forever — `fixtures.ts` and
  `supabase/seed.sql` must never be swapped for a real export "just for
  testing".

## Retention & deletion

Not yet applicable to the still-in-memory screens. For Leads: no retention
policy is implemented yet — rows persist indefinitely until manually
deleted via Supabase. A documented policy, informed by a proportionate
legal review, is still owed before any real client data goes in (see
`REGULATORY_ASSUMPTIONS.md` item 9).
