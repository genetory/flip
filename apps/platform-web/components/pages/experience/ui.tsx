"use client";

// 경험 발굴 캠페인 전용 — develop 의 components/v2/ui.tsx 에서 캠페인이 쓰는 조각(Page·Button·Chip·Spinner)만 같은 마크업으로 옮김.
// (프로덕션에는 v2 앱을 내보내지 않기 위해 따로 둔다.)
import Link from "next/link";
import type { ReactNode } from "react";

/** 본문 폭 — 모바일은 꽉 차게, PC 는 가운데 한 단(880px — GNB 폭과 너무 차이 나지 않게). */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[880px] pb-24">{children}</main>;
}

export function Button({
  href,
  onClick,
  children,
  disabled,
  variant = "primary",
  size = "md",
  full = false
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "neutral" | "white";
  size?: "md" | "sm";
  full?: boolean;
}) {
  const sizeCls = size === "md" ? "h-12 rounded-xl px-5 text-[16px]" : "h-9 rounded-lg px-3.5 text-[14px]";
  const variantCls =
    variant === "primary"
      ? "bg-[color:var(--v2-accent)] text-white hover:opacity-90"
      : variant === "secondary"
        ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)] hover:opacity-80"
        : variant === "white"
          ? "bg-white text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-fill)]" // 회색 카드 위의 보조 버튼
          : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]";
  const cls = `inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${sizeCls} ${variantCls} ${full ? "w-full" : ""}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-[15px] font-semibold transition ${active ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
