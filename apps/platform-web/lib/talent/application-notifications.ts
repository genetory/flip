"use client";

// 내 지원현황 알림 — 지원한 공고의 상태가 다음 단계(면접·결과)로 진행되면 알림을 쌓는다.
// (지원 완료 자체는 지원 시점에 activity-log.notifyApplied 로 별도 적재)
// dedupeKey 로 같은 (지원, 상태) 는 한 번만 알린다.
import { useEffect } from "react";
import { useTalentSnapshot } from "./useTalentData";
import { addNotification } from "./notifications";
import { talentAppRoutes } from "./app-nav";
import type { ApplicationStatus } from "./types";

const STATUS_NOTI: Partial<Record<ApplicationStatus, { emoji: string; title: string }>> = {
  applied: { emoji: "📮", title: "지원이 접수됐어요" },
  interview: { emoji: "🗓️", title: "면접 단계로 진행됐어요" },
  result: { emoji: "🎉", title: "지원 결과가 나왔어요" }
};

export function useApplicationStatusNotifications(): void {
  const { snapshot } = useTalentSnapshot();

  useEffect(() => {
    if (!snapshot) return;
    for (const app of snapshot.applications) {
      const meta = STATUS_NOTI[app.status];
      if (!meta) continue;
      addNotification({
        kind: "activity",
        emoji: meta.emoji,
        title: meta.title,
        body: app.company ? `${app.company} · ${app.jobTitle}` : app.jobTitle,
        href: `${talentAppRoutes.applications}/${app.id}`,
        dedupeKey: `appstatus:${app.id}:${app.status}`
      });
    }
  }, [snapshot]);
}
