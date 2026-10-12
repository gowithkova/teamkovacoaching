/**
 * Hand-written to match supabase/schema.sql exactly, since there is no live
 * Supabase project yet to run `supabase gen types typescript` against. Once
 * a real project exists, regenerate this file from it and diff against
 * schema.sql to confirm they still agree — see docs/DECISIONS.md.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface FitFactorsJson {
  serviceScopeFit: number;
  scheduleFit: number;
  netEarningPotential: number;
  travel: number;
  readinessToCommence: number;
}

export interface SupportBriefJson {
  approvedActivities: string[];
  excludedActivities: string[];
  instructions?: string;
  emergencyInstruction?: string;
}

export interface CancellationJson {
  recordedAt: string;
  reason: string;
  chargeable: boolean;
  chargeableReason: string;
}

export interface ActivityLogEntryJson {
  at: string;
  note: string;
}

export interface Database {
  public: {
    Tables: {
      operator_profiles: {
        Row: {
          id: string;
          trading_name: string;
          abn: string | null;
          weekly_gross_target_cents: number;
          max_travel_minutes_per_day: number;
          privacy_screen_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          trading_name?: string;
          abn?: string | null;
          weekly_gross_target_cents?: number;
          max_travel_minutes_per_day?: number;
          privacy_screen_enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["operator_profiles"]["Insert"]>;
        Relationships: never[];
      };
      organisations: {
        Row: {
          id: string;
          owner_id: string;
          legal_name: string;
          trading_name: string | null;
          organisation_type: "aged_provider" | "plan_manager" | "coordinator" | "referral" | "other";
          abn: string | null;
          registration_verified_at: string | null;
          payment_terms_days: number | null;
          contact_phone: string | null;
          contact_email: string | null;
          notes: string | null;
          status: "prospect" | "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organisations"]["Row"], "id" | "owner_id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organisations"]["Insert"]>;
        Relationships: never[];
      };
      contacts: {
        Row: {
          id: string;
          owner_id: string;
          organisation_id: string | null;
          client_id: string | null;
          name: string;
          preferred_name: string | null;
          role: "participant" | "authorised_representative" | "provider_contact" | "plan_manager" | "emergency_contact" | "other";
          phone: string | null;
          email: string | null;
          preferred_contact: "phone" | "email" | "sms" | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contacts"]["Row"], "id" | "owner_id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: never[];
      };
      clients: {
        Row: {
          id: string;
          owner_id: string;
          display_name: string;
          preferred_name: string | null;
          pronouns_optional: string | null;
          suburb: string;
          funding_lane: "support_at_home" | "ndis" | "private_pay" | "premium_private";
          active_status: "active" | "paused" | "ended";
          responsible_org_id: string | null;
          contracted_payer_id: string | null;
          contracted_payer_label: string;
          support_brief: SupportBriefJson;
          last_review_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "owner_id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: never[];
      };
      leads: {
        Row: {
          id: string;
          owner_id: string;
          type: "ndis_participant" | "support_at_home_participant" | "aged_care_provider_prospect" | "private_pay_household" | "platform_listing";
          display_alias: string;
          source: string;
          suburb: string;
          funding_lane: "support_at_home" | "ndis" | "private_pay" | "premium_private";
          requested_services: string[];
          proposed_days: string[];
          hours_per_visit: number | null;
          weekly_frequency: number | null;
          advertised_provider_rate_cents: number | null;
          proposed_worker_rate_cents: number | null;
          agreed_worker_rate_cents: number | null;
          travel_estimate_minutes: number | null;
          fit_factors: FitFactorsJson | null;
          status: "inbox" | "contacted" | "qualified" | "call_meeting" | "proposal_pending" | "won_onboarding" | "active" | "lost" | "not_suitable" | "archived";
          status_reason: string | null;
          readiness_badge: "unverified" | "need_provider_approval" | "ready_to_quote" | "awaiting_response";
          assigned_org_id: string | null;
          next_action_at: string | null;
          next_action_label: string | null;
          last_contact_at: string | null;
          converted_client_id: string | null;
          activity_log: ActivityLogEntryJson[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "owner_id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: never[];
      };
      engagements: {
        Row: {
          id: string;
          owner_id: string;
          client_id: string;
          funding_lane: "support_at_home" | "ndis" | "private_pay" | "premium_private";
          scope_allowed: string[];
          scope_excluded: string[];
          start_date: string;
          end_date: string | null;
          provider_approval_status: "not_required" | "pending" | "granted" | "declined";
          transport_consent_status: "not_required" | "pending" | "granted";
          readiness_state: "red" | "amber" | "green";
          readiness_blockers: string[];
          cancellation_terms: string;
          travel_terms: string;
          billing_terms: string;
          agreed_worker_rate_cents: number;
          rate_unit: "hour" | "visit";
          status: "draft" | "active" | "ended";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["engagements"]["Row"], "id" | "owner_id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["engagements"]["Insert"]>;
        Relationships: never[];
      };
      availability_blocks: {
        Row: {
          id: string;
          owner_id: string;
          start_at: string;
          end_at: string;
          block_type: "available" | "parenting" | "other_employment" | "personal" | "unavailable" | "travel_buffer";
          display_label: string;
          recurring: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["availability_blocks"]["Row"], "id" | "owner_id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_blocks"]["Insert"]>;
        Relationships: never[];
      };
      sessions: {
        Row: {
          id: string;
          owner_id: string;
          engagement_id: string;
          client_id: string;
          planned_start: string;
          planned_end: string;
          actual_start: string | null;
          actual_end: string | null;
          status: "proposed" | "tentative" | "confirmed" | "in_progress" | "completed" | "reviewed" | "invoiced" | "paid" | "cancelled" | "no_show" | "disputed";
          suburb: string;
          service_type: string;
          travel_buffer_before_min: number;
          travel_buffer_after_min: number;
          note_id: string | null;
          invoice_line_id: string | null;
          cancellation: CancellationJson | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "owner_id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
        Relationships: never[];
      };
      service_notes: {
        Row: {
          id: string;
          owner_id: string;
          session_id: string;
          activities: string;
          participant_response: string;
          factual_observations: string;
          next_steps: string;
          created_at: string;
          locked_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["service_notes"]["Row"], "id" | "owner_id" | "created_at" | "locked_at"> & {
          id?: string;
        };
        Update: never; // no UPDATE policy — enforced at the DB level too
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      append_lead_activity: {
        Args: { p_lead_id: string; p_note: string };
        Returns: void;
      };
      convert_lead_to_client: {
        Args: { p_lead_id: string };
        Returns: string;
      };
      complete_session_with_note: {
        Args: {
          p_session_id: string;
          p_activities: string;
          p_participant_response: string;
          p_factual_observations: string;
          p_next_steps: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
