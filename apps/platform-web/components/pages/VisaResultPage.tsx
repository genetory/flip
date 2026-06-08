"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShareNetwork, Copy as CopyIcon, ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";

// ---------------------------------------------------------------------------
// /events/visa/result/[slug] — VisaLandingPage 에서 진단한 결과를 보여주는
// 공유 페이지. 6개 로케일 지원, native share API + 클립보드 복사.
// 회원가입 퍼널(visa 맞춤 필드 + 소셜 로그인) 은 다음 단계에서 추가 예정.
// ---------------------------------------------------------------------------

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

type Copy = {
  pill: string;
  ownerSubtitle: (name: string) => string;
  visaCountTitle: (n: number) => string;
  disclaimer: string;
  hikoreaSuffix: string;
  positionsTitle: string;
  positionsEmpty: string;
  signupCta: string;
  shareTitle: string;
  shareText: string;
  shareBtn: string;
  copyBtn: string;
  copyDone: string;
  retryBtn: string;
  loading: string;
  notFound: string;
  fitHigh: string;
  fitMedium: string;
  fitLow: string;
  partnerCompanyFallback: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pill: "Aply × 비자 체크",
    ownerSubtitle: (name) => `${name}님의 진단`,
    visaCountTitle: (n) => `가능한 비자 ${n}개`,
    disclaimer: "본 진단은 일반적인 비자 가이드일 뿐 법률 자문이 아닙니다. 정확한 발급 가능성은 ",
    hikoreaSuffix: " 또는 출입국·외국인청에 확인하세요.",
    positionsTitle: "최근 채용 공고",
    positionsEmpty: "매칭되는 공고가 없어요. 가입하면 새 공고가 올라올 때 자동으로 알려드립니다.",
    signupCta: "Aply 가입하고 비자 후원 가능한 회사 추천받기 →",
    shareTitle: "내 한국 비자 진단 결과",
    shareText: "Aply 에서 한국 취업 비자 가능성을 진단해봤어요. 너도 확인해봐!",
    shareBtn: "공유하기",
    copyBtn: "결과 링크 복사",
    copyDone: "복사됨!",
    retryBtn: "다시 진단",
    loading: "진단 결과를 불러오는 중...",
    notFound: "결과를 찾을 수 없습니다.",
    fitHigh: "가능성 높음",
    fitMedium: "가능성 있음",
    fitLow: "조건 확인 필요",
    partnerCompanyFallback: "파트너 기업"
  },
  en: {
    pill: "Aply × Visa check",
    ownerSubtitle: (name) => `${name}'s result`,
    visaCountTitle: (n) => `${n} possible visa${n > 1 ? "s" : ""}`,
    disclaimer: "This is informational only — not legal advice. For accurate eligibility, see ",
    hikoreaSuffix: " or your local immigration office.",
    positionsTitle: "Recent jobs",
    positionsEmpty: "No matches right now. Sign up and we'll notify you when new ones open.",
    signupCta: "Sign up on Aply for visa-sponsoring companies →",
    shareTitle: "My Korean work visa check",
    shareText: "I checked my Korean work visa options on Aply. Try yours too!",
    shareBtn: "Share",
    copyBtn: "Copy result link",
    copyDone: "Copied!",
    retryBtn: "Run again",
    loading: "Loading your result...",
    notFound: "Result not found.",
    fitHigh: "High chance",
    fitMedium: "Possible",
    fitLow: "Check conditions",
    partnerCompanyFallback: "Partner company"
  },
  "zh-CN": {
    pill: "Aply × 签证检查",
    ownerSubtitle: (name) => `${name} 的诊断结果`,
    visaCountTitle: (n) => `${n} 个可申请签证`,
    disclaimer: "本诊断仅为一般指引，非法律咨询。准确签发可能性请查看 ",
    hikoreaSuffix: " 或当地出入境部门。",
    positionsTitle: "最近职位",
    positionsEmpty: "目前无匹配职位。注册后有新职位将自动通知您。",
    signupCta: "注册 Aply 获取支持签证赞助的公司推荐 →",
    shareTitle: "我的韩国工作签证检查结果",
    shareText: "我在 Aply 上检查了我的韩国工作签证可能性，你也来试试！",
    shareBtn: "分享",
    copyBtn: "复制结果链接",
    copyDone: "已复制！",
    retryBtn: "重新诊断",
    loading: "正在加载诊断结果...",
    notFound: "找不到结果。",
    fitHigh: "高可能性",
    fitMedium: "有可能",
    fitLow: "需确认条件",
    partnerCompanyFallback: "合作企业"
  },
  vi: {
    pill: "Aply × Kiểm tra visa",
    ownerSubtitle: (name) => `Kết quả của ${name}`,
    visaCountTitle: (n) => `${n} loại visa khả thi`,
    disclaimer: "Đây là hướng dẫn tham khảo, không phải tư vấn pháp lý. Để biết khả năng cấp chính xác, xem ",
    hikoreaSuffix: " hoặc văn phòng xuất nhập cảnh địa phương.",
    positionsTitle: "Việc làm gần đây",
    positionsEmpty: "Chưa có việc phù hợp. Đăng ký để được thông báo khi có việc mới.",
    signupCta: "Đăng ký Aply để xem công ty bảo trợ visa →",
    shareTitle: "Kết quả kiểm tra visa Hàn Quốc của tôi",
    shareText: "Tôi đã kiểm tra khả năng visa làm việc Hàn Quốc trên Aply. Bạn cũng thử nhé!",
    shareBtn: "Chia sẻ",
    copyBtn: "Sao chép link",
    copyDone: "Đã sao chép!",
    retryBtn: "Kiểm tra lại",
    loading: "Đang tải kết quả...",
    notFound: "Không tìm thấy kết quả.",
    fitHigh: "Khả năng cao",
    fitMedium: "Có thể",
    fitLow: "Cần xác nhận điều kiện",
    partnerCompanyFallback: "Doanh nghiệp đối tác"
  },
  ja: {
    pill: "Aply × ビザ診断",
    ownerSubtitle: (name) => `${name}さんの診断`,
    visaCountTitle: (n) => `取得可能なビザ ${n}件`,
    disclaimer: "本診断は一般的なガイドであり、法律相談ではありません。正確な発給可能性は ",
    hikoreaSuffix: " または出入国・外国人庁にご確認ください。",
    positionsTitle: "最新の求人",
    positionsEmpty: "現在マッチする求人はありません。登録すると新着求人を自動でお知らせします。",
    signupCta: "Aplyに登録してビザ支援可能な会社の推薦を受ける →",
    shareTitle: "私の韓国就労ビザ診断結果",
    shareText: "Aplyで韓国就労ビザの可能性を診断しました。あなたも試してみて！",
    shareBtn: "シェア",
    copyBtn: "結果リンクをコピー",
    copyDone: "コピー済み！",
    retryBtn: "再診断",
    loading: "診断結果を読み込み中...",
    notFound: "結果が見つかりません。",
    fitHigh: "可能性高い",
    fitMedium: "可能性あり",
    fitLow: "条件確認必要",
    partnerCompanyFallback: "パートナー企業"
  },
  id: {
    pill: "Aply × Cek visa",
    ownerSubtitle: (name) => `Hasil ${name}`,
    visaCountTitle: (n) => `${n} opsi visa`,
    disclaimer: "Hanya panduan umum, bukan nasihat hukum. Untuk kelayakan akurat lihat ",
    hikoreaSuffix: " atau kantor imigrasi setempat.",
    positionsTitle: "Lowongan terbaru",
    positionsEmpty: "Belum ada yang cocok. Daftar dan kami akan beri tahu saat ada baru.",
    signupCta: "Daftar di Aply untuk perusahaan pendukung visa →",
    shareTitle: "Hasil cek visa kerja Korea saya",
    shareText: "Saya cek opsi visa kerja Korea di Aply. Coba kamu juga!",
    shareBtn: "Bagikan",
    copyBtn: "Salin link hasil",
    copyDone: "Tersalin!",
    retryBtn: "Cek lagi",
    loading: "Memuat hasil...",
    notFound: "Hasil tidak ditemukan.",
    fitHigh: "Peluang tinggi",
    fitMedium: "Mungkin",
    fitLow: "Periksa syarat",
    partnerCompanyFallback: "Perusahaan mitra"
  }
};

