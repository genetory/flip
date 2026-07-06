import type { Metadata } from "next";
import { AiUsageProvider } from "../../../lib/resume-maker-ai-usage";
import { ResumePresenceProvider } from "../../../lib/resume-maker-resumes";
import { ResumeListPage } from "../../../components/resume-maker/ResumeListPage";

// Career Launch 안에서 바로 이력서를 만든다. resume-maker 빌더를 프로그램 경로에
// 임베드 — 진입이 프로그램 안(/career-launch/resume)에서 이뤄진다. 빌더가 필요로
// 하는 AI 티켓/이력서 보유 프로바이더는 resume-maker 레이아웃과 동일하게 감싼다.
export const metadata: Metadata = {
  title: "이력서 만들기 · Career Launch",
  robots: { index: false, follow: false }
};

export default function Page() {
  return (
    <AiUsageProvider>
      <ResumePresenceProvider>
        <ResumeListPage />
      </ResumePresenceProvider>
    </AiUsageProvider>
  );
}
