// 탤런트 이력서·자소서 편집기의 정식 경로는 /editor 다.
// 이전 경로(/talent/career/resume · /cover)는 next.config 에서 여기로 308 리다이렉트한다.
import { CoverBuilderScreen } from "../../../../../components/talent/screens/CoverBuilderScreen";

export default function TalentCoverRoute() {
  return <CoverBuilderScreen />;
}
