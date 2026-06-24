import type { ReactNode } from "react";
import { AiUsageProvider } from "../../lib/resume-maker-ai-usage";

// resume-maker 전 화면에서 공용 AI 티켓 잔량을 공유(GNB 표시 + 도구 소모 후 갱신).
export default function ResumeMakerLayout({ children }: { children: ReactNode }) {
  return <AiUsageProvider>{children}</AiUsageProvider>;
}
