"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";

const REASONS = ["Not urgent right now", "Waiting on someone else", "Will do tomorrow", "Already handled elsewhere"];

export function SnoozeButton({ onSnooze }: { onSnooze: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-sunken hover:text-ink-soft"
        aria-label="Snooze this task"
      >
        <Clock size={16} aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Snooze this task">
        <div className="space-y-3">
          <SelectField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </SelectField>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                onSnooze(reason);
                setOpen(false);
              }}
            >
              Snooze
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
