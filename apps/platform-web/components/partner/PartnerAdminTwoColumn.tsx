"use client";

import type { ReactNode } from "react";
import { PartnerAdminNav } from "./PartnerAdminNav";

export function PartnerAdminTwoColumn({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
      <aside className="md:sticky md:top-24">
        <PartnerAdminNav />
      </aside>
      <section className="rounded-2xl bg-muted/30 p-4 md:p-6">{children}</section>
    </div>
  );
}
