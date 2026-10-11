"use server";

import { createClient } from "@/lib/supabase/server";
import type { Organisation, OrganisationType } from "@/lib/types";

export async function getOrganisations(): Promise<Organisation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("organisations").select("*").order("legal_name");
  if (error) throw new Error(`Failed to load organisations: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    legalName: row.legal_name,
    tradingName: row.trading_name ?? undefined,
    organisationType: row.organisation_type as OrganisationType,
    abn: row.abn ?? undefined,
    registrationVerifiedAt: row.registration_verified_at,
    paymentTermsDays: row.payment_terms_days ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
  }));
}
