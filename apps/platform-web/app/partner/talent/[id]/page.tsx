import { PartnerCandidateDetailScreen } from "../../../../components/partner-app/screens/PartnerCandidateDetailScreen";

export default async function PartnerCandidateDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerCandidateDetailScreen candidateUserId={id} />;
}
