import type {
  ActionTask,
  Client,
  Credential,
  Engagement,
  Invoice,
  Lead,
  VisitSession,
} from "@/lib/types";
import { formatDateShort, isSameBrisbaneDay } from "@/lib/dates";
import { invoiceAgeingBucket, isInvoiceOutstanding } from "@/lib/invoicing";
import { formatCents } from "@/lib/money";
import { detectSessionConflicts } from "@/lib/conflicts";
import type { AvailabilityBlock } from "@/lib/types";

const TIER_ORDER: ActionTask["priority"][] = ["blocker", "today_service", "money", "lead", "admin"];

interface PriorityInput {
  sessions: VisitSession[];
  engagements: Engagement[];
  clients: Client[];
  leads: Lead[];
  invoices: Invoice[];
  credentials: Credential[];
  blocks: AvailabilityBlock[];
  now?: string;
}

function clientLabel(clients: Client[], clientId: string) {
  return clients.find((c) => c.id === clientId)?.displayName ?? "Client";
}

export function computePriorityQueue(input: PriorityInput): ActionTask[] {
  const now = input.now ?? new Date().toISOString();
  const tasks: ActionTask[] = [];
  let seq = 0;
  const id = (prefix: string) => `${prefix}-${seq++}`;

  // Tier: blocker
  for (const cred of input.credentials) {
    if (cred.verificationStatus === "expired") {
      tasks.push({
        id: id("task-cred-expired"),
        label: `Expired credential: ${cred.name} — resolve before more bookings`,
        priority: "blocker",
        linkHref: "/documents",
        done: false,
      });
    }
  }
  for (const eng of input.engagements) {
    if (eng.readinessState === "red" || (eng.readinessState === "amber" && eng.readinessBlockers.length > 0)) {
      tasks.push({
        id: id("task-eng-blocker"),
        label: `Resolve blocker for ${clientLabel(input.clients, eng.clientId)}: ${eng.readinessBlockers[0]}`,
        priority: "blocker",
        linkHref: `/clients/${eng.clientId}`,
        done: false,
      });
    }
  }
  for (const session of input.sessions) {
    if (session.status !== "proposed" && session.status !== "tentative") continue;
    const conflicts = detectSessionConflicts(session, input.sessions, input.blocks);
    if (conflicts.length > 0) {
      tasks.push({
        id: id("task-conflict"),
        label: `Booking conflict for ${clientLabel(input.clients, session.clientId)} on ${formatDateShort(session.plannedStart)}: ${conflicts[0].message}`,
        priority: "blocker",
        linkHref: "/calendar",
        done: false,
      });
    }
  }

  // Tier: today's service time
  for (const session of input.sessions) {
    if (session.status === "completed" && !session.noteId) {
      tasks.push({
        id: id("task-note"),
        label: `Finish the session note for ${clientLabel(input.clients, session.clientId)} (${formatDateShort(session.plannedStart)})`,
        priority: "today_service",
        linkHref: `/sessions/${session.id}`,
        done: false,
      });
    }
    if ((session.status === "tentative" || session.status === "proposed") && isSameBrisbaneDay(session.plannedStart, now)) {
      tasks.push({
        id: id("task-confirm-today"),
        label: `Confirm today's visit with ${clientLabel(input.clients, session.clientId)}`,
        priority: "today_service",
        linkHref: "/calendar",
        done: false,
      });
    }
  }

  // Tier: immediate collectable money
  for (const session of input.sessions) {
    if (session.status === "completed" && session.noteId && !session.invoiceLineId) {
      tasks.push({
        id: id("task-invoice"),
        label: `Send the invoice for completed work with ${clientLabel(input.clients, session.clientId)}`,
        priority: "money",
        linkHref: "/money",
        done: false,
      });
    }
  }
  for (const invoice of input.invoices) {
    if (!isInvoiceOutstanding(invoice)) continue;
    const bucket = invoiceAgeingBucket(invoice);
    if (bucket === "15-30" || bucket === "30+") {
      tasks.push({
        id: id("task-overdue"),
        label: `Follow up overdue invoice ${invoice.number} (${formatCents(invoice.lines.reduce((a, l) => a + l.amountCents, 0))}) — ${invoice.payerLabel}`,
        priority: "money",
        linkHref: `/money`,
        done: false,
      });
    }
  }

  // Tier: lead conversion
  for (const lead of input.leads) {
    if (["active", "lost", "not_suitable", "archived"].includes(lead.status)) continue;
    if (!lead.nextActionAt) continue;
    if (new Date(lead.nextActionAt).getTime() <= new Date(now).getTime()) {
      tasks.push({
        id: id("task-lead"),
        label: lead.nextActionLabel ?? `Follow up lead: ${lead.displayAlias}`,
        priority: "lead",
        linkHref: `/leads/${lead.id}`,
        done: false,
      });
    }
  }

  // Tier: general admin
  for (const cred of input.credentials) {
    if (cred.verificationStatus === "expiring_soon") {
      tasks.push({
        id: id("task-cred-soon"),
        label: `Renew ${cred.name} — expiring ${cred.expiryDate ? formatDateShort(cred.expiryDate) : "soon"}`,
        priority: "admin",
        linkHref: "/documents",
        done: false,
      });
    }
  }

  return tasks.sort((a, b) => TIER_ORDER.indexOf(a.priority) - TIER_ORDER.indexOf(b.priority));
}
