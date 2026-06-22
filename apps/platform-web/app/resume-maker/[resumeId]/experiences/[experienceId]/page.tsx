import type { Metadata } from "next";
import { ResumeExperienceInterviewPage } from "../../../../../components/resume-maker/ResumeExperienceInterviewPage";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 경험 인터뷰",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ resumeId: string; experienceId: string }> }) {
  const { resumeId, experienceId } = await params;
  return <ResumeExperienceInterviewPage resumeId={resumeId} experienceId={experienceId} />;
}
