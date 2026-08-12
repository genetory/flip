"use client";

// Talent 앱 공통 UI 프리미티브 — Toss 스타일(넓은 여백, 부드러운 라운드, 얇은 테두리, 약한 그림자).
// 점수/평가보다 단계·완료 상태를 표현하는 데 초점.
import type { ReactNode } from "react";
import Link from "next/link";
import { CircleNotch, WarningCircle, Check } from "@phosphor-icons/react";
import type { StepState } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

/* 카드 */
export function TCard({
  children,
  className = "",
  as = "div",
  href
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  href?: string;
}) {
  const cls = `rounded-2xl border border-[#EEF1F5] bg-white ${className}`;
  if (href) {
    return (
      <Link href={href} className={`${cls} block transition hover:border-[#D7DCE3] hover:shadow-[0_6px_20px_rgba(11,18,39,0.05)]`}>
        {children}
      </Link>
    );
  }
  const Tag = as;
  return <Tag className={cls}>{children}</Tag>;
}

/* 섹션 타이틀(앱 내부용, 랜딩 헤더와 구분) */
export function TSectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-[#191F28]">{title}</h2>
      {action}
    </div>
  );
}

/* 진행 바 */
export function TProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* 칩 */
export function TChip({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" | "lime" }) {
  const map = {
    gray: "bg-[#F2F4F6] text-[#4E5968]",
    blue: "bg-[#EDF1FD] text-[#0B46E8]",
    lime: "bg-[#B7FF5A] text-[#111111]"
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${map[tone]}`}>{children}</span>;
}

/* 단계 상태 점 */
export function TStepDot({ state }: { state: StepState }) {
  const t = usePlatformT();
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-2xl bg-[#B7FF5A]" aria-label={t("완료", "Done", "完成", "Hoàn tất", "完了", "Selesai")}>
        <Check className="h-3.5 w-3.5 text-[#1F3D00]" weight="bold" />
      </span>
    );
  }
  if (state === "doing") {
    return <span className="flex h-6 w-6 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[11px] font-black text-[#0B46E8]" aria-label={t("진행 중", "In progress", "进行中", "Đang làm", "進行中", "Berlangsung")}>●</span>;
  }
  if (state === "locked") {
    return <span className="h-6 w-6 rounded-full bg-[#F2F4F6]" aria-label={t("잠김", "Locked", "已锁定", "Đã khóa", "ロック", "Terkunci")} />;
  }
  return <span className="h-6 w-6 rounded-full border-2 border-[#E5E8EB] bg-white" aria-label={t("예정", "Upcoming", "待完成", "Sắp tới", "予定", "Akan datang")} />;
}

/* 단계 목록(세로) */
export function TStepList({ steps }: { steps: { label: string; state: StepState; hint?: string }[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={`${s.label}-${i}`} className="flex items-center gap-3">
          <TStepDot state={s.state} />
          <span className={`text-[14px] ${s.state === "todo" || s.state === "locked" ? "text-[#B0B8C1]" : "text-[#191F28]"} ${s.state === "doing" ? "font-semibold" : ""}`}>
            {s.label}
          </span>
          {s.hint ? <span className="ml-auto text-[12px] text-[#8B95A1]">{s.hint}</span> : null}
        </li>
      ))}
    </ol>
  );
}

/* 로딩 */
export function TLoading({ label }: { label?: string }) {
  const t = usePlatformT();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#8B95A1]">
      <CircleNotch className="h-6 w-6 animate-spin" />
      <p className="text-[13px]">{label ?? t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
    </div>
  );
}

/* 리스트 스켈레톤 — 목록 화면 로딩 시 카드형 자리표시(체감 속도↑). */
export function TListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#EEF1F5]" />
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-2/5 rounded bg-[#EEF1F5]" />
            <div className="mt-2 h-3 w-3/5 rounded bg-[#F2F4F6]" />
            <div className="mt-2.5 h-3 w-1/3 rounded bg-[#F2F4F6]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* 오류 */
export function TError({ onRetry }: { onRetry?: () => void }) {
  const t = usePlatformT();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <WarningCircle className="h-7 w-7 text-[#F04452]" />
      <p className="text-[14px] text-[#4E5968]">{t("정보를 불러오지 못했어요.", "Couldn't load the information.", "无法加载信息。", "Không thể tải thông tin.", "情報を読み込めませんでした。", "Tidak dapat memuat informasi.")}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="rounded-lg bg-[#F2F4F6] px-4 py-2 text-[13px] font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">
          {t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}
        </button>
      ) : null}
    </div>
  );
}

/* 빈 상태 — 다음 행동을 반드시 제공 */
export function TEmpty({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#E5E8EB] bg-[#FAFBFC] px-6 py-14 text-center">
      {icon ? <div className="text-[32px]" aria-hidden>{icon}</div> : null}
      <div>
        <p className="text-[15px] font-bold text-[#191F28]">{title}</p>
        {description ? <p className="mx-auto mt-1.5 max-w-xs break-keep text-[13px] leading-relaxed text-[#8B95A1]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* 페이지 상단 제목 블록 */
export function TPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{title}</h1>
      {description ? <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#4E5968]">{description}</p> : null}
    </div>
  );
}
