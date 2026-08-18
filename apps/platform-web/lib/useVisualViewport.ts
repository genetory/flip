"use client";

// 모바일 키보드가 올라오면 visualViewport 의 높이가 줄고 offsetTop 이 생긴다.
// 이 값을 추적해 팝업 오버레이를 '실제 보이는 영역'에 맞게 줄여, 입력창이 키보드에
// 가려지지 않게 한다. visualViewport 미지원 환경/SSR 에서는 null 을 반환(기존 동작 유지).
import { useEffect, useState } from "react";

export type VisualViewportRect = { height: number; offsetTop: number };

export function useVisualViewport(): VisualViewportRect | null {
  const [rect, setRect] = useState<VisualViewportRect | null>(null);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => setRect({ height: vv.height, offsetTop: vv.offsetTop });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return rect;
}
