// 공고 목록 — 서버 컴포넌트. 화면은 전부 클라이언트(JobsScreen)가 그린다.
// 여기서는 보이지 않는 것만 담당한다: metadata(title·description·canonical), BreadcrumbList,
// 진입 계측. 그리고 목록 API 가 실패했을 때만 사람이 읽을 수 있는 안내를 위에 띄운다.
//
// 처음에는 제목·설명·최근 공고 링크를 서버에서 렌더했는데, JobsScreen 자체 헤더와 겹쳐
// 화면 위에 중복으로 보여서 뺐다. 공고 본문은 개별 상세 페이지에서 서버 렌더된다.
import type { Metadata } from "next";
import { JobsScreen } from "../../../components/talent/screens/JobsScreen";
import { JsonLd } from "../../../components/seo/JsonLd";
import { GrowthPageView } from "../../../components/seo/GrowthPageView";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";
import { pageSeo } from "../../../lib/seo";
import Link from "next/link";
import { companyNameOf, fetchPublicPositions, hasIndexableBody, isClosed } from "../../../lib/server/positions";

export const metadata: Metadata = pageSeo({
  path: "/talent/jobs",
  title: "외국인 지원 가능 한국 채용 공고",
  description:
    "비자·외국인 채용이 가능한 한국 기업 공고를 직무·지역·고용형태로 찾아보세요. 지원 준비까지 Aply에서 함께 합니다."
});

export default async function TalentJobsRoute() {
  // 실패 여부만 보려고 읽는다 — 성공하면 화면에 아무것도 추가하지 않는다.
  const page = await fetchPublicPositions(20);
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "채용 공고", path: "/talent/jobs" }
  ]);
  const listed = (page?.items ?? []).filter((p) => hasIndexableBody(p) && !isClosed(p)).slice(0, 20);

  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <GrowthPageView kind="job_list" count={listed.length} />

      {/* 목록을 못 불러온 경우에만 노출 — 빈 화면이나 에러 스택을 보여주지 않는다. */}
      {page === null ? (
        <section className="mx-auto w-full max-w-[720px] px-5 pt-5" aria-label="공고 목록 안내">
          <div className="rounded-xl border border-[#F2D2D2] bg-[#FEF6F6] px-3.5 py-3">
            <p className="text-[13px] font-bold text-[#C0392B]">공고 목록을 불러오지 못했어요.</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4E5968]">일시적인 문제예요. 잠시 후 다시 시도해 주세요.</p>
          </div>
        </section>
      ) : null}

      {/* 서버에서 읽은 최근 공고 — 셸 '안' 하단에 들어간다(셸 앞에 두면 GNB 위에 뜬다).
          크롤러가 목록 HTML 에서 실제 공고를 볼 수 있게 하는 유일한 경로다. */}
      <JobsScreen
        seoSlot={
          listed.length > 0 ? (
            <nav aria-label="최근 등록된 공고">
              <h2 className="text-[13px] font-bold text-[#8B95A1]">최근 등록된 공고</h2>
              <ul className="mt-2 flex flex-col gap-1">
                {listed.map((p) => (
                  <li key={p.id} className="text-[13px] leading-relaxed">
                    <Link href={`/talent/jobs/${p.id}`} className="text-[#4E5968] underline-offset-2 hover:underline">
                      {p.title}
                      {companyNameOf(p) ? <span className="text-[#8B95A1]"> · {companyNameOf(p)}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : undefined
        }
      />
    </>
  );
}
