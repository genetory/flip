import type { Metadata } from "next";
import { pageSeo } from "../../../lib/seo";
import { HomeScreen } from "../../../components/talent/screens/HomeScreen";

// 홈 대시보드(GNB 포함, 로그인 필요). 공개 랜딩은 /talent.
export const metadata: Metadata = pageSeo({
  path: "/talent/home",
  title: "내 홈",
  description: "내 취업 준비 현황과 추천 공고를 한 화면에서 확인하세요.",
  noindex: true
});

export default function TalentHomeRoute() {
  return <HomeScreen />;
}
