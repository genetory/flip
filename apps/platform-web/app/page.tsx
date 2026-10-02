// 메인 랜딩. 화면은 변경 전(구직자·파트너 진입 카드 중심)으로 되돌렸다 — 요청.
// metadata 는 검색 노출용으로 유지한다(화면 문구와 다르면 아래 주석 참고).
import type { Metadata } from "next";
import { CommonLanding } from "../components/landing/CommonLanding";
import { JsonLd } from "../components/seo/JsonLd";
import { GrowthPageView } from "../components/seo/GrowthPageView";
import { breadcrumbJsonLd } from "../lib/seo-jsonld";
import { pageSeo } from "../lib/seo";

export const metadata: Metadata = pageSeo({
  path: "/",
  // 루트 layout 의 title template 은 같은 세그먼트(app/page.tsx)에 적용되지 않아 브랜드를 직접 붙인다.
  title: "한국에서 일하고 싶은 외국인을 위한 취업 플랫폼 | Aply",
  description:
    "비자에 맞는 채용공고를 찾고, 한국식 이력서와 면접까지 한 곳에서 준비하세요. 외국인 지원 가능 공고를 APLY 에서 확인하세요."
});

export default function Page() {
  const crumbs = breadcrumbJsonLd([{ name: "홈", path: "/" }]);
  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <GrowthPageView kind="landing" surface="home" />
      <CommonLanding />
    </>
  );
}
