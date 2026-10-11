"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField } from "@/components/ui/Field";
import { createLead } from "@/lib/db/leads";
import type { FundingLane, LeadType } from "@/lib/types";
import { FUNDING_LANE_LABEL, LEAD_TYPE_LABEL } from "@/lib/types";

export function QuickAddLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [alias, setAlias] = useState("");
  const [suburb, setSuburb] = useState("");
  const [type, setType] = useState<LeadType>("private_pay_household");
  const [fundingLane, setFundingLane] = useState<FundingLane>("private_pay");
  const [source, setSource] = useState("Direct enquiry");

  function reset() {
    setAlias("");
    setSuburb("");
    setSource("Direct enquiry");
  }

  function submit() {
    if (!alias.trim()) return;
    startTransition(async () => {
      await createLead({
        type,
        displayAlias: alias.trim(),
        source,
        suburb: suburb.trim() || "Not recorded",
        fundingLane,
      });
      reset();
      onClose();
      router.push("/leads");
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="New lead">
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
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!alias.trim() || isPending}>
            {isPending ? "Adding…" : "Add to pipeline"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
