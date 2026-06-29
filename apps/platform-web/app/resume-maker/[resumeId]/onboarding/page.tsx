import type { Metadata } from "next";
import { ResumeMakerOnboardingPage } from "../../../../components/resume-maker/ResumeMakerOnboardingPage";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 시작하기",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  return <ResumeMakerOnboardingPage resumeId={resumeId} />;
}
