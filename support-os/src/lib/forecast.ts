import type { Client, Engagement, FundingLane, VisitSession } from "@/lib/types";
import { brisbaneWeekStart, minutesBetween } from "@/lib/dates";

const CONFIRMED_STATUSES: VisitSession["status"][] = [
  "confirmed",
  "in_progress",
  "completed",
  "reviewed",
  "invoiced",
  "paid",
];
const PROPOSED_STATUSES: VisitSession["status"][] = ["proposed", "tentative"];

export function sessionHours(session: VisitSession): number {
  const start = session.actualStart ?? session.plannedStart;
  const end = session.actualEnd ?? session.plannedEnd;
  return minutesBetween(start, end) / 60;
}

export function sessionExpectedRevenueCents(
  session: VisitSession,
  engagement: Engagement | undefined,
): number {
  if (!engagement) return 0;
  if (engagement.rateUnit === "visit") return engagement.agreedWorkerRateCents;
  return Math.round(sessionHours(session) * engagement.agreedWorkerRateCents);
}

export type RevenueClass = "confirmed" | "proposed" | "excluded";

export function classifySession(session: VisitSession): RevenueClass {
  if (CONFIRMED_STATUSES.includes(session.status)) return "confirmed";
  if (PROPOSED_STATUSES.includes(session.status)) return "proposed";
  return "excluded";
}

export interface WeekForecast {
  weekOffset: number;
  startIso: string;
  confirmedCents: number;
  proposedCents: number;
}

export function forecastWeeks(
  sessions: VisitSession[],
  engagements: Engagement[],
  weekCount: number,
  startWeekOffset = 0,
): WeekForecast[] {
  const engagementById = new Map(engagements.map((e) => [e.id, e]));
  const weeks: WeekForecast[] = [];

  for (let w = startWeekOffset; w < startWeekOffset + weekCount; w++) {
    const startIso = brisbaneWeekStart(w);
    const endIso = brisbaneWeekStart(w + 1);
    let confirmedCents = 0;
    let proposedCents = 0;

    for (const session of sessions) {
      const cls = classifySession(session);
      if (cls === "excluded") continue;
      const start = new Date(session.plannedStart).getTime();
      if (start < new Date(startIso).getTime() || start >= new Date(endIso).getTime()) continue;
      const revenue = sessionExpectedRevenueCents(session, engagementById.get(session.engagementId));
      if (cls === "confirmed") confirmedCents += revenue;
      else proposedCents += revenue;
    }

    weeks.push({ weekOffset: w, startIso, confirmedCents, proposedCents });
  }

  return weeks;
}

export function forecastByLaneCents(
  sessions: VisitSession[],
  engagements: Engagement[],
  clients: Client[],
  weekCount: number,
): Record<FundingLane, { confirmedCents: number; proposedCents: number }> {
  const engagementById = new Map(engagements.map((e) => [e.id, e]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const startIso = brisbaneWeekStart(0);
  const endIso = brisbaneWeekStart(weekCount);
  const result: Record<FundingLane, { confirmedCents: number; proposedCents: number }> = {
    support_at_home: { confirmedCents: 0, proposedCents: 0 },
    ndis: { confirmedCents: 0, proposedCents: 0 },
    private_pay: { confirmedCents: 0, proposedCents: 0 },
    premium_private: { confirmedCents: 0, proposedCents: 0 },
  };

  for (const session of sessions) {
    const cls = classifySession(session);
    if (cls === "excluded") continue;
    const start = new Date(session.plannedStart).getTime();
    if (start < new Date(startIso).getTime() || start >= new Date(endIso).getTime()) continue;
    const client = clientById.get(session.clientId);
    if (!client) continue;
    const revenue = sessionExpectedRevenueCents(session, engagementById.get(session.engagementId));
    if (cls === "confirmed") result[client.fundingLane].confirmedCents += revenue;
    else result[client.fundingLane].proposedCents += revenue;
  }

  return result;
}
