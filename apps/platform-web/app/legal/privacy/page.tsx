import type { Metadata } from "next";
import { pageSeo } from "../../../lib/seo";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

export const metadata: Metadata = pageSeo({
  path: "/legal/privacy",
  title: "개인정보처리방침",
  description: "Aply 가 수집·이용하는 개인정보의 범위와 처리 방침입니다."
});

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
