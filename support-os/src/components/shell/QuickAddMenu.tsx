"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, FileText, NotebookPen, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import type { FundingLane, LeadType } from "@/lib/types";
import { FUNDING_LANE_LABEL, LEAD_TYPE_LABEL } from "@/lib/types";

export function QuickAddMenu({
  open,
  onClose,
  startWithLeadForm = false,
}: {
  open: boolean;
  onClose: () => void;
  startWithLeadForm?: boolean;
}) {
  const router = useRouter();
  const { addLead } = useStore();
  const [showLeadForm, setShowLeadForm] = useState(startWithLeadForm);
  const [alias, setAlias] = useState("");
  const [suburb, setSuburb] = useState("");
  const [type, setType] = useState<LeadType>("private_pay_household");
  const [fundingLane, setFundingLane] = useState<FundingLane>("private_pay");
  const [source, setSource] = useState("Direct enquiry");

  function closeAll() {
    setShowLeadForm(startWithLeadForm);
    setAlias("");
    setSuburb("");
    onClose();
  }

  function submitLead() {
    if (!alias.trim()) return;
    addLead({
      type,
      displayAlias: alias.trim(),
      source,
      suburb: suburb.trim() || "Not recorded",
      fundingLane,
      requestedServices: [],
      proposedDays: [],
    });
    closeAll();
    router.push("/leads");
  }

  return (
    <Modal open={open} onClose={closeAll} title={showLeadForm ? "New lead" : "Create new"}>
      {!showLeadForm ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowLeadForm(true)}
            className="flex flex-col items-start gap-2 rounded-lg border border-line-strong p-3 text-left hover:border-accent"
          >
            <UserPlus size={18} className="text-accent" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">New lead</span>
          </button>
          <button
            onClick={() => {
              closeAll();
              router.push("/calendar");
            }}
            className="flex flex-col items-start gap-2 rounded-lg border border-line-strong p-3 text-left hover:border-accent"
          >
            <CalendarPlus size={18} className="text-accent" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">New booking</span>
          </button>
          <button
            onClick={() => {
              closeAll();
              router.push("/sessions");
            }}
            className="flex flex-col items-start gap-2 rounded-lg border border-line-strong p-3 text-left hover:border-accent"
          >
            <NotebookPen size={18} className="text-accent" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">New note</span>
          </button>
          <button
            onClick={() => {
              closeAll();
              router.push("/money");
            }}
            className="flex flex-col items-start gap-2 rounded-lg border border-line-strong p-3 text-left hover:border-accent"
          >
            <FileText size={18} className="text-accent" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">New invoice</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <TextField label="Alias / short name" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="e.g. J. Smith (Burleigh)" />
          <TextField label="Suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Burleigh Heads" />
          <SelectField label="Opportunity type" value={type} onChange={(e) => setType(e.target.value as LeadType)}>
            {Object.entries(LEAD_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </SelectField>
          <SelectField label="Likely funding lane" value={fundingLane} onChange={(e) => setFundingLane(e.target.value as FundingLane)}>
            {Object.entries(FUNDING_LANE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </SelectField>
          <TextField label="Source" value={source} onChange={(e) => setSource(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowLeadForm(false)}>Back</Button>
            <Button variant="primary" onClick={submitLead} disabled={!alias.trim()}>Add to pipeline</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
