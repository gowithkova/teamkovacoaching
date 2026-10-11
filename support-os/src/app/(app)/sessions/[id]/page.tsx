import { SessionDetailClient } from "@/components/sessions/SessionDetailClient";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionDetailClient id={id} />;
}
