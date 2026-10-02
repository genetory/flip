"use client";

// Career Launch 시작 — 로그인·초대코드·대시보드 분기. 예전 /career-launch 가 하던 일이다.
// /career-launch 는 공개 소개 페이지가 되었고, "시작하기"가 여기로 온다.
// 기존 로그인 사용자와 초대 링크(?invite=CODE)가 깨지지 않게 동작을 그대로 옮겼다.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchLoginPage } from "../../../components/launch/CareerLaunchLoginPage";
import { EnrollmentGate } from "../../../components/launch/enrollment-gate";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";
import { trackCareerFunnel, trackCareerLaunchStartClick } from "../../../lib/analytics";

export default function LaunchStartRoute() {
  const t = useLaunchT();
  const { isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    trackCareerFunnel("career_launch_viewed");
    trackCareerLaunchStartClick("start_page");
    // 초대 링크(?invite=CODE) — 미로그인 방문자가 로그인·가입을 거쳐 돌아와도
    // EnrollmentGate 가 자동 등록할 수 있게 코드를 저장한다.
    try {
      const inv = new URLSearchParams(window.location.search).get("invite");
      if (inv && inv.trim()) window.localStorage.setItem("cl_invite", inv.trim().toUpperCase());
    } catch {
      /* 무시 */
    }
  }, []);

  if (!isReady) return <FullscreenSpinner label={t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")} />;
  if (!isAuthenticated) return <CareerLaunchLoginPage />;
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
