"use client";

// Career Launch 전용 GNB — partner/talent 헤더와 동일한 결(흰 배경·로고+배지 좌측,
// 우측 프로필 이름 pill). pill 클릭 시 설정 페이지로 이동(partner/talent와 동일 동작).
import Link from "next/link";
import Image from "next/image";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";
import { LaunchNotificationBell } from "./LaunchNotificationBell";

export function CareerLaunchHeader() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const name = user?.name?.trim() || user?.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          <Link href="/career-launch/dashboard" aria-label="Career Launch" className="flex items-center gap-2">
            <Image src="/img_logo.webp" alt="" width={72} height={24} className="h-5 w-auto" priority />
            <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">Career Launch</span>
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-1.5">
            <LaunchNotificationBell />
            <Link
              href="/career-launch/settings"
              aria-label={t("내 설정", "My settings", "我的设置", "Cài đặt của tôi", "設定", "Pengaturan")}
              className="inline-flex max-w-[160px] items-center rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
            >
              <span className="truncate">{name}</span>
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
