"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchCareerContent, type CareerContent } from "../../lib/launch/content-client";

// 운영자가 편집한 주차/스텝 문구를 한 번만 받아 앱 전체에 공급한다.
// 실패하거나 비로그인이면 빈 객체 — 화면은 코드의 기본값으로 정상 동작한다.
const CareerContentContext = createContext<CareerContent>({});

export function useCareerContentOverride(): CareerContent {
  return useContext(CareerContentContext);
}

export function CareerContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<CareerContent>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const c = await fetchCareerContent();
        if (alive) setContent(c ?? {});
      } catch {
        // 오버라이드가 없거나 비로그인 — 기본값 사용
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <CareerContentContext.Provider value={content}>{children}</CareerContentContext.Provider>;
}
