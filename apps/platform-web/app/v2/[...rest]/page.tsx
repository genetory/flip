import { V2Pending } from "../../../components/v2/screens/V2Pending";

// 아직 v2 로 옮기지 않은 화면 — 리뉴얼 중이라는 안내와 지금 화면으로 가는 길.
export default async function V2PendingRoute({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  return <V2Pending slug={rest.join("/")} />;
}
