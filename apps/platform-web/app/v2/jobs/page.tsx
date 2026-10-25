import { Suspense } from "react";
import { V2JobsScreen } from "../../../components/v2/screens/V2JobsScreen";
import { JsonLd } from "../../../components/seo/JsonLd";
import { GrowthPageView } from "../../../components/seo/GrowthPageView";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";
import { fetchPublicPositions, hasIndexableBody, isClosed } from "../../../lib/server/positions";

// 검색 노출(title·description·canonical)은 기존 공고 목록과 같다.
export { metadata } from "../../talent/jobs/page";

export default async function V2JobsRoute() {
  // 진입 계측의 공고 수 — 기존 목록과 같은 기준.
  const page = await fetchPublicPositions(20);
  const listed = (page?.items ?? []).filter((p) => hasIndexableBody(p) && !isClosed(p)).slice(0, 20);
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "채용 공고", path: "/talent/jobs" }
  ]);
  // 화면이 ?tab= 을 읽는다(useSearchParams) — 정적 렌더를 위해 Suspense 로 감싼다.
  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <GrowthPageView kind="job_list" count={listed.length} />
      <Suspense>
        <V2JobsScreen />
      </Suspense>
    </>
  );
}
