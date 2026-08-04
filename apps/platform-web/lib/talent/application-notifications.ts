"use client";

// 내 지원현황 알림 — 실제 서버 지원 내역(getMyApplications)의 상태가 진행되면 알림을 쌓는다.
// dedupeKey 로 같은 (지원, 상태) 는 한 번만 알린다.
import { useEffect } from "react";
import { getMyApplications, type MyApplication } from "../member-profile-client";
import { addNotification } from "./notifications";
import { talentAppRoutes } from "./app-nav";

const STATUS_NOTI: Partial<Record<MyApplication["status"], { emoji: string; title: string }>> = {
  SUBMITTED: { emoji: "📮", title: "지원이 접수됐어요" },
  INTERVIEW: { emoji: "🗓️", title: "면접 단계로 진행됐어요" },
  ACCEPTED: { emoji: "🎉", title: "합격 소식이 도착했어요" },
  REJECTED: { emoji: "📩", title: "지원 결과가 나왔어요" }
};

export function useApplicationStatusNotifications(): void {
  useEffect(() => {
    let alive = true;
    void getMyApplications()
      .then((list) => {
        if (!alive) return;
        for (const app of list) {
          const meta = STATUS_NOTI[app.status];
          if (!meta) continue;
          addNotification({
            kind: "activity",
            emoji: meta.emoji,
            title: meta.title,
            body: app.partnerOrganizationName ? `${app.partnerOrganizationName} · ${app.positionTitle}` : app.positionTitle,
            href: talentAppRoutes.applications,
            dedupeKey: `appstatus:${app.id}:${app.status}`
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
}
