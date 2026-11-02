"use client";

// APLY PREMIUM 어두운 한 장 페이지들(/premium, /premium-partners)이 같이 쓰는 조각 —
// 셸(로고·언어·오로라·별·진행 막대·바닥글), 등장·기울기·시차 효과, 제목·구획, 폼 칸.
// 색은 app/premium/premium.css 의 .premium-dark 변수, 움직임 클래스(pm-*)도 거기에 있다.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AplyFooter } from "../AplyFooter";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { usePlatformT } from "../../lib/i18n";
import { useLanguage } from "../i18n/LanguageProvider";
import { tl, type L } from "../../lib/premium";

export const GOLD = "#C5A878";
export const NIGHT = "#121622";

/** 셸 — 상단 메뉴 없이 로고·언어만, 첫 화면 뒤 오로라·격자·별, 맨 위 스크롤 진행 막대, 어두운 바닥글. */
export function PremiumShell({ children, homeHref = "/", variant = "luxe" }: { children: ReactNode; homeHref?: string; variant?: "luxe" | "web3" }) {
  const web3 = variant === "web3";
  return (
    <div className={`v2 premium-dark relative overflow-x-clip ${web3 ? "pm-web3" : ""}`}>
      {/* 웹3 테마(app/premium/premium.css .pm-web3) — 화면 전체 잡티 */}
      {web3 ? <div aria-hidden className="pm-noise" /> : null}
      {/* 첫 화면 뒤 오로라·격자 — 로고 줄까지 덮도록 맨 위에서 */}
      <div aria-hidden className="pm-aurora pm-fade-bottom bottom-auto h-[920px]">
        <span className="a" />
        <span className="b" />
        <span className="c" />
      </div>
      <div aria-hidden className="pm-grid bottom-auto h-[920px]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[860px]">
        <Stars />
      </div>
      <ScrollProgress />
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 pt-5 md:px-8 md:pt-7">
        <Link href={homeHref} aria-label="Aply">
          <Image src="/img_logo.webp" alt="Aply" width={96} height={30} className="h-6 w-auto brightness-0 invert md:h-7" priority />
        </Link>
        <LanguageSwitcher />
      </div>
      {children}
      <AplyFooter tone="dark" />
    </div>
  );
}

/** 신청 완료 축하 조각 — 부모가 relative·overflow-hidden 이어야 한다. */
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r = 140 + ((i * 53) % 120);
          return (
            <span
              key={i}
              className="pm-confetti"
              style={{
                background: ["#648BFF", "#C5A878", "#A98BFF", "#F7F8FC"][i % 4],
                animationDelay: `${(i % 6) * 40}ms`,
                ["--dx" as string]: `${Math.round(Math.cos(a) * r)}px`,
                ["--dy" as string]: `${Math.round(Math.sin(a) * r * 0.8 + 120)}px`,
                ["--rot" as string]: `${(i * 97) % 720 - 360}deg`
              }}
            />
          );
        })}
      </div>
  );
}

/** 화면에 들어오는지 — 한 번 보이면 true 로 남는다. */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
}

/** 화면에 들어올 때 흐림이 걷히며 떠오르게 — delay(ms)로 차례대로. 움직임 줄이기 설정이면 그대로 보인다. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`transition-[opacity,transform,filter] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${shown ? "translate-y-0 scale-100 opacity-100 blur-0" : "translate-y-8 scale-[0.98] opacity-0 blur-[6px]"} motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:blur-0 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}

/** 마우스를 따라오는 카드 빛(.pm-spot) — 위치만 CSS 변수로 넘긴다. */
export function spotMove(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
}

/** 첫 화면 별 — 시드로 정해 서버·브라우저 렌더가 같게. */
const STARS = (() => {
  let x = 7;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 56 }, () => ({ l: rnd() * 100, t: rnd() * 100, s: 1 + rnd() * 2, d: 2.5 + rnd() * 4, delay: -rnd() * 6 }));
})();

export function Stars({ count = STARS.length }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.slice(0, count).map((st, i) => (
        <span key={i} className="pm-star" style={{ left: `${st.l}%`, top: `${st.t}%`, width: st.s, height: st.s, ["--d" as string]: `${st.d}s`, ["--delay" as string]: `${st.delay}s` }} />
      ))}
      <span className="pm-shooting" style={{ right: "8%", top: "12%" }} />
      <span className="pm-shooting" style={{ right: "30%", top: "4%", animationDelay: "4.5s" }} />
    </div>
  );
}

