"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { AdminConsoleFrame } from "../../../components/dashboard/AdminConsoleFrame";
import { PartnerDashboardSidebar } from "./_components/DashboardSidebar";

export default function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  // 운영자는 슈퍼유저 — 파트너 콘솔(인재 검색 등)도 동일하게 접근 가능.
  const allowed = user?.role === "PARTNER" || user?.role === "OPERATOR";

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !allowed) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, allowed, router]);

  if (!isReady) {
    return (
      <main className="container py-10 md:py-14">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-xl bg-muted" />
            <div className="h-28 rounded-xl bg-muted" />
            <div className="h-28 rounded-xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !allowed) {
    return null;
  }

  return (
    <AdminConsoleFrame
      title="파트너 어드민"
      mainClassName="ops-console-main partner-shell"
      renderSidebar={(open) => <PartnerDashboardSidebar open={open} />}
    >
      {children}
    </AdminConsoleFrame>
  );
}
