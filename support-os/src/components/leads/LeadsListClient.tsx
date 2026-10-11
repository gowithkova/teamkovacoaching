"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { LEAD_PIPELINE_ORDER, LEAD_STATUS_LABEL, type Lead, type Organisation } from "@/lib/types";
import { LeadCard } from "@/components/leads/LeadCard";
import { ProviderCard } from "@/components/leads/ProviderCard";
import { Button } from "@/components/ui/Button";
import { QuickAddLeadModal } from "@/components/leads/QuickAddLeadModal";

const DECLINED_STATUSES = ["not_suitable", "lost", "archived"] as const;

export function LeadsListClient({ leads, organisations }: { leads: Lead[]; organisations: Organisation[] }) {
  const [tab, setTab] = useState<"pipeline" | "providers" | "declined">("pipeline");
  const [addOpen, setAddOpen] = useState(false);

  const pipelineLeads = useMemo(
    () => leads.filter((l) => l.type !== "aged_care_provider_prospect" && !DECLINED_STATUSES.includes(l.status as never)),
    [leads],
  );
  const providerLeads = useMemo(() => leads.filter((l) => l.type === "aged_care_provider_prospect"), [leads]);
  const declinedLeads = useMemo(() => leads.filter((l) => DECLINED_STATUSES.includes(l.status as never)), [leads]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {(
            [
              ["pipeline", `Pipeline (${pipelineLeads.length})`],
              ["providers", `Providers (${providerLeads.length})`],
              ["declined", `Declined (${declinedLeads.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === key ? "bg-accent-soft text-accent-strong" : "text-ink-soft hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} aria-hidden="true" /> New lead
        </Button>
      </div>

      {leads.length === 0 && (
        <p className="rounded-lg border border-line bg-surface-sunken px-3 py-2.5 text-sm text-ink-soft">
          No leads yet — this account starts empty. Add your first lead to get going.
        </p>
      )}

      {tab === "pipeline" && (
        <div className="space-y-5">
          {LEAD_PIPELINE_ORDER.map((status) => {
            const group = pipelineLeads.filter((l) => l.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {LEAD_STATUS_LABEL[status]} ({group.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "providers" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {providerLeads.map((lead) => (
            <ProviderCard key={lead.id} lead={lead} org={organisations.find((o) => o.id === lead.assignedOrgId)} />
          ))}
          {providerLeads.length === 0 && <p className="text-sm text-ink-soft">No provider prospects yet.</p>}
        </div>
      )}

      {tab === "declined" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {declinedLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {declinedLeads.length === 0 && <p className="text-sm text-ink-soft">Nothing declined.</p>}
        </div>
      )}

      <QuickAddLeadModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
