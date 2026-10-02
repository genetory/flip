// 콘텐츠(비자 등) sitemap. 지금은 비어 있다 — 비자 상세는 리뉴얼 정책상 308 로 차단돼
// 공개되지 않으므로 넣지 않는다. 공개를 되살리면 CONTENT_ENTRIES 에 경로를 추가한다.
import { CONTENT_ENTRIES, XML_HEADERS, urlsetXml } from "../../../lib/server/sitemap-urls";

export const revalidate = 86400;

export async function GET() {
  const lastmod = new Date().toISOString();
  return new Response(urlsetXml(CONTENT_ENTRIES.map((e) => ({ ...e, lastmod }))), { headers: XML_HEADERS });
}
