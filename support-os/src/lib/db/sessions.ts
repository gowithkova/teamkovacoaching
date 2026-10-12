"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sessionRowToSession } from "@/lib/db/mappers";
import type { VisitSession } from "@/lib/types";

export async function getSessions(): Promise<VisitSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions").select("*").order("planned_start");
  if (error) throw new Error(`Failed to load sessions: ${error.message}`);
  return data.map(sessionRowToSession);
}

export async function getSession(id: string): Promise<VisitSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load session: ${error.message}`);
  return data ? sessionRowToSession(data) : null;
}

function revalidateSessionPaths(id: string) {
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/today");
}

export async function confirmSession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").update({ status: "confirmed" }).eq("id", id);
  if (error) throw new Error(`Failed to confirm session: ${error.message}`);
  revalidateSessionPaths(id);
}

export async function startSession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "in_progress", actual_start: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Failed to start session: ${error.message}`);
  revalidateSessionPaths(id);
}

export interface NoteDraft {
  activities: string;
  participantResponse: string;
  factualObservations: string;
  nextSteps: string;
}

/** Writes the note and marks the session completed in one DB transaction — see complete_session_with_note in schema.sql. */
export async function completeSessionWithNote(id: string, note: NoteDraft): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_session_with_note", {
    p_session_id: id,
    p_activities: note.activities,
    p_participant_response: note.participantResponse,
    p_factual_observations: note.factualObservations,
    p_next_steps: note.nextSteps,
  });
  if (error) throw new Error(`Failed to complete session: ${error.message}`);
  revalidateSessionPaths(id);
}

export async function correctSessionTimes(id: string, actualStart: string, actualEnd: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ actual_start: actualStart, actual_end: actualEnd })
    .eq("id", id);
  if (error) throw new Error(`Failed to correct session times: ${error.message}`);
  revalidateSessionPaths(id);
}

export async function recordCancellation(
  id: string,
  reason: string,
  chargeable: boolean,
  chargeableReason: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      status: "cancelled",
      cancellation: { recordedAt: new Date().toISOString(), reason, chargeable, chargeableReason },
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to record cancellation: ${error.message}`);
  revalidateSessionPaths(id);
}
