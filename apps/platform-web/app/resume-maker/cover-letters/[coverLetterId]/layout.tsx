import type { ReactNode } from "react";
import { CareerLaunchManagedGuard } from "../../../../components/resume-maker/CareerLaunchManagedGuard";

// 자소서 편집 화면은 문항 본문을 저장한다. 커리어런치 미러 자소서는 여기서 막는다(미리보기는 통과).
export default async function ResumeMakerCoverLetterLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ coverLetterId: string }>;
}) {
  const { coverLetterId } = await params;
  return (
    <CareerLaunchManagedGuard
      kind="coverLetter"
      id={coverLetterId}
      previewHref={`/resume-maker/cover-letters/${encodeURIComponent(coverLetterId)}/preview`}
    >
      {children}
    </CareerLaunchManagedGuard>
  );
}
