import Link from "next/link";
import type { Lead } from "@/lib/types";
import { FUNDING_LANE_LABEL, LEAD_READINESS_LABEL, LEAD_STATUS_LABEL, LEAD_TYPE_LABEL } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/money";
import { leadFitScore } from "@/lib/leadFit";
import { formatDateShort } from "@/lib/dates";

const READINESS_TONE = {
  unverified: "neutral",
  need_provider_approval: "amber",
  ready_to_quote: "success",
  awaiting_response: "accent",
} as const;

export function LeadCard({ lead }: { lead: Lead }) {
  const fit = leadFitScore(lead.fitFactors);

  return (
    <Link href={`/leads/${lead.id}`} className="block">
      <Card className="transition-colors hover:border-accent">
        <CardBody className="space-y-2.5 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{lead.displayAlias}</p>
              <p className="text-xs text-ink-soft">
                {LEAD_TYPE_LABEL[lead.type]} · {lead.suburb}
              </p>
            </div>
            {fit !== null && (
              <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-1 text-xs font-semibold tabular text-ink-soft">
                {fit}/100
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{LEAD_STATUS_LABEL[lead.status]}</Badge>
            <Badge tone={READINESS_TONE[lead.readinessBadge]}>{LEAD_READINESS_LABEL[lead.readinessBadge]}</Badge>
            <Badge tone="neutral">{FUNDING_LANE_LABEL[lead.fundingLane]}</Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
            {lead.proposedWorkerRateCents != null && (
              <span>Proposed rate: <span className="tabular font-medium text-ink">{formatCents(lead.proposedWorkerRateCents)}/h</span></span>
            )}
            {lead.advertisedProviderRateCents != null && (
              <span>Provider advertised: <span className="tabular font-medium text-ink">{formatCents(lead.advertisedProviderRateCents)}/h</span></span>
            )}
          </div>

          {lead.nextActionLabel && (
            <p className="rounded-md bg-surface-sunken px-2.5 py-1.5 text-xs text-ink-soft">
              Next: {lead.nextActionLabel}
              {lead.nextActionAt && <span className="text-ink-faint"> · {formatDateShort(lead.nextActionAt)}</span>}
            </p>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}
