"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import { opsDashboardMenuGroups } from "./menu";

// Treat "/dashboard/ops" as a strict match — every other ops page starts with
// the same prefix, so a "startsWith" check would mark "대시보드" active on every
// page.
function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/ops") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OpsDashboardSidebar({ open = false }: { open?: boolean }) {
  const pathname = usePathname();

  // Default: every group is expanded. Operator can manually collapse any
  // group, but the typical "I want to see everything" mode is the starting
  // state — easier to scan the whole nav at a glance.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(opsDashboardMenuGroups.map((g) => [g.title, true]))
  );

  function toggle(title: string) {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside className={`ops-console-sidebar${open ? " is-open" : ""}`}>
      <div className="ops-console-brand">
        <img src="/aply_logo.webp" alt="Aply" />
        <strong>Aply Ops Admin</strong>
      </div>

      <nav className="ops-console-nav">
        {opsDashboardMenuGroups.map((group) => {
          const isOpen = expanded[group.title] ?? false;
          const single = group.links.length === 1;
          // Single-link groups (홈/대시보드) render as a one-row link without
          // a toggle — visually feels less like noise.
          if (single) {
            const link = group.links[0];
            const Icon = link.icon;
            const active = isLinkActive(pathname, link.href);
            return (
              <section key={group.title} className="ops-console-nav-group ops-console-nav-group--single">
                <ul>
                  <li>
                    <Link href={link.href} className={active ? "is-active" : undefined}>
                      <Icon className="ops-console-nav-icon" aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                </ul>
              </section>
            );
          }

          return (
            <section
              key={group.title}
              className={`ops-console-nav-group ${isOpen ? "is-open" : "is-collapsed"}`}
            >
              <button
                type="button"
                className="ops-console-nav-group-toggle"
                onClick={() => toggle(group.title)}
                aria-expanded={isOpen}
              >
                <span>{group.title}</span>
                <ChevronDown
                  className={`ops-console-nav-chevron ${isOpen ? "is-open" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <ul>
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const active = isLinkActive(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link href={link.href} className={active ? "is-active" : undefined}>
                          <Icon className="ops-console-nav-icon" aria-hidden />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          );
        })}
      </nav>

      <div className="ops-console-logout-wrap" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Career Launch 운영은 이제 사이드바 메뉴(Career Launch 그룹)로 편입됨 */}
        <Link href="/talent/home">
          <button type="button" className="ops-console-logout">
            플랫폼으로 이동
          </button>
        </Link>
      </div>
    </aside>
  );
}
