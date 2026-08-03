"use client";

// 이미 로그인한 Talent 사용자를 앱 화면으로 넘긴다(공개 진입 페이지에서 사용).
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../../auth/AuthSessionProvider";

export function AuthedRedirect({ to }: { to: string }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR")) {
      router.replace(to);
    }
  }, [isReady, isAuthenticated, user?.role, router, to]);

  return null;
}
