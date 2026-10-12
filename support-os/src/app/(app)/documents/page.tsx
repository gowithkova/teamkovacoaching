"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { CredentialStatus } from "@/lib/types";
import { FUNDING_LANE_LABEL } from "@/lib/types";
import { formatDateShort } from "@/lib/dates";

const STATUS_TONE: Record<CredentialStatus, "success" | "amber" | "danger" | "neutral"> = {
  valid: "success",
  expiring_soon: "amber",
  expired: "danger",
  pending_verification: "neutral",
};

const STATUS_LABEL: Record<CredentialStatus, string> = {
  valid: "Valid",
  expiring_soon: "Expiring soon",
  expired: "Expired — resolve before more bookings",
  pending_verification: "Pending verification",
};

export default function DocumentsPage() {
  const { credentials, incidents, clients } = useStore();

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Credential vault</h3>
        <div className="space-y-2">
          {credentials.map((c) => (
            <Card key={c.id} className={c.verificationStatus === "expired" ? "border-danger-line" : undefined}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <Badge tone={STATUS_TONE[c.verificationStatus]}>{STATUS_LABEL[c.verificationStatus]}</Badge>
              </CardHeader>
              <CardBody className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
                <span>{c.kind}{c.issuer && ` · ${c.issuer}`}</span>
                <span>{c.expiryDate ? `Expires ${formatDateShort(c.expiryDate)}` : "No expiry recorded"}</span>
              </CardBody>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-faint">Reminders are informational only — they are not proof of legal sufficiency. Verify directly with each issuer.</p>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Incident register</h3>
        <div className="space-y-2">
          {incidents.length === 0 && <p className="text-sm text-ink-soft">No incidents recorded.</p>}
          {incidents.map((inc) => {
            const client = clients.find((c) => c.id === inc.clientId);
            return (
              <Card key={inc.id}>
                <CardBody className="space-y-1.5 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{client?.displayName ?? "Unlinked"} · {formatDateShort(inc.occurredAt)}</span>
                    <Badge tone="neutral">{inc.resolutionStatus}</Badge>
                  </div>
                  <p className="text-ink">{inc.factualDescription}</p>
                  <p className="text-ink-soft">Immediate actions: {inc.immediateActions}</p>
                  <Badge tone={inc.authorityNotifiedStatus === "not_notified" ? "amber" : "success"}>
                    {inc.authorityNotifiedStatus.replace(/_/g, " ")}
                  </Badge>
                </CardBody>
              </Card>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          For immediate danger, call 000. This register does not submit anything to the Aged Care SIRS or NDIS Commission automatically — reportability is a human decision.
        </p>
      </section>

      <p className="text-xs text-ink-faint">
        Relevant lanes shown per credential help confirm coverage: {Object.values(FUNDING_LANE_LABEL).join(", ")}.
      </p>
    </div>
  );
}
