import type { Metadata } from "next";
import { AiUsageProvider } from "../../../lib/resume-maker-ai-usage";
import { ResumePresenceProvider } from "../../../lib/resume-maker-resumes";
import { CoverLetterListPage } from "../../../components/resume-maker/CoverLetterListPage";

// Career Launch 안에서 바로 자기소개서를 만든다. resume-maker 빌더를 프로그램 경로에
// 임베드 — 진입이 프로그램 안(/career-launch/cover-letter)에서 이뤄진다.
export const metadata: Metadata = {
  title: "자기소개서 만들기 · Career Launch",
  robots: { index: false, follow: false }
};

export default function Page() {
  return (
    <AiUsageProvider>
      <ResumePresenceProvider>
        <CoverLetterListPage />
      </ResumePresenceProvider>
    </AiUsageProvider>
  );
}
