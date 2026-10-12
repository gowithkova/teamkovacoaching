"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, FileText, NotebookPen, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { QuickAddLeadModal } from "@/components/leads/QuickAddLeadModal";

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
  const [showLeadForm, setShowLeadForm] = useState(startWithLeadForm);

  function closeAll() {
    setShowLeadForm(startWithLeadForm);
    onClose();
  }

  if (showLeadForm) {
    return <QuickAddLeadModal open={open} onClose={closeAll} />;
  }

  return (
    <Modal open={open} onClose={closeAll} title="Create new">
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
    </Modal>
  );
}
