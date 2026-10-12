import { getClient } from "@/lib/db/clients";
import { getEngagements } from "@/lib/db/engagements";
import { getContacts } from "@/lib/db/contacts";
import { getSessions } from "@/lib/db/sessions";
import { getServiceNotes } from "@/lib/db/serviceNotes";
import { ClientDetailClient } from "@/components/clients/ClientDetailClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, engagements, contacts, sessions, serviceNotes] = await Promise.all([
    getClient(id),
    getEngagements(),
    getContacts(),
    getSessions(),
    getServiceNotes(),
  ]);

  return (
    <ClientDetailClient
      client={client}
      engagement={engagements.find((e) => e.clientId === id)}
      contacts={contacts}
      sessions={sessions}
      serviceNotes={serviceNotes}
    />
  );
}
