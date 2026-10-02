// 공고 상세 — 서버 컴포넌트. 예전에는 "use client" 라서 (1) generateMetadata 를 쓸 수 없어
// 12,000여 개 공고가 전부 사이트 기본 title + canonical "/" 를 달았고, (2) 본문이 전부
// 클라이언트 fetch 라 크롤러가 빈 껍데기를 봤고, (3) 없는 공고도 200 을 돌려줬다.
// 상호작용은 그대로 JobDetailScreen(클라이언트)에 맡기고, 여기서 메타·요약·JSON-LD·404 를 담당한다.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JobDetailScreen } from "../../../../components/talent/screens/JobDetailScreen";
import { JsonLd } from "../../../../components/seo/JsonLd";
import { JobSeoSummary } from "../../../../components/seo/JobSeoSummary";
import { GrowthPageView } from "../../../../components/seo/GrowthPageView";
import { breadcrumbJsonLd, jobPostingJsonLd } from "../../../../lib/seo-jsonld";
import { clampDescription, pageSeo } from "../../../../lib/seo";
import {
  companyNameOf,
  fetchPublicPosition,
  hasIndexableBody,
  isClosed,
  isExternal,
  positionBodyText
} from "../../../../lib/server/positions";

type RouteProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { id } = await params;
  const position = await fetchPublicPosition(id);
  // 조회 실패(undefined)는 404 로 단정하지 않는다 — API 가 흔들릴 때 색인에서 사라지지 않게
  // 중립적인 메타를 주고 색인만 보류한다.
  if (position === undefined) {
    return pageSeo({
      path: `/talent/jobs/${id}`,
      title: "채용 공고",
      description: "외국인도 지원할 수 있는 한국 채용 공고를 APLY 에서 확인하세요.",
      noindex: true
    });
  }
  // 없는 공고는 여기서 404 를 낸다. generateMetadata 는 응답 스트리밍이 시작되기 전에
  // 실행되므로 상태 코드를 바꿀 수 있다 — 페이지 본문에서만 notFound() 를 부르면
  // 셸이 이미 전송된 뒤라 내용은 404 페이지인데 상태는 200(소프트 404)이 된다.
  if (position === null) notFound();

  const company = companyNameOf(position);
  // title 중복 제거 — 회사명이 제목에 이미 들어간 공고가 많아 그대로 붙이면 같은 말이 두 번 나온다.
  const titleHasCompany = company ? position.title.includes(company) : false;
  const title = company && !titleHasCompany ? `${position.title} — ${company}` : position.title;

  const bits = [
    company,
    position.workLocation,
    position.preferredJobRole,
    (position.eligibleVisas ?? []).length > 0 ? "외국인 지원 가능" : null
  ]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" · ");
  const body = positionBodyText(position);
  const description = clampDescription([bits, body].filter(Boolean).join(" — ") || `${position.title} 채용 공고`);

  return pageSeo({
    path: `/talent/jobs/${id}`,
    title,
    description,
    // 내용이 부족한 공고(제목만 있는 외부 수집분)와 마감 공고는 색인하지 않는다.
    noindex: !hasIndexableBody(position) || isClosed(position),
    ogType: "article",
    publishedTime: position.createdAt ?? undefined,
    modifiedTime: position.updatedAt ?? undefined
  });
}

export default async function TalentJobDetailRoute({ params }: RouteProps) {
  const { id } = await params;
  const position = await fetchPublicPosition(id);
  if (position === null) notFound(); // 없는 공고 → 올바른 404

  const jsonLd: Record<string, unknown>[] = [];
  if (position) {
    const crumbs = breadcrumbJsonLd([
      { name: "홈", path: "/" },
      { name: "채용 공고", path: "/talent/jobs" },
      { name: position.title, path: `/talent/jobs/${position.id}` }
    ]);
    if (crumbs) jsonLd.push(crumbs);
    // 내용이 부족하면 JobPosting 을 만들지 않는다 — 빈 구인 마크업은 검색 품질 위반이다.
    if (hasIndexableBody(position) && !isClosed(position)) {
      const jp = jobPostingJsonLd({
        id: position.id,
        title: position.title,
        description: positionBodyText(position),
        companyName: companyNameOf(position),
        companyUrl: isExternal(position) ? position.sourceUrl ?? null : null,
        employmentType: position.employmentType,
        workLocation: position.workLocation,
        datePosted: position.createdAt,
        validThrough: position.sourceDeadlineRolling ? null : position.sourceDeadlineDate,
        directApply: !isExternal(position)
      });
      if (jp) jsonLd.push(jp);
    }
  }

  return (
    <>
      {jsonLd.length > 0 ? <JsonLd data={jsonLd} /> : null}
      <GrowthPageView kind="job_detail" positionId={id} closed={position ? isClosed(position) : undefined} external={position ? isExternal(position) : undefined} />
      {position ? (
        <JobSeoSummary position={position} />
      ) : (
        /* 조회 실패 — 사람과 크롤러 모두 읽을 수 있는 안내. 빈 화면·에러 스택을 보여주지 않는다. */
        <section className="mx-auto w-full max-w-[720px] px-5 pt-6">
          <h1 className="text-[18px] font-black text-[#191F28]">공고를 불러오지 못했어요</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968]">
            일시적인 문제예요. 잠시 후 다시 시도해 주세요. 다른 공고는 아래에서 볼 수 있어요.
          </p>
          <a href="/talent/jobs" className="mt-3 inline-block text-[13.5px] font-semibold text-[#0B46E8] underline">
            전체 채용 공고 보기
          </a>
        </section>
      )}
      <JobDetailScreen jobId={id} />
    </>
  );
}
