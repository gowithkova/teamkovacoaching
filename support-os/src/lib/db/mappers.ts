import type { Database } from "@/lib/supabase/database.types";
import type { Lead, LeadType, LeadStatus, LeadReadinessBadge, FundingLane } from "@/lib/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

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
