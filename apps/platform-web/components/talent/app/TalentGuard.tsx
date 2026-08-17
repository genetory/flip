"use client";

// Talent 로그인 후 화면 접근 가드.
// - 미로그인 → /login
// - PARTNER → /business (파트너 콘솔)
// - STUDENT / OPERATOR 허용 (운영자는 학생 기능 슈퍼유저)
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { TLoading } from "../ui/primitives";
import { usePlatformT } from "../../../lib/i18n";

// allowGuest: 로그인 없이도 열람 가능한 공개 화면(포지션 탐색·취업 가이드 등).
// 이 경우 로그인/역할 리다이렉트를 하지 않고 누구에게나 콘텐츠를 보여준다.
export function TalentGuard({ children, allowGuest = false }: { children: ReactNode; allowGuest?: boolean }) {
  const router = useRouter();
  const t = usePlatformT();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const allowed = allowGuest || (isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR"));

  useEffect(() => {
    if (!isReady || allowGuest) return; // 공개 화면 — 리다이렉트 없음
    if (!isAuthenticated) {
      // 로그인 페이지는 ?next= 만 신뢰(same-origin 내부 경로). 로그인 후 원래 화면으로 복귀.
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (user?.role === "PARTNER") {
      router.replace("/partner/home");
    }
  }, [isReady, isAuthenticated, user?.role, router, allowGuest]);

  if (!isReady) return <TLoading label={t("확인하는 중…", "Checking…", "确认中…", "Đang kiểm tra…", "確認中…", "Memeriksa…")} />;
  if (!allowed) return <TLoading label={t("이동하는 중…", "Redirecting…", "跳转中…", "Đang chuyển…", "移動中…", "Mengalihkan…")} />;
  return <>{children}</>;
}
