"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACTION_TASK_SEED,
  AVAILABILITY_BLOCKS,
  CLIENTS,
  CONTACTS,
  CREDENTIALS,
  ENGAGEMENTS,
  INCIDENTS,
  INVOICES,
  LEADS,
  OPERATOR_SETTINGS,
  ORGANISATIONS,
  RATE_ITEMS,
  SERVICE_NOTES,
  SESSIONS,
} from "@/lib/fixtures";
import type {
  AvailabilityBlock,
  Client,
  Contact,
  Credential,
  Engagement,
  Incident,
  Invoice,
  InvoiceLine,
  Lead,
  LeadStatus,
  Organisation,
  Payment,
  RateItem,
  ServiceNote,
  VisitSession,
  OperatorSettings,
} from "@/lib/types";

interface StoreState {
  organisations: Organisation[];
  contacts: Contact[];
  clients: Client[];
  engagements: Engagement[];
  availabilityBlocks: AvailabilityBlock[];
  sessions: VisitSession[];
  serviceNotes: ServiceNote[];
  leads: Lead[];
  rateItems: RateItem[];
  invoices: Invoice[];
  credentials: Credential[];
  incidents: Incident[];
  settings: OperatorSettings;
  snoozedTaskLabels: string[];
}

function initialState(): StoreState {
  return {
    organisations: ORGANISATIONS,
    contacts: CONTACTS,
    clients: CLIENTS,
    engagements: ENGAGEMENTS,
    availabilityBlocks: AVAILABILITY_BLOCKS,
    sessions: SESSIONS,
    serviceNotes: SERVICE_NOTES,
    leads: LEADS,
    rateItems: RATE_ITEMS,
    invoices: INVOICES,
    credentials: CREDENTIALS,
    incidents: INCIDENTS,
    settings: OPERATOR_SETTINGS,
    snoozedTaskLabels: ACTION_TASK_SEED.map((t) => t.label),
  };
}

interface NoteDraft {
  activities: string;
  participantResponse: string;
  factualObservations: string;
  nextSteps: string;
}

