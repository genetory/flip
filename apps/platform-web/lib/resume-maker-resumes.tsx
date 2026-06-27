"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getMyResumes } from "./member-profile-client";
import { isResumeMakerDraft } from "./resume-maker-client";

// 이력서 보유 여부를 resume-maker 전 화면에서 공유한다(GNB에서 도구 메뉴 활성/비활성 판단).
// hasResume: null = 아직 모름(로딩), true/false = 보유 여부.
type ResumePresenceCtx = { hasResume: boolean | null; refresh: () => void };

const Ctx = createContext<ResumePresenceCtx>({ hasResume: null, refresh: () => {} });

export function ResumePresenceProvider({ children }: { children: ReactNode }) {
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const refresh = useCallback(() => {
    void getMyResumes()
      .then((list) => setHasResume(list.filter(isResumeMakerDraft).length > 0))
      .catch(() => {
        /* 조회 실패 시 잠그지 않음(가용성 우선) */
      });
  }, []);
  useEffect(() => {
    refresh();
    // 이력서 생성/삭제 시 즉시 갱신.
    const onChanged = () => refresh();
    window.addEventListener("aply:resumes-changed", onChanged);
    return () => window.removeEventListener("aply:resumes-changed", onChanged);
  }, [refresh]);
  return <Ctx.Provider value={{ hasResume, refresh }}>{children}</Ctx.Provider>;
}

export function useResumePresence(): ResumePresenceCtx {
  return useContext(Ctx);
}
