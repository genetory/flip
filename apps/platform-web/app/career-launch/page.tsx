"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchLoginPage } from "../../components/launch/CareerLaunchLoginPage";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

// 첫 화면 — 이미 로그인되어 있으면 대시보드로, 아니면 리뉴얼 로그인(학생 전용).
export default function LaunchLoginRoute() {
  const t = useLaunchT();
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </div>
    );
  }

  return <CareerLaunchLoginPage />;
}
