"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlatformT } from "../../lib/i18n";

export function PartnerAdminNav() {
  const pathname = usePathname();
  const t = usePlatformT();

  const ITEMS = [
    { href: "/profile", label: t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor") },
    { href: "/partner-profile/edit", label: t("파트너 프로필", "Partner profile", "合作伙伴资料", "Hồ sơ đối tác", "パートナー情報", "Profil mitra") },
    { href: "/profile?tab=positions", label: t("포지션 관리", "Positions", "职位管理", "Quản lý vị trí", "ポジション管理", "Kelola posisi") },
    { href: "/profile?tab=positions", label: t("지원자 관리", "Applicants", "申请者管理", "Quản lý ứng viên", "応募者管理", "Kelola pelamar") },
    { href: "/profile", label: t("운영 가이드", "Guide", "运营指南", "Hướng dẫn", "運用ガイド", "Panduan") },
    { href: "/profile", label: t("설정", "Settings", "设置", "Cài đặt", "設定", "Pengaturan") }
  ];

  return (
    <nav className="mb-5 flex flex-col gap-1">
      {ITEMS.map((item, idx) => {
        const active = item.href === "/profile" ? pathname === "/profile" : pathname.startsWith(item.href.split("?")[0]);
        return (
          <Link
            key={`${item.href}-${idx}`}
            href={item.href}
            className={`rounded-md px-2.5 py-2 text-sm transition ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
