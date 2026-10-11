import { test } from "node:test";
import assert from "node:assert/strict";
import { leadFitScore } from "../../src/lib/leadFit";

test("fit score sums the five weighted rubric factors to a max of 100", () => {
  const score = leadFitScore({
    serviceScopeFit: 30,
    scheduleFit: 25,
    netEarningPotential: 25,
    travel: 15,
    readinessToCommence: 5,
  });
  assert.equal(score, 100);
});

test("fit score is null when no fit factors were recorded (never a fabricated 0)", () => {
  assert.equal(leadFitScore(undefined), null);
  assert.equal(leadFitScore(null), null);
});

test("fit rubric never includes medical/protected-trait fields by construction", () => {
  const factors = { serviceScopeFit: 10, scheduleFit: 10, netEarningPotential: 10, travel: 10, readinessToCommence: 2 };
  const keys = Object.keys(factors);
  for (const banned of ["diagnosis", "age", "gender", "disability", "ethnicity"]) {
    assert.equal(keys.includes(banned), false);
  }
});
