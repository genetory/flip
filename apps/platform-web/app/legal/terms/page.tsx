import type { Metadata } from "next";
import { pageSeo } from "../../../lib/seo";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = pageSeo({
  path: "/legal/terms",
  title: "이용약관",
  description: "Aply 서비스 이용약관입니다."
});

export default function TermsPage() {
  return <TermsContent />;
}
