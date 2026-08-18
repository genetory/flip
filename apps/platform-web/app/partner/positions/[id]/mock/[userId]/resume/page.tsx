import { PartnerMockParticipantDocScreen } from "../../../../../../../components/partner-app/screens/PartnerMockParticipantDocScreen";

export default async function PartnerMockParticipantResumeRoute({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  return <PartnerMockParticipantDocScreen positionId={id} userId={userId} kind="resume" />;
}
