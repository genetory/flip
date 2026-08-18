import { Suspense } from "react";
import type { Metadata } from "next";
import { PartnerSignupPage } from "../../../components/partner-app/PartnerSignupPage";

export const metadata: Metadata = {
  title: "APLY 파트너 — 기업 회원가입",
  description: "이메일로 간단히 가입하고 공고 등록·지원자 관리를 시작하세요."
};

export default function PartnerSignupRoute() {
  return (
    <Suspense fallback={null}>
      <PartnerSignupPage />
    </Suspense>
  );
}
