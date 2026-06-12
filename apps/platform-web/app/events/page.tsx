import type { Metadata } from "next";
import { EventsListPage } from "../../components/pages/EventsListPage";

// OG 이미지는 일단 사주 이벤트의 이미지를 재사용. 별도 디자인 마련 시
// /public/img_meta_events.webp 로 만들어 같은 경로 규칙 적용.
export const metadata: Metadata = {
  title: "Aply 이벤트 | 한국 취업, 재미있게 풀어보기",
  description:
    "사주와 비자 진단으로 한국 취업 방향을 즉시 확인하세요. Aply 의 가벼운 진단 이벤트 모음.",
  openGraph: {
    title: "Aply 이벤트 — 한국 취업, 재미있게 풀어보기",
    description: "사주·비자 진단으로 내 커리어 방향을 즉시 확인",
    type: "website",
    images: [
      {
        url: "/img_meta_home.webp",
        width: 1200,
        height: 630,
        alt: "Aply 이벤트"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Aply 이벤트 — 한국 취업, 재미있게 풀어보기",
    description: "사주·비자 진단으로 내 커리어 방향을 즉시 확인",
    images: ["/img_meta_home.webp"]
  }
};

export default function Page() {
  return <EventsListPage />;
}
