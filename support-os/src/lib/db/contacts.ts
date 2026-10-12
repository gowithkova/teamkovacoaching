"use server";

import { createClient } from "@/lib/supabase/server";
import { contactRowToContact } from "@/lib/db/mappers";
import type { Contact } from "@/lib/types";

export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contacts").select("*").order("name");
  if (error) throw new Error(`Failed to load contacts: ${error.message}`);
  return data.map(contactRowToContact);
}
