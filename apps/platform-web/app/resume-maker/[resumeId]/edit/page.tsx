import { Suspense } from "react";
import type { Metadata } from "next";
import { ResumeBuilderEditorPage } from "../../../../components/resume-maker/ResumeBuilderEditorPage";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 편집",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  return (
    <Suspense>
      <ResumeBuilderEditorPage resumeId={resumeId} />
    </Suspense>
  );
}
