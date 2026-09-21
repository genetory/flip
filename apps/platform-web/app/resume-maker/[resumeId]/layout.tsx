import type { ReactNode } from "react";
import { CareerLaunchManagedGuard } from "../../../components/resume-maker/CareerLaunchManagedGuard";

// 이 아래 편집 화면(edit·chat·experiences·interview·onboarding·tailor)은 모두 이력서 본문을 저장한다.
// 커리어런치 미러 이력서는 여기서 막는다(미리보기는 통과).
export default async function ResumeMakerResumeLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  return (
    <CareerLaunchManagedGuard kind="resume" id={resumeId} previewHref={`/resume-maker/${encodeURIComponent(resumeId)}/preview`}>
      {children}
    </CareerLaunchManagedGuard>
  );
}
