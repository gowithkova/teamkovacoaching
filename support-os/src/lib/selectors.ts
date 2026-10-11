import type { Invoice, VisitSession } from "@/lib/types";
import { invoiceOutstandingCents, invoiceTotalCents, isInvoiceOutstanding } from "@/lib/invoicing";
import { sumCents } from "@/lib/money";
import { brisbaneWeekStart } from "@/lib/dates";

const UPCOMING_STATUSES: VisitSession["status"][] = [
  "proposed",
  "tentative",
  "confirmed",
  "in_progress",
];

export function nextUpcomingSession(sessions: VisitSession[], now = new Date()): VisitSession | null {
  const upcoming = sessions
    .filter((s) => UPCOMING_STATUSES.includes(s.status) && new Date(s.plannedEnd) >= now)
    .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());
  return upcoming[0] ?? null;
}

export function totalOutstandingCents(invoices: Invoice[]): number {
  return sumCents(invoices.filter(isInvoiceOutstanding).map(invoiceOutstandingCents));
}

export function totalCollectedCents(invoices: Invoice[]): number {
  return sumCents(invoices.flatMap((inv) => inv.payments.map((p) => p.amountCents)));
}

function withinCurrentWeek(iso: string): boolean {
  const start = new Date(brisbaneWeekStart(0)).getTime();
  const end = new Date(brisbaneWeekStart(1)).getTime();
  const t = new Date(iso).getTime();
  return t >= start && t < end;
}

export function invoicedThisWeekCents(invoices: Invoice[]): number {
  return sumCents(
    invoices.filter((inv) => inv.status !== "draft" && withinCurrentWeek(inv.issueDate)).map(invoiceTotalCents),
  );
}

export function receivedThisWeekCents(invoices: Invoice[]): number {
  return sumCents(
    invoices.flatMap((inv) => inv.payments.filter((p) => withinCurrentWeek(p.paidAt)).map((p) => p.amountCents)),
  );
}

export function overdueCents(invoices: Invoice[], now = new Date()): number {
  return sumCents(
    invoices
      .filter((inv) => isInvoiceOutstanding(inv) && new Date(inv.dueDate) < now)
      .map(invoiceOutstandingCents),
  );
}
