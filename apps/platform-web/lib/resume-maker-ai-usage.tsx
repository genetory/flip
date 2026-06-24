"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getAiUsage } from "./resume-maker-client";

// 공용 AI 티켓 잔량을 resume-maker 전 화면에서 공유한다(GNB 표시 + 도구에서 소모 후 갱신).
type AiUsageCtx = { remaining: number | null; resetAt: string | null; refresh: () => void };

const Ctx = createContext<AiUsageCtx>({ remaining: null, resetAt: null, refresh: () => {} });

export function AiUsageProvider({ children }: { children: ReactNode }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const refresh = useCallback(() => {
    void getAiUsage()
      .then((u) => {
        setRemaining(u.remaining);
        setResetAt(u.resetAt);
      })
      .catch(() => {
        /* STUDENT 아님/비로그인 등 — 표시하지 않음 */
      });
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return <Ctx.Provider value={{ remaining, resetAt, refresh }}>{children}</Ctx.Provider>;
}

export function useAiUsage(): AiUsageCtx {
  return useContext(Ctx);
}
