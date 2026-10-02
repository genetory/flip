import type { Metadata } from "next";
import { CommonLanding } from "../components/landing/CommonLanding";
import { JsonLd } from "../components/seo/JsonLd";
import { GrowthPageView } from "../components/seo/GrowthPageView";
import { breadcrumbJsonLd } from "../lib/seo-jsonld";
import { pageSeo } from "../lib/seo";

export const metadata: Metadata = pageSeo({
  path: "/",
  title: "Aply — 한국에서 일하고 싶은 외국인을 위한 채용 플랫폼",
  description:
    "외국인도 지원할 수 있는 한국 채용 공고를 찾고, 이력서·자기소개서·모의면접까지 무료로 준비하세요."
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
