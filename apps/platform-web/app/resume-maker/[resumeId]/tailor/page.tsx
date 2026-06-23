import { Suspense } from "react";
import type { Metadata } from "next";
import { ResumeTailorPage } from "../../../../components/resume-maker/ResumeTailorPage";
import { ResumeWipNotice } from "../../../../components/resume-maker/ResumeWipNotice";
import { RESUME_TOOLS_WIP } from "../../../../lib/resume-maker-flags";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 공고 맞춤",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  if (RESUME_TOOLS_WIP) return <ResumeWipNotice />;
  return (
    <Suspense>
      <ResumeTailorPage resumeId={resumeId} />
    </Suspense>
  );
}
