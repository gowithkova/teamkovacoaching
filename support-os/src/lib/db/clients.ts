"use server";

import { createClient } from "@/lib/supabase/server";
import { clientRowToClient } from "@/lib/db/mappers";
import type { Client } from "@/lib/types";

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").order("display_name");
  if (error) throw new Error(`Failed to load clients: ${error.message}`);
  return data.map(clientRowToClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load client: ${error.message}`);
  return data ? clientRowToClient(data) : null;
}
