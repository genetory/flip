// 공고 목록 — 서버 컴포넌트. 목록 UI 자체는 클라이언트(JobsScreen)가 그리지만,
// 크롤러와 "목록 API 가 실패한 사용자" 모두를 위해 첫 페이지 핵심 정보를 서버에서 렌더한다.
import type { Metadata } from "next";
import Link from "next/link";
import { JobsScreen } from "../../../components/talent/screens/JobsScreen";
import { JsonLd } from "../../../components/seo/JsonLd";
import { GrowthPageView } from "../../../components/seo/GrowthPageView";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";
import { pageSeo } from "../../../lib/seo";
import { companyNameOf, fetchPublicPositions, hasIndexableBody, isClosed } from "../../../lib/server/positions";

export const metadata: Metadata = pageSeo({
  path: "/talent/jobs",
  title: "외국인 지원 가능 한국 채용 공고",
  description:
    "비자·외국인 채용이 가능한 한국 기업 공고를 직무·지역·고용형태로 찾아보세요. 지원 준비까지 Aply에서 함께 합니다."
});

export default async function TalentJobsRoute() {
  // 서버에서 첫 페이지를 미리 읽어 둔다 — 실패하면 null 이고, 그때는 사람·크롤러가
  // 모두 이해할 수 있는 안내로 대체한다(빈 목록이나 에러 화면을 보여주지 않는다).
  const page = await fetchPublicPositions(20);
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "채용 공고", path: "/talent/jobs" }
  ]);
  // 색인할 가치가 있는(본문이 있고 마감되지 않은) 공고만 서버 링크로 노출한다.
  const listed = (page?.items ?? []).filter((p) => hasIndexableBody(p) && !isClosed(p)).slice(0, 20);

  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <GrowthPageView kind="job_list" count={listed.length} />

      <section className="mx-auto w-full max-w-[720px] px-5 pt-5" aria-label="채용 공고 안내">
        <h1 className="text-[20px] font-black leading-snug tracking-[-0.02em] text-[#191F28]">
          외국인 지원 가능 한국 채용 공고
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968]">
          비자·외국인 채용이 가능한 공고를 모았어요. 직무와 지역으로 좁혀 보고, 마음에 드는 공고는 지원 준비까지 이어서 할 수 있어요.
        </p>

        {page === null ? (
          <div className="mt-3 rounded-xl border border-[#F2D2D2] bg-[#FEF6F6] px-3.5 py-3">
            <p className="text-[13px] font-bold text-[#C0392B]">공고 목록을 불러오지 못했어요.</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4E5968]">
              일시적인 문제예요. 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        ) : listed.length > 0 ? (
          <nav className="mt-3" aria-label="최근 공고">
            <h2 className="text-[13px] font-bold text-[#8B95A1]">최근 등록된 공고</h2>
            <ul className="mt-1.5 flex flex-col gap-1">
              {listed.map((p) => {
                const company = companyNameOf(p);
                return (
                  <li key={p.id} className="text-[13px] leading-relaxed">
                    <Link href={`/talent/jobs/${p.id}`} className="text-[#333D4B] underline-offset-2 hover:underline">
                      {p.title}
                      {company ? <span className="text-[#8B95A1]"> · {company}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        {/* 목록 화면의 primary CTA 는 하나 — 나에게 맞는 직무 찾기. */}
        <Link
          href="/career-launch"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white"
        >
          나에게 맞는 직무 찾기
        </Link>
      </section>

      <JobsScreen />
    </>
  );
}
