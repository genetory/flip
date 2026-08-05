"use client";

// 서버 알림 하이드레이트 — 지원상태·면접·회사 메시지·새 포지션 등 실제 서버 알림을
// 알림함(로컬 표시 캐시)으로 계정별 1회 끌어온다. 계정 전환 시 이전 계정 알림은 리셋.
import { useEffect } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { getMyNotifications, type ServerNotification } from "../member-profile-client";
import { addNotification, resetNotifications, type NotificationKind } from "./notifications";
import { talentAppRoutes } from "./app-nav";

let lastSyncedUser: string | null | undefined = undefined;

function mapKind(type: string): NotificationKind {
  return type.startsWith("APPLICATION") || type.startsWith("INTERVIEW") ? "activity" : "update";
}

function mapEmoji(type: string): string {
  if (type.startsWith("INTERVIEW")) return "🗓️";
  if (type.includes("COMMENT") || type.includes("MESSAGE")) return "💬";
  if (type.includes("ACCEPTED")) return "🎉";
  if (type.startsWith("APPLICATION")) return "📮";
  if (type.startsWith("POSITION")) return "💼";
  if (type.includes("CERTIFICATE") || type.includes("RECOMMENDATION")) return "📜";
  return "🔔";
}

function mapHref(n: ServerNotification): string {
  if (n.applicationId) return talentAppRoutes.applications;
  if (n.linkPath && n.linkPath.startsWith("/talent")) return n.linkPath;
  return talentAppRoutes.notifications;
}

export function useServerNotificationSync(): void {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (lastSyncedUser === userId) return; // 계정별 1회만.
    lastSyncedUser = userId;
    resetNotifications(); // 계정 전환 → 이전 계정 알림 제거.
    if (!userId) return;

    let alive = true;
    void getMyNotifications(50)
      .then(({ items }) => {
        if (!alive) return;
        // 오래된 것부터 넣어야 최신이 앞으로 온다(addNotification이 createdAt로 정렬).
        for (const n of [...items].reverse()) {
          addNotification({
            kind: mapKind(n.type),
            emoji: mapEmoji(n.type),
            title: n.title,
            body: n.message ?? "",
            href: mapHref(n),
            createdAt: new Date(n.createdAt).getTime(),
            unread: n.readAt === null,
            dedupeKey: `srv:${n.id}`
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId]);
}
