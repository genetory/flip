import type { ReactNode } from "react";
import { AiUsageProvider } from "../../lib/resume-maker-ai-usage";
import { ResumePresenceProvider } from "../../lib/resume-maker-resumes";

// resume-maker 전 화면에서 공용 AI 티켓 잔량 + 이력서 보유 여부를 공유(GNB 표시·메뉴 활성화).
export default function ResumeMakerLayout({ children }: { children: ReactNode }) {
  return (
    <AiUsageProvider>
      <ResumePresenceProvider>{children}</ResumePresenceProvider>
    </AiUsageProvider>
  );
}
