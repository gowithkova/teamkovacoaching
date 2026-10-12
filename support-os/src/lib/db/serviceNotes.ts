"use server";

import { createClient } from "@/lib/supabase/server";
import { serviceNoteRowToNote } from "@/lib/db/mappers";
import type { ServiceNote } from "@/lib/types";

export async function getServiceNotes(): Promise<ServiceNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_notes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load service notes: ${error.message}`);
  return data.map(serviceNoteRowToNote);
}
