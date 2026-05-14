import type { Metadata } from "next";
import { VisaResourcesPage } from "../../../components/pages/resources/VisaResourcesPage";

export const metadata: Metadata = {
  title: "한국 비자 종류별 가이드 (D-2, D-10, E-7, F-2-7 등)",
  description:
    "외국인 한국 취업/체류에 필요한 비자(D-2 유학, D-10 구직, E-7 특정활동, F-2-7 거주, F-4 재외동포 등) 자격 요건과 신청 방법을 한국어·영어·중국어·베트남어로 정리했습니다.",
  alternates: { canonical: "/resources/visa" },
  openGraph: {
    type: "article",
    title: "한국 비자 종류별 가이드 | Aply",
    description: "외국인 한국 취업 비자 종류와 자격 요건 정리.",
    url: "/resources/visa"
  }
};

export default function Page() {
  return <VisaResourcesPage />;
}
