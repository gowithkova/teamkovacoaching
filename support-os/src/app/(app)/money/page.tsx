"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { PriceBook } from "@/components/money/PriceBook";
import { QuoteCalculator } from "@/components/money/QuoteCalculator";
import { InvoiceDetailModal } from "@/components/money/InvoiceDetailModal";
import { FUNDING_LANE_LABEL, INVOICE_STATUS_LABEL } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";
import { ageingBreakdown, invoiceOutstandingCents, invoiceTotalCents } from "@/lib/invoicing";
import { forecastByLaneCents, forecastWeeks } from "@/lib/forecast";
import { invoicedThisWeekCents, overdueCents, receivedThisWeekCents } from "@/lib/selectors";
import { cn } from "@/lib/cn";

type Tab = "overview" | "pricebook" | "calculator" | "invoices";

export default function MoneyPage() {
  const { sessions, engagements, clients, invoices, rateItems } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) ?? null;

  const weeks = useMemo(() => forecastWeeks(sessions, engagements, 4, 0), [sessions, engagements]);
  const laneForecast = useMemo(() => forecastByLaneCents(sessions, engagements, clients, 4), [sessions, engagements, clients]);
  const ageing = useMemo(() => ageingBreakdown(invoices), [invoices]);
  const thisWeek = weeks[0];

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()),
    [invoices],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1 scrollbar-none">
        {(
          [
            ["overview", "Overview"],
            ["pricebook", "Price book"],
            ["calculator", "Calculator"],
            ["invoices", `Invoices (${invoices.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium",
              tab === key ? "bg-accent-soft text-accent-strong" : "text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>This week</CardTitle></CardHeader>
            <CardBody className="flex flex-wrap gap-4">
              <StatTile label="Earned (confirmed)" value={formatCents(thisWeek.confirmedCents)} tone="success" />
              <StatTile label="Invoiced" value={formatCents(invoicedThisWeekCents(invoices))} />
              <StatTile label="Received" tone="success" value={formatCents(receivedThisWeekCents(invoices))} />
              <StatTile label="Overdue" tone={overdueCents(invoices) > 0 ? "danger" : "default"} value={formatCents(overdueCents(invoices))} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>4-week forecast by funding lane</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {Object.entries(laneForecast).map(([lane, v]) => (
                <div key={lane} className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0">
                  <span className="text-ink-soft">{FUNDING_LANE_LABEL[lane as keyof typeof FUNDING_LANE_LABEL]}</span>
                  <span className="tabular">
                    <span className="font-medium text-success">{formatCents(v.confirmedCents)}</span>
                    {v.proposedCents > 0 && <span className="text-ink-faint"> +{formatCents(v.proposedCents)} proposed</span>}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Outstanding invoices by age</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["0-7", "8-14", "15-30", "30+"] as const).map((bucket) => (
                <StatTile key={bucket} label={`${bucket} days`} tone={bucket === "15-30" || bucket === "30+" ? "amber" : "default"} value={formatCents(ageing[bucket])} />
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "pricebook" && <PriceBook items={rateItems} />}
      {tab === "calculator" && <QuoteCalculator />}

      {tab === "invoices" && (
        <div className="space-y-2">
          {sortedInvoices.map((inv) => (
            <button key={inv.id} onClick={() => setSelectedInvoiceId(inv.id)} className="block w-full text-left">
              <Card className="hover:border-accent">
                <CardBody className="flex items-center justify-between pt-4 text-sm">
                  <div>
                    <p className="font-medium text-ink">{inv.number} · {inv.payerLabel}</p>
                    <p className="text-ink-soft">Issued {formatDateShort(inv.issueDate)} · Due {formatDateShort(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular font-medium text-ink">{formatCents(invoiceTotalCents(inv))}</p>
                    {invoiceOutstandingCents(inv) > 0 && <p className="tabular text-xs text-amber">{formatCents(invoiceOutstandingCents(inv))} outstanding</p>}
                  </div>
                  <Badge tone="neutral">{INVOICE_STATUS_LABEL[inv.status]}</Badge>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoiceId(null)} />
    </div>
  );
}
