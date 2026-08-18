"use client";

// 저장(즐겨찾기)한 공고 중 마감이 임박(≤3일)한 공고를 알림함(벨)에 적재하는 백그라운드 워처.
// dedupeKey(공고id+마감일)로 같은 공고를 반복 알림하지 않는다. 학생 계정에서만 동작.
import { useEffect } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { getMyFavoritePositions } from "../member-profile-client";
import { addNotification } from "./notifications";
import { snapshotNotifPushOptOut } from "./renewal-docs-store";
import { talentAppRoutes } from "./app-nav";

const IMMINENT_DAYS = 3;

export function useSavedDeadlineNotifications(): void {
  const { user, isAuthenticated } = useAuthSession();
  const isStudent = isAuthenticated && user?.role === "STUDENT";

  useEffect(() => {
    if (!isStudent) return;
    // 설정 > 알림에서 공고/추천 알림을 끈 사용자는 마감 알림도 적재하지 않는다.
    if (snapshotNotifPushOptOut()) return;
    let cancelled = false;
    void getMyFavoritePositions()
      .then((list) => {
        if (cancelled) return;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        for (const p of list) {
          if (p.sourceDeadlineRolling || !p.sourceDeadlineDate) continue;
          const dateStr = p.sourceDeadlineDate.slice(0, 10);
          const d = new Date(dateStr);
          if (Number.isNaN(d.getTime())) continue;
          const days = Math.ceil((d.getTime() - today) / 86_400_000);
          if (days < 0 || days > IMMINENT_DAYS) continue;
          const company = p.partnerOrganization?.name || p.sourceCompanyName || "";
          addNotification({
            kind: "update",
            emoji: "⏰",
            title: days === 0 ? "오늘 마감되는 공고예요" : `마감 D-${days} 공고가 있어요`,
            body: `${company ? `${company} · ` : ""}${p.title}${days === 0 ? " — 오늘까지 지원할 수 있어요." : " — 마감 전에 지원해보세요."}`,
            href: `${talentAppRoutes.jobs}/${p.id}`,
            dedupeKey: `deadline:${p.id}:${dateStr}`
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isStudent]);
}
