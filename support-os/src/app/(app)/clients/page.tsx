import { getClients } from "@/lib/db/clients";
import { getEngagements } from "@/lib/db/engagements";
import { getSessions } from "@/lib/db/sessions";
import { ClientCard } from "@/components/clients/ClientCard";

export default async function ClientsPage() {
  const [clients, engagements, sessions] = await Promise.all([getClients(), getEngagements(), getSessions()]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">{clients.length} client{clients.length === 1 ? "" : "s"}</p>
      {clients.length === 0 && (
        <p className="rounded-lg border border-line bg-surface-sunken px-3 py-2.5 text-sm text-ink-soft">
          No clients yet — convert a lead from the Leads screen to create one.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            engagement={engagements.find((e) => e.clientId === client.id)}
            sessions={sessions}
          />
        ))}
      </div>
    </div>
  );
}
