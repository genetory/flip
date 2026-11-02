import type { Metadata } from "next";
import { PartnersScreen } from "../../components/premium/PartnersScreen";
import { pageSeo } from "../../lib/seo";

export const metadata: Metadata = pageSeo({
  title: "APLY PARTNERS 기업 제휴 — 사전 교육된 글로벌 인재와 인턴십",
  description:
    "어플라이가 글로벌 인재의 취업 준비를 지원하고, 기업이 적합한 인턴십 후보자를 만날 수 있도록 돕습니다. 사전 교육·직무 역량 확인·인턴십 후보자 추천. 기업 제휴 문의를 남겨 주세요.",
  path: "/premium-partners",
  ogImage: "/premium-partners/opengraph-image"
});

export default function PremiumPartnersPage() {
  return <PartnersScreen />;
}
