/**
 * Domain types for KOVA Support OS, simplified from the blueprint's section 8
 * data model for the Gate 1 synthetic prototype. Money is integer cents AUD.
 * Durations are integer minutes. Dates/times are ISO 8601 UTC strings;
 * display always converts to Australia/Brisbane.
 */

export type FundingLane =
  | "support_at_home"
  | "ndis"
  | "private_pay"
  | "premium_private";

export const FUNDING_LANE_LABEL: Record<FundingLane, string> = {
  support_at_home: "Support at Home (subcontractor)",
  ndis: "NDIS self/plan-managed",
  private_pay: "Private pay",
  premium_private: "Premium private service",
};

export type OrganisationType =
  | "aged_provider"
  | "plan_manager"
  | "coordinator"
  | "referral"
  | "other";

export interface Organisation {
  id: string;
  legalName: string;
  tradingName?: string;
  organisationType: OrganisationType;
  abn?: string;
  registrationVerifiedAt?: string | null;
  paymentTermsDays?: number;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  status: "prospect" | "active" | "inactive";
}

export type ContactRole =
  | "participant"
  | "authorised_representative"
  | "provider_contact"
  | "plan_manager"
  | "emergency_contact"
  | "other";

export interface Contact {
  id: string;
  organisationId?: string;
  clientId?: string;
  name: string;
  preferredName?: string;
  role: ContactRole;
  phone?: string;
  email?: string;
  preferredContact?: "phone" | "email" | "sms";
}

export type LeadType =
  | "ndis_participant"
  | "support_at_home_participant"
  | "aged_care_provider_prospect"
  | "private_pay_household"
  | "platform_listing";

export const LEAD_TYPE_LABEL: Record<LeadType, string> = {
  ndis_participant: "NDIS participant / coordinator referral",
  support_at_home_participant: "Support at Home participant",
  aged_care_provider_prospect: "Aged-care provider prospect",
  private_pay_household: "Private-pay household",
  platform_listing: "Platform listing / application",
};

export type LeadStatus =
  | "inbox"
  | "contacted"
  | "qualified"
  | "call_meeting"
  | "proposal_pending"
  | "won_onboarding"
  | "active"
  | "lost"
  | "not_suitable"
  | "archived";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  inbox: "Inbox",
  contacted: "Contacted",
  qualified: "Qualified",
  call_meeting: "Call / meeting",
  proposal_pending: "Proposal / approval pending",
  won_onboarding: "Won / onboarding",
  active: "Active",
  lost: "Lost",
  not_suitable: "Not suitable",
  archived: "Archived",
};

export const LEAD_PIPELINE_ORDER: LeadStatus[] = [
  "inbox",
  "contacted",
  "qualified",
  "call_meeting",
  "proposal_pending",
  "won_onboarding",
  "active",
];

export type LeadReadinessBadge =
  | "unverified"
  | "need_provider_approval"
  | "ready_to_quote"
  | "awaiting_response";

export const LEAD_READINESS_LABEL: Record<LeadReadinessBadge, string> = {
  unverified: "Unverified",
  need_provider_approval: "Need provider approval",
  ready_to_quote: "Ready to quote",
  awaiting_response: "Awaiting response",
};

export interface FitFactors {
  serviceScopeFit: number; // 0-30
  scheduleFit: number; // 0-25
  netEarningPotential: number; // 0-25
  travel: number; // 0-15
  readinessToCommence: number; // 0-5
}

export interface Lead {
  id: string;
  type: LeadType;
  displayAlias: string;
  source: string;
  suburb: string;
  fundingLane: FundingLane;
  requestedServices: string[];
  proposedDays: string[];
  hoursPerVisit?: number;
  weeklyFrequency?: number;
  advertisedProviderRateCents?: number | null;
  proposedWorkerRateCents?: number | null;
  agreedWorkerRateCents?: number | null;
  travelEstimateMinutes?: number;
  fitFactors?: FitFactors;
  status: LeadStatus;
  statusReason?: string;
  readinessBadge: LeadReadinessBadge;
  assignedOrgId?: string;
  nextActionAt?: string | null;
  nextActionLabel?: string;
  lastContactAt?: string;
  createdAt: string;
  convertedClientId?: string | null;
  activityLog?: { at: string; note: string }[];
}

export interface SupportBrief {
  approvedActivities: string[];
  excludedActivities: string[];
  instructions?: string;
  emergencyInstruction?: string;
}

export interface Client {
  id: string;
  displayName: string;
  preferredName?: string;
  pronounsOptional?: string;
  suburb: string;
  fundingLane: FundingLane;
  activeStatus: "active" | "paused" | "ended";
  responsibleOrgId?: string;
  contractedPayerId?: string; // organisation or contact that is actually billed
  contractedPayerLabel: string;
  supportBrief: SupportBrief;
  lastReviewAt?: string;
  createdAt: string;
}

export type ReadinessState = "red" | "amber" | "green";

