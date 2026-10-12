import { getSessions } from "@/lib/db/sessions";
import { getAvailabilityBlocks } from "@/lib/db/availability";
import { getClients } from "@/lib/db/clients";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const [sessions, availabilityBlocks, clients] = await Promise.all([
    getSessions(),
    getAvailabilityBlocks(),
    getClients(),
  ]);

  return <CalendarClient sessions={sessions} availabilityBlocks={availabilityBlocks} clients={clients} />;
}
