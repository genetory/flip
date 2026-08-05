import { PartnerApplicantDetailScreen } from "../../../../components/partner-app/screens/PartnerApplicantDetailScreen";

export default async function PartnerApplicantDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerApplicantDetailScreen applicantId={id} />;
}
