"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { partnerDashboardMenuGroups } from "./menu";
import { readAccessToken } from "../../../../lib/auth-client";

// 사이드바 뱃지 — 처리 대기 건수(지원자 검토·과제 검토·열린 이슈)를 메뉴 옆에.
const COUNT_BY_HREF: Record<string, "applicants" | "assignments" | "issues"> = {
  "/dashboard/partner/applicants": "applicants",
  "/dashboard/partner/assignments": "assignments",
  "/dashboard/partner/issues": "issues"
};

export function PartnerDashboardSidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<{ applicants: number; assignments: number; issues: number } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = readAccessToken();
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const res = await fetch(`${base}/partner/nav-counts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        const payload = (await res.json()) as { ok?: boolean; applicants?: number; assignments?: number; issues?: number };
        if (payload.ok) setCounts({ applicants: payload.applicants ?? 0, assignments: payload.assignments ?? 0, issues: payload.issues ?? 0 });
      } catch {
        // 뱃지는 부가 정보 — 실패해도 무시
      }
    })();
    // 라우트 이동 시 갱신(처리 후 숫자 반영)
  }, [pathname]);

  return (
    <aside className="ops-console-sidebar">
      <div className="ops-console-brand">
        <img src="/aply_logo.webp" alt="Aply" />
        <strong>Aply Partner Admin</strong>
      </div>

      <nav className="ops-console-nav">
        {partnerDashboardMenuGroups.map((group) => (
          <section key={group.title} className="ops-console-nav-group">
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((link) => {
                // 상세 라우트(/applicants/[id] 등)에서도 상위 메뉴가 활성으로 표시되게 prefix 매칭.
                // 단, 대시보드 홈(/dashboard/partner)은 모든 경로의 접두사라 정확히 일치할 때만.
                const isActive =
                  link.href === "/dashboard/partner"
                    ? pathname === "/dashboard/partner"
                    : pathname === link.href || pathname.startsWith(link.href + "/");
                const countKey = COUNT_BY_HREF[link.href];
                const badge = countKey && counts ? counts[countKey] : 0;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={isActive ? "is-active" : undefined}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                    >
                      <span>{link.label}</span>
                      {badge > 0 ? (
                        <span
                          style={{
                            flex: "none",
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            borderRadius: 999,
                            background: "var(--accent)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {badge > 99 ? "99+" : badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="ops-console-logout-wrap" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Link href="/">
          <button type="button" className="ops-console-logout">
            플랫폼으로 이동
          </button>
        </Link>
        <Link href="/profile">
          <button type="button" className="ops-console-logout">
            내 프로필로 이동
          </button>
        </Link>
      </div>
    </aside>
  );
}
