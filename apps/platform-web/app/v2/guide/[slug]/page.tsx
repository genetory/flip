import { V2GuideArticle } from "../../../../components/v2/screens/V2GuideArticle";

export default async function V2GuideArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <V2GuideArticle slug={slug} />;
}
