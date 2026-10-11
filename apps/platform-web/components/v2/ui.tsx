"use client";

// 리뉴얼 v2 공통 조각 — 모든 v2 화면이 이것만으로 짜이게 한다(화면마다 따로 꾸며 정신없어지는 것을 막는다).
//
// 규칙
//  - 구분은 상자 대신 '여백 + 가는 선(hairline)'. 카드는 정말 따로 떼어 볼 것에만.
//  - 제목은 Paperlogy(display), 본문은 Pretendard. 본문 16px·줄간격 넉넉히.
//  - 포인트 색은 파랑 하나 — 누를 수 있는 것에만. 주의 색(갈색)은 '마감·다시 볼 것'에만.
//  - 한 화면의 주 행동은 하나(PrimaryButton). 나머지는 글자 링크(TextLink).
import Link from "next/link";
import type { ReactNode } from "react";
import { paperlogy } from "../../lib/fonts";

const display = paperlogy.className;

/** 본문 폭 — 읽기 좋은 한 단(약 34자). */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10 md:pt-14">{children}</main>;
}

/** 머리말 — 작은 머리글 · 큰 제목 · 한 줄 설명. 화면의 첫인상은 이것 하나로. */
export function Masthead({ eyebrow, title, lede, action }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; action?: ReactNode }) {
  return (
    <header>
      {eyebrow ? <p className="text-[13px] font-semibold tracking-[0.02em] text-[color:var(--v2-muted)]">{eyebrow}</p> : null}
      <h1 className={`${display} mt-2 text-[28px] font-extrabold leading-[1.3] tracking-[-0.03em] text-[color:var(--v2-ink)] md:text-[36px]`}>{title}</h1>
      {lede ? <p className="mt-3 max-w-[560px] text-[16px] leading-[1.75] text-[color:var(--v2-ink-2)]">{lede}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </header>
  );
}

/** 구획 — 위에 가는 선, 제목, 내용. 화면은 이것을 쌓아서 만든다. */
export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-14 border-t border-[color:var(--v2-line)] pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className={`${display} text-[19px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]`}>{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 목록 한 줄 — 글 중심. 왼쪽 큰 글, 아래 작은 설명, 오른쪽 보조 정보. 줄 사이는 가는 선. */
export function Row({ href, onClick, title, meta, right, lead }: { href?: string; onClick?: () => void; title: ReactNode; meta?: ReactNode; right?: ReactNode; lead?: ReactNode }) {
  const body = (
    <>
      {lead ? <span className="w-8 shrink-0 pt-[2px] text-[15px] font-bold tabular-nums text-[color:var(--v2-faint)]">{lead}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">{title}</span>
        {meta ? <span className="mt-0.5 block text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{meta}</span> : null}
      </span>
      {right ? <span className="shrink-0 pt-[2px] text-[14px] font-semibold text-[color:var(--v2-ink-2)]">{right}</span> : null}
    </>
  );
  const cls = "flex w-full items-start gap-3 border-b border-[color:var(--v2-line)] py-4 text-left transition last:border-b-0 hover:opacity-70";
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls.replace(" hover:opacity-70", "")}>{body}</div>;
}

/** 주 행동 — 화면에 하나. 먹색 바탕. */
export function PrimaryButton({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--v2-ink)] px-6 text-[15px] font-semibold text-white transition hover:opacity-85";
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** 보조 행동 — 파란 글자 + 화살표. */
export function TextLink({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "inline-flex items-center gap-1 text-[15px] font-semibold text-[color:var(--v2-accent)] transition hover:opacity-70";
  if (href) return <Link href={href} className={cls}>{children} <span aria-hidden>→</span></Link>;
  return <button type="button" onClick={onClick} className={cls}>{children} <span aria-hidden>→</span></button>;
}

/** 숫자 하나를 크게 — 진행률·개수. 막대 대신 숫자로 읽게. */
export function Figure({ value, label, note }: { value: ReactNode; label: string; note?: ReactNode }) {
  return (
    <div>
      <p className={`${display} text-[30px] font-extrabold leading-none tracking-[-0.03em] text-[color:var(--v2-ink)]`}>{value}</p>
      <p className="mt-2 text-[14px] font-semibold text-[color:var(--v2-ink-2)]">{label}</p>
      {note ? <p className="mt-0.5 text-[13px] text-[color:var(--v2-muted)]">{note}</p> : null}
    </div>
  );
}

/** 주의 표시 — 마감·다시 볼 것에만. */
export function Attention({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[color:var(--v2-attention)]">{children}</span>;
}

export const v2Display = display;
