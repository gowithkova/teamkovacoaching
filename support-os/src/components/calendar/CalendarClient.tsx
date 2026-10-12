"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AVAILABILITY_LABEL,
  SESSION_STATUS_LABEL,
  type AvailabilityBlock,
  type Client,
  type VisitSession,
} from "@/lib/types";
import {
  brisbaneDayOffset,
  brisbaneWeekStart,
  formatDateShort,
  formatTimeRange,
  isSameBrisbaneDay,
} from "@/lib/dates";
import { detectSessionConflicts } from "@/lib/conflicts";
import { cn } from "@/lib/cn";

const EXCLUDED_STATUSES: VisitSession["status"][] = ["cancelled", "no_show"];

function DayAgenda({
  dayOffset,
  sessions,
  blocks,
  allSessions,
  clientName,
}: {
  dayOffset: number;
  sessions: VisitSession[];
  blocks: AvailabilityBlock[];
  allSessions: VisitSession[];
  clientName: (id: string) => string;
}) {
  const dayIso = brisbaneDayOffset(dayOffset, 12, 0);
  const daySessions = sessions
    .filter((s) => isSameBrisbaneDay(s.plannedStart, dayIso) && !EXCLUDED_STATUSES.includes(s.status))
    .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());
  const dayBlocks = blocks.filter((b) => isSameBrisbaneDay(b.startAt, dayIso));

  if (daySessions.length === 0 && dayBlocks.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {dayOffset === 0 ? "Today" : formatDateShort(dayIso)}
      </h3>
      <div className="space-y-2">
        {dayBlocks.map((b) => (
          <div key={b.id} className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink-soft">
            {formatTimeRange(b.startAt, b.endAt)} · {b.displayLabel} <span className="text-ink-faint">({AVAILABILITY_LABEL[b.blockType]})</span>
          </div>
        ))}
        {daySessions.map((s) => {
          const conflicts = detectSessionConflicts(s, allSessions, blocks);
          return (
            <Link key={s.id} href={`/sessions/${s.id}`} className="block">
              <Card className={cn("hover:border-accent", conflicts.length > 0 && "border-danger-line")}>
                <CardBody className="space-y-1 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="tabular text-sm font-medium text-ink">{formatTimeRange(s.plannedStart, s.plannedEnd)}</span>
                    <Badge tone={s.status === "tentative" || s.status === "proposed" ? "neutral" : "accent"}>
                      {SESSION_STATUS_LABEL[s.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-soft">{s.serviceType} · {clientName(s.clientId)} · {s.suburb}</p>
                  {conflicts.length > 0 && (
                    <p className="flex items-start gap-1.5 text-xs text-danger">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {conflicts[0].message}
                    </p>
                  )}
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarClient({
  sessions,
  availabilityBlocks,
  clients,
}: {
  sessions: VisitSession[];
  availabilityBlocks: AvailabilityBlock[];
  clients: Client[];
}) {
  const [view, setView] = useState<"list" | "week">("list");
  const [weekOffset, setWeekOffset] = useState(0);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "Client";

  const listDays = useMemo(() => Array.from({ length: 25 }, (_, i) => i - 3), []);
  const weekStartIso = brisbaneWeekStart(weekOffset);
  const weekDayOffsets = useMemo(() => {
    const todayStartMs = new Date(brisbaneWeekStart(0)).getTime();
    const thisWeekStartMs = new Date(weekStartIso).getTime();
    const baseOffset = Math.round((thisWeekStartMs - todayStartMs) / 86_400_000);
    return Array.from({ length: 7 }, (_, i) => baseOffset + i);
  }, [weekStartIso]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {(["list", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                view === v ? "bg-accent-soft text-accent-strong" : "text-ink-soft hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        {view === "week" && (
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week" className="h-9 w-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="text-sm text-ink-soft">{formatDateShort(weekStartIso)}</span>
            <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week" className="h-9 w-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <Badge tone="accent">Confirmed / in progress</Badge>
        <Badge tone="neutral">Proposed / tentative</Badge>
        <Badge tone="danger">Conflict</Badge>
      </div>

      {view === "list" && (
        <div className="space-y-5">
          {listDays.map((offset) => (
            <DayAgenda
              key={offset}
              dayOffset={offset}
              sessions={sessions}
              blocks={availabilityBlocks}
              allSessions={sessions}
              clientName={clientName}
            />
          ))}
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {weekDayOffsets.map((offset) => (
            <div key={offset} className="rounded-lg border border-line p-2.5">
              <DayAgenda
                dayOffset={offset}
                sessions={sessions}
                blocks={availabilityBlocks}
                allSessions={sessions}
                clientName={clientName}
              />
              {sessions.filter((s) => isSameBrisbaneDay(s.plannedStart, brisbaneDayOffset(offset, 12, 0))).length === 0 &&
                availabilityBlocks.filter((b) => isSameBrisbaneDay(b.startAt, brisbaneDayOffset(offset, 12, 0))).length === 0 && (
                  <p className="text-xs text-ink-faint">{formatDateShort(brisbaneDayOffset(offset, 12, 0))} — free</p>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
