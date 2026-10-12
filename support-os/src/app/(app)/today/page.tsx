"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { SnoozeButton } from "@/components/today/SnoozeButton";
import { MiniDayStrip } from "@/components/calendar/MiniDayStrip";
import { nextUpcomingSession } from "@/lib/selectors";
import { invoicedThisWeekCents, overdueCents, receivedThisWeekCents } from "@/lib/selectors";
import { forecastWeeks } from "@/lib/forecast";
import { computePriorityQueue } from "@/lib/priority";
import { formatCents } from "@/lib/money";
import { formatDateLong, formatTimeRange, relativeDayLabel, todayBrisbane } from "@/lib/dates";
import { Badge } from "@/components/ui/Badge";

function greeting(): string {
  const hour = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", hour: "numeric", hour12: false }).format(new Date());
  const h = Number(hour);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayPage() {
  const store = useStore();
  const { sessions, engagements, clients, invoices, leads, credentials, availabilityBlocks, settings, snoozedTaskLabels, snoozeTaskLabel } = store;

  const next = nextUpcomingSession(sessions);
  const nextClient = next ? clients.find((c) => c.id === next.clientId) : null;

  const weeks = useMemo(() => forecastWeeks(sessions, engagements, 4, 0), [sessions, engagements]);
  const thisWeek = weeks[0];

  const priorityTasks = useMemo(
    () =>
      computePriorityQueue({ sessions, engagements, clients, leads, invoices, credentials, blocks: availabilityBlocks })
        .filter((t) => !snoozedTaskLabels.includes(t.label))
        .slice(0, 5),
    [sessions, engagements, clients, leads, invoices, credentials, availabilityBlocks, snoozedTaskLabels],
  );

  const todayStr = todayBrisbane();
  const todayIso = new Date(Date.UTC(todayStr.year, todayStr.month, todayStr.day)).toISOString();
  const targetProgress = thisWeek.confirmedCents / Math.max(settings.weeklyGrossTargetCents, 1);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-soft">{formatDateLong(todayIso)}</p>
        <h2 className="text-xl font-semibold text-ink">{greeting()}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next</CardTitle>
        </CardHeader>
        <CardBody>
          {next ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-ink">
                  {relativeDayLabel(next.plannedStart)} · {formatTimeRange(next.plannedStart, next.plannedEnd)}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {next.serviceType} · {nextClient?.displayName ?? "Client"} · {next.suburb}
                </p>
              </div>
              <div className="flex gap-2">
                <LinkButton href={`/sessions/${next.id}`} variant="primary">
                  Open visit <ArrowRight size={16} aria-hidden="true" />
                </LinkButton>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(next.suburb)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-medium text-ink hover:border-accent hover:text-accent-strong"
                >
                  <Navigation size={16} aria-hidden="true" /> Directions
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Nothing scheduled right now.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <Link href="/money" className="text-sm font-medium text-accent-strong hover:underline">
            View money
          </Link>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-4">
          <StatTile label="Scheduled this week" value={formatCents(thisWeek.confirmedCents + thisWeek.proposedCents)} />
          <StatTile label="Invoiced" value={formatCents(invoicedThisWeekCents(invoices))} />
          <StatTile label="Received" tone="success" value={formatCents(receivedThisWeekCents(invoices))} />
          <StatTile label="Overdue" tone={overdueCents(invoices) > 0 ? "danger" : "default"} value={formatCents(overdueCents(invoices))} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Do next</CardTitle>
        </CardHeader>
        <CardBody>
          {priorityTasks.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing urgent — nice work.</p>
          ) : (
            <ol className="space-y-2">
              {priorityTasks.map((task, i) => (
                <li key={task.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-ink-soft">
                    {i + 1}
                  </span>
                  {task.linkHref ? (
                    <Link href={task.linkHref} className="min-w-0 flex-1 truncate text-sm text-ink hover:text-accent-strong">
                      {task.label}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{task.label}</span>
                  )}
                  {task.priority === "blocker" && <Badge tone="danger">Blocker</Badge>}
                  <SnoozeButton onSnooze={() => snoozeTaskLabel(task.label)} />
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income forecast</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink-soft">
                Confirmed {formatCents(thisWeek.confirmedCents)} of {formatCents(settings.weeklyGrossTargetCents)} target
              </span>
              {thisWeek.proposedCents > 0 && (
                <span className="text-ink-faint">+{formatCents(thisWeek.proposedCents)} proposed</span>
              )}
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={Math.round(targetProgress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${Math.min(100, targetProgress * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Next 4 weeks</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {weeks.map((w, i) => (
                <div key={w.weekOffset} className="rounded-lg border border-line p-2.5">
                  <p className="text-[11px] font-medium text-ink-soft">{i === 0 ? "This week" : `Week +${i}`}</p>
                  <p className="tabular text-sm font-semibold text-success">{formatCents(w.confirmedCents)}</p>
                  {w.proposedCents > 0 && (
                    <p className="tabular text-xs text-ink-faint">+{formatCents(w.proposedCents)} proposed</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next few days</CardTitle>
          <Link href="/calendar" className="text-sm font-medium text-accent-strong hover:underline">
            Open calendar
          </Link>
        </CardHeader>
        <CardBody>
          <MiniDayStrip sessions={sessions} blocks={availabilityBlocks} days={4} />
        </CardBody>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
        <MapPin size={12} aria-hidden="true" /> Synthetic demo data — see Settings for your weekly target.
      </p>
    </div>
  );
}
