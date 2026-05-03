"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { Button } from "../../../components/ui/button";
import { PartnerAdminTwoColumn } from "../../../components/partner/PartnerAdminTwoColumn";
import {
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete,
  isPartnerOrganizationVerificationComplete,
  type MyPartnerOrganization
} from "../../../lib/member-profile-client";

export default function PartnerOnboardingPage() {
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const item = await getMyPartnerOrganization();
        if (!mounted) return;
        setOrg(item);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const profileDone = isPartnerOrganizationProfileComplete(org);
  const verificationDone = isPartnerOrganizationVerificationComplete(org);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="container py-10 md:py-14">
        <PartnerAdminTwoColumn>
        <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border/70 bg-card p-6 md:p-8">
                    <div>
            <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">
              파트너 온보딩
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              기업 프로필과 인증 서류를 완료하면 포지션 공개 및 지원자 연락 권한이 활성화됩니다.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">기업 프로필</p>
              <p className={`mt-1 text-sm font-semibold ${profileDone ? "text-emerald-600" : "text-amber-600"}`}>
                {loading ? "확인 중..." : profileDone ? "완료" : "미완료"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">회사명, 산업군, 웹사이트, 주소, 소개를 입력합니다.</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/partner/company-profile">기업 프로필 입력</Link>
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">인증 서류</p>
              <p className={`mt-1 text-sm font-semibold ${verificationDone ? "text-emerald-600" : "text-amber-600"}`}>
                {loading ? "확인 중..." : verificationDone ? "완료" : "미완료"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">사업자등록증, 4대보험 가입자명부, 회사 로고, 사무실 사진을 업로드합니다.</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/profile/company/verification/edit">인증 서류 입력</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
            {!loading && profileDone && verificationDone
              ? "온보딩이 완료되었습니다. 파트너 대시보드에서 운영을 시작하세요."
              : "온보딩 완료 전에는 포지션을 공개(OPEN)할 수 없습니다."}
          </div>

          <div className="flex justify-end">
            <Button asChild>
              <Link href="/partner/dashboard">대시보드로 이동</Link>
            </Button>
          </div>
        </div>
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}

