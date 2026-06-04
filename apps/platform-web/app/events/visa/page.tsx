import type { Metadata } from "next";
import { VisaLandingPage } from "../../../components/pages/VisaLandingPage";

export const metadata: Metadata = {
  title: "내가 받을 수 있는 한국 비자는? | Aply",
  description:
    "국적·학력·한국어 수준만 입력하면 받을 수 있는 한국 비자 옵션과 후원해줄 만한 회사를 한 번에 확인하세요.",
  openGraph: {
    title: "내가 받을 수 있는 한국 비자는?",
    description: "한국 취업 비자 가능성 즉시 진단 + 매칭 채용 공고",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "내가 받을 수 있는 한국 비자는?",
    description: "한국 취업 비자 가능성 즉시 진단 + 매칭 채용 공고"
  }
};

export default function Page() {
  return <VisaLandingPage />;
}
