import type { Metadata } from "next";
import { pageSeo } from "../../../lib/seo";
import { TalentSignupPage } from "../../../components/talent/auth/TalentSignupPage";

export const metadata: Metadata = pageSeo({
  path: "/talent/signup",
  title: "무료 회원가입 — 외국인 구직자를 위한 Aply",
  description: "이메일 또는 소셜 계정으로 1분 안에 가입하고, 외국인 지원 가능 공고와 무료 취업 준비 도구를 이용하세요."
});

export default function TalentSignupRoute() {
  return <TalentSignupPage />;
}
