import { V2ActivityScreen } from "../../../../components/v2/screens/V2ActivityScreen";

// v2 내 활동 — 관심 회사·저장한 공고·팔로우·저장한 글(기존 /talent/activity/[type]).
export default async function V2ActivityRoute({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <V2ActivityScreen type={type} />;
}
