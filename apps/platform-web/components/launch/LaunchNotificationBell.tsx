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
      className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB]"
    >
      <Bell className="h-[22px] w-[22px]" weight="regular" />
      {unread > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F04452] px-1 text-[10px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
