"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/profile", label: "대시보드" },
  { href: "/partner-profile/edit", label: "파트너 프로필" },
  { href: "/profile?tab=positions", label: "포지션 관리" },
  { href: "/profile?tab=positions", label: "지원자 관리" },
  { href: "/profile", label: "운영 가이드" },
  { href: "/profile", label: "설정" }
] as const;

export function PartnerAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.href === "/profile" ? pathname === "/profile" : pathname.startsWith(item.href.split("?")[0]);
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
