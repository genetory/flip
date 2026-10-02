"use client";

// 공개 랜딩(/career-launch)에 이미 수강 중인 사용자가 들어오면 대시보드로 보낸다.
// 예전 /career-launch 가 하던 동작을 유지하기 위한 것 — 기존 사용자가 매번 소개 페이지를
// 다시 읽게 하지 않는다. 비로그인·미등록 방문자는 그대로 소개를 본다.
// 화면에는 아무것도 그리지 않는다(랜딩 레이아웃을 건드리지 않게).
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { fetchProgress } from "../../lib/launch/progress-client";

export function LaunchEnrolledRedirect() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuthSession();
  const done = useRef(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated || done.current) return;
    done.current = true;
    // 진행 상태를 읽을 수 있으면 수강생이다 — 실패(403 미등록 등)면 소개를 그대로 보여 준다.
    void fetchProgress()
      .then(() => router.replace("/career-launch/dashboard"))
      .catch(() => {
        /* 미등록·조회 실패 → 공개 소개 유지 */
      });
  }, [isReady, isAuthenticated, router]);

  return null;
}
