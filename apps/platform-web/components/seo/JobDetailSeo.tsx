// 공고 상세의 '보이지 않는 것' — metadata·JSON-LD·진입 계측·없는 공고 404.
// 기존 화면(/talent/jobs/[id])과 v2 화면이 같이 쓴다. 화면은 각 라우트가 따로 그린다.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "./JsonLd";
import { GrowthPageView } from "./GrowthPageView";
import { breadcrumbJsonLd, jobPostingJsonLd } from "../../lib/seo-jsonld";
import { clampDescription, pageSeo } from "../../lib/seo";
import {
  companyNameOf,
  fetchPublicPosition,
  hasIndexableBody,
  isClosed,
  isExternal,
  positionBodyText
} from "../../lib/server/positions";

export async function jobDetailMetadata(id: string): Promise<Metadata> {
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

/** 조회 실패(undefined)면 JSON-LD 없이 계측만 — 화면의 에러·재시도는 각 화면이 처리한다. 없는 공고(null)는 404. */
export async function JobDetailSeo({ id }: { id: string }) {
  const position = await fetchPublicPosition(id);
  if (position === null) notFound();

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
    </>
  );
}
