import Link from "next/link";
import type { Lead, Organisation } from "@/lib/types";
import { LEAD_STATUS_LABEL } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateShort } from "@/lib/dates";

export function ProviderCard({ lead, org }: { lead: Lead; org?: Organisation }) {
  return (
    <Link href={`/leads/${lead.id}`} className="block">
      <Card className="transition-colors hover:border-accent">
        <CardBody className="space-y-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{org?.tradingName ?? org?.legalName ?? lead.displayAlias}</p>
            <Badge tone="neutral">{LEAD_STATUS_LABEL[lead.status]}</Badge>
          </div>
          <p className="text-xs text-ink-soft">{lead.suburb}</p>
          <Badge tone={org?.registrationVerifiedAt ? "success" : "amber"}>
            {org?.registrationVerifiedAt ? "Registration verified" : "Registration not yet verified"}
          </Badge>
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
