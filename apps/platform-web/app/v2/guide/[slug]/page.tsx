import type { Metadata } from "next";
import { V2GuideArticle } from "../../../../components/v2/screens/V2GuideArticle";
import { pageSeo } from "../../../../lib/seo";
import { INSIGHTS, insightPath } from "../../../../lib/insights/catalog";

// v2 가이드 글. 검색에는 기존 글 주소(/talent/insights/분류/글)가 올라가 있어서 canonical 을 그쪽으로 둔다 —
// 같은 글이 두 주소로 잡히지 않게. 공개 글이 아닌 v2 전용 가이드는 색인하지 않는다(레이아웃 기본값).
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = INSIGHTS.find((x) => x.slug === slug);
  if (!meta) return {};
  return pageSeo({
    path: insightPath(meta),
    title: meta.titleKo,
    description: meta.descKo,
    ogType: "article",
    publishedTime: meta.publishedAt,
    modifiedTime: meta.reviewedAt ?? meta.publishedAt
  });
}

export default async function V2GuideArticleRoute({ params }: Props) {
  const { slug } = await params;
  return <V2GuideArticle slug={slug} />;
}
