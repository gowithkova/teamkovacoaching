import { test } from "node:test";
import assert from "node:assert/strict";
import { classifySession, sessionExpectedRevenueCents, sessionHours } from "../../src/lib/forecast";
import type { Engagement, VisitSession } from "../../src/lib/types";

function makeSession(overrides: Partial<VisitSession> = {}): VisitSession {
  return {
    id: "session-test",
    engagementId: "eng-test",
    clientId: "client-test",
    plannedStart: "2026-10-13T00:00:00.000Z",
    plannedEnd: "2026-10-13T02:00:00.000Z",
    status: "confirmed",
    suburb: "Testville",
    serviceType: "Domestic assistance",
    travelBufferBeforeMin: 15,
    travelBufferAfterMin: 15,
    ...overrides,
  };
}

function makeEngagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: "eng-test",
    clientId: "client-test",
    fundingLane: "private_pay",
    scopeAllowed: [],
    scopeExcluded: [],
    startDate: "2026-01-01T00:00:00.000Z",
    providerApprovalStatus: "not_required",
    transportConsentStatus: "not_required",
    readinessState: "green",
    readinessBlockers: [],
    cancellationTerms: "",
    travelTerms: "",
    billingTerms: "",
    agreedWorkerRateCents: 9_500,
    rateUnit: "hour",
    status: "active",
    ...overrides,
  };
}

test("sessionHours reads actual times when present, else planned", () => {
  const planned = makeSession();
  assert.equal(sessionHours(planned), 2);

  const actual = makeSession({ actualStart: "2026-10-13T00:10:00.000Z", actualEnd: "2026-10-13T01:40:00.000Z" });
  assert.equal(sessionHours(actual), 1.5);
});

test("hourly engagement: revenue = hours x rate", () => {
  const session = makeSession();
  const engagement = makeEngagement({ rateUnit: "hour", agreedWorkerRateCents: 9_500 });
  assert.equal(sessionExpectedRevenueCents(session, engagement), 19_000);
});

test("per-visit engagement: revenue is the flat rate regardless of session duration", () => {
  const twoHourSession = makeSession();
  const fourHourSession = makeSession({ plannedEnd: "2026-10-13T04:00:00.000Z" });
  const engagement = makeEngagement({ rateUnit: "visit", agreedWorkerRateCents: 8_500 });
  assert.equal(sessionExpectedRevenueCents(twoHourSession, engagement), 8_500);
  assert.equal(sessionExpectedRevenueCents(fourHourSession, engagement), 8_500);
});

test("no engagement found: revenue is 0, never NaN or a crash", () => {
  assert.equal(sessionExpectedRevenueCents(makeSession(), undefined), 0);
});

test("classifySession buckets by status per the blueprint's confirmed/proposed split", () => {
  assert.equal(classifySession(makeSession({ status: "confirmed" })), "confirmed");
  assert.equal(classifySession(makeSession({ status: "paid" })), "confirmed");
  assert.equal(classifySession(makeSession({ status: "tentative" })), "proposed");
  assert.equal(classifySession(makeSession({ status: "proposed" })), "proposed");
  assert.equal(classifySession(makeSession({ status: "cancelled" })), "excluded");
  assert.equal(classifySession(makeSession({ status: "no_show" })), "excluded");
});
