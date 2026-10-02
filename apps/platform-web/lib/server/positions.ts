// 서버에서 공개 공고를 읽는다 — 공고 상세의 metadata·JSON-LD·404 판정이 전부 이 모듈을 쓴다.
// 클라이언트 화면(JobDetailScreen)은 그대로 두고, 크롤러가 첫 HTML 에서 볼 내용만 여기서 만든다.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

/** 공개 /positions API 가 돌려주는 필드 중 SEO 에 쓰는 것만. */
export type PublicPosition = {
  id: string;
  title: string;
  status: string;
  sourceKind?: string | null;
  sourceCompanyName?: string | null;
  sourceUrl?: string | null;
  sourceDeadlineDate?: string | null;
  sourceDeadlineRolling?: boolean | null;
  employmentType?: string | null;
  workLocation?: string | null;
  preferredJobRole?: string | null;
  mainResponsibilities?: string | null;
  requiredQualifications?: string | null;
  preferredQualifications?: string | null;
  hiringProcess?: string | null;
  additionalNotes?: string | null;
  eligibleVisas?: string[] | null;
  communicationLanguages?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  partnerOrganization?: { name?: string | null } | null;
};

/**
 * 공고 1건. 없으면 null(호출부에서 notFound() 로 404 를 낸다).
 * 네트워크 실패와 404 를 구분한다 — 실패를 404 로 바꾸면 API 가 흔들릴 때
 * 멀쩡한 공고가 검색엔진에서 사라진다. 실패는 undefined 로 돌려준다.
 */
export async function fetchPublicPosition(id: string): Promise<PublicPosition | null | undefined> {
  if (!id.trim()) return null;
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl}/positions/${encodeURIComponent(id)}`, { next: { revalidate: 600 } });
  } catch {
    return undefined; // 조회 실패 — 404 로 단정하지 않는다
  }
  if (res.status === 404) return null;
  if (!res.ok) return undefined;
  try {
    const payload = (await res.json()) as { ok?: boolean; item?: PublicPosition };
    if (!payload?.ok || !payload.item?.id) return undefined;
    return payload.item;
  } catch {
    return undefined;
  }
}

/** 회사명 — 파트너 공고는 조직명, 외부 공고는 수집한 회사명. */
export function companyNameOf(p: PublicPosition): string | null {
  return p.partnerOrganization?.name?.trim() || p.sourceCompanyName?.trim() || null;
}

/** 공고 본문을 사람이 읽는 순서로 합친다. 비어 있으면 빈 문자열. */
export function positionBodyText(p: PublicPosition): string {
  return [p.mainResponsibilities, p.requiredQualifications, p.preferredQualifications, p.additionalNotes, p.hiringProcess]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * 색인할 만한 내용이 있나. 외부 수집 공고 중에는 제목만 있고 본문이 빈 것이 많다 —
 * 그런 페이지를 정상 SEO 페이지로 색인하면 사이트 전체 품질 평가가 내려간다.
 */
export function hasIndexableBody(p: PublicPosition): boolean {
  return positionBodyText(p).length >= 120;
}

export function isClosed(p: PublicPosition): boolean {
  if (p.status && p.status !== "OPEN") return true;
  if (p.sourceDeadlineDate && !p.sourceDeadlineRolling) {
    const d = new Date(p.sourceDeadlineDate);
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now()) return true;
  }
  return false;
}

/** 외부(원티드 등) 공고 — 우리 사이트에서 지원이 끝나지 않으므로 directApply=false. */
export function isExternal(p: PublicPosition): boolean {
  return p.sourceKind === "EXTERNAL";
}

/** 외국인 지원 가능 여부 — eligibleVisas 에 값이 있으면 받는다는 뜻이다. */
export function foreignerFriendly(p: PublicPosition): boolean {
  return (p.eligibleVisas ?? []).length > 0;
}

export type PositionListPage = { items: PublicPosition[]; nextCursor: string | null };

/**
 * 공개 공고 목록 한 페이지. 실패하면 null — 호출부가 사람·크롤러 모두 읽을 수 있는
 * 안내로 대체한다(빈 화면이나 에러 스택을 보여주지 않는다).
 */
export async function fetchPublicPositions(limit = 20, cursor?: string): Promise<PositionListPage | null> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  try {
    const res = await fetch(`${apiBaseUrl}/positions?${params.toString()}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const payload = (await res.json()) as { ok?: boolean; items?: PublicPosition[]; nextCursor?: string | null };
    if (!payload?.ok || !Array.isArray(payload.items)) return null;
    return { items: payload.items, nextCursor: payload.nextCursor ?? null };
  } catch {
    return null;
  }
}
