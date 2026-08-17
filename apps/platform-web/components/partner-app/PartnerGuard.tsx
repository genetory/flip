"use client";

// 파트너 앱 접근 가드.
// - 미로그인 → 로그인
// - STUDENT → /talent (탤런트 앱)
// - PARTNER / OPERATOR 허용 (운영자는 파트너 기능도 접근 가능)
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TLoading } from "../talent/ui/primitives";
import { usePlatformT } from "../../lib/i18n";

// allowGuest: 로그인 없이도 열람 가능한 공개 화면(마스킹된 인재 검색 등). 리다이렉트 없음.
export function PartnerGuard({ children, allowGuest = false }: { children: ReactNode; allowGuest?: boolean }) {
  const t = usePlatformT();
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const allowed = allowGuest || (isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR"));

  useEffect(() => {
    if (!isReady || allowGuest) return; // 공개 화면 — 리다이렉트 없음
    if (!isAuthenticated) {
      const here = window.location.pathname + window.location.search;
      router.replace(`/partner/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (user?.role === "STUDENT") {
      router.replace("/talent/home");
    }
  }, [isReady, isAuthenticated, user?.role, router, allowGuest]);

  if (!isReady) return <TLoading label={t("확인하는 중…", "Checking…", "确认中…", "Đang kiểm tra…", "確認中…", "Memeriksa…")} />;
  if (!allowed) return <TLoading label={t("이동하는 중…", "Redirecting…", "跳转中…", "Đang chuyển…", "移動中…", "Mengalihkan…")} />;
  return <>{children}</>;
}
