"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectField, TextField } from "@/components/ui/Field";
import { TemplateBox } from "@/components/shared/TemplateBox";
import type { Invoice } from "@/lib/types";
import { INVOICE_STATUS_LABEL } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { invoiceOutstandingCents, invoicePaidCents, invoiceTotalCents } from "@/lib/invoicing";
import { formatDateShort } from "@/lib/dates";
import { paymentReminder } from "@/lib/templates";
import { useStore } from "@/lib/store";

export function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { approveInvoice, issueInvoice, recordPayment } = useStore();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"eft" | "cash" | "card" | "other">("eft");
  const [reference, setReference] = useState("");

  if (!invoice) return <Modal open={false} onClose={onClose} title="Invoice"><div /></Modal>;

  const invoiceId = invoice.id;
  const total = invoiceTotalCents(invoice);
  const paid = invoicePaidCents(invoice);
  const outstanding = invoiceOutstandingCents(invoice);

  function submitPayment() {
    const cents = Math.round((Number(amount) || 0) * 100);
    if (cents <= 0) return;
    recordPayment(invoiceId, { amountCents: cents, paidAt: new Date().toISOString(), method, reference: reference || undefined });
    setAmount("");
    setReference("");
  }

  return (
    <Modal open={!!invoice} onClose={onClose} title={`Invoice ${invoice.number}`} widthClassName="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{invoice.payerLabel}</p>
            <p className="text-xs text-ink-soft">Issued {formatDateShort(invoice.issueDate)} · Due {formatDateShort(invoice.dueDate)}</p>
          </div>
          <Badge tone="neutral">{INVOICE_STATUS_LABEL[invoice.status]}</Badge>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-faint">
              <th className="py-1.5 font-normal">Date</th>
              <th className="font-normal">Description</th>
              <th className="font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-line">
                <td className="py-1.5 tabular text-ink-soft">{formatDateShort(line.serviceDate)}</td>
                <td className="text-ink">
                  {line.description}
                  {line.eligibilityReviewState === "needs_review" && <Badge tone="amber" className="ml-1.5">Review</Badge>}
                </td>
                <td className="tabular text-right text-ink">{formatCents(line.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-6 text-sm">
          <span className="text-ink-soft">Total <span className="tabular font-medium text-ink">{formatCents(total)}</span></span>
          <span className="text-ink-soft">Paid <span className="tabular font-medium text-success">{formatCents(paid)}</span></span>
          <span className="text-ink-soft">Outstanding <span className="tabular font-medium text-amber">{formatCents(outstanding)}</span></span>
        </div>

        {invoice.payments.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Payments</p>
            <ul className="space-y-1 text-sm text-ink-soft">
              {invoice.payments.map((p) => (
                <li key={p.id}>{formatDateShort(p.paidAt)} · {formatCents(p.amountCents)} · {p.method.toUpperCase()} {p.reference && `(${p.reference})`}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          {invoice.status === "draft" && <Button variant="secondary" onClick={() => approveInvoice(invoice.id)}>Approve</Button>}
          {invoice.status === "approved" && <Button variant="primary" onClick={() => issueInvoice(invoice.id)}>Issue to payer</Button>}
        </div>

        {outstanding > 0 && invoice.status !== "draft" && (
          <div className="space-y-2 rounded-lg border border-line p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Record a payment</p>
            <div className="grid grid-cols-3 gap-2">
              <TextField label="Amount ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <SelectField label="Method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                <option value="eft">EFT</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </SelectField>
              <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button variant="primary" size="sm" onClick={submitPayment}>Record payment</Button>
          </div>
        )}

        {outstanding > 0 && invoice.status !== "draft" && (
          <TemplateBox
            options={[
              { key: "reminder", label: "Payment reminder", text: paymentReminder(invoice.number, outstanding, formatDateShort(invoice.dueDate)) },
            ]}
          />
        )}
      </div>
    </Modal>
  );
}
