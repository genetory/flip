"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "../../components/pages/LoginPage";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

// 첫 화면 — 이미 로그인되어 있으면 대시보드로 바로 이동, 아니면 aply.global
// 로그인 화면(사이트 헤더/푸터 + Career Launch Bootcamp 타이틀)을 보여준다.
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-[13px] text-muted-foreground">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </div>
    );
  }

  return (
    <LoginPage
      defaultNext="/career-launch/dashboard"
      brandTitle="Career Launch Bootcamp"
      brandSubtitle={t(
        "외국인 유학생을 위한 4주 한국 취업 준비 부트캠프",
        "A 4-week Korea job-prep bootcamp for international students",
        "为外国留学生打造的4周韩国就业准备训练营",
        "Trại huấn luyện 4 tuần chuẩn bị xin việc tại Hàn Quốc dành cho du học sinh",
        "外国人留学生のための4週間・韓国就職準備ブートキャンプ",
        "Bootcamp persiapan kerja di Korea selama 4 minggu untuk mahasiswa internasional"
      )}
    />
  );
}
