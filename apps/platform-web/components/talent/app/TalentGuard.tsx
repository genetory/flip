"use client";

// Talent 로그인 후 화면 접근 가드.
// - 미로그인 → 그 자리에서 잠긴 미리보기(무슨 화면인지 + 로그인/가입). 곧장 로그인으로 보내면
//   무슨 화면인지도 모른 채 잠겨 있어 믿음이 안 간다. 로그인은 /talent/login?next= 로.
// - PARTNER → /business (파트너 콘솔)
// - STUDENT / OPERATOR 허용 (운영자는 학생 기능 슈퍼유저)
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { TLoading } from "../ui/primitives";
import { TalentLockedPreview } from "./TalentLockedPreview";
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
    if (!isAuthenticated) return; // 잠긴 미리보기를 보여 준다(아래)
    if (user?.role === "PARTNER") {
      router.replace("/partner/home");
    }
  }, [isReady, isAuthenticated, user?.role, router, allowGuest]);

  // 공개 화면(allowGuest)은 세션 확인을 기다리지 않고 바로 내용을 렌더한다.
  // 기다리면 서버 HTML 이 스피너뿐이라 검색엔진이 본문을 전혀 보지 못한다(포지션 탐색·
  // 공고 상세·비자 가이드가 모두 그랬다). 보호할 비공개 내용이 없고 리다이렉트도 하지
  // 않으므로 기다릴 이유가 없다. 로그인 필요 화면은 그대로 확인 후에 렌더한다.
  if (!isReady && !allowGuest) return <TLoading label={t("확인하는 중…", "Checking…", "确认中…", "Đang kiểm tra…", "確認中…", "Memeriksa…")} />;
  if (!allowGuest && !isAuthenticated) return <TalentLockedPreview />;
  if (!allowed) return <TLoading label={t("이동하는 중…", "Redirecting…", "跳转中…", "Đang chuyển…", "移動中…", "Mengalihkan…")} />;
  return <>{children}</>;
}
