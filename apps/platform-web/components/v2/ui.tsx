"use client";

// 리뉴얼 v2 공통 조각 — 모든 v2 화면이 이것만으로 짜이게 한다(화면마다 따로 꾸며 정신없어지는 것을 막는다).
//
// 규칙(흰 바탕 토스 스타일)
//  - 글의 위계는 크기·굵기·회색 단계로. 색은 쓰지 않는다.
//  - 구획은 두꺼운 연회색 띠(Band)로 나눈다. 구획 안에선 상자 없이 목록(Row).
//  - 목록 한 줄은 오른쪽 '>' — 누르면 들어간다는 걸 늘 같은 모양으로.
//  - 한 화면의 주 행동은 하나(PrimaryButton, 큰 파란 둥근 버튼). 나머지는 SecondaryButton·TextLink.
//  - 주황(attention)은 마감·다시 볼 것에만.
import Link from "next/link";
import type { ReactNode } from "react";

/** 본문 폭 — 모바일은 꽉 차게, PC 는 가운데 한 단. */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[640px] pb-24">{children}</main>;
}

/** 머리말 — 작은 머리글 · 굵은 큰 제목 · 한두 줄 설명 · 주 행동. */
export function Masthead({ eyebrow, title, lede, action }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; action?: ReactNode }) {
  return (
    <header className="px-5 pb-8 pt-8 md:pt-12">
      {eyebrow ? <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">{eyebrow}</p> : null}
      <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{title}</h1>
      {lede ? <p className="mt-2.5 text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">{lede}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </header>
  );
}

/** 구획 사이 두꺼운 연회색 띠. */
export function Band() {
  return <div aria-hidden className="h-3 bg-[color:var(--v2-band)] md:mx-5 md:h-px md:bg-[color:var(--v2-line)]" />;
}

/** 구획 — 띠 위에 제목과 내용. */
export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <>
      <Band />
      <section className="px-5 pb-4 pt-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{title}</h2>
          {aside}
        </div>
        <div className="mt-3">{children}</div>
      </section>
    </>
  );
}

function Chevron() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-[color:var(--v2-faint)]">
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 목록 왼쪽 사진 — 공고 썸네일·회사 대표 사진. 없으면 이름 첫 글자. 번호·아이콘(lead)과 같은 48px 칸. */
function Thumb({ src, fallback }: { src?: string | null; fallback: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- 외부 공고 이미지·data URL 이 섞여 next/image 로 못 받는다.
    <img src={src} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl bg-[color:var(--v2-band)] object-cover" />
  ) : (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-band)] text-[17px] font-bold text-[color:var(--v2-faint)]">{fallback.slice(0, 1)}</span>
  );
}

/** 목록 한 줄 — 왼쪽(선택) 사진 또는 표시, 제목·설명, 오른쪽 보조 정보, '>'. */
export function Row({ href, onClick, title, meta, right, lead, thumb }: { href?: string; onClick?: () => void; title: ReactNode; meta?: ReactNode; right?: ReactNode; lead?: ReactNode; thumb?: { src?: string | null; fallback: string } }) {
  const body = (
    <>
      {thumb ? <Thumb src={thumb.src} fallback={thumb.fallback} /> : null}
      {lead ? <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-band)] text-[17px] font-bold text-[color:var(--v2-ink-3)]">{lead}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-[14px] leading-[1.5] text-[color:var(--v2-faint)]">{meta}</span> : null}
      </span>
      {right ? <span className="shrink-0 text-[15px] font-semibold text-[color:var(--v2-ink-3)]">{right}</span> : null}
      {href || onClick ? <Chevron /> : null}
    </>
  );
  const cls = "-mx-2 flex w-[calc(100%+16px)] items-center gap-3.5 rounded-2xl px-2 py-3.5 text-left transition active:bg-[color:var(--v2-band)] md:hover:bg-[color:var(--v2-fill)]";
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

/** 주 행동 — 화면에 하나. 큰 파란 둥근 버튼(모바일은 꽉 차게). */
export function PrimaryButton({ href, onClick, children, disabled }: { href?: string; onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  const cls = "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--v2-accent)] px-6 text-[17px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 md:w-auto md:min-w-[200px]";
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

/** 보조 행동 — 연파랑 바탕. */
export function SecondaryButton({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-accent-weak)] px-4 text-[15px] font-semibold text-[color:var(--v2-accent)] transition active:scale-[0.98]";
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** 글자 링크 — 회색, 구획 오른쪽 '전체' 같은 곳. */
export function TextLink({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "inline-flex items-center gap-0.5 text-[15px] font-medium text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)]";
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** 큰 숫자 하나 — 진행률·개수. */
export function Figure({ value, label, note }: { value: ReactNode; label: string; note?: ReactNode }) {
  return (
    <div>
      <p className="text-[15px] font-medium text-[color:var(--v2-muted)]">{label}</p>
      <p className="mt-1 text-[26px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{value}</p>
      {note ? <p className="mt-0.5 text-[14px] text-[color:var(--v2-faint)]">{note}</p> : null}
    </div>
  );
}

/** 진행 막대 — 토스처럼 얇고 둥글게. */
export function Progress({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--v2-band)]" aria-hidden>
      <div className="h-full rounded-full bg-[color:var(--v2-accent)]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** 주의 표시 — 마감·다시 볼 것에만. */
export function Attention({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[color:var(--v2-attention)]">{children}</span>;
}

/** 검색칸 — 연회색 둥근 칸. 모바일 확대를 막으려 글자 16px. */
export function SearchField({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-[color:var(--v2-band)] px-4">
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" className="shrink-0 text-[color:var(--v2-faint)]">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[16px] text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
      />
    </label>
  );
}

/** 칩 — 필터·탭. 고르면 먹색. */
export function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-semibold transition ${active ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"}`}
    >
      {children}
    </button>
  );
}

/** 비어 있을 때 한 줄 안내. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-[15px] leading-[1.6] text-[color:var(--v2-faint)]">{children}</p>;
}
