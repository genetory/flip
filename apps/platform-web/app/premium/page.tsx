import type { Metadata } from "next";
import { PremiumScreen } from "../../components/premium/PremiumScreen";
import { pageSeo } from "../../lib/seo";

export const metadata: Metadata = pageSeo({
  title: "APLY PREMIUM 얼리 액세스 — 한국 취업·인턴십 프리미엄 프로그램",
  description:
    "이력서 첨삭부터 실전 면접, 기업 매칭과 인턴십 연계까지. 외국인 인재를 위한 어플라이 프리미엄 커리어 프로그램 얼리 액세스를 신청하고 런칭 소식을 가장 먼저 받아 보세요.",
  path: "/premium",
  ogImage: "/premium/opengraph-image"
});

export default function PremiumPage() {
  return <PremiumScreen />;
}
