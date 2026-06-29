import type { Metadata } from "next";
import { ResumeBuilderPreviewPage } from "../../../../components/resume-maker/ResumeBuilderPreviewPage";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 미리보기",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  return <ResumeBuilderPreviewPage resumeId={resumeId} />;
}
