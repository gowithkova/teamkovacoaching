"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { LEAD_PIPELINE_ORDER, LEAD_STATUS_LABEL } from "@/lib/types";
import { LeadCard } from "@/components/leads/LeadCard";
import { ProviderCard } from "@/components/leads/ProviderCard";
import { Button } from "@/components/ui/Button";
import { QuickAddMenu } from "@/components/shell/QuickAddMenu";

const DECLINED_STATUSES = ["not_suitable", "lost", "archived"] as const;

export default function LeadsPage() {
  const { leads, organisations } = useStore();
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
          {pipelineLeads.length === 0 && <p className="text-sm text-ink-soft">No leads in the active pipeline.</p>}
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

      <QuickAddMenu open={addOpen} onClose={() => setAddOpen(false)} startWithLeadForm />
    </div>
  );
}
