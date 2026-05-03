"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../../../components/site/Header";
import { Footer } from "../../../../components/site/Footer";
import { Button } from "../../../../components/ui/button";
import { PartnerAdminTwoColumn } from "../../../../components/partner/PartnerAdminTwoColumn";
import {
  getMyPartnerApplicantById,
  updateMyPartnerApplicantState,
  type PartnerApplicantDetail,
  type PartnerApplicantStatus
} from "../../../../lib/member-profile-client";
import { getApplicantStatusLabel } from "../../../../lib/partner-applicants-data";

const STATUS_ACTIONS: PartnerApplicantStatus[] = ["REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"];

export default function PartnerApplicantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PartnerApplicantDetail | null>(null);
  const [status, setStatus] = useState<PartnerApplicantStatus>("APPLIED");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      try {
        const found = await getMyPartnerApplicantById(id);
        if (!mounted) return;
        setItem(found);
        setStatus(found.status);
        setMemo(found.memo ?? "");
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "지원자 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) {
    notFound();
  }

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyPartnerApplicantState(item.id, {
        status,
        memo: memo.trim() ? memo.trim() : null
      });
      setItem(updated);
      setStatus(updated.status);
      setMemo(updated.memo ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "지원자 상태 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="container py-10 text-sm text-muted-foreground">불러오는 중...</main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="container py-10 md:py-14">
        <PartnerAdminTwoColumn>
        <div className="mx-auto max-w-4xl space-y-6">
                    <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">{item.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{item.positionTitle} 지원자 상세</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/partner/applicants">목록으로</Link>
            </Button>
          </div>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">기본 정보</h2>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <p><span className="text-muted-foreground">국적:</span> {item.nationality ?? "-"}</p>
              <p><span className="text-muted-foreground">이메일:</span> {item.email}</p>
              <p><span className="text-muted-foreground">학교/전공:</span> {item.school ?? "-"} / {item.major ?? "-"}</p>
              <p><span className="text-muted-foreground">거주지:</span> {item.residence ?? "-"}</p>
              <p><span className="text-muted-foreground">시작 가능일:</span> {item.availableStartDate ?? "-"}</p>
              <p><span className="text-muted-foreground">현재 상태:</span> {getApplicantStatusLabel(status)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">프로필 요약</h2>
            <p className="mt-3 text-sm text-muted-foreground">{item.summary ?? "-"}</p>
            <h3 className="mt-4 text-sm font-semibold text-foreground">지원 동기</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.motivation ?? "-"}</p>
            <h3 className="mt-4 text-sm font-semibold text-foreground">언어</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {item.languages.length > 0 ? item.languages.map((lang) => <li key={lang}>- {lang}</li>) : <li>-</li>}
            </ul>
            {item.portfolioUrl ? (
              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">포트폴리오:</span>{" "}
                <a href={item.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  {item.portfolioUrl}
                </a>
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">상태 변경 / 내부 메모</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_ACTIONS.map((next) => (
                <Button key={next} size="sm" variant={status === next ? "default" : "outline"} onClick={() => setStatus(next)}>
                  {getApplicantStatusLabel(next)}
                </Button>
              ))}
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="mt-4 min-h-28 w-full rounded-md border border-input/60 bg-white px-3 py-2 text-sm"
              placeholder="파트너 내부 메모"
            />
            {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            <div className="mt-3 flex justify-end">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </section>
        </div>
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}
