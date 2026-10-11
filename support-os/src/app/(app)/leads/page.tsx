import { getLeads } from "@/lib/db/leads";
import { getOrganisations } from "@/lib/db/organisations";
import { LeadsListClient } from "@/components/leads/LeadsListClient";

export default async function LeadsPage() {
  const [leads, organisations] = await Promise.all([getLeads(), getOrganisations()]);
  return <LeadsListClient leads={leads} organisations={organisations} />;
}
