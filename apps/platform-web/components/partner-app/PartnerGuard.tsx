"use client";

// 파트너 앱 접근 가드.
// - 미로그인 → 로그인
// - STUDENT → /talent (탤런트 앱)
// - PARTNER / OPERATOR 허용 (운영자는 파트너 기능도 접근 가능)
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TLoading } from "../talent/ui/primitives";

export function PartnerGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const allowed = isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR");

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (user?.role === "STUDENT") {
      router.replace("/talent/home");
    }
  }, [isReady, isAuthenticated, user?.role, router]);

  if (!isReady) return <TLoading label="확인하는 중…" />;
  if (!allowed) return <TLoading label="이동하는 중…" />;
  return <>{children}</>;
}
