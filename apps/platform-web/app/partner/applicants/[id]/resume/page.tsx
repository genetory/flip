import { PartnerResumePreviewScreen } from "../../../../../components/partner-app/screens/PartnerResumePreviewScreen";

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default async function PartnerApplicantResumeRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerResumePreviewScreen applicantId={safeDecode(id)} />;
}
