"use client";

// 지원/모의 면접 준비도 넛지 — 100% 게이트에 막히기 전에 "무엇을 완성하면 되는지"를 상시 노출.
// variant "card": 홈용 상세 카드 / "compact": 공고 탐색·상세용 슬림 스트립.
// 준비 완료 시: 홈 카드에서는 축하 + 지원 유도(닫기 가능), 컴팩트에서는 렌더 안 함.
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CaretRight, CheckCircle, X, ArrowRight } from "@phosphor-icons/react";
import { useApplyReadiness } from "../../lib/talent/apply-readiness";
import { talentAppRoutes } from "../../lib/talent/app-nav";
import { snapshotApplyCelebrated, setApplyCelebrated, subscribeDocs } from "../../lib/talent/renewal-docs-store";

export function ApplyReadinessBanner({ variant = "card", className = "" }: { variant?: "card" | "compact"; className?: string }) {
  const { loaded, ready, pct, remaining } = useApplyReadiness();
  // 축하 배너 닫힘 여부 — 계정(서버 Resume.content.renewalApplyCelebrated)에 저장.
  const dismissed = useSyncExternalStore(subscribeDocs, snapshotApplyCelebrated, () => false);

  if (!loaded) return null;

  // 준비 완료 — 홈 카드에서만 축하 + 지원 유도.
  if (ready) {
    if (variant !== "card" || dismissed) return null;
    return (
      <section className={`relative overflow-hidden rounded-2xl border border-[#CFE8DA] bg-[#EAF8F0] p-4 ${className}`}>
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setApplyCelebrated(true)}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-[#6FA98A] transition hover:bg-white/60"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A9B59]">
            <CheckCircle className="h-6 w-6" weight="fill" />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <p className="text-[14.5px] font-bold text-[#0B1227]">지원 준비 완료! 🎉</p>
            <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#3B7A5A]">이력서·자기소개서가 모두 준비됐어요. 이제 마음에 드는 공고에 지원하고 모의 면접도 볼 수 있어요.</p>
            <Link href={talentAppRoutes.jobs} className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-bold text-[#0A9B59]">
              공고 보러 가기 <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (remaining.length === 0) return null;
  const first = remaining[0];

  if (variant === "compact") {
    return (
      <Link
        href={first.href}
        className={`flex items-center gap-3 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] px-4 py-3 transition hover:border-[#0B46E8]/40 ${className}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[12.5px] font-black tabular-nums text-[#0B46E8]">{pct}%</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[#191F28]">지원까지 {remaining.length}가지 남았어요</p>
          <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{remaining.map((s) => `${s.label} ${s.pct}%`).join(" · ")}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">이어서<CaretRight className="h-3.5 w-3.5" weight="bold" /></span>
      </Link>
    );
  }

  return (
    <section className={`rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14.5px] font-bold text-[#191F28]">지원 준비 {pct}%</p>
          <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#5A6473]">{remaining.length}가지만 완성하면 공고에 지원하고 모의 면접도 볼 수 있어요.</p>
        </div>
        <span className="shrink-0 text-[22px] font-black tabular-nums text-[#0B46E8]">{pct}%</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {remaining.map((s) => (
          <Link key={s.key} href={s.href} className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 transition hover:bg-[#EEF3FF]">
            <span className="w-9 shrink-0 text-center text-[13px] font-black tabular-nums text-[#B0B8C1]">{s.pct}%</span>
            <span className="min-w-0 flex-1 text-[13.5px] font-bold text-[#191F28]">{s.label}</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">{s.cta}<CaretRight className="h-3.5 w-3.5" weight="bold" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
