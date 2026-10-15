// "내 경험이 스펙이 되는 순간" — 어플라이 자소서 경험 발굴 캠페인(/events/experience, 공개·로그인 없이 신청, 색인 허용).
// 화면은 v2 결(흰 바탕 토스 스타일)이라 v2 색 토큰(.v2)을 여기서도 불러온다(app/v2 바깥 경로).
import type { Metadata } from "next";
import "../../v2/v2.css";
import { ExperienceCampaignPage } from "../../../components/pages/ExperienceCampaignPage";
import { pageSeo } from "../../../lib/seo";

export const metadata: Metadata = pageSeo({
  path: "/events/experience",
  title: "내 경험이 스펙이 되는 순간 — 무료 이력서·자소서 1:1 상담",
  description:
    "한국식 이력서·자기소개서가 어렵다면? 매주 2명, 어플라이 취업 서류 전문가가 1:1 상담과 첨삭을 무료로 도와드려요. 편의점 알바도, 동아리 활동도 취업 스펙이 될 수 있습니다.",
  ogImage: "/img_coverletter.webp"
});

export default function ExperienceCampaignRoute() {
  return <ExperienceCampaignPage />;
}
