// 정적 공개 페이지 sitemap.
import { STATIC_ENTRIES, XML_HEADERS, urlsetXml } from "../../../lib/server/sitemap-urls";

export const revalidate = 86400;

export async function GET() {
  const lastmod = new Date().toISOString();
  return new Response(urlsetXml(STATIC_ENTRIES.map((e) => ({ ...e, lastmod }))), { headers: XML_HEADERS });
}
