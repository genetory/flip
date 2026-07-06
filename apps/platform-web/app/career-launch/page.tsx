"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "../../components/pages/LoginPage";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";

// 첫 화면 — 이미 로그인되어 있으면 대시보드로 바로 이동, 아니면 aply.global
// 로그인 화면(사이트 헤더/푸터 + Career Launch Bootcamp 타이틀)을 보여준다.
export default function LaunchLoginRoute() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/career-launch/dashboard");
    }
  }, [isReady, isAuthenticated, router]);

  // 세션 확인 중이거나 이미 로그인(대시보드로 이동 중) → 로그인 폼 깜빡임 방지.
  if (!isReady || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-[13px] text-muted-foreground">불러오는 중...</span>
      </div>
    );
  }

  return (
    <LoginPage
      defaultNext="/career-launch/dashboard"
      brandTitle="Career Launch Bootcamp"
      brandSubtitle="외국인 유학생을 위한 4주 한국 취업 준비 부트캠프"
    />
  );
}
