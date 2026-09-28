"use client";

import type { ReactNode } from "react";
import { AiUsageProvider } from "../../lib/resume-maker-ai-usage";
import { ResumePresenceProvider } from "../../lib/resume-maker-resumes";

// 레거시 resume-maker 도구 화면을 리뉴얼 경로에서 마운트할 때 쓰는 provider 묶음.
//
// ResumeMakerShell 이 useAiUsage()(잔량 표시)와 useResumePresence()(이력서 보유 여부로
// 도구 메뉴 잠금)를 둘 다 쓴다. 두 컨텍스트 모두 기본값이 있어 provider 없이도 크래시는
// 나지 않지만, hasResume 이 null 로 고정돼 **도구 메뉴가 계속 잠긴 상태**로 보인다.
// app/resume-maker/layout.tsx 가 하던 역할을 그대로 옮긴 것이다.
export function ResumeMakerToolProviders({ children }: { children: ReactNode }) {
  return (
    <AiUsageProvider>
      <ResumePresenceProvider>{children}</ResumePresenceProvider>
    </AiUsageProvider>
  );
}
