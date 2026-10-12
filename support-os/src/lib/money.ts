/** All money is stored and summed as integer cents AUD. Never use floats for currency. */

export function formatCents(cents: number, opts?: { noCents?: boolean }): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: opts?.noCents && Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function hoursToCents(hours: number, rateCentsPerHour: number): number {
  return Math.round(hours * rateCentsPerHour);
}

export function centsToHoursLabel(hours: number): string {
  if (hours === 1) return "1 hour";
  if (hours % 1 === 0) return `${hours} hours`;
  return `${hours.toFixed(2).replace(/\.00$/, "")} hours`;
}
