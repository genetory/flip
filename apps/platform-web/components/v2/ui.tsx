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

/** 본문 폭 — 모바일은 꽉 차게, PC 는 가운데 한 단(880px — GNB 폭과 너무 차이 나지 않게). */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[880px] pb-24">{children}</main>;
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
export function Section({ title, aside, children, band = true }: { title: string; aside?: ReactNode; children: ReactNode; band?: boolean }) {
  return (
    <>
      {band ? <Band /> : null}
      <section className="px-5 pb-7 pt-8 md:pb-9 md:pt-10">
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

/** 버튼 — 크기는 둘뿐: md(48px, 화면의 행동) · sm(36px, 목록 안 행동). 같은 쓰임이면 같은 크기.
 *  모양은 셋: primary(파랑, 화면에 하나) · secondary(연파랑) · neutral(회색). */
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

/** 주 행동 — 화면에 하나. */
export function PrimaryButton(props: { href?: string; onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return <Button {...props} variant="primary" />;
}

/** 보조 행동 — 주 행동과 같은 크기, 연파랑. */
export function SecondaryButton(props: { href?: string; onClick?: () => void; children: ReactNode }) {
  return <Button {...props} variant="secondary" />;
}

/** 버튼 여럿 — 늘 한 줄로 나란히(넘치면 다음 줄). */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
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

/** 검색칸 — 연회색 둥근 칸. 엔터나 [검색]을 누를 때만 찾는다(글자마다 찾으면 한글 조합 중 결과가 출렁이고,
 *  뜻 기반 검색은 매번 AI 를 불러 비싸다). 글자가 있으면 지우기(×) — 지우면 바로 전체로 돌아간다.
 *  모바일 확대를 막으려 글자 16px. */
export function SearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  submitLabel,
  clearLabel,
  autoFocus,
  busy = false
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder: string;
  submitLabel: string;
  clearLabel: string;
  autoFocus?: boolean;
  /** 찾는 중 — [검색]에 도는 표시, 다시 누르지 못하게. */
  busy?: boolean;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex h-12 items-center gap-2 rounded-2xl bg-[color:var(--v2-band)] pl-4 pr-1.5"
    >
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" className="shrink-0 text-[color:var(--v2-faint)]">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        enterKeyHint="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[16px] text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button type="button" onClick={onClear} aria-label={clearLabel} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[18px] leading-none text-[color:var(--v2-faint)] hover:text-[color:var(--v2-ink-3)]">
          ×
        </button>
      ) : null}
      <button type="submit" disabled={busy} aria-busy={busy} className="inline-flex h-9 min-w-[56px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-accent)] px-3.5 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-80">
        {busy ? <Spinner /> : submitLabel}
      </button>
    </form>
  );
}

/** 칩 — 필터·탭. 고르면 먹색. */
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

/** 비어 있을 때 한 줄 안내. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-[15px] leading-[1.6] text-[color:var(--v2-faint)]">{children}</p>;
}

// ── 스켈레톤 — 불러오는 동안 실제 화면과 같은 모양의 회색 자리. 글자 대신 모양으로 '곧 뜬다'를 알린다. ──

function Bone({ className }: { className: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-lg bg-[color:var(--v2-band)] ${className}`} />;
}

/** 머리말 자리 — 작은 머리글·큰 제목 두 줄·설명. */
export function MastheadSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="px-5 pb-8 pt-8 md:pt-12" aria-busy="true">
      <Bone className="h-4 w-32" />
      <Bone className="mt-3 h-8 w-3/4" />
      <Bone className="mt-3 h-5 w-2/3" />
      {action ? <Bone className="mt-6 h-12 w-[160px] rounded-xl" /> : null}
    </div>
  );
}

/** 목록 줄 자리 — 왼쪽 48px 칸 + 두 줄. */
export function RowsSkeleton({ count = 3, thumb = true }: { count?: number; thumb?: boolean }) {
  return (
    <div aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 py-3.5">
          {thumb ? <Bone className="h-12 w-12 shrink-0 rounded-xl" /> : null}
          <span className="min-w-0 flex-1">
            <Bone className="h-[18px] w-3/5" />
            <Bone className="mt-2 h-3.5 w-2/5" />
          </span>
        </div>
      ))}
    </div>
  );
}

/** 구획 자리 — 띠·제목·목록. */
export function SectionSkeleton({ rows = 3, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <>
      <Band />
      <div className="px-5 pb-4 pt-7">
        <Bone className="h-6 w-28" />
        <div className="mt-3">
          <RowsSkeleton count={rows} thumb={thumb} />
        </div>
      </div>
    </>
  );
}

/** 화면 전체 자리 — 로그인 확인 중 등 아직 아무것도 모를 때. */
export function PageSkeleton() {
  return (
    <Page>
      <MastheadSkeleton />
      <SectionSkeleton />
      <SectionSkeleton rows={2} />
    </Page>
  );
}

/** 서류 카드 — 이력서·자기소개서를 2단으로 나란히. 카드 전체가 편집으로, 아래 '미리보기'는 선택. */
export function DocCard({ href, label, pct, note, previewHref, previewLabel, extra }: { href: string; label: string; pct: number; note: string; previewHref?: string | null; previewLabel?: string; extra?: { href: string; label: string } | null }) {
  return (
    <div className="relative flex flex-col rounded-2xl bg-[color:var(--v2-band)] p-4 transition hover:bg-[color:var(--v2-line)] md:p-5">
      <Link href={href} aria-label={label} className="absolute inset-0 rounded-2xl" />
      <p className="text-[15px] font-semibold text-[color:var(--v2-ink-3)]">{label}</p>
      <p className="mt-1 text-[26px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{pct}%</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white" aria-hidden>
        <div className="h-full rounded-full bg-[color:var(--v2-accent)]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <p className="mt-2.5 text-[14px] text-[color:var(--v2-muted)]">{note}</p>
      {previewHref || extra ? (
        <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 self-start">
          {previewHref ? (
            <Link href={previewHref} className="text-[14px] font-semibold text-[color:var(--v2-accent)] hover:opacity-70">
              {previewLabel}
            </Link>
          ) : null}
          {extra ? (
            <Link href={extra.href} className="text-[14px] font-semibold text-[color:var(--v2-accent)] hover:opacity-70">
              {extra.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** 스위치 — 켜고 끄는 거름망(탭·칩과 구분). 글자 + 토글. 켜면 파랑. */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="inline-flex shrink-0 items-center gap-2 py-1 text-[14px] font-semibold text-[color:var(--v2-ink-2)]">
      {label}
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-[color:var(--v2-accent)]" : "bg-[color:var(--v2-line)]"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** 도는 표시 — 찾는 중·보내는 중. 글자 색을 따른다. */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
