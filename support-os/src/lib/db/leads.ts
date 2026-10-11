"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leadRowToLead } from "@/lib/db/mappers";
import type { FundingLane, Lead, LeadStatus, LeadType } from "@/lib/types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load leads: ${error.message}`);
  return data.map(leadRowToLead);
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  return data ? leadRowToLead(data) : null;
}

export interface NewLeadInput {
  type: LeadType;
  displayAlias: string;
  source: string;
  suburb: string;
  fundingLane: FundingLane;
}

export async function createLead(input: NewLeadInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    type: input.type,
    display_alias: input.displayAlias,
    source: input.source,
    suburb: input.suburb,
    funding_lane: input.fundingLane,
    requested_services: [],
    proposed_days: [],
    hours_per_visit: null,
    weekly_frequency: null,
    advertised_provider_rate_cents: null,
    proposed_worker_rate_cents: null,
    agreed_worker_rate_cents: null,
    travel_estimate_minutes: null,
    fit_factors: null,
    status: "inbox",
    status_reason: null,
    readiness_badge: "unverified",
    assigned_org_id: null,
    next_action_at: null,
    next_action_label: null,
    last_contact_at: null,
    converted_client_id: null,
    activity_log: [],
  });
  if (error) throw new Error(`Failed to create lead: ${error.message}`);
  revalidatePath("/leads");
}

export async function setLeadStatus(id: string, status: LeadStatus, reason?: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status, ...(reason !== undefined ? { status_reason: reason } : {}) })
    .eq("id", id);
  if (error) throw new Error(`Failed to update lead status: ${error.message}`);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function addLeadActivity(id: string, note: string): Promise<void> {
  const supabase = await createClient();
  // Atomic append via a single UPDATE — no read-modify-write race.
  const { error } = await supabase.rpc("append_lead_activity", { p_lead_id: id, p_note: note });
  if (error) throw new Error(`Failed to log activity: ${error.message}`);
  revalidatePath(`/leads/${id}`);
}