interface StoreApi extends StoreState {
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "status" | "readinessBadge">) => void;
  setLeadStatus: (leadId: string, status: LeadStatus, reason?: string) => void;
  setLeadNextAction: (leadId: string, label: string, atIso: string | null) => void;
  addLeadActivity: (leadId: string, note: string) => void;
  convertLeadToClient: (leadId: string) => string;
  snoozeTaskLabel: (label: string) => void;
  confirmSession: (sessionId: string) => void;
  startSession: (sessionId: string) => void;
  completeSession: (sessionId: string, note: NoteDraft) => void;
  correctSessionTimes: (sessionId: string, actualStart: string, actualEnd: string) => void;
  recordCancellation: (
    sessionId: string,
    reason: string,
    chargeable: boolean,
    chargeableReason: string,
  ) => void;
  createDraftInvoiceFromSessions: (clientId: string, sessionIds: string[]) => string;
  approveInvoice: (invoiceId: string) => void;
  issueInvoice: (invoiceId: string) => void;
  recordPayment: (invoiceId: string, payment: Omit<Payment, "id" | "invoiceId">) => void;
  updateSettings: (partial: Partial<OperatorSettings>) => void;
  addIncident: (incident: Omit<Incident, "id" | "resolutionStatus" | "authorityNotifiedStatus"> & { authorityNotifiedStatus?: Incident["authorityNotifiedStatus"] }) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);

  const addLead = useCallback(
    (lead: Omit<Lead, "id" | "createdAt" | "status" | "readinessBadge">) => {
      const newLead: Lead = {
        ...lead,
        id: `lead-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "inbox",
        readinessBadge: "unverified",
      };
      setState((s) => ({ ...s, leads: [newLead, ...s.leads] }));
    },
    [],
  );

  const setLeadStatus = useCallback(
    (leadId: string, status: LeadStatus, reason?: string) => {
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) => (l.id === leadId ? { ...l, status, statusReason: reason ?? l.statusReason } : l)),
      }));
    },
    [],
  );

  const setLeadNextAction = useCallback((leadId: string, label: string, atIso: string | null) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) =>
        l.id === leadId ? { ...l, nextActionLabel: label, nextActionAt: atIso } : l,
      ),
    }));
  }, []);

  const addLeadActivity = useCallback((leadId: string, note: string) => {
    const nowIso = new Date().toISOString();
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) =>
        l.id === leadId
          ? { ...l, lastContactAt: nowIso, activityLog: [...(l.activityLog ?? []), { at: nowIso, note }] }
          : l,
      ),
    }));
  }, []);

  const convertLeadToClient = useCallback((leadId: string) => {
    let newClientId = "";
    setState((s) => {
      const lead = s.leads.find((l) => l.id === leadId);
      if (!lead) return s;
      if (lead.convertedClientId) {
        newClientId = lead.convertedClientId;
        return s;
      }
      newClientId = `client-${Date.now()}`;
      const engagementId = `eng-${Date.now()}`;
      const newClient: Client = {
        id: newClientId,
        displayName: lead.displayAlias,
        suburb: lead.suburb,
        fundingLane: lead.fundingLane,
        activeStatus: "active",
        responsibleOrgId: lead.assignedOrgId,
        contractedPayerLabel: "To be confirmed — complete the service agreement",
        supportBrief: {
          approvedActivities: lead.requestedServices,
          excludedActivities: [],
        },
        createdAt: new Date().toISOString(),
      };
      const needsProviderApproval = lead.fundingLane === "support_at_home";
      const newEngagement: Engagement = {
        id: engagementId,
        clientId: newClientId,
        fundingLane: lead.fundingLane,
        scopeAllowed: lead.requestedServices,
        scopeExcluded: [],
        startDate: new Date().toISOString(),
        providerApprovalStatus: needsProviderApproval ? "pending" : "not_required",
        transportConsentStatus: "pending",
        readinessState: "amber",
        readinessBlockers: [
          "New engagement — service agreement and consents not yet recorded",
          ...(needsProviderApproval ? ["Registered provider approval not yet granted"] : []),
        ],
        cancellationTerms: "To be agreed",
        travelTerms: "To be agreed",
        billingTerms: "To be agreed",
        agreedWorkerRateCents: lead.proposedWorkerRateCents ?? 0,
        rateUnit: "hour",
        status: "draft",
      };
      return {
        ...s,
        clients: [...s.clients, newClient],
        engagements: [...s.engagements, newEngagement],
        leads: s.leads.map((l) => (l.id === leadId ? { ...l, status: "won_onboarding", convertedClientId: newClientId } : l)),
      };
    });
    return newClientId;
  }, []);

  const snoozeTaskLabel = useCallback((label: string) => {
    setState((s) => ({ ...s, snoozedTaskLabels: [...s.snoozedTaskLabels, label] }));
  }, []);

  const confirmSession = useCallback((sessionId: string) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, status: "confirmed" } : sess,
      ),
    }));
  }, []);

  const startSession = useCallback((sessionId: string) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? { ...sess, status: "in_progress", actualStart: new Date().toISOString() }
          : sess,
      ),
    }));
  }, []);

  const completeSession = useCallback((sessionId: string, note: NoteDraft) => {
    setState((s) => {
      const nowIso = new Date().toISOString();
      const noteId = `note-${sessionId}-${Date.now()}`;
      const newNote: ServiceNote = { id: noteId, sessionId, createdAt: nowIso, ...note };
      return {
        ...s,
        sessions: s.sessions.map((sess) =>
          sess.id === sessionId
            ? { ...sess, status: "completed", actualEnd: sess.actualEnd ?? nowIso, noteId }
            : sess,
        ),
        serviceNotes: [...s.serviceNotes, newNote],
      };
    });
  }, []);

  const correctSessionTimes = useCallback(
    (sessionId: string, actualStart: string, actualEnd: string) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) =>
          sess.id === sessionId ? { ...sess, actualStart, actualEnd } : sess,
        ),
      }));
    },
    [],
  );

  const recordCancellation = useCallback(
    (sessionId: string, reason: string, chargeable: boolean, chargeableReason: string) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) =>
          sess.id === sessionId
            ? {
                ...sess,
                status: "cancelled",
                cancellation: {
                  recordedAt: new Date().toISOString(),
                  reason,
                  chargeable,
                  chargeableReason,
                },
              }
            : sess,
        ),
      }));
    },
    [],
  );

  const createDraftInvoiceFromSessions = useCallback(
    (clientId: string, sessionIds: string[]) => {
      const invoiceId = `invoice-draft-${Date.now()}`;
      setState((s) => {
        const client = s.clients.find((c) => c.id === clientId);
        const engagement = s.engagements.find((e) => e.clientId === clientId);
        if (!client || !engagement) return s;
        const targetSessions = s.sessions.filter((sess) => sessionIds.includes(sess.id));
        const lines: InvoiceLine[] = targetSessions.map((sess) => {
          const hours =
            (new Date(sess.actualEnd ?? sess.plannedEnd).getTime() -
              new Date(sess.actualStart ?? sess.plannedStart).getTime()) /
            3_600_000;
          const unitPriceCents = engagement.agreedWorkerRateCents;
          const isPerVisit = engagement.rateUnit === "visit";
          return {
            id: `line-${sess.id}`,
            sessionId: sess.id,
            serviceDate: sess.plannedStart,
            description: isPerVisit
              ? `${sess.serviceType} — 1 visit`
              : `${sess.serviceType} — ${hours.toFixed(1)} hours`,
            quantityHours: isPerVisit ? 1 : Math.round(hours * 100) / 100,
            unitPriceCents,
            amountCents: isPerVisit ? unitPriceCents : Math.round(hours * unitPriceCents),
            gstRule: "review_needed",
            eligibilityReviewState: "ok",
          };
        });
        const newInvoice: Invoice = {
          id: invoiceId,
          number: `DRAFT-${invoiceId.slice(-6)}`,
          clientId,
          payerLabel: client.contractedPayerLabel,
          fundingLane: client.fundingLane,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          status: "draft",
          lines,
          payments: [],
          gstTreatment: "review_needed",
        };
        return {
          ...s,
          invoices: [newInvoice, ...s.invoices],
          sessions: s.sessions.map((sess) =>
            sessionIds.includes(sess.id) ? { ...sess, invoiceLineId: `line-${sess.id}` } : sess,
          ),
        };
      });
      return invoiceId;
    },
    [],
  );

  const approveInvoice = useCallback((invoiceId: string) => {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: "approved" } : inv)),
    }));
  }, []);

  const issueInvoice = useCallback((invoiceId: string) => {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: "issued" } : inv)),
    }));
  }, []);

  const recordPayment = useCallback(
    (invoiceId: string, payment: Omit<Payment, "id" | "invoiceId">) => {
      setState((s) => ({
        ...s,
        invoices: s.invoices.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const newPayment: Payment = { ...payment, id: `pay-${Date.now()}`, invoiceId };
          const total = inv.lines.reduce((a, l) => a + l.amountCents, 0);
          const paid = inv.payments.reduce((a, p) => a + p.amountCents, 0) + newPayment.amountCents;
          const status = paid >= total ? "paid" : "part_paid";
          return { ...inv, payments: [...inv.payments, newPayment], status };
        }),
      }));
    },
    [],
  );

  const updateSettings = useCallback((partial: Partial<OperatorSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
  }, []);

  const addIncident = useCallback(
    (
      incident: Omit<Incident, "id" | "resolutionStatus" | "authorityNotifiedStatus"> & {
        authorityNotifiedStatus?: Incident["authorityNotifiedStatus"];
      },
    ) => {
      const newIncident: Incident = {
        ...incident,
        id: `incident-${Date.now()}`,
        resolutionStatus: "open",
        authorityNotifiedStatus: incident.authorityNotifiedStatus ?? "not_notified",
      };
      setState((s) => ({ ...s, incidents: [newIncident, ...s.incidents] }));
    },
    [],
  );

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      addLead,
      setLeadStatus,
      setLeadNextAction,
      addLeadActivity,
      convertLeadToClient,
      snoozeTaskLabel,
      confirmSession,
      startSession,
      completeSession,
      correctSessionTimes,
      recordCancellation,
      createDraftInvoiceFromSessions,
      approveInvoice,
      issueInvoice,
      recordPayment,
      updateSettings,
      addIncident,
    }),
    [
      state,
      addLead,
      setLeadStatus,
      setLeadNextAction,
      addLeadActivity,
      convertLeadToClient,
      snoozeTaskLabel,
      confirmSession,
      startSession,
      completeSession,
      correctSessionTimes,
      recordCancellation,
      createDraftInvoiceFromSessions,
      approveInvoice,
      issueInvoice,
      recordPayment,
      updateSettings,
      addIncident,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within DataStoreProvider");
  return ctx;
}
