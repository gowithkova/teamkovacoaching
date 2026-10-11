import type { RateItem } from "@/lib/types";
import { FUNDING_LANE_LABEL } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";

export function PriceBook({ items }: { items: RateItem[] }) {
  const byLane = new Map<string, RateItem[]>();
  for (const item of items) {
    byLane.set(item.lane, [...(byLane.get(item.lane) ?? []), item]);
  }

  return (
    <div className="space-y-5">
      {[...byLane.entries()].map(([lane, laneItems]) => (
        <div key={lane}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {FUNDING_LANE_LABEL[lane as keyof typeof FUNDING_LANE_LABEL]}
          </h3>
          <div className="space-y-2">
            {laneItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.serviceCategory}</CardTitle>
                  {item.approvedByOperator ? (
                    <Badge tone="success">Your rate</Badge>
                  ) : (
                    <Badge tone="neutral">Reference only</Badge>
                  )}
                </CardHeader>
                <CardBody className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-ink-faint">Agreed worker rate</p>
                    <p className="tabular text-ink">{item.agreedWorkerRateCents > 0 ? `${formatCents(item.agreedWorkerRateCents)}/h` : "—"}</p>
                  </div>
                  {item.capAmountCents != null && (
                    <div>
                      <p className="text-ink-faint">Cap / published price</p>
                      <p className="tabular text-ink">{formatCents(item.capAmountCents)}/h</p>
                    </div>
                  )}
                  <div>
                    <p className="text-ink-faint">GST</p>
                    <p className="capitalize text-ink">{item.gstRuleStatus.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-ink-faint">Source</p>
                    <p className="text-ink">{item.sourceLabel} {item.sourceCheckedAt && `(checked ${formatDateShort(item.sourceCheckedAt)})`}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
