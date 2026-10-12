import type { Invoice } from "@/lib/types";
import { sumCents } from "@/lib/money";
import { minutesBetween } from "@/lib/dates";

export function invoiceTotalCents(invoice: Invoice): number {
  return sumCents(invoice.lines.map((l) => l.amountCents));
}

export function invoicePaidCents(invoice: Invoice): number {
  return sumCents(invoice.payments.map((p) => p.amountCents));
}

export function invoiceOutstandingCents(invoice: Invoice): number {
  return invoiceTotalCents(invoice) - invoicePaidCents(invoice);
}

export function isInvoiceOutstanding(invoice: Invoice): boolean {
  return (
    invoiceOutstandingCents(invoice) > 0 &&
    invoice.status !== "voided" &&
    invoice.status !== "draft"
  );
}

export type AgeingBucket = "0-7" | "8-14" | "15-30" | "30+";

export function invoiceAgeDays(invoice: Invoice, nowIso = new Date().toISOString()): number {
  return Math.floor(minutesBetween(invoice.issueDate, nowIso) / (60 * 24));
}

export function invoiceAgeingBucket(invoice: Invoice): AgeingBucket {
  const age = invoiceAgeDays(invoice);
  if (age <= 7) return "0-7";
  if (age <= 14) return "8-14";
  if (age <= 30) return "15-30";
  return "30+";
}

export function ageingBreakdown(invoices: Invoice[]): Record<AgeingBucket, number> {
  const buckets: Record<AgeingBucket, number> = { "0-7": 0, "8-14": 0, "15-30": 0, "30+": 0 };
  for (const inv of invoices) {
    if (!isInvoiceOutstanding(inv)) continue;
    buckets[invoiceAgeingBucket(inv)] += invoiceOutstandingCents(inv);
  }
  return buckets;
}

/**
 * effective_rate = (gross work income − direct unreimbursed costs) ÷
 * (service hours + travel hours + allocated admin hours). Blueprint 5.7.
 */
export function effectiveHourlyRateCents(
  grossCents: number,
  directCostsCents: number,
  serviceHours: number,
  travelHours: number,
  adminHours: number,
): number | null {
  const totalHours = serviceHours + travelHours + adminHours;
  if (totalHours <= 0) return null;
  return Math.round((grossCents - directCostsCents) / totalHours);
}
