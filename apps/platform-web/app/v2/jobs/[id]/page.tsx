import type { Metadata } from "next";
import { V2JobDetailScreen } from "../../../../components/v2/screens/V2JobDetailScreen";
import { JobDetailSeo, jobDetailMetadata } from "../../../../components/seo/JobDetailSeo";

// v2 공고 상세 — 화면은 클라이언트(V2JobDetailScreen). 검색 노출(metadata·JSON-LD·404)은 기존 화면과 같은 JobDetailSeo.
type RouteProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { id } = await params;
  return jobDetailMetadata(id);
}

export default async function V2JobDetailRoute({ params }: RouteProps) {
  const { id } = await params;
  return (
    <>
      <JobDetailSeo id={id} />
      <V2JobDetailScreen id={id} />
    </>
  );
}
