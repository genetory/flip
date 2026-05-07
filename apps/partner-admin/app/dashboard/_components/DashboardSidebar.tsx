"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardMenuGroups } from "./menu";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="ops-console-sidebar">
      <div className="ops-console-brand">
        <img src="/aply_logo.webp" alt="Aply" />
        <strong>Aply Partner Admin</strong>
      </div>

      <nav className="ops-console-nav">
        {dashboardMenuGroups.map((group) => (
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

      <form action="/logout" method="post" className="ops-console-logout-wrap">
        <button type="submit" className="ops-console-logout">
          로그아웃
        </button>
      </form>
    </aside>
  );
}
