import { getSession, getSessions } from "@/lib/db/sessions";
import { getClient } from "@/lib/db/clients";
import { getEngagements } from "@/lib/db/engagements";
import { getContacts } from "@/lib/db/contacts";
import { getAvailabilityBlocks } from "@/lib/db/availability";
import { getServiceNotes } from "@/lib/db/serviceNotes";
import { SessionDetailClient } from "@/components/sessions/SessionDetailClient";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, allSessions, engagements, contacts, availabilityBlocks, serviceNotes] = await Promise.all([
    getSession(id),
    getSessions(),
    getEngagements(),
    getContacts(),
    getAvailabilityBlocks(),
    getServiceNotes(),
  ]);

  const client = session ? await getClient(session.clientId) : null;
  const engagement = session ? engagements.find((e) => e.id === session.engagementId) : undefined;
  const note = session ? serviceNotes.find((n) => n.id === session.noteId) : undefined;

  return (
    <SessionDetailClient
      session={session}
      client={client ?? undefined}
      engagement={engagement}
      contacts={contacts}
      note={note}
      allSessions={allSessions}
      availabilityBlocks={availabilityBlocks}
    />
  );
}
