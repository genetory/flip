import { PartnerMockParticipantDetailScreen } from "../../../../../../components/partner-app/screens/PartnerMockParticipantDetailScreen";

export default async function PartnerMockParticipantDetailRoute({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  return <PartnerMockParticipantDetailScreen positionId={id} userId={userId} />;
}
