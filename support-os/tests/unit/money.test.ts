import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCents, hoursToCents, sumCents } from "../../src/lib/money";

test("formatCents renders AUD with 2 decimals", () => {
  assert.equal(formatCents(19_000), "$190.00");
  assert.equal(formatCents(0), "$0.00");
});

test("formatCents handles negative cents (credit/refund)", () => {
  assert.equal(formatCents(-5_000), "-$50.00");
});

test("sumCents adds a list of integer cents", () => {
  assert.equal(sumCents([19_000, 19_000, 19_000]), 57_000);
  assert.equal(sumCents([]), 0);
});

test("hoursToCents: 2 hours at $95/h = $190 (blueprint §15 acceptance test)", () => {
  assert.equal(hoursToCents(2, 9_500), 19_000);
});

test("hoursToCents: hypothetical 7h NDIS Sunday shift at $133.50/h = $934.50", () => {
  assert.equal(hoursToCents(7, 13_350), 93_450);
});
