import { Suspense } from "react";
import type { Metadata } from "next";
import { AiUsageProvider } from "../../../../../../lib/resume-maker-ai-usage";
import { ResumeTailorPage } from "../../../../../../components/resume-maker/ResumeTailorPage";

// 공고 맞춤 분석 — 레거시 /resume-maker/[resumeId]/tailor 에만 마운트돼 있어서, 리뉴얼 전용
// 라우팅(308) 이후 도달 불가 상태로 묻혀 있던 화면을 리뉴얼 경로로 되살린다.
// RESUME_TOOLS_WIP 는 false("공개 완료")이므로 WIP 게이트는 두지 않는다.
// 리뉴얼 ResumesScreen 의 '직무 맞춤'은 직무명·역량 칩으로 초안을 만드는 온보딩이고,
// 이 화면은 JD/공고를 받아 적합도 점수까지 내는 별개 기능이다(tailor-resume API).
export const metadata: Metadata = {
  title: "공고 맞춤 분석",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      {/* ResumeTailorPage 가 useAiUsage() 를 쓴다. 기본 컨텍스트로도 동작하지만
          잔량 표시·갱신이 무동작이 되므로 provider 로 감싼다. */}
      <AiUsageProvider>
        <ResumeTailorPage resumeId={id} />
      </AiUsageProvider>
    </Suspense>
  );
}
