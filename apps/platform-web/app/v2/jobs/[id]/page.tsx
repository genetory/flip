import { V2JobDetailScreen } from "../../../../components/v2/screens/V2JobDetailScreen";

// v2 공고 상세 — 화면은 클라이언트(V2JobDetailScreen). 검색 노출·JSON-LD 는 기존 /talent/jobs/[id] 가 맡는다(v2 는 noindex).
export default async function V2JobDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <V2JobDetailScreen id={id} />;
}