export interface Engagement {
  id: string;
  clientId: string;
  fundingLane: FundingLane;
  scopeAllowed: string[];
  scopeExcluded: string[];
  startDate: string;
  endDate?: string | null;
  providerApprovalStatus: "not_required" | "pending" | "granted" | "declined";
  transportConsentStatus: "not_required" | "pending" | "granted";
  readinessState: ReadinessState;
  readinessBlockers: string[];
  cancellationTerms: string;
  travelTerms: string;
  billingTerms: string;
  agreedWorkerRateCents: number;
  rateUnit: "hour" | "visit";
  status: "draft" | "active" | "ended";
}

export type AvailabilityBlockType =
  | "available"
  | "parenting"
  | "other_employment"
  | "personal"
  | "unavailable"
  | "travel_buffer";

export const AVAILABILITY_LABEL: Record<AvailabilityBlockType, string> = {
  available: "Available",
  parenting: "Parenting",
  other_employment: "Other employment",
  personal: "Personal",
  unavailable: "Unavailable",
  travel_buffer: "Travel buffer",
};

export interface AvailabilityBlock {
  id: string;
  startAt: string;
  endAt: string;
  blockType: AvailabilityBlockType;
  displayLabel: string;
  recurring?: boolean;
}

export type SessionStatus =
  | "proposed"
  | "tentative"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "invoiced"
  | "paid"
  | "cancelled"
  | "no_show"
  | "disputed";

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  proposed: "Proposed",
  tentative: "Tentative",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  reviewed: "Reviewed",
  invoiced: "Invoiced",
  paid: "Paid",
  cancelled: "Cancelled",
  no_show: "No show",
  disputed: "Disputed",
};

export interface VisitSession {
  id: string;
  engagementId: string;
  clientId: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: SessionStatus;
  suburb: string;
  serviceType: string;
  travelBufferBeforeMin: number;
  travelBufferAfterMin: number;
  noteId?: string | null;
  invoiceLineId?: string | null;
  cancellation?: {
    recordedAt: string;
    reason: string;
    chargeable: boolean;
    chargeableReason: string;
  };
}

export interface ServiceNote {
  id: string;
  sessionId: string;
  activities: string;
  participantResponse: string;
  factualObservations: string;
  nextSteps: string;
  createdAt: string;
  lockedAt?: string | null;
}

export interface RateItem {
  id: string;
  lane: FundingLane;
  serviceCategory: string;
  code?: string;
  daypart?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  capAmountCents?: number | null;
  agreedWorkerRateCents: number;
  gstRuleStatus: "gst_free" | "taxable" | "review_needed";
  sourceLabel: string;
  sourceUrl?: string;
  sourceCheckedAt?: string;
  version: number;
  approvedByOperator: boolean;
}

export type InvoiceStatus =
  | "draft"
  | "approved"
  | "issued"
  | "part_paid"
  | "paid"
  | "overdue"
  | "disputed"
  | "voided";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  issued: "Issued",
  part_paid: "Part-paid",
  paid: "Paid",
  overdue: "Overdue",
  disputed: "Disputed",
  voided: "Voided",
};

export interface InvoiceLine {
  id: string;
  sessionId?: string;
  serviceDate: string;
  description: string;
  supportItemCode?: string;
  quantityHours: number;
  unitPriceCents: number;
  amountCents: number;
  gstRule: "gst_free" | "taxable" | "review_needed";
  eligibilityReviewState: "ok" | "needs_review" | "blocked";
  eligibilityNote?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  paidAt: string;
  method: "eft" | "cash" | "card" | "other";
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  payerLabel: string;
  fundingLane: FundingLane;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  payments: Payment[];
  gstTreatment: "gst_free" | "taxable" | "review_needed";
}

export type CredentialStatus = "valid" | "expiring_soon" | "expired" | "pending_verification";

export interface Credential {
  id: string;
  name: string;
  kind: string;
  issuer?: string;
  effectiveDate?: string;
  expiryDate?: string | null;
  verificationStatus: CredentialStatus;
  relevantLanes: FundingLane[];
}

export type IncidentStatus = "open" | "monitoring" | "closed";

export interface Incident {
  id: string;
  clientId?: string;
  sessionId?: string;
  occurredAt: string;
  factualDescription: string;
  immediateActions: string;
  authorityNotifiedStatus: "not_notified" | "user_confirmed_notified" | "escalated";
  followUpDue?: string | null;
  resolutionStatus: IncidentStatus;
}

export type TaskPriority = "blocker" | "today_service" | "money" | "lead" | "admin";

export interface ActionTask {
  id: string;
  label: string;
  priority: TaskPriority;
  linkHref?: string;
  dueAt?: string | null;
  snoozedUntil?: string | null;
  snoozeReason?: string;
  done: boolean;
}

export interface OperatorSettings {
  tradingName: string;
  abn: string;
  weeklyGrossTargetCents: number;
  maxTravelMinutesPerDay: number;
  privacyScreenEnabled: boolean;
}
