import type { Metadata } from "next";
import { ResumeResourcesPage } from "../../../components/pages/resources/ResumeResourcesPage";

export const metadata: Metadata = {
  title: "한국식 이력서 / 커버레터 작성 가이드",
  description:
    "한국 기업이 선호하는 이력서·자기소개서·커버레터 작성법, 영문 vs 한글 이력서 차이, 흔히 하는 실수와 검수 체크리스트를 정리했습니다.",
  alternates: { canonical: "/resources/resume" },
  openGraph: {
    type: "article",
    title: "한국식 이력서 가이드 | Aply",
    description: "한국 기업이 원하는 이력서 작성법.",
    url: "/resources/resume"
  }
};

export default function Page() {
  return <ResumeResourcesPage />;
}
