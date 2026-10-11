"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SESSION_STATUS_LABEL, type VisitSession } from "@/lib/types";
import { formatDateShort, formatTimeRange, isSameBrisbaneDay } from "@/lib/dates";

function SessionRow({ session, clientName }: { session: VisitSession; clientName: string }) {
  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <Card className="hover:border-accent">
        <CardBody className="flex items-center justify-between pt-4 text-sm">
          <div>
            <p className="font-medium text-ink">{formatDateShort(session.plannedStart)} · {formatTimeRange(session.plannedStart, session.plannedEnd)}</p>
            <p className="text-ink-soft">{session.serviceType} · {clientName} · {session.suburb}</p>
          </div>
          <Badge tone="neutral">{SESSION_STATUS_LABEL[session.status]}</Badge>
        </CardBody>
      </Card>
    </Link>
  );
}

export default function SessionsPage() {
  const { sessions, clients } = useStore();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "Client";

  const today = useMemo(() => sessions.filter((s) => isSameBrisbaneDay(s.plannedStart, new Date().toISOString())), [sessions]);
  const needsNote = useMemo(() => sessions.filter((s) => s.status === "completed" && !s.noteId), [sessions]);
  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => ["proposed", "tentative", "confirmed"].includes(s.status) && !today.includes(s))
        .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime())
        .slice(0, 10),
    [sessions, today],
  );
  const recent = useMemo(
    () =>
      sessions
        .filter((s) => ["completed", "reviewed", "invoiced", "paid"].includes(s.status))
        .sort((a, b) => new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime())
        .slice(0, 10),
    [sessions],
  );

  return (
    <div className="space-y-6">
      {needsNote.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-danger">Needs a note</h3>
          <div className="space-y-2">
            {needsNote.map((s) => <SessionRow key={s.id} session={s} clientName={clientName(s.clientId)} />)}
          </div>
        </section>
      )}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Today</h3>
        <div className="space-y-2">
          {today.length === 0 && <p className="text-sm text-ink-soft">No visits today.</p>}
          {today.map((s) => <SessionRow key={s.id} session={s} clientName={clientName(s.clientId)} />)}
        </div>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Upcoming</h3>
        <div className="space-y-2">
          {upcoming.map((s) => <SessionRow key={s.id} session={s} clientName={clientName(s.clientId)} />)}
        </div>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Recently completed</h3>
        <div className="space-y-2">
          {recent.map((s) => <SessionRow key={s.id} session={s} clientName={clientName(s.clientId)} />)}
        </div>
      </section>
    </div>
  );
}
