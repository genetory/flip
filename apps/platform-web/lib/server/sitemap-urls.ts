// sitemap 에 넣을 URL 목록 — "실제로 200 을 돌려주는 공개 페이지"만 담는다.
//
// 예전 sitemap 은 /resources/*, /pricing, /community, /matching-probability 와 비자 상세 39개를
// 담고 있었는데 이들은 next.config.mjs 에서 308 로 리다이렉트된다(리뉴얼 전면 이관 정책).
// 리다이렉트 URL 을 sitemap 에 넣으면 Search Console 이 오류로 처리하므로 모두 제거했다.
import { SITE_URL } from "../seo";
import { VISA_DETAILS } from "../visa-details";

export type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  lastmod?: string;
};

/** 리다이렉트되지 않고 색인 대상인 정적 공개 페이지. 추가 전 반드시 실제 응답을 확인한다. */
export const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/talent", changefreq: "weekly", priority: 0.9 },
  { path: "/talent/jobs", changefreq: "daily", priority: 0.9 },
  { path: "/career-launch", changefreq: "weekly", priority: 0.8 },
  { path: "/talent/signup", changefreq: "monthly", priority: 0.6 },
  { path: "/legal/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/legal/privacy", changefreq: "yearly", priority: 0.3 }
];

/**
 * 콘텐츠(비자) sitemap. 리뉴얼 경로(/talent/visa)로 발행한 것만 담는다.
 * 레거시 /resources/visa/* 는 정책상 308 로 차단된 상태이므로 절대 넣지 않는다.
 */
export const CONTENT_ENTRIES: SitemapEntry[] = [
  { path: "/talent/visa", changefreq: "monthly", priority: 0.7 },
  ...Object.keys(VISA_DETAILS).map((code) => ({
    path: `/talent/visa/${encodeURIComponent(code)}`,
    changefreq: "monthly" as const,
    priority: 0.6
  }))
];

/** 공고 sitemap 한 조각의 최대 URL 수. Google 상한은 50,000 이지만 응답 크기를 위해 더 작게 쪼갠다. */
export const JOBS_PER_SITEMAP = 5000;

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const loc = xmlEscape(`${SITE_URL}${e.path === "/" ? "" : e.path}`);
      const lastmod = e.lastmod ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>` : "";
      return `<url><loc>${loc}</loc>${lastmod}<changefreq>${e.changefreq}</changefreq><priority>${e.priority.toFixed(1)}</priority></url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(paths: string[], lastmod: string): string {
  const body = paths
    .map((p) => `<sitemap><loc>${xmlEscape(`${SITE_URL}${p}`)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
} as const;
