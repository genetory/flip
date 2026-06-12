import type { Metadata } from "next";
import { SgcApplyPage } from "../../../../components/pages/SgcApplyPage";

export const metadata: Metadata = {
  title: "프로그램 지원 | 서울글로벌센터 × Aply 6주 일경험 프로그램",
  description:
    "Aply 회원으로 로그인하고 본인 이력서와 함께 SGC × Aply 6주 일경험 프로그램에 지원하세요.",
  // 신청 페이지는 SEO 대상이 아니라 검색 인덱싱 차단.
  robots: {
    index: false,
    follow: false
  }
};

export default function Page() {
  return <SgcApplyPage />;
}
