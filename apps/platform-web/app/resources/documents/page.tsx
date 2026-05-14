import type { Metadata } from "next";
import { DocumentsResourcesPage } from "../../../components/pages/resources/DocumentsResourcesPage";

export const metadata: Metadata = {
  title: "한국 취업 필수 서류 체크리스트",
  description:
    "여권 사본, 학위 증명서, 경력 증명서, 어학 성적표, 비자 신청 서류 등 한국 기업 지원과 비자 발급에 필요한 모든 서류를 단계별로 안내합니다.",
  alternates: { canonical: "/resources/documents" },
  openGraph: {
    type: "article",
    title: "한국 취업 필수 서류 체크리스트 | Aply",
    description: "한국 기업 지원·비자 발급 필수 서류 정리.",
    url: "/resources/documents"
  }
};

export default function Page() {
  return <DocumentsResourcesPage />;
}
