import { notFound } from "next/navigation";
import { PositionDetailPage } from "../../../components/pages/PositionDetailPage";
import { getPublicPositionById } from "../../../lib/member-profile-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let position: Awaited<ReturnType<typeof getPublicPositionById>> | null = null;
  try {
    position = await getPublicPositionById(id);
  } catch {
    position = null;
  }
  if (!position) notFound();
  return <PositionDetailPage position={position} />;
}
