import { PartnerApplicantDetailScreen } from "../../../../components/partner-app/screens/PartnerApplicantDetailScreen";

// 지원자 id 는 candidateUserId:positionId(콜론) 조합이라 링크에서 인코딩된다.
// Next 가 %3A 를 자동 디코드하지 않으므로 여기서 한 번 디코드해(클라이언트의 재인코딩과 짝을 맞춘다).
function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default async function PartnerApplicantDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerApplicantDetailScreen applicantId={safeDecode(id)} />;
}
