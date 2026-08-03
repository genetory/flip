import type { Metadata } from "next";
import { TalentLandingPage } from "../../components/talent/TalentLandingPage";
import { AuthedRedirect } from "../../components/talent/app/AuthedRedirect";

export const metadata: Metadata = {
  title: "Aply — 첫 이력서부터 첫 지원까지",
  description: "처음이라 막막한 취업 준비, Aply가 나의 경험을 함께 찾고 하나씩 완성해드려요."
};

// /talent = 공개 랜딩. 로그인한 Talent 는 홈(/talent/home)으로 자동 이동.
export default function TalentPage() {
  return (
    <>
      <AuthedRedirect to="/talent/home" />
      <TalentLandingPage />
    </>
  );
}
