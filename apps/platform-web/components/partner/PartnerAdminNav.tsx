"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/partner/dashboard", label: "대시보드" },
  { href: "/partner/company-profile", label: "파트너 프로필" },
  { href: "/partner/positions", label: "포지션 관리" },
  { href: "/partner/applicants", label: "지원자 관리" },
  { href: "/partner/guide", label: "운영 가이드" },
  { href: "/partner/settings", label: "설정" }
] as const;

export function PartnerAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href || (item.href.startsWith("/partner") && item.href !== "/partner/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
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
