# Data privacy

This app is designed, from Gate 1 onward, as if it will eventually hold
health-adjacent information about real people (support-work clients), even
though **nothing in this Gate-1 build stores anything beyond a browser
tab's in-memory React state**. This document describes the target posture
and what's actually true today.

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

## Current state (Gate 1)

- **No persistence.** `src/lib/store.tsx` is a plain React context backed
  by `useState`. Closing the tab or reloading loses everything. Nothing is
  written to `localStorage`, a database, or any network request.
- **No authentication.** There is no login; anyone with the URL who opens
  the deployed Gate-1 build sees the synthetic demo data. This is
  acceptable only because the data is 100% synthetic (see
  `src/lib/fixtures.ts`'s header comment) — it must not be true once real
  client data is involved.
- **No analytics, no logging of content.** No client-side analytics SDK is
  installed. The dev server's own request logs are standard Next.js access
  logs (method/path/status), not application data.
- **No outbound network calls carry client data.** The only outbound link
  this app opens is a Google Maps search by *suburb name* (Today's
  "Directions" button) — never a full address, never a client name.

## Target state (from Gate 2 — see blueprint §10)

- Authenticated access only, MFA supported, no shared logins.
- PostgreSQL Row Level Security scoping every row to the authenticated
  operator, tested server-side (not just hidden in the UI).
- TLS in transit, managed encryption at rest, encrypted object storage for
  documents; time-limited signed URLs for any document download.
- Client medical/health detail, addresses, banking details and incident
  narratives never logged to analytics, error trackers, terminals, or sent
  to an external AI model by default.
- Append-only audit trail on invoice issuance, document access, status
  approvals, note corrections and incident updates.
- A documented retention/deletion policy, reviewed against Australian
  Privacy Act obligations before go-live (see `REGULATORY_ASSUMPTIONS.md`
  item 9).
- Demo/seed data stays synthetic forever — `fixtures.ts` must never be
  swapped for a real export "just for testing".

## Retention & deletion

Not yet applicable — there is nothing to retain or delete in Gate 1. This
section will be filled in once Gate 2 introduces a real database, informed
by a proportionate legal review as the blueprint requires.
