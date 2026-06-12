import type { Metadata } from "next";
import { SgcEventPage } from "../../../components/pages/SgcEventPage";

export const metadata: Metadata = {
  title: "한국 기업 6주 일경험 프로그램 | Seoul Global Center × Aply",
  description:
    "한국에서 취업을 희망하는 외국인 유학생을 위한 기업 연계 6주 실전 일경험 프로그램. 기업 적응 교육 + 직무별 그룹 코칭 + 현장 일경험 + 식비/교통비 지원.",
  openGraph: {
    title: "한국 기업 6주 일경험 프로그램 — Seoul Global Center × Aply",
    description: "외국인 유학생용 기업 연계 6주 인턴십. 적응 교육 + 그룹 코칭 + 현장 일경험 + 식비·교통비 지원.",
    type: "article",
    images: [
      {
        url: "/img_sgc_aply.webp",
        width: 1200,
        height: 400,
        alt: "Seoul Global Center × Aply"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "한국 기업 6주 일경험 프로그램 — Seoul Global Center × Aply",
    description: "외국인 유학생용 기업 연계 6주 인턴십.",
    images: ["/img_sgc_aply.webp"]
  }
};

export default function Page() {
  return <SgcEventPage />;
}
