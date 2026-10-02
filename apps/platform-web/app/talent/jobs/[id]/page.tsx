// 공고 상세 — 서버 컴포넌트. 예전에는 "use client" 라서 generateMetadata 를 쓸 수 없어
// 12,000여 개 공고가 전부 사이트 기본 title + canonical "/" 를 달았다.
// 화면은 전부 JobDetailScreen(클라이언트)이 그리고, 여기서는 보이지 않는 것만 담당한다:
// metadata(공고별 title·description·canonical·noindex), JobPosting·BreadcrumbList JSON-LD,
// 진입 계측, 없는 공고의 404.
//
// 서버 렌더 요약 카드(JobSeoSummary)는 GNB 위에 떠서 레이아웃을 깨뜨려 제거했다.
// 그래서 공고 사실 정보는 JSON-LD(구조화 데이터)로만 서버에서 제공된다.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JobDetailScreen } from "../../../../components/talent/screens/JobDetailScreen";
import { JsonLd } from "../../../../components/seo/JsonLd";
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
  if (position === null) {
    return pageSeo({ path: `/talent/jobs/${id}`, title: "공고를 찾을 수 없어요", description: "요청한 공고가 없거나 내려갔어요.", noindex: true });
  }

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
  if (position === null) notFound(); // 없는 공고 → 404
  // 조회 실패(undefined)면 JSON-LD 없이 그냥 넘긴다 — 화면의 에러·재시도는 JobDetailScreen 이 처리한다.

  const jsonLd: Record<string, unknown>[] = [];
  if (position) {
    const crumbs = breadcrumbJsonLd([
      { name: "홈", path: "/" },
      { name: "채용 공고", path: "/talent/jobs" },
      { name: position.title, path: `/talent/jobs/${position.id}` }
    ]);
    if (crumbs) jsonLd.push(crumbs);
    // 내용이 부족하거나 마감된 공고에는 만들지 않는다 — 빈 구인 마크업은 검색 품질 위반이다.
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
      <GrowthPageView
        kind="job_detail"
        positionId={id}
        closed={position ? isClosed(position) : undefined}
        external={position ? isExternal(position) : undefined}
      />
      <JobDetailScreen jobId={id} />
    </>
  );
}
