import type { Metadata } from "next";
import { BusinessPage } from "../../components/pages/BusinessPage";

export const metadata: Metadata = {
  title: "Aply for Business — 검증된 글로벌 인재 채용 솔루션",
  description:
    "서류 · AI 면접 · 사전 교육 · 5주 스코어링을 통과한 글로벌 인재만 추천합니다. 비자 · 행정 · 법무까지 aply가 운영하는 외국인 인재 채용 솔루션. 포지션 등록 무료, 채용 전환 시에만 비용.",
  openGraph: {
    title: "Aply for Business — 검증된 글로벌 인재 채용 솔루션",
    description:
      "검증된 글로벌 인재를 비용·채용 리스크 없이. 포지션 등록 무료, 비자·행정·법무까지 aply가 대행합니다.",
    type: "website",
    images: [
      {
        url: "/img_for_business.webp",
        width: 1200,
        height: 630,
        alt: "Aply for Business"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Aply for Business — 검증된 글로벌 인재 채용 솔루션",
    description: "검증된 글로벌 인재를 비용·채용 리스크 없이. 포지션 등록 무료.",
    images: ["/img_for_business.webp"]
  }
};

export default function Page() {
  return <BusinessPage />;
}
