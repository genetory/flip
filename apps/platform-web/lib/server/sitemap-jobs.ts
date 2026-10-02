// 공고 sitemap 데이터 — 색인할 가치가 있는 공고만 넣는다.
//
// 예전 sitemap 은 공개 공고 전체(12,000여 개)를 그대로 담았다. 그중 상당수는 외부에서
// 수집한 제목만 있는 공고이거나 마감된 공고다. 그런 페이지는 상세에서 noindex 로 내보내므로
// sitemap 에 넣으면 "sitemap 에 있는데 noindex" 충돌만 만든다 → 여기서 함께 걸러낸다.
import { JOBS_PER_SITEMAP, type SitemapEntry } from "./sitemap-urls";
import { hasIndexableBody, isClosed, type PublicPosition } from "./positions";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

/** 커서 페이지네이션으로 공개 공고를 모두 읽는다. 상한을 둬 sitemap 응답이 무한정 커지지 않게 한다. */
async function fetchAllPublicPositions(): Promise<PublicPosition[]> {
  const out: PublicPosition[] = [];
  const pageSize = 100;
  const maxPages = 200; // 최대 20,000건
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const params = new URLSearchParams({ limit: String(pageSize) });
    if (cursor) params.set("cursor", cursor);
    let res: Response;
    try {
      res = await fetch(`${apiBaseUrl}/positions?${params.toString()}`, { next: { revalidate: 3600 } });
    } catch {
      break; // 조회 실패 — 지금까지 모은 것만 내보낸다(sitemap 전체를 깨뜨리지 않는다)
    }
    if (!res.ok) break;
    let payload: { ok?: boolean; items?: PublicPosition[]; nextCursor?: string | null };
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      break;
    }
    if (!payload?.ok || !Array.isArray(payload.items)) break;
    out.push(...payload.items);
    if (!payload.nextCursor) break;
    cursor = payload.nextCursor;
  }
  return out;
}

/** 색인 대상 공고만 sitemap 항목으로. 상세의 noindex 기준과 같은 함수를 쓴다. */
export async function fetchIndexableJobSitemapEntries(): Promise<SitemapEntry[]> {
  const positions = await fetchAllPublicPositions();
  return positions
    .filter((p) => hasIndexableBody(p) && !isClosed(p))
    .map((p) => ({
      path: `/talent/jobs/${p.id}`,
      changefreq: "weekly" as const,
      priority: 0.8,
      lastmod: p.updatedAt ?? p.createdAt ?? undefined
    }));
}

/** index 가 조각 수를 계산할 때만 쓴다. */
export async function fetchPublicPositionCount(): Promise<number> {
  const entries = await fetchIndexableJobSitemapEntries();
  return entries.length;
}

export { JOBS_PER_SITEMAP };
