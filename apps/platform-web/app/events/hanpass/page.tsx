import type { Metadata } from "next";
import { HanpassEventPage } from "../../../components/pages/HanpassEventPage";

export const metadata: Metadata = {
  title: "Hanpass 이용자 취업 지원 확인 | Hanpass × Aply",
  description:
    "한국에서 취업을 희망하는 외국인 분들을 위한 Hanpass × Aply 취업 지원 설문. 채용 정보, 이력서 첨삭, 취업 상담 안내. 2026년 6월 26일까지 응답자 중 선착순 10명 이력서 첨삭·컨설팅 우선 제공.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Hanpass 이용자 취업 지원 확인 — Hanpass × Aply",
    description:
      "채용 정보 · 이력서 첨삭 · 취업 상담. 약 30초~1분 설문. 선착순 10명 이력서 첨삭·컨설팅 우선 제공.",
    type: "article"
  }
};

export default function Page() {
  return <HanpassEventPage />;
}
