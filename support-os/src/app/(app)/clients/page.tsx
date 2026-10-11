"use client";

import { useStore } from "@/lib/store";
import { ClientCard } from "@/components/clients/ClientCard";

export default function ClientsPage() {
  const { clients, engagements, sessions } = useStore();

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">{clients.length} client{clients.length === 1 ? "" : "s"}</p>
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
