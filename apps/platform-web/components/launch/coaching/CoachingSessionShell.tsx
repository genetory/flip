"use client";

// UX Phase 3 — 상담 시작 화면(빈 채팅창으로 시작하지 않도록). JobsChat 인트로에서 사용.
// Phase 16: 기존 CoachingSessionShell의 미사용 export(헤더/컴포저/패널/완료요약 등)는 실사용이 CoachingIntroScreen
// 뿐이라 제거(dead code 정리). 구조 라벨은 6개국어화(intro.* props 는 호출부에서 이미 번역됨).
import { ArrowRight, Info } from "@phosphor-icons/react";
import { AI_DISCLOSURE, type CoachingIntro } from "../../../lib/launch/coaching-types";
import { useLaunchT } from "../../../lib/launch/i18n";

export function CoachingIntroScreen({ intro, onStart, onEditKnown }: { intro: CoachingIntro; onStart: () => void; onEditKnown?: () => void }) {
  const t = useLaunchT();
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-6 pb-8 md:pt-8">
      <p className="text-[12.5px] font-bold uppercase tracking-[0.1em] text-[#3182F6]">{t("오늘의 상담", "Today's coaching", "今日咨询", "Tư vấn hôm nay", "今日の相談", "Konseling hari ini")}</p>
      <h1 className="mt-2 break-keep text-[22px] font-bold leading-snug text-[#191F28]">{intro.title}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">{intro.problem}</p>

      {intro.known.length > 0 && (
        <div className="mt-5 rounded-2xl border border-[#DDE7FB] bg-[#F4F8FF] p-4">
          <p className="text-[12.5px] font-bold text-[#1B64DA]">{t("코치가 이미 알고 있는 내용", "What the coach already knows", "教练已了解的内容", "Điều coach đã biết", "コーチがすでに知っていること", "Yang sudah diketahui coach")}</p>
          <ul className="mt-1.5 space-y-1 text-[13.5px] text-[#191F28]">
            {intro.known.map((k, i) => (
              <li key={i}>· {k}</li>
            ))}
          </ul>
          {onEditKnown ? (
            <button onClick={onEditKnown} className="mt-2 text-[12.5px] font-semibold text-[#1B64DA]">
              {t("코치가 알고 있는 내용 수정하기", "Edit what the coach knows", "修改教练已了解的内容", "Sửa điều coach đã biết", "コーチが知っている内容を修正", "Ubah yang diketahui coach")}
            </button>
          ) : null}
        </div>
      )}

      {intro.toConfirm.length > 0 && (
        <div className="mt-3 rounded-2xl border border-[#EEF1F5] bg-white p-4">
          <p className="text-[12.5px] font-bold text-[#4E5968]">{t("오늘 확인할 내용", "What we'll confirm today", "今天要确认的内容", "Điều cần xác nhận hôm nay", "今日確認する内容", "Yang akan dikonfirmasi hari ini")}</p>
          <ul className="mt-1.5 space-y-1 text-[13.5px] text-[#191F28]">
            {intro.toConfirm.map((k, i) => (
              <li key={i}>· {k}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[12.5px] text-[#8B95A1]">
        <span>{intro.estimateText}</span>
        <span aria-hidden>·</span>
        <span>{t("결과물", "Result", "成果", "Kết quả", "成果物", "Hasil")}: {intro.artifactLabel}</span>
      </div>
      <button onClick={onStart} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-3.5 text-[15px] font-bold text-white transition sm:w-auto sm:min-w-[240px]">
        {intro.ctaLabel} <ArrowRight size={16} weight="bold" />
      </button>
      <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#B0B8C1]">
        <Info size={13} className="mt-0.5 flex-none" /> {AI_DISCLOSURE}
      </p>
    </div>
  );
}
