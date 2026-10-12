import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageingBreakdown,
  effectiveHourlyRateCents,
  invoiceAgeingBucket,
  invoiceOutstandingCents,
  invoicePaidCents,
  invoiceTotalCents,
  isInvoiceOutstanding,
} from "../../src/lib/invoicing";
import type { Invoice } from "../../src/lib/types";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-test",
    number: "INV-TEST-0001",
    clientId: "client-test",
    payerLabel: "Test Payer",
    fundingLane: "private_pay",
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    status: "issued",
    lines: [
      {
        id: "line-1",
        serviceDate: new Date().toISOString(),
        description: "Domestic assistance — 2 hours",
        quantityHours: 2,
        unitPriceCents: 9_500,
        amountCents: 19_000,
        gstRule: "review_needed",
        eligibilityReviewState: "ok",
      },
      {
        id: "line-2",
        serviceDate: new Date().toISOString(),
        description: "Domestic assistance — 2 hours",
        quantityHours: 2,
        unitPriceCents: 9_500,
        amountCents: 19_000,
        gstRule: "review_needed",
        eligibilityReviewState: "ok",
      },
      {
        id: "line-3",
        serviceDate: new Date().toISOString(),
        description: "Domestic assistance — 2 hours",
        quantityHours: 2,
        unitPriceCents: 9_500,
        amountCents: 19_000,
        gstRule: "review_needed",
        eligibilityReviewState: "ok",
      },
    ],
    payments: [],
    gstTreatment: "review_needed",
    ...overrides,
  };
}

test("blueprint §15: 3 x $190 = $570 total, $380 paid, $190 outstanding", () => {
  const invoice = makeInvoice({
    payments: [{ id: "p1", invoiceId: "inv-test", amountCents: 38_000, paidAt: new Date().toISOString(), method: "eft" }],
  });
  assert.equal(invoiceTotalCents(invoice), 57_000);
  assert.equal(invoicePaidCents(invoice), 38_000);
  assert.equal(invoiceOutstandingCents(invoice), 19_000);
});

test("a fully paid invoice is not outstanding", () => {
  const invoice = makeInvoice({
    status: "paid",
    payments: [{ id: "p1", invoiceId: "inv-test", amountCents: 57_000, paidAt: new Date().toISOString(), method: "eft" }],
  });
  assert.equal(invoiceOutstandingCents(invoice), 0);
  assert.equal(isInvoiceOutstanding(invoice), false);
});

test("a draft invoice is never counted as outstanding, even with an unpaid balance", () => {
  const invoice = makeInvoice({ status: "draft" });
  assert.equal(isInvoiceOutstanding(invoice), false);
});

test("ageing bucket boundaries", () => {
  const dayMs = 86_400_000;
  const now = Date.now();
  assert.equal(invoiceAgeingBucket(makeInvoice({ issueDate: new Date(now - 3 * dayMs).toISOString() })), "0-7");
  assert.equal(invoiceAgeingBucket(makeInvoice({ issueDate: new Date(now - 10 * dayMs).toISOString() })), "8-14");
  assert.equal(invoiceAgeingBucket(makeInvoice({ issueDate: new Date(now - 20 * dayMs).toISOString() })), "15-30");
  assert.equal(invoiceAgeingBucket(makeInvoice({ issueDate: new Date(now - 45 * dayMs).toISOString() })), "30+");
});

test("ageingBreakdown only counts genuinely outstanding invoices, split by bucket", () => {
  const dayMs = 86_400_000;
  const now = Date.now();
  const recent = makeInvoice({ id: "a", issueDate: new Date(now - 2 * dayMs).toISOString() });
  const old = makeInvoice({ id: "b", issueDate: new Date(now - 40 * dayMs).toISOString() });
  const draft = makeInvoice({ id: "c", status: "draft", issueDate: new Date(now - 40 * dayMs).toISOString() });
  const result = ageingBreakdown([recent, old, draft]);
  assert.equal(result["0-7"], 57_000);
  assert.equal(result["30+"], 57_000);
  assert.equal(result["15-30"], 0);
});

test("effective hourly rate subtracts direct costs and divides by all hours worked", () => {
  // $570 gross, $20 fuel, 4 service hours + 1 travel hour + 0.25 admin hour
  const result = effectiveHourlyRateCents(57_000, 2_000, 4, 1, 0.25);
  assert.equal(result, Math.round(55_000 / 5.25));
});

test("effective hourly rate is null with zero total hours (avoid divide-by-zero)", () => {
  assert.equal(effectiveHourlyRateCents(10_000, 0, 0, 0, 0), null);
});
