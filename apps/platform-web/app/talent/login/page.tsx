import type { Metadata } from "next";
import { pageSeo } from "../../../lib/seo";
import { TalentLoginPage } from "../../../components/talent/auth/TalentLoginPage";

export const metadata: Metadata = pageSeo({
  path: "/talent/login",
  title: "로그인",
  description: "Aply 계정으로 로그인하세요.",
  noindex: true
});

export default function TalentLoginRoute() {
  return <TalentLoginPage />;
}
