"use client";

// GNB 위(상단 오버스크롤) 영역이 회색으로 보이지 않게 최상단 <html> 배경을 흰색으로.
// talent/partner 셸과 동일한 처리. 레이아웃에 두어 career-launch 전 화면에 적용.
import { useEffect } from "react";

export function LaunchHtmlBg() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = "#ffffff";
    return () => {
      html.style.backgroundColor = prev;
    };
  }, []);
  return null;
}
