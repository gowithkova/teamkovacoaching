"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  FUNDING_LANE_LABEL,
  LEAD_READINESS_LABEL,
  LEAD_STATUS_LABEL,
  LEAD_TYPE_LABEL,
  LEAD_PIPELINE_ORDER,
  type LeadStatus,
} from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField } from "@/components/ui/Field";
import { TemplateBox } from "@/components/shared/TemplateBox";
import { leadFitScore } from "@/lib/leadFit";
import { formatCents } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";
import {
  declineReferral,
  enquiryAcknowledgment,
  providerAuthorisationRequest,
  scopeClarification,
  screeningQuestions,
} from "@/lib/templates";

const ALL_STATUSES: LeadStatus[] = [...LEAD_PIPELINE_ORDER, "lost", "not_suitable", "archived"];

export function LeadDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { leads, organisations, settings, setLeadStatus, addLeadActivity, convertLeadToClient } = useStore();
  const lead = leads.find((l) => l.id === id);
  const [note, setNote] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  const fit = useMemo(() => leadFitScore(lead?.fitFactors), [lead]);

  if (!lead) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">Lead not found.</p>
        <Link href="/leads" className="text-sm text-accent-strong hover:underline">Back to leads</Link>
      </div>
    );
  }

  const leadId = lead.id;
  const org = organisations.find((o) => o.id === lead.assignedOrgId);
  const templates = [
    { key: "ack", label: "Enquiry acknowledgment", text: enquiryAcknowledgment(lead, settings) },
    { key: "screen", label: "Four-question screening call", text: screeningQuestions(lead) },
    { key: "scope", label: "Clarify scope, days, duration, rate", text: scopeClarification(lead) },
    ...(lead.fundingLane === "support_at_home"
      ? [{ key: "provider", label: "Request registered-provider authorisation", text: providerAuthorisationRequest(lead) }]
      : []),
    { key: "decline", label: "I cannot safely provide that service", text: declineReferral(lead) },
  ];

  function handleConvert() {
    const clientId = convertLeadToClient(leadId);
    router.push(`/clients/${clientId}`);
  }

  function handleDecline() {
    setLeadStatus(leadId, "not_suitable", declineReason || "Declined — outside scope/qualifications.");
    setShowDecline(false);
  }

  return (
    <div className="space-y-5">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Back to leads
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-ink">{lead.displayAlias}</h2>
        <p className="text-sm text-ink-soft">
          {LEAD_TYPE_LABEL[lead.type]} · {lead.suburb} · Source: {lead.source}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{FUNDING_LANE_LABEL[lead.fundingLane]}</Badge>
          <Badge tone="accent">{LEAD_READINESS_LABEL[lead.readinessBadge]}</Badge>
          {fit !== null && <Badge tone="neutral">Fit score {fit}/100</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <SelectField
            label="Pipeline status"
            value={lead.status}
            onChange={(e) => setLeadStatus(lead.id, e.target.value as LeadStatus)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
            ))}
          </SelectField>
          {lead.statusReason && (
            <p className="rounded-md bg-amber-soft px-3 py-2 text-sm text-amber">{lead.statusReason}</p>
          )}
          {lead.convertedClientId ? (
            <Link href={`/clients/${lead.convertedClientId}`} className="inline-block">
              <Button variant="secondary">View client record</Button>
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleConvert}>Convert to client</Button>
              <Button variant="danger" onClick={() => setShowDecline((v) => !v)}>Decline / not suitable</Button>
            </div>
          )}
          {showDecline && (
            <div className="space-y-2 rounded-lg border border-danger-line bg-danger-soft/40 p-3">
              <TextAreaField
                label="Reason (kept on the lead's history)"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Requires personal care and medication administration — outside scope."
              />
              <Button variant="danger" size="sm" onClick={handleDecline}>Confirm decline</Button>
            </div>
          )}
        </CardBody>
      </Card>

      {lead.type === "aged_care_provider_prospect" && org && (
        <Card>
          <CardHeader><CardTitle>Provider</CardTitle></CardHeader>
          <CardBody className="space-y-1 text-sm text-ink">
            <p className="font-medium">{org.tradingName ?? org.legalName}</p>
            <p className="text-ink-soft">{org.contactEmail} · {org.contactPhone}</p>
            <Badge tone={org.registrationVerifiedAt ? "success" : "amber"}>
              {org.registrationVerifiedAt ? `Registration verified ${formatDateShort(org.registrationVerifiedAt)}` : "Registration not yet verified"}
            </Badge>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Requested</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><p className="text-ink-faint">Services</p><p className="text-ink">{lead.requestedServices.join(", ") || "—"}</p></div>
          <div><p className="text-ink-faint">Days</p><p className="text-ink">{lead.proposedDays.join(", ") || "—"}</p></div>
          <div><p className="text-ink-faint">Hours / visit</p><p className="text-ink">{lead.hoursPerVisit ?? "—"}</p></div>
          <div><p className="text-ink-faint">Weekly frequency</p><p className="text-ink">{lead.weeklyFrequency ?? "—"}</p></div>
          <div><p className="text-ink-faint">Travel estimate</p><p className="text-ink">{lead.travelEstimateMinutes ? `${lead.travelEstimateMinutes} min` : "—"}</p></div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rate — kept distinct</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-line pb-2">
            <span className="text-ink-soft">Advertised by provider (reference only)</span>
            <span className="tabular font-medium">{lead.advertisedProviderRateCents != null ? `${formatCents(lead.advertisedProviderRateCents)}/h` : "—"}</span>
          </div>
          <div className="flex justify-between border-b border-line pb-2">
            <span className="text-ink-soft">Proposed to worker</span>
            <span className="tabular font-medium">{lead.proposedWorkerRateCents != null ? `${formatCents(lead.proposedWorkerRateCents)}/h` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Contractually agreed</span>
            <span className="tabular font-medium">{lead.agreedWorkerRateCents != null ? `${formatCents(lead.agreedWorkerRateCents)}/h` : "Not yet agreed"}</span>
          </div>
        </CardBody>
      </Card>

      {lead.fitFactors && (
        <Card>
          <CardHeader><CardTitle>Fit rubric (commercial/logistics only — never protected traits)</CardTitle></CardHeader>
          <CardBody className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Service/scope fit</span><span className="tabular">{lead.fitFactors.serviceScopeFit}/30</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Schedule fit</span><span className="tabular">{lead.fitFactors.scheduleFit}/25</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Net earning potential</span><span className="tabular">{lead.fitFactors.netEarningPotential}/25</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Travel</span><span className="tabular">{lead.fitFactors.travel}/15</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Readiness to commence</span><span className="tabular">{lead.fitFactors.readinessToCommence}/5</span></div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
        <CardBody>
          <TemplateBox options={templates} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <div className="flex gap-2">
            <TextAreaField
              label="Log a call or note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Called, left voicemail re: provider approval."
              className="flex-1"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (!note.trim()) return;
              addLeadActivity(lead.id, note.trim());
              setNote("");
            }}
          >
            Log activity
          </Button>
          <ul className="space-y-1.5 text-sm">
            {[...(lead.activityLog ?? [])].reverse().map((a, i) => (
              <li key={i} className="border-l-2 border-line pl-2.5 text-ink-soft">
                <span className="tabular text-ink-faint">{formatDateShort(a.at)}</span> — {a.note}
              </li>
            ))}
            {lead.lastContactAt && (!lead.activityLog || lead.activityLog.length === 0) && (
              <li className="text-ink-faint">Last contact {formatDateShort(lead.lastContactAt)}</li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
