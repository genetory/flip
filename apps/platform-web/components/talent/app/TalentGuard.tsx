"use client";

// Talent 로그인 후 화면 접근 가드.
// - 미로그인 → /login
// - PARTNER → /business (파트너 콘솔)
// - STUDENT / OPERATOR 허용 (운영자는 학생 기능 슈퍼유저)
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { TLoading } from "../ui/primitives";

export function TalentGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const allowed = isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR");

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      // 로그인 페이지는 ?next= 만 신뢰(same-origin 내부 경로). 로그인 후 원래 화면으로 복귀.
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (user?.role === "PARTNER") {
      router.replace("/partner");
    }
  }, [isReady, isAuthenticated, user?.role, router]);

  if (!isReady) return <TLoading label="확인하는 중…" />;
  if (!allowed) return <TLoading label="이동하는 중…" />;
  return <>{children}</>;
}
