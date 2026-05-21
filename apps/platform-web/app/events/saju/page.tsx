import type { Metadata } from "next";
import { SajuLandingPage } from "../../../components/pages/SajuLandingPage";

export const metadata: Metadata = {
  title: "나의 사주가 말하는 미래 직업은? | Aply",
  description:
    "이름, 성별, 생년월일만 입력하면 오행 사주가 풀어주는 어울리는 직무와 실제 채용 공고를 한 번에 확인하세요.",
  openGraph: {
    title: "나의 사주가 말하는 미래 직업은?",
    description: "Aply가 풀어주는 오행 사주 기반 직업 적성 + 매칭 공고",
    type: "website"
  }
};

export default function Page() {
  return <SajuLandingPage />;
}
