"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { formatCents } from "@/lib/money";
import { effectiveHourlyRateCents } from "@/lib/invoicing";

export function QuoteCalculator() {
  const [hours, setHours] = useState("2");
  const [rate, setRate] = useState("95");
  const [travelHours, setTravelHours] = useState("0.5");
  const [adminHours, setAdminHours] = useState("0.1");
  const [directCosts, setDirectCosts] = useState("0");
  const [taxReserve, setTaxReserve] = useState("20");

  const h = Number(hours) || 0;
  const r = Math.round((Number(rate) || 0) * 100);
  const grossCents = Math.round(h * r);
  const effective = effectiveHourlyRateCents(
    grossCents,
    Math.round((Number(directCosts) || 0) * 100),
    h,
    Number(travelHours) || 0,
    Number(adminHours) || 0,
  );
  const reserveCents = Math.round((grossCents * (Number(taxReserve) || 0)) / 100);

  return (
    <Card>
      <CardHeader><CardTitle>Quoted value calculator</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <TextField label="Service hours" type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
          <TextField label="Worker rate ($/h)" type="number" step="1" value={rate} onChange={(e) => setRate(e.target.value)} />
          <TextField label="Travel hours" type="number" step="0.1" value={travelHours} onChange={(e) => setTravelHours(e.target.value)} />
          <TextField label="Admin hours" type="number" step="0.1" value={adminHours} onChange={(e) => setAdminHours(e.target.value)} />
          <TextField label="Unreimbursed direct costs ($)" type="number" step="1" value={directCosts} onChange={(e) => setDirectCosts(e.target.value)} />
          <TextField label="Tax/super reserve (%, manual, not advice)" type="number" step="1" value={taxReserve} onChange={(e) => setTaxReserve(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-sunken p-3 sm:grid-cols-3">
          <div><p className="text-xs text-ink-faint">Gross value</p><p className="tabular text-lg font-semibold text-ink">{formatCents(grossCents)}</p></div>
          <div><p className="text-xs text-ink-faint">Effective hourly return</p><p className="tabular text-lg font-semibold text-success">{effective != null ? `${formatCents(effective)}/h` : "—"}</p></div>
          <div><p className="text-xs text-ink-faint">Suggested reserve (not tax advice)</p><p className="tabular text-lg font-semibold text-ink-soft">{formatCents(reserveCents)}</p></div>
        </div>
      </CardBody>
    </Card>
  );
}
