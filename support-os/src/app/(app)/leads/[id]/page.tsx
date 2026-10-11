import { getLead } from "@/lib/db/leads";
import { getOrganisations } from "@/lib/db/organisations";
import { LeadDetailClient } from "@/components/leads/LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, organisations] = await Promise.all([getLead(id), getOrganisations()]);
  return <LeadDetailClient lead={lead} organisations={organisations} />;
}
