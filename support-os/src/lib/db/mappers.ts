import type { Database } from "@/lib/supabase/database.types";
import type {
  AvailabilityBlock,
  AvailabilityBlockType,
  Client,
  Contact,
  ContactRole,
  Engagement,
  FundingLane,
  Lead,
  LeadReadinessBadge,
  LeadStatus,
  LeadType,
  ReadinessState,
  ServiceNote,
  SessionStatus,
  VisitSession,
} from "@/lib/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type EngagementRow = Database["public"]["Tables"]["engagements"]["Row"];
type AvailabilityBlockRow = Database["public"]["Tables"]["availability_blocks"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type ServiceNoteRow = Database["public"]["Tables"]["service_notes"]["Row"];

/** DB row (snake_case) -> app type (camelCase). Keep in lockstep with schema.sql. */
export function leadRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    type: row.type as LeadType,
    displayAlias: row.display_alias,
    source: row.source,
    suburb: row.suburb,
    fundingLane: row.funding_lane as FundingLane,
    requestedServices: row.requested_services,
    proposedDays: row.proposed_days,
    hoursPerVisit: row.hours_per_visit ?? undefined,
    weeklyFrequency: row.weekly_frequency ?? undefined,
    advertisedProviderRateCents: row.advertised_provider_rate_cents,
    proposedWorkerRateCents: row.proposed_worker_rate_cents,
    agreedWorkerRateCents: row.agreed_worker_rate_cents,
    travelEstimateMinutes: row.travel_estimate_minutes ?? undefined,
    fitFactors: row.fit_factors ?? undefined,
    status: row.status as LeadStatus,
    statusReason: row.status_reason ?? undefined,
    readinessBadge: row.readiness_badge as LeadReadinessBadge,
    assignedOrgId: row.assigned_org_id ?? undefined,
    nextActionAt: row.next_action_at,
    nextActionLabel: row.next_action_label ?? undefined,
    lastContactAt: row.last_contact_at ?? undefined,
    createdAt: row.created_at,
    convertedClientId: row.converted_client_id,
    activityLog: row.activity_log,
  };
}

export function contactRowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    organisationId: row.organisation_id ?? undefined,
    clientId: row.client_id ?? undefined,
    name: row.name,
    preferredName: row.preferred_name ?? undefined,
    role: row.role as ContactRole,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    preferredContact: row.preferred_contact ?? undefined,
  };
}

export function clientRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    displayName: row.display_name,
    preferredName: row.preferred_name ?? undefined,
    pronounsOptional: row.pronouns_optional ?? undefined,
    suburb: row.suburb,
    fundingLane: row.funding_lane as FundingLane,
    activeStatus: row.active_status,
    responsibleOrgId: row.responsible_org_id ?? undefined,
    contractedPayerId: row.contracted_payer_id ?? undefined,
    contractedPayerLabel: row.contracted_payer_label,
    supportBrief: row.support_brief,
    lastReviewAt: row.last_review_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function engagementRowToEngagement(row: EngagementRow): Engagement {
  return {
    id: row.id,
    clientId: row.client_id,
    fundingLane: row.funding_lane as FundingLane,
    scopeAllowed: row.scope_allowed,
    scopeExcluded: row.scope_excluded,
    startDate: row.start_date,
    endDate: row.end_date,
    providerApprovalStatus: row.provider_approval_status,
    transportConsentStatus: row.transport_consent_status,
    readinessState: row.readiness_state as ReadinessState,
    readinessBlockers: row.readiness_blockers,
    cancellationTerms: row.cancellation_terms,
    travelTerms: row.travel_terms,
    billingTerms: row.billing_terms,
    agreedWorkerRateCents: row.agreed_worker_rate_cents,
    rateUnit: row.rate_unit,
    status: row.status,
  };
}

export function availabilityBlockRowToBlock(row: AvailabilityBlockRow): AvailabilityBlock {
  return {
    id: row.id,
    startAt: row.start_at,
    endAt: row.end_at,
    blockType: row.block_type as AvailabilityBlockType,
    displayLabel: row.display_label,
    recurring: row.recurring,
  };
}

export function sessionRowToSession(row: SessionRow): VisitSession {
  return {
    id: row.id,
    engagementId: row.engagement_id,
    clientId: row.client_id,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    status: row.status as SessionStatus,
    suburb: row.suburb,
    serviceType: row.service_type,
    travelBufferBeforeMin: row.travel_buffer_before_min,
    travelBufferAfterMin: row.travel_buffer_after_min,
    noteId: row.note_id,
    invoiceLineId: row.invoice_line_id,
    cancellation: row.cancellation ?? undefined,
  };
}

export function serviceNoteRowToNote(row: ServiceNoteRow): ServiceNote {
  return {
    id: row.id,
    sessionId: row.session_id,
    activities: row.activities,
    participantResponse: row.participant_response,
    factualObservations: row.factual_observations,
    nextSteps: row.next_steps,
    createdAt: row.created_at,
    lockedAt: row.locked_at,
  };
}
