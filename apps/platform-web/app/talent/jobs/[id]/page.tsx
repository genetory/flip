// 공고 상세 — 서버 컴포넌트. 예전에는 "use client" 라서 generateMetadata 를 쓸 수 없어
// 12,000여 개 공고가 전부 사이트 기본 title + canonical "/" 를 달았다.
// 화면은 전부 JobDetailScreen(클라이언트)이 그리고, 여기서는 보이지 않는 것만 담당한다:
// metadata(공고별 title·description·canonical·noindex), JobPosting·BreadcrumbList JSON-LD,
// 진입 계측, 없는 공고의 404.
//
// 서버 렌더 요약 카드(JobSeoSummary)는 GNB 위에 떠서 레이아웃을 깨뜨려 제거했다.
// 그래서 공고 사실 정보는 JSON-LD(구조화 데이터)로만 서버에서 제공된다.
import type { Metadata } from "next";
import { JobDetailScreen } from "../../../../components/talent/screens/JobDetailScreen";
import { JobDetailSeo, jobDetailMetadata } from "../../../../components/seo/JobDetailSeo";

type RouteProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { id } = await params;
  return jobDetailMetadata(id);
}

export default async function TalentJobDetailRoute({ params }: RouteProps) {
  const { id } = await params;
  return (
    <>
      <JobDetailSeo id={id} />
      <JobDetailScreen jobId={id} />
    </>
  );
}