const FIT_CLS: Record<Fit, string> = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  low: "border-zinc-300 bg-zinc-50 text-zinc-600"
};

export function VisaResultPage({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const t = COPY[locale] ?? COPY.ko;
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
        if (!response.ok) throw new Error(t.notFound);
        const payload = (await response.json()) as { ok?: boolean; result?: Result; positions?: Position[] };
        if (cancelled) return;
        if (!payload.ok || !payload.result) throw new Error(t.notFound);
        setResult(payload.result);
        setPositions(payload.positions ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t.notFound);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // locale 변동 시 다시 fetch 할 필요는 없음 — 결과 자체는 언어 무관.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, slug]);

  // 모바일에서는 native share, 데스크탑에선 클립보드 복사. 둘 다 실패하면
  // 최소한의 fallback 으로 토스트만 띄움.
  async function share() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/visa/result/${slug}`;
    const navAny = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (typeof navAny.share === "function") {
      try {
        await navAny.share({ title: t.shareTitle, text: t.shareText, url });
        return;
      } catch {
        // 사용자가 share 다이얼로그를 닫은 경우. 그냥 fall-through.
      }
    }
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드도 안 되면 그냥 무시.
    }
  }

  const FIT_LABEL: Record<Fit, string> = {
    high: t.fitHigh,
    medium: t.fitMedium,
    low: t.fitLow
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-2xl space-y-6">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">{t.loading}</p>
          ) : error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : result ? (
            <>
              <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-white to-white p-6 text-center md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t.pill}</p>
                {result.name ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t.ownerSubtitle(result.name)}</p>
                ) : null}
                <p className="mt-3 font-display text-3xl font-black tracking-tight md:text-4xl">
                  {t.visaCountTitle(result.eligibleVisas.length)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {result.nationality} · {result.educationLevel.replace("_", " ")} · {result.koreanLevel}
                </p>
              </section>

              {/* Disclaimer */}
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                ⚠️ {t.disclaimer}
                <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  HiKorea
                </a>
                {t.hikoreaSuffix}
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
                <h2 className="text-sm font-semibold text-muted-foreground">{t.positionsTitle}</h2>
                {positions.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{t.positionsEmpty}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {positions.map((p) => (
                      <Link
                        key={p.id}
                        href={`/positions/${p.id}`}
                        className="block rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {p.partnerOrganization?.name ?? t.partnerCompanyFallback}
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
                  {t.signupCta}
                </Link>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-white text-xs font-semibold"
                  >
                    <ShareNetwork className="h-3.5 w-3.5" weight="bold" />
                    {t.shareBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-white text-xs font-semibold"
                  >
                    <CopyIcon className="h-3.5 w-3.5" weight="bold" />
                    {copied ? t.copyDone : t.copyBtn}
                  </button>
                  <Link
                    href="/events/visa"
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-white text-xs font-semibold"
                  >
                    <ArrowClockwise className="h-3.5 w-3.5" weight="bold" />
                    {t.retryBtn}
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
