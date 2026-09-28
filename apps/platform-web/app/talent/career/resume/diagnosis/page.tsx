import { Suspense } from "react";
import type { Metadata } from "next";
import { ResumeMakerToolProviders } from "../../../../../components/resume-maker/ResumeMakerToolProviders";
import { ResumeDiagnosisEntryPage } from "../../../../../components/resume-maker/ResumeDiagnosisEntryPage";

// 이력서 AI 진단 — 레거시 /resume-maker/diagnosis 에만 마운트돼 있어서 리뉴얼 전용
// 라우팅(308) 이후 도달 불가 상태였다. tailor 와 같은 케이스로 되살린다.
// 리뉴얼 쪽에 대체물이 없다(ResumeDetailScreen 은 조회 전용, Resume.score 필드를 쓰는 화면 없음).
//
// per-id 가 아니다 — ResumeDiagnosisEntryPage 는 props 없이 내부에서 대상 이력서를
// 해석한다(getBuilderState / getDraftResume). 그래서 [id] 하위가 아니라 단일 경로에 둔다.
// /talent/career/resumes/diagnosis 로 두면 형제 [id] 세그먼트와 헷갈리므로(정적 우선이라
// 동작은 하지만 함정) 편집기 경로(/talent/career/resume) 하위에 둔다.
export const metadata: Metadata = {
  title: "이력서 AI 진단",
  robots: { index: false, follow: false }
};

export default function Page() {
  return (
    <Suspense>
      <ResumeMakerToolProviders>
        <ResumeDiagnosisEntryPage />
      </ResumeMakerToolProviders>
    </Suspense>
  );
}
