"use server";

import { createClient } from "@/lib/supabase/server";
import { availabilityBlockRowToBlock } from "@/lib/db/mappers";
import type { AvailabilityBlock } from "@/lib/types";

export async function getAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("availability_blocks").select("*").order("start_at");
  if (error) throw new Error(`Failed to load availability blocks: ${error.message}`);
  return data.map(availabilityBlockRowToBlock);
}
