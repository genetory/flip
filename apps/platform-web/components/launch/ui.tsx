"use client";

import Link from "next/link";
import { useState } from "react";
import { LAUNCH, type Mission, type Step } from "../../lib/launch/data";

// 모바일 우선 컨테이너 — 최대 폭 좁게, 카드형 레이아웃.
export function LaunchContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[480px] px-5 ${className}`}>{children}</div>;
}

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#EEF1F5] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_8px_24px_-12px_rgba(17,24,39,0.12)] ${onClick ? "cursor-pointer transition hover:border-[#0B46E8]/30" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "lime" | "grey" | "amber" | "green" }) {
  const cls: Record<string, string> = {
    blue: "bg-[#EDF1FD] text-[#0B46E8]",
    lime: "bg-[#EAFFD1] text-[#3A6B00]",
    grey: "bg-[#F2F4F6] text-[#4E5968]",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700"
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${cls[tone]}`}>{children}</span>;
}

// 진행률 바 — 라임 포인트.
export function ProgressBar({ value, height = 10 }: { value: number; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-[#F2F4F6]" style={{ height }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: `linear-gradient(90deg, ${LAUNCH.blue}, ${LAUNCH.lime})` }} />
    </div>
  );
}

// 체크리스트 — 로컬 토글(MVP).
export function Checklist({ items }: { items: Mission[] }) {
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((m) => [m.id, Boolean(m.done)])));
  return (
    <ul className="space-y-2">
      {items.map((m) => {
        const checked = state[m.id];
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, [m.id]: !s[m.id] }))}
              className="flex w-full items-center gap-3 rounded-xl border border-[#EEF1F5] bg-white px-3.5 py-3 text-left transition hover:bg-[#FAFBFC]"
            >
              <span
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[12px] font-black ${checked ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"}`}
              >
                ✓
              </span>
              <span className={`text-[14px] ${checked ? "text-[#8B95A1] line-through" : "font-medium text-[#191F28]"}`}>{m.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// 주차별 "스텝별 해야 할 일" — 번호 + 연결선 스테퍼. 완료는 로컬 토글(MVP).
export function Stepper({ steps }: { steps: Step[] }) {
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(steps.map((s) => [s.id, Boolean(s.done)])));
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = state[s.id];
        const last = i === steps.length - 1;
        return (
          <li key={s.id} className="flex gap-3.5">
            {/* 번호/체크 + 연결선 */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                aria-label={done ? "완료 취소" : "완료로 표시"}
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-black transition ${
                  done ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3] bg-white text-[#8B95A1] hover:border-[#0B46E8]/50"
                }`}
              >
                {done ? "✓" : i + 1}
              </button>
              {!last ? <span className="mt-1 w-[2px] flex-1 rounded bg-[#EAECEF]" /> : null}
            </div>
            {/* 내용 */}
            <div className={`min-w-0 flex-1 ${last ? "" : "pb-5"}`}>
              <p className={`text-[15px] font-bold tracking-[-0.01em] ${done ? "text-[#8B95A1] line-through" : "text-[#191F28]"}`}>{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#4E5968]">{s.desc}</p>
              {s.action ? (
                <Link
                  href={s.action.href}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#E0E8FC]"
                >
                  {s.action.label} →
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LaunchButton({
  children,
  href,
  onClick,
  variant = "primary",
  full = false,
  type = "button"
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "lime" | "outline";
  full?: boolean;
  type?: "button" | "submit";
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold transition ${full ? "w-full" : ""}`;
  const styles: Record<string, string> = {
    primary: "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]",
    lime: "bg-[#B7FF5A] text-[#111111] hover:brightness-105",
    outline: "border border-[#D7DCE3] bg-white text-[#191F28] hover:border-[#0B46E8]/40"
  };
  const cls = `${base} ${styles[variant]}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} className={cls}>{children}</button>;
}

// 과제 제출 영역(MVP — 로컬 상태). 링크/메모 입력 후 제출 → 제출됨 상태 표시.
export function SubmissionBox({ label, initialStatus }: { label: string; initialStatus: "todo" | "submitted" | "reviewed" }) {
  const [status, setStatus] = useState(initialStatus);
  const [value, setValue] = useState("");
  if (status === "reviewed") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-[13.5px] font-semibold text-emerald-700">
        ✓ 제출 완료 · 피드백까지 받았어요
      </div>
    );
  }
  if (status === "submitted") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[#CFE0FF] bg-[#EDF1FD] px-4 py-3.5">
        <span className="text-[13.5px] font-semibold text-[#0B46E8]">✓ 제출 완료 · 피드백 대기 중</span>
        <button type="button" onClick={() => setStatus("todo")} className="text-[12px] font-semibold text-[#8B95A1] underline">
          다시 제출
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={label}
        className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
      />
      <LaunchButton variant="primary" full onClick={() => setStatus("submitted")}>
        과제 제출하기
      </LaunchButton>
    </div>
  );
}

// 섹션 제목.
export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[16px] font-extrabold tracking-[-0.01em] text-[#0B1227]">{children}</h2>
      {sub ? <p className="mt-0.5 text-[13px] text-[#8B95A1]">{sub}</p> : null}
    </div>
  );
}

// 상단 브랜드 바(런치 전용).
export function LaunchTopBar({ back }: { back?: { href: string; label: string } }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#EEF1F5] bg-white/90 backdrop-blur">
      <LaunchContainer className="flex h-14 items-center justify-between">
        {back ? (
          <Link href={back.href} className="text-[13px] font-semibold text-[#8B95A1] hover:text-[#191F28]">
            ← {back.label}
          </Link>
        ) : (
          <Link href="/career-launch" className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rotate-45 rounded-[2px]" style={{ background: LAUNCH.blue }} />
            <span className="text-[14px] font-extrabold text-[#0B1227]">Career Launch</span>
          </Link>
        )}
        <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#0B46E8]">대시보드</Link>
      </LaunchContainer>
    </header>
  );
}
