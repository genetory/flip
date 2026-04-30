"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { Button } from "../../../components/ui/button";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import {
  getMyPartnerOrganization,
  getPublicPositions,
  isPartnerOrganizationProfileComplete,
  isPartnerOrganizationVerificationComplete,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";

function extractDomainFromEmail(email?: string | null) {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

export default function PartnerDashboardPage() {
  const { user } = useAuthSession();
  const [allMyPositions, setAllMyPositions] = useState<PublicPositionListItem[]>([]);
  const [profileDone, setProfileDone] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [org, all] = await Promise.all([getMyPartnerOrganization(), getPublicPositions()]);
        if (!mounted) return;

        const domain = org?.domain?.toLowerCase() ?? extractDomainFromEmail(user?.email) ?? "";
        const mine = all.filter((item) => item.partnerOrganization?.domain?.toLowerCase() === domain);
        setAllMyPositions(mine);
        setProfileDone(isPartnerOrganizationProfileComplete(org));
        setVerificationDone(isPartnerOrganizationVerificationComplete(org));
      } catch {
        if (!mounted) return;
        setAllMyPositions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const stats = useMemo(() => {
    const total = allMyPositions.length;
    const open = allMyPositions.filter((item) => item.status === "OPEN").length;
    const waiting = allMyPositions.filter((item) => item.status === "DRAFT").length;
    const applicants = allMyPositions.reduce((sum, item) => sum + (item.matchingParticipantsCount ?? 0), 0);
    const reviewNeeded = allMyPositions.filter((item) => (item.matchingParticipantsCount ?? 0) > 0).length;
    return { total, open, waiting, applicants, reviewNeeded };
  }, [allMyPositions]);

  const todoItems = [
    `승인/보완 확인 필요 포지션 ${stats.waiting}개`,
    `새 지원자(누적) ${stats.applicants}명`,
    `검토 필요 포지션 ${stats.reviewNeeded}개`,
    `기업 프로필 상태 ${profileDone ? "완료" : "미완료"} / 인증 ${verificationDone ? "완료" : "미완료"}`
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">
              파트너 대시보드
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">오늘 확인할 일 중심으로 현재 상태를 빠르게 점검하세요.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">등록 포지션</p>
              <p className="mt-1 text-xl font-black text-foreground">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">모집 중</p>
              <p className="mt-1 text-xl font-black text-foreground">{stats.open}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">승인/보완 대기</p>
              <p className="mt-1 text-xl font-black text-foreground">{stats.waiting}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-xs text-muted-foreground">총 지원자 수</p>
              <p className="mt-1 text-xl font-black text-foreground">{stats.applicants}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">오늘 확인해야 할 일</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {todoItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/partner/positions">포지션 관리</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/partner/positions/new">포지션 등록</Link>
              </Button>
              <Button size="sm" variant="outline" disabled>
                지원자 관리 (준비중)
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
