import type { Metadata } from "next";
import { VisaLandingPage } from "../../../components/pages/VisaLandingPage";

// OG 이미지는 saju 와 동일 위치 규칙 — public/img_meta_visa.webp (1200×630).
// 디자인 파일은 별도로 마련해서 같은 경로에 배치하면 자동으로 적용됨.
export const metadata: Metadata = {
  title: "내가 받을 수 있는 한국 비자는? | Aply",
  description:
    "국적·학력·한국어 수준만 입력하면 받을 수 있는 한국 비자 옵션과 후원해줄 만한 회사를 한 번에 확인하세요.",
  openGraph: {
    title: "내가 받을 수 있는 한국 비자는?",
    description: "한국 취업 비자 가능성 즉시 진단 + 매칭 채용 공고",
    type: "website",
    images: [
      {
        url: "/img_meta_visa.webp",
        width: 1200,
        height: 630,
        alt: "내가 받을 수 있는 한국 비자는?"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "내가 받을 수 있는 한국 비자는?",
    description: "한국 취업 비자 가능성 즉시 진단 + 매칭 채용 공고",
    images: ["/img_meta_visa.webp"]
  }
};

export default function Page() {
  return <VisaLandingPage />;
}
