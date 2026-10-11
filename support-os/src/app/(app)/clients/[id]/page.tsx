import { ClientDetailClient } from "@/components/clients/ClientDetailClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetailClient id={id} />;
}
