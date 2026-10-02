// sitemap index — robots.txt 가 알리는 단일 진입점. 하위 sitemap 을 가리킨다.
// 공고가 12,000개를 넘어 한 파일에 담지 않고 조각으로 쪼갠다.
import { CONTENT_ENTRIES, JOBS_PER_SITEMAP, XML_HEADERS, sitemapIndexXml } from "../../lib/server/sitemap-urls";
import { fetchPublicPositionCount } from "../../lib/server/sitemap-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const total = await fetchPublicPositionCount();
  const jobPages = Math.max(1, Math.ceil(total / JOBS_PER_SITEMAP));
  const paths = [
    "/sitemaps/static.xml",
    ...(CONTENT_ENTRIES.length > 0 ? ["/sitemaps/content.xml"] : []),
    ...Array.from({ length: jobPages }, (_, i) => `/sitemaps/jobs/${i + 1}.xml`)
  ];
  return new Response(sitemapIndexXml(paths, new Date().toISOString()), { headers: XML_HEADERS });
}
