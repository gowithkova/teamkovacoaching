"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { nextUpcomingSession, totalOutstandingCents } from "@/lib/selectors";
import { forecastWeeks } from "@/lib/forecast";
import { formatCents } from "@/lib/money";
import { formatTimeRange, relativeDayLabel } from "@/lib/dates";

export function TopSummaryBar() {
  const { sessions, engagements, clients, invoices } = useStore();

  const next = nextUpcomingSession(sessions);
  const nextClient = next ? clients.find((c) => c.id === next.clientId) : null;
  const thisWeek = forecastWeeks(sessions, engagements, 1, 0)[0];
  const outstanding = totalOutstandingCents(invoices);

  return (
    <div className="flex gap-4 overflow-x-auto border-b border-line bg-surface px-4 py-2.5 text-xs scrollbar-none lg:px-6">
      <Link href="/calendar" className="flex min-w-0 shrink-0 items-center gap-1.5 hover:text-accent-strong">
        <span className="font-medium text-ink-soft">Next:</span>
        {next ? (
          <span className="truncate tabular text-ink">
            {relativeDayLabel(next.plannedStart)} {formatTimeRange(next.plannedStart, next.plannedEnd)} · {nextClient?.displayName ?? "Client"}
          </span>
        ) : (
          <span className="text-ink-soft">Nothing scheduled</span>
        )}
      </Link>
      <Link href="/money" className="flex shrink-0 items-center gap-1.5 hover:text-accent-strong">
        <span className="font-medium text-ink-soft">This week confirmed:</span>
        <span className="tabular font-semibold text-success">{formatCents(thisWeek.confirmedCents)}</span>
      </Link>
      <Link href="/money" className="flex shrink-0 items-center gap-1.5 hover:text-accent-strong">
        <span className="font-medium text-ink-soft">Outstanding:</span>
        <span className={`tabular font-semibold ${outstanding > 0 ? "text-amber" : "text-ink"}`}>
          {formatCents(outstanding)}
        </span>
      </Link>
    </div>
  );
}
