import { PartnerCoverPreviewScreen } from "../../../../../components/partner-app/screens/PartnerCoverPreviewScreen";

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default async function PartnerApplicantCoverRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerCoverPreviewScreen applicantId={safeDecode(id)} />;
}
