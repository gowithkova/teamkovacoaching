"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ReadinessBadge } from "@/components/ui/ReadinessBadge";
import { FUNDING_LANE_LABEL, INVOICE_STATUS_LABEL, SESSION_STATUS_LABEL } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { invoiceOutstandingCents, invoiceTotalCents } from "@/lib/invoicing";
import { formatDateShort, formatTimeRange, relativeDayLabel } from "@/lib/dates";
import { nextUpcomingSession } from "@/lib/selectors";

export function ClientDetailClient({ id }: { id: string }) {
  const { clients, engagements, contacts, sessions, serviceNotes, invoices, incidents } = useStore();
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">Client not found.</p>
        <Link href="/clients" className="text-sm text-accent-strong hover:underline">Back to clients</Link>
      </div>
    );
  }

  const engagement = engagements.find((e) => e.clientId === client.id);
  const clientContacts = contacts.filter((c) => c.clientId === client.id);
  const clientSessions = sessions
    .filter((s) => s.clientId === client.id)
    .sort((a, b) => new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime());
  const clientInvoices = invoices.filter((inv) => inv.clientId === client.id);
  const clientIncidents = incidents.filter((inc) => inc.clientId === client.id);
  const next = nextUpcomingSession(clientSessions);

  return (
    <div className="space-y-4">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Back to clients
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-ink">{client.displayName}</h2>
          <p className="text-sm text-ink-soft">{client.suburb} · {FUNDING_LANE_LABEL[client.fundingLane]}</p>
        </div>
        {engagement && <ReadinessBadge state={engagement.readinessState} />}
      </div>

      <Tabs
        items={[
          {
            key: "overview",
            label: "Overview",
            content: (
              <div className="space-y-3">
                <Card>
                  <CardBody className="grid grid-cols-2 gap-3 pt-4 text-sm sm:grid-cols-3">
                    <div><p className="text-ink-faint">Status</p><p className="capitalize text-ink">{client.activeStatus}</p></div>
                    <div><p className="text-ink-faint">Payer</p><p className="text-ink">{client.contractedPayerLabel}</p></div>
                    <div>
                      <p className="text-ink-faint">Next visit</p>
                      <p className="text-ink">{next ? `${relativeDayLabel(next.plannedStart)} ${formatTimeRange(next.plannedStart, next.plannedEnd)}` : "None scheduled"}</p>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Approved scope</CardTitle></CardHeader>
                  <CardBody className="flex flex-wrap gap-1.5">
                    {client.supportBrief.approvedActivities.map((a) => (
                      <Badge key={a} tone="success">{a}</Badge>
                    ))}
                  </CardBody>
                </Card>
                {client.supportBrief.excludedActivities.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Excluded — never schedule</CardTitle></CardHeader>
                    <CardBody className="flex flex-wrap gap-1.5">
                      {client.supportBrief.excludedActivities.map((a) => (
                        <Badge key={a} tone="danger">{a}</Badge>
                      ))}
                    </CardBody>
                  </Card>
                )}
              </div>
            ),
          },
          {
            key: "service",
            label: "Service",
            content: engagement ? (
              <div className="space-y-3">
                {engagement.readinessBlockers.length > 0 && (
                  <Card className="border-amber-line">
                    <CardBody className="space-y-1 pt-4">
                      <p className="text-sm font-semibold text-amber">Blockers before this can be billed</p>
                      <ul className="list-inside list-disc text-sm text-ink-soft">
                        {engagement.readinessBlockers.map((b) => <li key={b}>{b}</li>)}
                      </ul>
                    </CardBody>
                  </Card>
                )}
                <Card>
                  <CardBody className="grid grid-cols-2 gap-3 pt-4 text-sm sm:grid-cols-3">
                    <div><p className="text-ink-faint">Agreed rate</p><p className="tabular text-ink">{formatCents(engagement.agreedWorkerRateCents)}/{engagement.rateUnit}</p></div>
                    <div><p className="text-ink-faint">Provider approval</p><p className="capitalize text-ink">{engagement.providerApprovalStatus.replace("_", " ")}</p></div>
                    <div><p className="text-ink-faint">Transport consent</p><p className="capitalize text-ink">{engagement.transportConsentStatus.replace("_", " ")}</p></div>
                    <div className="col-span-2 sm:col-span-3"><p className="text-ink-faint">Cancellation terms</p><p className="text-ink">{engagement.cancellationTerms}</p></div>
                    <div className="col-span-2 sm:col-span-3"><p className="text-ink-faint">Travel terms</p><p className="text-ink">{engagement.travelTerms}</p></div>
                    <div className="col-span-2 sm:col-span-3"><p className="text-ink-faint">Billing terms</p><p className="text-ink">{engagement.billingTerms}</p></div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No engagement on file yet.</p>
            ),
          },
          {
            key: "contacts",
            label: "Contacts",
            content: (
              <div className="space-y-2">
                {clientContacts.length === 0 && <p className="text-sm text-ink-soft">No contacts recorded — minimum necessary only.</p>}
                {clientContacts.map((c) => (
                  <Card key={c.id}>
                    <CardBody className="flex items-center justify-between pt-4 text-sm">
                      <div>
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-ink-soft capitalize">{c.role.replace("_", " ")}</p>
                      </div>
                      <p className="text-ink-soft">{c.phone ?? c.email ?? "—"}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: "schedule",
            label: "Schedule",
            content: (
              <div className="space-y-2">
                <Link href="/calendar" className="text-sm text-accent-strong hover:underline">Open full calendar</Link>
                {clientSessions
                  .filter((s) => new Date(s.plannedStart) >= new Date())
                  .map((s) => (
                    <Card key={s.id}>
                      <CardBody className="flex items-center justify-between pt-4 text-sm">
                        <span>{relativeDayLabel(s.plannedStart)} {formatTimeRange(s.plannedStart, s.plannedEnd)} · {s.serviceType}</span>
                        <Badge tone="neutral">{SESSION_STATUS_LABEL[s.status]}</Badge>
                      </CardBody>
                    </Card>
                  ))}
              </div>
            ),
          },
          {
            key: "sessions",
            label: "Sessions & notes",
            content: (
              <div className="space-y-2">
                {clientSessions.map((s) => {
                  const note = serviceNotes.find((n) => n.id === s.noteId);
                  return (
                    <Link key={s.id} href={`/sessions/${s.id}`} className="block">
                      <Card className="hover:border-accent">
                        <CardBody className="space-y-1 pt-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-ink">{formatDateShort(s.plannedStart)} · {s.serviceType}</span>
                            <Badge tone="neutral">{SESSION_STATUS_LABEL[s.status]}</Badge>
                          </div>
                          {note && <p className="text-ink-soft">{note.activities}</p>}
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ),
          },
          {
            key: "invoices",
            label: "Invoices",
            content: (
              <div className="space-y-2">
                <Link href="/money" className="text-sm text-accent-strong hover:underline">Open Money</Link>
                {clientInvoices.map((inv) => (
                  <Card key={inv.id}>
                    <CardBody className="flex items-center justify-between pt-4 text-sm">
                      <div>
                        <p className="font-medium text-ink">{inv.number}</p>
                        <p className="text-ink-soft">{formatDateShort(inv.issueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="tabular font-medium text-ink">{formatCents(invoiceTotalCents(inv))}</p>
                        {invoiceOutstandingCents(inv) > 0 && (
                          <p className="tabular text-xs text-amber">{formatCents(invoiceOutstandingCents(inv))} outstanding</p>
                        )}
                      </div>
                      <Badge tone="neutral">{INVOICE_STATUS_LABEL[inv.status]}</Badge>
                    </CardBody>
                  </Card>
                ))}
                {clientInvoices.length === 0 && <p className="text-sm text-ink-soft">No invoices yet.</p>}
              </div>
            ),
          },
          {
            key: "documents",
            label: "Documents",
            content: <p className="text-sm text-ink-soft">No documents uploaded yet. Secure upload lands in Gate 4.</p>,
          },
          {
            key: "safety",
            label: "Safety",
            content: (
              <div className="space-y-3">
                {client.supportBrief.emergencyInstruction && (
                  <Card>
                    <CardHeader><CardTitle>Emergency instruction</CardTitle></CardHeader>
                    <CardBody><p className="text-sm text-ink">{client.supportBrief.emergencyInstruction}</p></CardBody>
                  </Card>
                )}
                <Card>
                  <CardHeader><CardTitle>Incidents</CardTitle></CardHeader>
                  <CardBody className="space-y-2">
                    {clientIncidents.length === 0 && <p className="text-sm text-ink-soft">No incidents recorded.</p>}
                    {clientIncidents.map((inc) => (
                      <div key={inc.id} className="rounded-lg border border-line p-2.5 text-sm">
                        <p className="text-ink-faint">{formatDateShort(inc.occurredAt)}</p>
                        <p className="text-ink">{inc.factualDescription}</p>
                      </div>
                    ))}
                    <Link href="/documents" className="text-sm text-accent-strong hover:underline">Open incident register</Link>
                  </CardBody>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
