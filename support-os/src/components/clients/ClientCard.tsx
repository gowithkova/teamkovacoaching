import Link from "next/link";
import type { Client, Engagement, VisitSession } from "@/lib/types";
import { FUNDING_LANE_LABEL } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ReadinessBadge } from "@/components/ui/ReadinessBadge";
import { nextUpcomingSession } from "@/lib/selectors";
import { formatTimeRange, relativeDayLabel } from "@/lib/dates";

export function ClientCard({
  client,
  engagement,
  sessions,
}: {
  client: Client;
  engagement?: Engagement;
  sessions: VisitSession[];
}) {
  const next = nextUpcomingSession(sessions.filter((s) => s.clientId === client.id));

  return (
    <Link href={`/clients/${client.id}`} className="block">
      <Card className="transition-colors hover:border-accent">
        <CardBody className="space-y-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{client.displayName}</p>
              <p className="text-xs text-ink-soft">{client.suburb}</p>
            </div>
            {engagement && <ReadinessBadge state={engagement.readinessState} />}
          </div>
          <Badge tone="neutral">{FUNDING_LANE_LABEL[client.fundingLane]}</Badge>
          <p className="text-xs text-ink-soft">
            {next ? `Next: ${relativeDayLabel(next.plannedStart)} ${formatTimeRange(next.plannedStart, next.plannedEnd)}` : "No upcoming visit"}
          </p>
        </CardBody>
      </Card>
    </Link>
  );
}
