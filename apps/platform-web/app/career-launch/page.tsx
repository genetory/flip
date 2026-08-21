"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchLoginPage } from "../../components/launch/CareerLaunchLoginPage";
import { EnrollmentGate } from "../../components/launch/enrollment-gate";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

// 진입 게이트 3단계 — 어느 상태에서든 "무슨 서비스인지" 인지되도록 소개를 함께 노출한다.
//  1) 비로그인       → 서비스 소개 + 로그인 (CareerLaunchLoginPage)
//  2) 로그인·미등록   → 서비스 소개 + 초대코드 입력 (EnrollmentGate)
//  3) 로그인·등록완료 → 대시보드(메인)로 이동
export default function LaunchEntryRoute() {
  const t = useLaunchT();
  const { isReady, isAuthenticated } = useAuthSession();

  if (!isReady) return <FullscreenSpinner label={t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")} />;
  // 비로그인 → 로그인(소개 포함).
  if (!isAuthenticated) return <CareerLaunchLoginPage />;
  // 로그인됨 → 등록 여부에 따라: 등록완료면 대시보드로, 미등록이면 초대코드 입력을 EnrollmentGate가 처리.
  return (
    <EnrollmentGate>
      <DashboardRedirect label={t("대시보드로 이동 중...", "Opening dashboard...", "正在打开面板...", "Đang mở bảng điều khiển...", "ダッシュボードへ移動中...", "Membuka dasbor...")} />
    </EnrollmentGate>
  );
}

function DashboardRedirect({ label }: { label: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace("/career-launch/dashboard");
  }, [router]);
  return <FullscreenSpinner label={label} />;
}

function FullscreenSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]">
        <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {label}
      </span>
    </div>
  );
}
