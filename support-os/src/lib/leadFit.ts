import type { FitFactors } from "@/lib/types";

/**
 * Fit rubric: service/scope fit 30, schedule fit 25, net earning potential 25,
 * travel 15, readiness to commence 5 (blueprint 5.2). Deliberately excludes
 * any medical, diagnosis, age or protected-trait input — commercial/logistic
 * fit only.
 */
export function leadFitScore(factors?: FitFactors | null): number | null {
  if (!factors) return null;
  return (
    factors.serviceScopeFit +
    factors.scheduleFit +
    factors.netEarningPotential +
    factors.travel +
    factors.readinessToCommence
  );
}
