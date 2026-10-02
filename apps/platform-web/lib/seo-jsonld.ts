// 구조화 데이터 빌더(순수 함수) — 값이 없는 키는 아예 넣지 않는다.
// Google Rich Results Test 로 검증 가능한 최소 형태를 지킨다.
import { SITE_URL, absoluteUrl } from "./seo";

/** undefined/null/빈 문자열/빈 배열 키를 제거한다 — 빈 값이 들어간 JSON-LD 는 검증에서 경고가 난다. */
function compact<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export type BreadcrumbItem = { name: string; path: string };

/** 빵부스러기 — 마지막 항목이 현재 페이지. 1개뿐이면 만들지 않는다(의미 없음). */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> | null {
  if (items.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

/** schema.org employmentType 으로 쓸 수 있는 값만 통과시킨다. */
const EMPLOYMENT_TYPES = new Set(["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER", "PER_DIEM", "OTHER"]);

export type JobPostingInput = {
  id: string;
  title: string;
  /** 사람이 읽는 HTML/텍스트 본문. 비어 있으면 JobPosting 을 만들지 않는다. */
  description: string;
  companyName: string | null;
  companyUrl?: string | null;
  employmentType?: string | null;
  /** 자유 서술 주소(예: "서울시 송파구 …"). */
  workLocation?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  /** 외부 공고면 false — 우리 사이트에서 직접 지원이 완료되지 않는다. */
  directApply: boolean;
};

/**
 * JobPosting — description 과 title 이 없으면 null 을 돌려준다.
 * Google 은 description·title·datePosted·hiringOrganization·jobLocation 을 권장한다.
 */
export function jobPostingJsonLd(input: JobPostingInput): Record<string, unknown> | null {
  if (!input.title.trim() || !input.description.trim()) return null;
  const employmentType = input.employmentType && EMPLOYMENT_TYPES.has(input.employmentType) ? input.employmentType : undefined;
  return compact({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: input.title.trim(),
    description: input.description.trim(),
    identifier: compact({ "@type": "PropertyValue", name: "Aply", value: input.id }),
    url: absoluteUrl(`/talent/jobs/${input.id}`),
    datePosted: input.datePosted ?? undefined,
    validThrough: input.validThrough ?? undefined,
    employmentType,
    directApply: input.directApply,
    hiringOrganization: input.companyName
      ? compact({ "@type": "Organization", name: input.companyName, sameAs: input.companyUrl ?? undefined })
      : compact({ "@type": "Organization", name: "Aply", sameAs: SITE_URL }),
    jobLocation: compact({
      "@type": "Place",
      address: compact({
        "@type": "PostalAddress",
        addressCountry: "KR",
        streetAddress: input.workLocation ?? undefined
      })
    })
  });
}
