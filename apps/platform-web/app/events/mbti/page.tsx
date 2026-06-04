import type { Metadata } from "next";
import { MbtiLandingPage } from "../../../components/pages/MbtiLandingPage";

export const metadata: Metadata = {
  title: "내 MBTI가 어울리는 한국 직장은? | Aply",
  description:
    "MBTI 4개 축만 고르면 어울리는 한국 회사 문화와 직무, 실제 채용 공고를 한 번에 추천해드려요.",
  openGraph: {
    title: "내 MBTI가 어울리는 한국 직장은?",
    description: "Aply가 매칭해주는 MBTI × 한국 직장 적합도 + 채용 공고",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "내 MBTI가 어울리는 한국 직장은?",
    description: "Aply가 매칭해주는 MBTI × 한국 직장 적합도 + 채용 공고"
  }
};

export default function Page() {
  return <MbtiLandingPage />;
}
