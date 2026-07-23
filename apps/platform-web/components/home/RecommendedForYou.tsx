"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Briefcase, ArrowRight } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { getMyCandidateProfile, getPublicPositionsPage } from "../../lib/member-profile-client";
import { mapPublicPositionToCard } from "../pages/PositionsPage";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";

// 후보 비자 enum → 코드(포지션 eligibleVisas 와 매칭).
function visaCode(visaType?: string | null): string | null {
  if (!visaType) return null;
  if (visaType.includes("-")) return visaType;
  const map: Record<string, string> = {
    D10_JOB_SEEKING: "D-10",
    D2_STUDENT: "D-2",
    D4_GENERAL_TRAINING: "D-4",
    F2_RESIDENCE: "F-2",
    F4_OVERSEAS_KOREAN: "F-4",
    F5_PERMANENT_RESIDENCE: "F-5",
    F6_MARRIAGE_IMMIGRATION: "F-6",
    E7_SPECIFIC_ACTIVITY: "E-7",
    H1_WORKING_HOLIDAY: "H-1"
  };
  return map[visaType] ?? null;
}

type Card = ReturnType<typeof mapPublicPositionToCard>;

// 로그인 학생에게만 노출되는 홈 개인화 섹션 — 비자로 지원 가능한 최신 공고를 추천.
export function RecommendedForYou() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const [cards, setCards] = useState<Card[] | null>(null);

  const isStudent = isReady && isAuthenticated && user?.role === "STUDENT";

  const tr = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) =>
    (({ ko, en, "zh-CN": zh, vi, ja, id }) as Record<PlatformLocale, string>)[locale] ?? en;

  useEffect(() => {
    if (!isStudent) {
      setCards(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [profile, page] = await Promise.all([
          getMyCandidateProfile().catch(() => null),
          getPublicPositionsPage({ limit: 40, locale })
        ]);
        if (cancelled) return;
        const code = visaCode(profile?.visaType ?? null);
        const open = (page.items ?? []).filter((p) => p.status === "OPEN");
        // 비자가 있으면 지원 가능한 공고(제한 없음 또는 내 비자 포함)만, 없으면 최신 전체.
        const eligible = code
          ? open.filter((p) => !p.eligibleVisas?.length || p.eligibleVisas.includes(code))
          : open;
        setCards(eligible.slice(0, 6).map((p) => mapPublicPositionToCard(p, locale)));
      } catch {
        if (!cancelled) setCards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStudent, locale]);

  if (!isStudent || !cards || cards.length === 0) return null;

  return (
    <section className="container py-10 md:py-12">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>
            {tr("회원님께 맞는 공고", "Recommended for you", "为您推荐的职位", "Gợi ý cho bạn", "あなたへのおすすめ求人", "Rekomendasi untuk Anda")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {tr("비자로 지원 가능한 최신 공고예요.", "Latest positions you're eligible to apply with your visa.", "根据您的签证可申请的最新职位。", "Vị trí mới nhất phù hợp visa của bạn.", "ビザで応募できる最新の求人です。", "Posisi terbaru yang sesuai visa Anda.")}
          </p>
        </div>
        <Link href="/positions" className="hidden flex-none items-center gap-1 text-sm font-semibold text-[#0B46E8] hover:underline sm:inline-flex">
          {tr("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}
          <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.id}
            href={`/positions/${c.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(11,18,39,0.04),0_10px_28px_rgba(11,18,39,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(11,18,39,0.05),0_16px_40px_rgba(11,18,39,0.10)]"
          >
            {c.thumbnailUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={c.thumbnailUrl} alt="" className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] w-full place-items-center bg-[#EEF4FF] font-display text-3xl font-bold text-[#0B46E8]/45">
                {c.initial}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <p className="truncate text-[13px] text-slate-500">{c.company}</p>
              <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug text-[#0B1227]">{c.role}</h3>
              <div className="mt-auto flex min-w-0 items-center gap-2 pt-3 text-[12px] text-slate-500">
                {c.location ? (
                  <span className="inline-flex min-w-0 max-w-[60%] items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 flex-none" />
                    <span className="truncate">{c.location}</span>
                  </span>
                ) : null}
                {c.type ? (
                  <span className="inline-flex items-center gap-1 truncate">
                    <Briefcase className="h-3 w-3 flex-none" />
                    {c.type}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
