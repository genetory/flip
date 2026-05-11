"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { partnerDashboardMenuGroups } from "./menu";

export function PartnerDashboardSidebar() {
  const pathname = usePathname();

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
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link href={link.href} className={isActive ? "is-active" : undefined}>
                      {link.label}
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