/** 글자 하나씩 떠오르기 — 읽기 프로그램엔 한 줄로 들리게 aria-label. */
export function SplitText({ text, start = 0, step = 40 }: { text: string; start?: number; step?: number }) {
  return (
    <span aria-label={text} className="block">
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className="pm-char" style={{ animationDelay: `${start + i * step}ms` }}>
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}

/** 맨 위 스크롤 진행 막대 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
    };
  }, []);
  return <div ref={ref} aria-hidden className="pm-progress" style={{ transform: "scaleX(0)" }} />;
}

/** 카드 3D 기울기 + 따라오는 빛 */
export function tiltMove(e: React.MouseEvent<HTMLElement>) {
  spotMove(e);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.transform = `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(-6px)`;
}
export function tiltLeave(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = "";
}

/** 첫 화면 마우스 시차 — --mx, --my(-1~1)를 넘기고 층마다 다르게 움직인다. */
export function parallaxMove(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
  e.currentTarget.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  e.currentTarget.style.setProperty("--cx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--cy", `${e.clientY - r.top}px`);
}


export function Wrap({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-[1080px] scroll-mt-24 px-5 py-14 md:py-20 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <p className={`pm-eyebrow text-[13px] font-bold tracking-[0.14em] ${dark ? "text-white/60" : "text-[color:var(--v2-accent)]"}`}>{children}</p>;
}

/** 구획 제목 — 보이면 줄마다 아래에서 밀려 올라온다. */
export function Heading({ children, dark = false }: { children: string; dark?: boolean }) {
  const [ref, shown] = useInView<HTMLHeadingElement>();
  return (
    <h2 ref={ref} className={`mt-2 text-[26px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[38px] ${dark ? "text-white" : "text-[color:var(--v2-ink)]"}`}>
      {children.split("\n").map((line, i) => (
        <span key={i} className="pm-rise-mask">
          <span className={`pm-rise ${shown ? "is-on" : ""}`} style={{ animationDelay: `${i * 140}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </h2>
  );
}

export const fieldCls =
  "h-12 w-full rounded-xl border border-[color:var(--v2-line)] bg-[color:var(--premium-elevated)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-disabled)] focus:border-[color:var(--v2-accent)] aria-[invalid=true]:border-[color:var(--v2-attention)]";

export function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  const t = usePlatformT();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-2)]">
        {label}
        {required ? <span className="ml-1 text-[color:var(--v2-accent)]">*</span> : <span className="ml-1.5 font-normal text-[color:var(--v2-faint)]">{t("선택", "Optional")}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[color:var(--v2-attention)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ChoiceGroup({ id, value, onChange, options, invalid }: { id: string; value: string; onChange: (v: string) => void; options: { code: string; label: string }[]; invalid?: boolean }) {
  return (
    <div id={id} role="radiogroup" aria-invalid={invalid || undefined} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.code;
        return (
          <button
            key={o.code}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.code)}
            className={`h-11 rounded-xl border px-4 text-[15px] font-semibold transition ${
              on
                ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"
                : `bg-[color:var(--premium-elevated)] text-[color:var(--v2-ink-3)] hover:bg-white/10 ${invalid ? "border-[color:var(--v2-attention)]" : "border-[color:var(--v2-line)]"}`
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}


/** 여러 개 고르는 칩(체크박스) — 값은 코드 배열. */
export function MultiChoice({ id, value, onChange, options, invalid }: { id: string; value: string[]; onChange: (v: string[]) => void; options: { code: string; label: string }[]; invalid?: boolean }) {
  return (
    <div id={id} role="group" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.code);
        return (
          <button
            key={o.code}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.code) : [...value, o.code])}
            className={`inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-[15px] font-semibold transition ${
              on
                ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"
                : `bg-[color:var(--premium-elevated)] text-[color:var(--v2-ink-3)] hover:bg-white/10 ${invalid ? "border-[color:var(--v2-attention)]" : "border-[color:var(--v2-line)]"}`
            }`}
          >
            <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded border text-[11px] ${on ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent)] text-white" : "border-white/25"}`}>
              {on ? "✓" : ""}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** 진행 단계 — 보이면 선이 그려지고 번호가 차례로 나타난다. */
export function Timeline({ steps }: { steps: { title: L; body: L }[] }) {
  const { locale } = useLanguage();
  const [ref, shown] = useInView<HTMLOListElement>();
  return (
    <ol ref={ref} className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-5">
      <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-px bg-[color:var(--v2-line)] md:bottom-auto md:left-5 md:right-5 md:top-5 md:h-px md:w-auto" />
      {/* 보이면 파란 선이 위에서 아래로(PC 는 왼쪽에서 오른쪽으로) 그려진다 */}
      <span
        aria-hidden
        className={`pm-timeline-line absolute bottom-3 left-[19px] top-3 w-px origin-top bg-gradient-to-b from-[#648BFF] to-[#C5A878] transition-transform duration-[1600ms] ease-out md:bottom-auto md:left-5 md:right-5 md:top-5 md:h-px md:w-auto md:origin-left md:bg-gradient-to-r ${shown ? "scale-100" : "scale-y-0 md:scale-x-0 md:scale-y-100"} motion-reduce:scale-100 motion-reduce:transition-none`}
      />
      {steps.map((st, i) => (
        <li key={i} className="relative flex gap-4 md:block">
          <span
            style={{ transitionDelay: shown ? `${250 + i * 320}ms` : "0ms" }}
            className={`pm-timeline-dot relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--v2-accent)] text-[15px] font-bold text-white ring-4 ring-[color:var(--v2-fill)] transition duration-500 ${shown ? "scale-100 opacity-100" : "scale-50 opacity-0"} motion-reduce:scale-100 motion-reduce:opacity-100`}
          >
            {i + 1}
          </span>
          <div style={{ transitionDelay: shown ? `${350 + i * 320}ms` : "0ms" }} className={`min-w-0 transition duration-700 md:mt-4 ${shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"} motion-reduce:translate-y-0 motion-reduce:opacity-100`}>
            <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{tl(locale, st.title)}</p>
            <p className="mt-1 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{tl(locale, st.body)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
