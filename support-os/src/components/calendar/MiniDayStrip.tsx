"use client";

import Link from "next/link";
import type { AvailabilityBlock, VisitSession } from "@/lib/types";
import { SESSION_STATUS_LABEL } from "@/lib/types";
import { brisbaneDayOffset, formatDateShort, formatTimeRange, isSameBrisbaneDay } from "@/lib/dates";
import { cn } from "@/lib/cn";

const EXCLUDED = ["cancelled", "no_show"] as const;

export function MiniDayStrip({
  sessions,
  blocks,
  days = 4,
}: {
  sessions: VisitSession[];
  blocks: AvailabilityBlock[];
  days?: number;
}) {
  const dayOffsets = Array.from({ length: days }, (_, i) => i);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {dayOffsets.map((offset) => {
        const dayIso = brisbaneDayOffset(offset, 12, 0);
        const daySessions = sessions
          .filter((s) => isSameBrisbaneDay(s.plannedStart, dayIso))
          .filter((s) => !EXCLUDED.includes(s.status as (typeof EXCLUDED)[number]))
          .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());
        const unavailable = blocks.find(
          (b) => b.blockType === "unavailable" && isSameBrisbaneDay(b.startAt, dayIso),
        );

        return (
          <div key={offset} className="rounded-lg border border-line p-2.5">
            <p className="text-xs font-semibold text-ink-soft">
              {offset === 0 ? "Today" : formatDateShort(dayIso)}
            </p>
            <div className="mt-1.5 space-y-1">
              {unavailable && (
                <p className="rounded bg-neutral-chip px-1.5 py-1 text-[11px] text-neutral-chip-ink">
                  {unavailable.displayLabel}
                </p>
              )}
              {daySessions.length === 0 && !unavailable && (
                <p className="text-[11px] text-ink-faint">No visits</p>
              )}
              {daySessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className={cn(
                    "block rounded px-1.5 py-1 text-[11px] leading-tight hover:ring-1 hover:ring-accent",
                    s.status === "proposed" || s.status === "tentative"
                      ? "bg-neutral-chip text-neutral-chip-ink"
                      : "bg-accent-soft text-accent-strong",
                  )}
                >
                  <span className="tabular font-medium">{formatTimeRange(s.plannedStart, s.plannedEnd)}</span>
                  <span className="block truncate">{s.serviceType}</span>
                  <span className="block text-[10px] opacity-80">{SESSION_STATUS_LABEL[s.status]}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
