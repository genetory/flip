"use client";

// Career Launch GNB 알림 벨 — career-launch 전용 알림함으로 이동. talent/partner 벨과 별개.
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";
import { useUnreadLaunchCount } from "../../lib/launch/notifications";
import { useLaunchT } from "../../lib/launch/i18n";

export function LaunchNotificationBell() {
  const t = useLaunchT();
  const unread = useUnreadLaunchCount();
  return (
    <Link
      href="/career-launch/notifications"
      aria-label={unread > 0 ? t(`알림 ${unread}개`, `${unread} notifications`, `${unread} 条通知`, `${unread} thông báo`, `通知 ${unread}件`, `${unread} notifikasi`) : t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-band)]"
    >
      <Bell className="h-6 w-6" weight="regular" />
      {unread > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--v2-attention)] px-1 text-[10px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
