// 공고 sitemap 조각 — /sitemaps/jobs/1.xml 형태. 파일명에서 번호를 뽑는다.
import { JOBS_PER_SITEMAP, XML_HEADERS, urlsetXml, type SitemapEntry } from "../../../../lib/server/sitemap-urls";
import { fetchIndexableJobSitemapEntries } from "../../../../lib/server/sitemap-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET(_req: Request, ctx: { params: Promise<{ page: string }> }) {
  const { page } = await ctx.params;
  const n = Number.parseInt(page.replace(/\.xml$/, ""), 10);
  if (!Number.isInteger(n) || n < 1) return new Response("not found", { status: 404 });
  const all = await fetchIndexableJobSitemapEntries();
  const slice: SitemapEntry[] = all.slice((n - 1) * JOBS_PER_SITEMAP, n * JOBS_PER_SITEMAP);
  if (slice.length === 0 && n > 1) return new Response("not found", { status: 404 });
  return new Response(urlsetXml(slice), { headers: XML_HEADERS });
}
