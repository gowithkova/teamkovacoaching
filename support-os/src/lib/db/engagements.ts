"use server";

import { createClient } from "@/lib/supabase/server";
import { engagementRowToEngagement } from "@/lib/db/mappers";
import type { Engagement } from "@/lib/types";

export async function getEngagements(): Promise<Engagement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("engagements").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load engagements: ${error.message}`);
  return data.map(engagementRowToEngagement);
}
