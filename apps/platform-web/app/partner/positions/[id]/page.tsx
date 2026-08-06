import { PartnerPositionDetailScreen } from "../../../../components/partner-app/screens/PartnerPositionDetailScreen";

export default async function PartnerPositionDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerPositionDetailScreen positionId={id} />;
}
