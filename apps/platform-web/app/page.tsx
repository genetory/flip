// 메인 랜딩(서버) — 실제 공고와 비자 코드를 읽어 랜딩에 내려준다.
// 보이는 요소는 전부 CommonLanding 안에서 그린다(랜딩은 자체 헤더·푸터를 갖는다).
import type { Metadata } from "next";
import { CommonLanding } from "../components/landing/CommonLanding";
import type { LandingJob } from "../components/landing/LandingSections";
import { JsonLd } from "../components/seo/JsonLd";
import { pageSeo } from "../lib/seo";
import { VISA_DETAILS } from "../lib/visa-details";
import { companyNameOf, fetchPublicPositions, hasIndexableBody, isClosed } from "../lib/server/positions";

export const metadata: Metadata = pageSeo({
  path: "/",
  // 루트 layout 의 title template 은 같은 세그먼트(app/page.tsx)에 적용되지 않으므로 브랜드를 직접 붙인다.
  title: "한국에서 일하고 싶은 외국인을 위한 취업 플랫폼 | Aply",
  description:
    "비자에 맞는 채용공고를 찾고, 한국식 이력서와 면접까지 한 곳에서 준비하세요. 외국인 지원 가능 공고를 APLY 에서 확인하세요."
});

/** 메인에 노출할 비자 코드 — 외국인 취업에서 가장 많이 찾는 것만 추린다(전체는 /talent/visa). */
const FEATURED_VISA_CODES = ["E-7", "E-9", "D-2", "D-10", "F-2", "F-4", "F-6", "H-1"];

export default async function Page() {
  // 실패하면 빈 배열 — 해당 섹션이 사라지고 나머지 랜딩은 그대로 보인다.
  const page = await fetchPublicPositions(12);
  const jobs: LandingJob[] = (page?.items ?? [])
    .filter((p) => hasIndexableBody(p) && !isClosed(p))
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.title, company: companyNameOf(p), location: p.workLocation ?? null }));

  const visaCodes = FEATURED_VISA_CODES.filter((c) => VISA_DETAILS[c]);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "한국에서 일하고 싶은 외국인을 위한 취업 플랫폼",
    description: "비자에 맞는 채용공고를 찾고, 한국식 이력서와 면접까지 한 곳에서 준비하세요.",
    inLanguage: "ko"
  };

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <CommonLanding jobs={jobs} visaCodes={visaCodes} />
    </>
  );
}
