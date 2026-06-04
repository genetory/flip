"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";

type Fit = "high" | "medium" | "low";

type EligibleVisa = {
  code: string;
  name: string;
  fit: Fit;
  conditions: string[];
  notes?: string;
};

type Result = {
  id: string;
  name: string | null;
  nationality: string;
  currentVisa: string | null;
  educationLevel: string;
  majorCategory: string | null;
  koreanLevel: string;
  workYears: number;
  targetRole: string | null;
  eligibleVisas: EligibleVisa[];
  shareSlug: string;
  locale: string;
  createdAt: string;
};

type Position = {
  id: string;
  title: string;
  preferredJobRole: string | null;
  partnerOrganization: { id: string; name: string } | null;
};

const FIT_LABEL: Record<Fit, string> = { high: "가능성 높음", medium: "가능성 있음", low: "조건 확인 필요" };
const FIT_CLS: Record<Fit, string> = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  low: "border-zinc-300 bg-zinc-50 text-zinc-600"
};

export function VisaResultPage({ slug }: { slug: string }) {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [result, setResult] = useState<Result | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${apiBase}/visa/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("결과를 찾을 수 없습니다.");
        const payload = (await response.json()) as { ok?: boolean; result?: Result; positions?: Position[] };
        if (cancelled) return;
        if (!payload.ok || !payload.result) throw new Error("결과를 찾을 수 없습니다.");
        setResult(payload.result);
        setPositions(payload.positions ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "결과를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, slug]);

  function copyShareLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/visa/result/${slug}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-2xl space-y-6">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">진단 결과를 불러오는 중...</p>
          ) : error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : result ? (
            <>
              <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-white to-white p-6 text-center md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Aply × Visa Check</p>
                {result.name ? (
                  <p className="mt-2 text-sm text-muted-foreground">{result.name}님의 진단</p>
                ) : null}
                <p className="mt-3 font-display text-3xl font-black tracking-tight md:text-4xl">
                  가능한 비자 {result.eligibleVisas.length}개
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {result.nationality} · {result.educationLevel.replace("_", " ")} · 한국어 {result.koreanLevel}
                </p>
              </section>

              {/* Disclaimer */}
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                ⚠️ 본 진단은 일반적인 비자 가이드일 뿐 법률 자문이 아닙니다. 정확한 발급 가능성은{" "}
                <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  HiKorea
                </a>
                {" "}또는 출입국·외국인청에 확인하세요.
              </section>

              {/* Eligible visas */}
              <section className="space-y-3">
                {result.eligibleVisas.map((v) => (
                  <article key={v.code} className="rounded-2xl bg-white p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-xl font-bold tracking-tight">
                          {v.code} <span className="text-sm font-semibold text-muted-foreground">· {v.name}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${FIT_CLS[v.fit]}`}>
                        {FIT_LABEL[v.fit]}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                      {v.conditions.map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                    {v.notes ? (
                      <p className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                        💡 {v.notes}
                      </p>
                    ) : null}
                  </article>
                ))}
              </section>

              {/* Recommended positions */}
              <section className="rounded-2xl bg-white p-5 md:p-6">
                <h2 className="text-sm font-semibold text-muted-foreground">최근 채용 공고</h2>
                {positions.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    매칭되는 공고가 없어요. 가입하면 새 공고가 올라올 때 자동으로 알려드립니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {positions.map((p) => (
                      <Link
                        key={p.id}
                        href={`/positions/${p.id}`}
                        className="block rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {p.partnerOrganization?.name ?? "파트너 기업"}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{p.title}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* CTAs */}
              <section className="rounded-2xl bg-white p-5 md:p-6 space-y-3">
                <Link
                  href="/signup"
                  className="block w-full h-12 leading-[3rem] text-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Aply 가입하고 비자 후원 가능한 회사 추천받기 →
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="h-11 rounded-xl border border-border/60 bg-white text-sm font-semibold"
                  >
                    {copied ? "복사됨!" : "결과 링크 복사"}
                  </button>
                  <Link
                    href="/events/visa"
                    className="h-11 flex items-center justify-center rounded-xl border border-border/60 bg-white text-sm font-semibold"
                  >
                    다시 진단
                  </Link>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
