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
  // 화면 h1 과 같은 문구를 쓴다 — 검색결과를 보고 들어온 사람이 기대한 화면을 보게 한다.
  // (루트 layout 의 title template 은 같은 세그먼트에 적용되지 않아 브랜드를 직접 붙인다.)
  title: "구직자와 기업을 잇는 첫 취업 플랫폼 | Aply",
  description:
    "경험을 정리해 이력서·자기소개서를 만들고, 나에게 맞는 공고를 찾아 지원하세요. 외국인 지원 가능 공고와 비자별 안내도 함께 제공합니다."
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
