# Regulatory assumptions

**This is product-development guidance carried over from the blueprint —
not legal, accounting or registration advice.** Every figure below is
reproduced from the brief supplied to this build (`KOVA_SUPPORT_OS_MASTER_
BLUEPRINT.md`, dated 12 October 2026) and has not been independently
re-verified by this coding session. Treat every row as "needs a human to
check the live source before this is relied on commercially" — that is the
entire point of this file.

| # | Assumption | Source (as supplied) | Checked | Status |
|---|---|---|---|---|
| 1 | NDIS 2026–27 pricing schedule effective 24 Sep 2026; weekday daytime community access $73.58/h (`04_104_0125_6_1`), weekday evening $81.07/h (`04_103_0125_6_1`), Saturday $103.54/h (`04_105_0125_6_1`), Sunday $133.50/h (`04_106_0125_6_1`) | https://www.ndis.gov.au/providers/pricing-and-payments/pricing/pricing-arrangements | Not independently re-verified this session | **Needs human verification before live use** |
| 2 | Only self-/plan-managed participants can generally use unregistered providers, subject to services requiring registration | https://www.ndiscommission.gov.au/provider-registration/about-registration | Not independently re-verified | **Needs human verification** |
| 3 | NDIS Code of Conduct applies to registered and unregistered workers | https://www.ndiscommission.gov.au/rules-and-standards/ndis-code-conduct | Not independently re-verified | **Needs human verification** |
| 4 | Support at Home: registered provider remains responsible for engaged third-party services even where the participant self-manages | https://www.health.gov.au/our-work/support-at-home/delivering-services-for-support-at-home/services-under-support-at-home | Not independently re-verified | **Needs human verification** |
| 5 | Support at Home price caps planned for July 2026 were paused; providers set their own reasonable, transparent, all-inclusive price, which is *not* the subcontractor's fee | https://www.myagedcare.gov.au/news-and-updates/new-consumer-protections-support-home-services ; https://www.health.gov.au/our-work/support-at-home/charging-for-support-at-home-services/prices-for-support-at-home-participants | Not independently re-verified | **Needs human verification** |
| 6 | Self-managed third-party overhead referenced as up to 10% of third-party service cost | https://www.health.gov.au/our-work/support-at-home/delivering-services-for-support-at-home/services-under-support-at-home | Not independently re-verified | **Needs human verification** |
| 7 | Aged-care worker screening / SIRS obligations apply to the registered provider and engaged workers | https://www.health.gov.au/topics/aged-care-workforce/screening-requirements ; https://www.health.gov.au/our-work/support-at-home/responsibilities-of-support-at-home-providers/compliance-for-support-at-home-providers | Not independently re-verified | **Needs human verification** |
| 8 | NDIS GST-free treatment requires specific statutory conditions incl. a written agreement; subcontractor-to-business supply may differ | https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/your-industry/gst-and-health/national-disability-insurance-scheme | Not independently re-verified | **Needs human verification** |
| 9 | Australian Privacy Act may apply to a small business providing a health service / holding health information | https://www.oaic.gov.au/privacy/your-privacy-rights/health-information/what-is-a-health-service-provider | Not independently re-verified | **Needs human verification** |
| 10 | Holding an ABN does not by itself establish contractor status — see sham contracting guidance | https://www.fairwork.gov.au/find-help-for/independent-contractors/sham-contracting | Not independently re-verified | **Needs human verification** |

## How the app encodes "needs review" rather than guessing

- `rate_items` (`src/lib/fixtures.ts`) carry `sourceLabel`, `sourceUrl` and
  `sourceCheckedAt` for every NDIS cap, and a `gstRuleStatus` that defaults
  to `"review_needed"` wherever the blueprint itself flagged genuine
  ambiguity (e.g. Support at Home subcontractor GST, private meal-prep GST),
  rather than defaulting to GST-free or taxable.
- A provider's advertised retail price and the worker's actually agreed fee
  are always two separate fields/rows — see the Price Book and Lead rate
  rows — so a rate change in one can never silently change the other.
- Engagement `readinessState`/`readinessBlockers` block invoice creation in
  the UI (`SessionDetailClient`) whenever a precondition like provider
  approval is outstanding — the app never infers eligibility from a session
  simply being completed.

## Before any live client data goes into this app

1. Verify every row above against the current official source and update
   `sourceCheckedAt` accordingly.
2. Get a proportionate professional review of privacy, data hosting,
   security, recordkeeping and insurance (blueprint §10) — this prototype
   is not a compliant clinical/care record system by itself.
3. Confirm actual ABN, registrations, insurances and worker screening
   status — none of that is asserted anywhere in this codebase; `Settings`
   deliberately labels the ABN field "synthetic placeholder".
