import type { Metadata } from "next";
import { ResumeExperiencesPage } from "../../../../components/resume-maker/ResumeExperiencesPage";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 경험",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  return <ResumeExperiencesPage resumeId={resumeId} />;
}
