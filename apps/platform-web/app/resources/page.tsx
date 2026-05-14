import type { Metadata } from "next";
import { ResourcesPage } from "../../components/pages/ResourcesPage";

export const metadata: Metadata = {
  title: "자료실 — 한국 취업을 위한 비자·이력서·서류 가이드",
  description:
    "비자 종류별 자격 요건, 이력서 작성 팁, 한국 취업에 필요한 서류 체크리스트를 한곳에서 확인하세요. Aply가 글로벌 인재의 한국 정착을 돕습니다.",
  alternates: { canonical: "/resources" },
  openGraph: {
    type: "website",
    title: "Aply 자료실 — 한국 취업 가이드",
    description: "비자, 이력서, 서류 등 한국 취업에 필요한 모든 정보.",
    url: "/resources"
  }
};

export default function Page() {
  return <ResourcesPage />;
}
