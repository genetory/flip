"use client";

// "내 경험이 스펙이 되는 순간" — 어플라이 자소서 경험 발굴 캠페인(/experience). 로그인 없이 신청.
// v2 광고 페이지 결(V2InterviewsGuest): 가운데 정렬 · 아주 큰 제목 · 흰/회색(#f5f5f7) 띠가 번갈아 · 흰 타일 + 곱하기 합성 그림.
// 히어로 → 이런 고민 → Before/After(예시) → 컨설팅 안내 → 신청 폼(완료 화면으로 바뀜) → 자주 묻는 질문 → 마지막 권유,
// 휴대폰은 아래 고정 신청 버튼(폼이 보이면 숨김).
// 문구·제공 범위·보관 기간·예시는 lib/experience-campaign.ts 에서 바꾼다. 이 캠페인은 '무료'를 써도 된다(전액 무료 행사).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AplyFooter } from "../AplyFooter";
import { Button, Chip, Page, Spinner } from "../v2/ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { readAccessToken } from "../../lib/auth-client";
import { setFabInset, clearFabInset } from "../../lib/talent/fab-inset";
import { trackExperienceCampaign } from "../../lib/analytics";
import {
  BEFORE_AFTER_EXAMPLES,
  CASE_STUDY_CONSENT,
  EXPERT_SCOPE,
  PRIVACY_CONSENT_DETAILS,
  WEEKLY_SLOTS,
  type Copy
} from "../../lib/experience-campaign";

const FORM_ID = "apply";
// 첨부 파일 — 이력서(필수)·자기소개서(선택). API(/public/experience-applications)와 같은 기준.
const FILE_MAX_BYTES = 10 * 1024 * 1024;
const FILE_EXTS = ["pdf", "doc", "docx", "hwp", "hwpx"];
const FILE_ACCEPT = FILE_EXTS.map((e) => `.${e}`).join(",");
const FAB_KEY = "experience-campaign";

type ConsultMethod = "ONLINE" | "OFFLINE" | "ANY";
type Utm = Partial<Record<"utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm" | "referrer", string>>;

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function scrollToForm() {
  document.getElementById(FORM_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ExperienceCampaignPage() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const tc = (c: Copy) => t(c.ko, c.en);
  const [submitted, setSubmitted] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const formRef = useRef<HTMLElement | null>(null);

  // 유입 경로 — 처음 들어온 URL 의 utm_* 와 referrer 를 들고 있다가 신청에 같이 보낸다.
  const utmRef = useRef<Utm>({});
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const pick = (k: string) => p.get(k)?.trim().slice(0, 200) || undefined;
    utmRef.current = {
      utmSource: pick("utm_source"),
      utmMedium: pick("utm_medium"),
      utmCampaign: pick("utm_campaign"),
      utmContent: pick("utm_content"),
      utmTerm: pick("utm_term"),
      referrer: document.referrer ? document.referrer.slice(0, 500) : undefined
    };
    trackExperienceCampaign("experience_landing_view", { locale, utm_source: utmRef.current.utmSource ?? "(none)" });
    // 진입 1회만 — locale 이 바뀌어도 다시 보내지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 폼이 화면에 보이는지 — 처음 보일 때 1회 이벤트, 보이는 동안은 아래 고정 버튼을 숨긴다.
  useEffect(() => {
    const el = formRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let sent = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        setFormVisible(entry.isIntersecting);
        if (entry.isIntersecting && !sent) {
          sent = true;
          trackExperienceCampaign("experience_form_view");
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 휴대폰 아래 고정 신청 버튼 — 보일 때만 전역 피드백 버튼을 그만큼 비켜 준다.
  const showSticky = !formVisible && !submitted;
  useEffect(() => {
    const apply = () => (showSticky && window.innerWidth <= 767 ? setFabInset(FAB_KEY, 76) : clearFabInset(FAB_KEY));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset(FAB_KEY);
    };
  }, [showSticky]);

  const cta = (source: string) => () => {
    trackExperienceCampaign("experience_cta_click", { source });
    scrollToForm();
  };

  const worries = [
    t("아르바이트밖에 해본 게 없어요.", "All I've done is part-time jobs."),
    t("동아리 경험을 자소서에 어떻게 써야 할까요?", "How do I write about my club activities?"),
    t("한국 회사가 원하는 지원동기를 모르겠어요.", "I don't know what motivation Korean companies want."),
    t("자소서를 썼는데 너무 평범한 것 같아요.", "My cover letter feels too ordinary.")
  ];

  // 혜택 쿠폰 — 왼쪽 큰 표시 · 점선 · 오른쪽 설명
  const offers = [
    {
      mark: "1:1",
      tone: "bg-[color:var(--v2-accent)] text-white",
      title: t(`매주 단 ${WEEKLY_SLOTS}명`, `Only ${WEEKLY_SLOTS} a week`),
      desc: t(`자소서 전문가가 직접 상담하고 첨삭해요. (${EXPERT_SCOPE.ko})`, `An expert consults and edits with you. (${EXPERT_SCOPE.en})`)
    },
    {
      mark: t("온·오프", "ON·OFF"),
      tone: "bg-[#7c5cff] text-white",
      title: t("온라인 또는 오프라인", "Online or in person"),
      desc: t("화상 상담도, 만나서 하는 상담도 돼요. 선정 후 편한 방식으로 맞춰요.", "Video call or face to face — we'll arrange it after selection.")
    },
    {
      mark: "₩0",
      tone: "bg-[#ffd84d] text-[#191f28]",
      title: t("100% 무료", "100% free"),
      desc: t("상담부터 약속한 첨삭 결과물까지 비용이 전혀 없어요.", "From the consultation to the promised edits — completely free.")
    }
  ];

  const sample = BEFORE_AFTER_EXAMPLES[0];
  return (
    // 완전히 분리된 싱글 페이지 — 사이트 상단 메뉴(GNB) 없이, 법적 고지용 바닥글만.
    <div className="v2">
      {/* 프로모션 페이지 — 연파랑 바탕 위에 파란 히어로·말풍선·쿠폰 카드 */}
      <div className="bg-[#eef3ff]">
      <Page>
        {/* ① 히어로 — 파란 띠, 노란 강조, 자소서 미리보기 카드 */}
        <section className="relative overflow-hidden bg-[color:var(--v2-accent)] px-5 pb-12 pt-6 text-white md:mx-5 md:mt-6 md:rounded-[40px] md:px-10 md:pt-10">
          {/* 장식 원 */}
          <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <span aria-hidden className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/[0.07]" />
          {/* 로고 — 메뉴 없이 브랜드만(흰 칩 위) */}
          <span className="relative inline-flex h-9 items-center rounded-full bg-white px-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- 작은 로고 */}
            <img src="/img_logo.webp" alt="Aply" className="h-5 w-auto" />
          </span>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#ffd84d] px-3 py-1.5 text-[13px] font-extrabold text-[#191f28]">{t("100% 무료", "100% FREE")}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-bold">{t(`매주 단 ${WEEKLY_SLOTS}명`, `${WEEKLY_SLOTS} per week`)}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-bold">{t("전문가 1:1", "1:1 expert")}</span>
          </div>
          <p className="relative mt-6 text-[13px] font-bold tracking-[0.14em] text-white/70">APLY CAREER PROJECT</p>
          <h1 className="relative mt-2 text-[34px] font-extrabold leading-[1.18] tracking-[-0.04em] min-[360px]:text-[40px] md:text-[60px]">
            {t("당신의 경험이", "Your experience")}
            <br />
            <span className="text-[#ffd84d]">{t("자소서", "your cover letter")}</span>
            {t("가 됩니다.", ".")}
          </h1>
          <p className="relative mt-4 max-w-[440px] text-[17px] leading-[1.6] text-white/85">
            {t("한국식 자기소개서가 어렵다면? 어플라이 자소서 전문가가 직접 도와드립니다.", "Korean-style cover letters feel hard? An Aply expert will help you in person.")}
          </p>
          <div className="relative mt-7 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center">
            <button type="button" onClick={cta("hero")} className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-[17px] font-extrabold text-[color:var(--v2-accent)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition hover:opacity-90 active:scale-[0.98]">
              {t("무료 상담 신청하기 →", "Apply for free →")}
            </button>
            <span className="text-[14px] font-semibold text-white/80">{t("월요일까지 신청 · 화요일 선정", "Apply by Mon · picked Tue")}</span>
          </div>
          {/* 자소서 미리보기 — 살짝 기운 종이 카드 */}
          <div className="relative mx-auto mt-10 max-w-[420px] rotate-[-2deg] rounded-[24px] bg-white p-5 text-left text-[color:var(--v2-ink)] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)]">
            <p className="text-[12px] font-bold tracking-[0.08em] text-[color:var(--v2-faint)]">BEFORE</p>
            <p className="mt-1 text-[15px] leading-[1.55] text-[color:var(--v2-muted)] line-through decoration-[#f04452]/60 decoration-2">{t(sample.before.ko, sample.before.en)}</p>
            <div aria-hidden className="my-3 border-t-2 border-dashed border-[color:var(--v2-band)]" />
            <p className="text-[12px] font-bold tracking-[0.08em] text-[color:var(--v2-accent)]">AFTER</p>
            <p className="mt-1 text-[16px] font-bold leading-[1.55]">
              <span className="bg-[linear-gradient(transparent_55%,#ffe98a_55%)]">{t(sample.after.ko, sample.after.en)}</span>
            </p>
          </div>
        </section>

        {/* ② 이런 고민 — 말풍선(채팅) */}
        <section className="px-5 py-16">
          <Headline eyebrow={t("이런 고민 있나요?", "Sound familiar?")} title={t("혼자 쓰기\n막막했다면.", "Stuck writing\nit alone?")} />
          <div className="mx-auto mt-10 flex max-w-[520px] flex-col gap-3">
            {worries.map((w, i) => (
              <div key={w} className={`flex items-end gap-2 ${i % 2 ? "flex-row-reverse" : ""}`}>
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[18px]">{["🙋", "🤔", "😥", "📝"][i]}</span>
                <p className={`max-w-[82%] rounded-[22px] px-5 py-3.5 text-[16px] font-semibold leading-[1.5] shadow-[0_6px_18px_-12px_rgba(11,70,232,0.35)] ${i % 2 ? "rounded-br-md bg-[color:var(--v2-accent)] text-white" : "rounded-bl-md bg-white text-[color:var(--v2-ink)]"}`}>{w}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--v2-ink)]">
            {t("그 경험, 전문가와 함께\n자소서로 바꿔 봐요.", "Let's turn that experience\ninto a cover letter.").split("\n").map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </p>
        </section>

        {/* ③ Before / After — 예시(실제 사례로 교체 예정) */}
        <BeforeAfter t={t} />

        {/* ④ 혜택 — 쿠폰 카드 셋 + 주간 진행 */}
        <section className="px-5 py-16">
          <Headline eyebrow={t("이번 캠페인 혜택", "What you get")} title={t("전문가가\n직접 봐 드려요.", "An expert,\nwith you.")} />
          <div className="mx-auto mt-10 flex max-w-[560px] flex-col gap-3">
            {offers.map((o) => (
              <article key={o.title} className="relative flex overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_-18px_rgba(11,70,232,0.45)]">
                <span className={`flex w-[96px] shrink-0 items-center justify-center text-[22px] font-extrabold tracking-[-0.02em] min-[360px]:w-[108px] ${o.tone}`}>{o.mark}</span>
                {/* 쿠폰 홈 — 위아래 반원 + 점선 */}
                <span aria-hidden className="relative w-0 border-l-2 border-dashed border-[#dfe6f7]">
                  <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-[#eef3ff]" />
                  <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-[#eef3ff]" />
                </span>
                <span className="min-w-0 flex-1 px-5 py-5">
                  <span className="block text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--v2-ink)]">{o.title}</span>
                  <span className="mt-1 block text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">{o.desc}</span>
                </span>
              </article>
            ))}
          </div>
          {/* 주간 진행 — 월 검토 · 화 선정·연락 · 수~금 상담 (가로 단계) */}
          <div className="mx-auto mt-6 max-w-[560px] rounded-[24px] bg-white px-5 py-6">
            <p className="text-center text-[17px] font-extrabold text-[color:var(--v2-ink)]">{t("매주 이렇게 진행돼요", "How each week works")}</p>
            <ol className="relative mt-5 grid grid-cols-3 gap-2">
              <span aria-hidden className="absolute left-[16%] right-[16%] top-6 border-t-2 border-dashed border-[color:var(--v2-accent-weak)]" />
              {[
                [t("월", "Mon"), t("신청서 검토", "Review")],
                [t("화", "Tue"), t(`${WEEKLY_SLOTS}명 선정·연락`, `Pick ${WEEKLY_SLOTS}`)],
                [t("수~금", "Wed–Fri"), t("1:1 상담·첨삭", "1:1 session")]
              ].map(([day, what], i) => (
                <li key={day} className="relative flex flex-col items-center text-center">
                  <span className={`flex h-12 min-w-[48px] items-center justify-center rounded-full px-2 text-[14px] font-extrabold ${i === 1 ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"}`}>{day}</span>
                  <span className="mt-2 text-[13px] font-bold leading-[1.4] text-[color:var(--v2-ink-2)]">{what}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑤ 신청 폼 — 흰 카드. 접수되면 이 자리가 완료 화면으로 바뀐다 */}
        <section id={FORM_ID} ref={formRef} className="scroll-mt-20 px-4 py-12 md:px-5">
          <div className="mx-auto max-w-[640px] rounded-[32px] bg-white px-5 py-10 shadow-[0_20px_50px_-30px_rgba(11,70,232,0.5)] min-[360px]:px-6 md:px-10">
            {submitted ? (
              <Completion t={t} />
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="rounded-full bg-[#ffd84d] px-3 py-1 text-[13px] font-extrabold text-[#191f28]">{t(`이번 주 ${WEEKLY_SLOTS}자리`, `${WEEKLY_SLOTS} spots this week`)}</span>
                </div>
                <div className="mt-3">
                  <Headline eyebrow={t("신청하기", "Apply")} title={t("이력서만\n보내 주세요.", "Just send\nyour resume.")} sub={t("1분이면 신청할 수 있어요.", "It takes about a minute.")} />
                </div>
                <ApplyForm t={t} tc={tc} locale={locale} utmRef={utmRef} onDone={() => setSubmitted(true)} />
              </>
            )}
          </div>
        </section>

        {/* ⑥ 자주 묻는 질문 */}
        <Faq t={t} />

        {/* ⑦ 마지막 — 파란 띠 권유 */}
        {!submitted ? (
          <section className="relative mx-4 mb-6 mt-4 overflow-hidden rounded-[32px] bg-[color:var(--v2-accent)] px-6 py-12 text-center text-white md:mx-5">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <h2 className="relative whitespace-pre-line text-[30px] font-extrabold leading-[1.22] tracking-[-0.04em] min-[360px]:text-[34px] md:text-[48px]">
              {t("별거 아닌 경험은\n없어요.", "No experience\nis too small.")}
            </h2>
            <p className="relative mt-3 text-[16px] text-white/85">{t("편의점 알바도, 동아리 활동도 취업 스펙이 될 수 있어요.", "A part-time job or a club can become a real qualification.")}</p>
            <div className="relative mt-7 flex justify-center">
              <button type="button" onClick={cta("footer")} className="inline-flex h-14 items-center justify-center rounded-full bg-[#ffd84d] px-7 text-[17px] font-extrabold text-[#191f28] transition hover:opacity-90 active:scale-[0.98]">
                {t("이번 주 신청하기 →", "Apply this week →")}
              </button>
            </div>
          </section>
        ) : null}

        {/* 고정 버튼에 마지막 내용이 가리지 않게 */}
        <div aria-hidden className="h-20 md:hidden" />

        {/* 휴대폰 아래 고정 신청 버튼 — 폼이 보이는 동안·접수 후엔 숨긴다 */}
        {showSticky ? (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-[#eef3ff]/90 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
            <button type="button" onClick={cta("sticky")} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--v2-accent)] text-[16px] font-bold text-white">
              <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[12px] font-extrabold text-[#191f28]">{t(`이번 주 ${WEEKLY_SLOTS}자리`, `${WEEKLY_SLOTS} spots`)}</span>
              {t("무료 상담 신청하기", "Apply for free")}
            </button>
          </div>
        ) : null}
      </Page>
      </div>
      <AplyFooter />
    </div>
  );
}

/** 애플식 섹션 머리 — 작은 눈썹 · 아주 큰 제목(줄바꿈 \n) · 한 줄 설명, 가운데 정렬. */
function Headline({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{eyebrow}</p>
      <h2 className="mt-2 whitespace-pre-line text-[30px] font-bold leading-[1.22] tracking-[-0.035em] text-[color:var(--v2-ink)] min-[360px]:text-[32px] md:text-[48px]">{title}</h2>
      {sub ? <p className="mt-3 text-[17px] text-[color:var(--v2-ink-3)]">{sub}</p> : null}
    </div>
  );
}

/** Before/After — 칩으로 예시를 넘겨 본다. 예시는 lib/experience-campaign.ts. */
function BeforeAfter({ t }: { t: PlatformT }) {
  const [idx, setIdx] = useState(0);
  const ex = BEFORE_AFTER_EXAMPLES[idx] ?? BEFORE_AFTER_EXAMPLES[0];
  return (
    <section className="px-5 py-16">
      <Headline eyebrow="Before / After" title={t("같은 경험도,\n이렇게 달라져요.", "Same experience.\nNew story.")} />
      <p className="mt-4 text-center">
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[color:var(--v2-muted)]">
          {t("예시 · 실제 상담 사례로 교체 예정", "Example · to be replaced with real cases")}
        </span>
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {BEFORE_AFTER_EXAMPLES.map((e, i) => (
          <Chip key={e.tag.ko} active={i === idx} onClick={() => setIdx(i)}>
            {t(e.tag.ko, e.tag.en)}
          </Chip>
        ))}
      </div>
      <div className="mx-auto mt-6 grid max-w-[720px] gap-3 md:grid-cols-2">
        <div className="rounded-[24px] bg-white/70 p-5">
          <span className="inline-flex rounded-full bg-[color:var(--v2-band)] px-2.5 py-1 text-[12px] font-extrabold tracking-[0.04em] text-[color:var(--v2-muted)]">BEFORE</span>
          <p className="mt-3 text-[16px] leading-[1.65] text-[color:var(--v2-muted)] line-through decoration-[#f04452]/50 decoration-2">{t(ex.before.ko, ex.before.en)}</p>
        </div>
        <div className="relative rounded-[24px] bg-white p-5 shadow-[0_14px_34px_-20px_rgba(11,70,232,0.55)]">
          <span className="inline-flex rounded-full bg-[color:var(--v2-accent)] px-2.5 py-1 text-[12px] font-extrabold tracking-[0.04em] text-white">AFTER</span>
          <p className="mt-3 text-[17px] font-bold leading-[1.65] text-[color:var(--v2-ink)]">
            <span className="bg-[linear-gradient(transparent_58%,#ffe98a_58%)]">{t(ex.after.ko, ex.after.en)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 신청 폼
// ---------------------------------------------------------------------------

type Fields = {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  desiredRole: string;
  resume: File | null;
  coverLetterFile: File | null;
  consultMethod: ConsultMethod | "";
  consentPrivacy: boolean;
  consentCaseStudy: boolean;
};
type FieldKey = keyof Fields;

const EMPTY: Fields = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  desiredRole: "",
  resume: null,
  coverLetterFile: null,
  consultMethod: "",
  consentPrivacy: false,
  consentCaseStudy: false
};

// 연락이 닿는 이메일이 꼭 있어야 한다 — 형식만 보되 흔한 오타(공백·@ 두 개·TLD 없음)는 걸러낸다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NATIONALITY_SUGGESTIONS = ["베트남", "중국", "우즈베키스탄", "몽골", "인도네시아", "일본", "네팔", "미국", "필리핀", "태국"];

function fileExt(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function fileError(file: File | null, t: PlatformT): string | undefined {
  if (!file) return undefined;
  if (!FILE_EXTS.includes(fileExt(file.name))) return t("PDF·Word·한글 파일만 올릴 수 있어요.", "Only PDF, Word or HWP files.");
  if (file.size > FILE_MAX_BYTES) return t("10MB 이하 파일로 올려 주세요.", "Please use a file under 10MB.");
  if (file.size === 0) return t("빈 파일이에요. 다른 파일을 골라 주세요.", "This file is empty. Please choose another.");
  return undefined;
}

function validate(f: Fields, t: PlatformT): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (!f.name.trim()) e.name = t("이름을 입력해 주세요.", "Please enter your name.");
  if (!f.email.trim()) e.email = t("연락받을 이메일을 입력해 주세요.", "Please enter an email we can reach you at.");
  else if (!EMAIL_RE.test(f.email.trim())) e.email = t("이메일 형식을 확인해 주세요.", "Please check your email address.");
  if (f.phone.trim() && !/^[+\d][\d\s-]{6,}$/.test(f.phone.trim())) e.phone = t("휴대폰 번호를 확인해 주세요.", "Please check your phone number.");
  if (!f.desiredRole.trim()) e.desiredRole = t("지원하려는 직무를 입력해 주세요.", "Please enter the role you're applying for.");
  if (!f.resume) e.resume = t("이력서 파일을 첨부해 주세요.", "Please attach your resume.");
  else {
    const re = fileError(f.resume, t);
    if (re) e.resume = re;
  }
  const ce = fileError(f.coverLetterFile, t);
  if (ce) e.coverLetterFile = ce;
  if (!f.consultMethod) e.consultMethod = t("상담 방식을 골라 주세요.", "Please choose a consultation method.");
  if (!f.consentPrivacy) e.consentPrivacy = t("개인정보 수집·이용에 동의해야 신청할 수 있어요.", "You need to agree to the privacy terms to apply.");
  return e;
}

const FIELD_ORDER: FieldKey[] = ["name", "email", "phone", "nationality", "desiredRole", "resume", "coverLetterFile", "consultMethod", "consentPrivacy"];

function ApplyForm({
  t,
  tc,
  locale,
  utmRef,
  onDone
}: {
  t: PlatformT;
  tc: (c: Copy) => string;
  locale: string;
  utmRef: React.RefObject<Utm>;
  onDone: () => void;
}) {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  const set = <K extends FieldKey>(k: K, v: Fields[K]) => {
    const next = { ...f, [k]: v };
    setF(next);
    // 한 번 제출을 시도한 뒤엔 고치는 즉시 오류가 사라지게.
    if (tried) setErrors(validate(next, t));
  };

  // 파일은 고르자마자 형식·용량을 확인해 바로 알려 준다(제출 전이어도).
  const setFile = (k: "resume" | "coverLetterFile", file: File | null) => {
    const next = { ...f, [k]: file };
    setF(next);
    if (tried) setErrors(validate(next, t));
    else setErrors((prev) => ({ ...prev, [k]: fileError(file, t) }));
  };

  const submit = async () => {
    if (busy) return;
    setTried(true);
    setNotice(null);
    const errs = validate(f, t);
    setErrors(errs);
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) {
      document.getElementById(`exp-${first}`)?.focus({ preventScroll: true });
      document.getElementById(`exp-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      const token = readAccessToken();
      // 파일 첨부라 multipart(FormData) — Content-Type 은 브라우저가 boundary 와 함께 정한다.
      const body = new FormData();
      const put = (k: string, v: string | undefined) => {
        if (v) body.append(k, v);
      };
      put("name", f.name.trim());
      put("email", f.email.trim().toLowerCase());
      put("phone", f.phone.trim() || undefined);
      put("nationality", f.nationality.trim() || undefined);
      put("desiredRole", f.desiredRole.trim());
      put("consultMethod", f.consultMethod);
      put("consentPrivacy", "true");
      put("consentCaseStudy", f.consentCaseStudy ? "true" : "false");
      for (const [k, v] of Object.entries(utmRef.current ?? {})) put(k, v);
      put("locale", locale);
      if (f.resume) body.append("resume", f.resume, f.resume.name);
      if (f.coverLetterFile) body.append("coverLetterFile", f.coverLetterFile, f.coverLetterFile.name);
      const res = await fetch(`${apiBase()}/public/experience-applications`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body
      });
      if (res.status === 409) {
        trackExperienceCampaign("experience_form_duplicate");
        setNotice({ tone: "info", text: t("이미 신청하셨어요. 선정되면 연락드릴게요.", "You've already applied. We'll contact you if you're selected.") });
        return;
      }
      if (res.status === 429) {
        setNotice({ tone: "error", text: t("잠시 후 다시 시도해 주세요.", "Please try again in a moment.") });
        return;
      }
      if (res.status === 400) {
        // 서버가 파일 문제(형식·용량·누락)를 알려 주면 그 문구를 그대로 보여 준다.
        const data = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
        if (data?.code && data.message) {
          setNotice({ tone: "error", text: data.message });
          return;
        }
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackExperienceCampaign("experience_form_submit", {
        consult_method: f.consultMethod,
        case_study: f.consentCaseStudy,
        has_cover_letter_file: Boolean(f.coverLetterFile),
        utm_source: utmRef.current?.utmSource ?? "(none)"
      });
      onDone();
      requestAnimationFrame(() => scrollToForm());
    } catch {
      setNotice({ tone: "error", text: t("신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.", "We couldn't send your application. Please try again shortly.") });
    } finally {
      setBusy(false);
    }
  };

  const methods: [ConsultMethod, string][] = [
    ["ONLINE", t("온라인", "Online")],
    ["OFFLINE", t("오프라인", "In person")],
    ["ANY", t("상관없음", "Either")]
  ];

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="mx-auto mt-10 flex max-w-[560px] flex-col gap-6 text-left"
    >
      <Field id="exp-name" label={t("이름", "Name")} required error={errors.name}>
        <input id="exp-name" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={80} placeholder={t("이름", "Your name")} className={inputCls(errors.name)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "exp-name-err" : undefined} />
      </Field>

      <Field id="exp-email" label={t("이메일", "Email")} required error={errors.email} hint={t("선정 안내를 이 이메일로 드려요. 정확히 적어 주세요.", "We'll contact you at this address — please double-check it.")}>
        <input id="exp-email" type="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" maxLength={200} placeholder="name@example.com" className={inputCls(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "exp-email-err" : "exp-email-hint"} />
      </Field>

      <Field id="exp-phone" label={t("휴대폰", "Phone")} error={errors.phone}>
        <input id="exp-phone" type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" maxLength={40} placeholder="010-0000-0000" className={inputCls(errors.phone)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "exp-phone-err" : undefined} />
      </Field>

      <Field id="exp-nationality" label={t("국적", "Nationality")}>
        <input id="exp-nationality" list="exp-nationality-list" value={f.nationality} onChange={(e) => set("nationality", e.target.value)} maxLength={80} placeholder={t("예: 베트남", "e.g. Vietnam")} className={inputCls()} />
        <datalist id="exp-nationality-list">
          {NATIONALITY_SUGGESTIONS.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>

      <Field id="exp-desiredRole" label={t("지원 직무", "Role you're applying for")} required error={errors.desiredRole}>
        <input id="exp-desiredRole" value={f.desiredRole} onChange={(e) => set("desiredRole", e.target.value)} maxLength={120} placeholder={t("예: 해외영업, 마케팅, 무역사무", "e.g. Overseas sales, marketing")} className={inputCls(errors.desiredRole)} aria-invalid={Boolean(errors.desiredRole)} aria-describedby={errors.desiredRole ? "exp-desiredRole-err" : undefined} />
      </Field>

      <Field id="exp-resume" label={t("이력서 파일", "Resume file")} required error={errors.resume} hint={t("PDF·Word·한글 파일, 10MB 이하", "PDF, Word or HWP, up to 10MB")}>
        <FilePicker id="exp-resume" t={t} file={f.resume} error={errors.resume} onChange={(file) => setFile("resume", file)} />
      </Field>

      <Field id="exp-coverLetterFile" label={t("자기소개서 파일", "Cover letter file")} error={errors.coverLetterFile} hint={t("있으면 함께 올려 주세요. 없어도 괜찮아요.", "Add it if you have one. It's fine if you don't.")}>
        <FilePicker id="exp-coverLetterFile" t={t} file={f.coverLetterFile} error={errors.coverLetterFile} onChange={(file) => setFile("coverLetterFile", file)} />
      </Field>

      <Field id="exp-consultMethod" label={t("상담 방식", "Consultation method")} required error={errors.consultMethod}>
        <div id="exp-consultMethod" role="radiogroup" tabIndex={-1} aria-describedby={errors.consultMethod ? "exp-consultMethod-err" : undefined} className="grid grid-cols-3 gap-2 outline-none">
          {methods.map(([v, label]) => {
            const on = f.consultMethod === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("consultMethod", v)}
                className={`h-12 rounded-2xl px-1 text-[15px] font-semibold transition ${on ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)] ring-2 ring-[color:var(--v2-accent)]" : "bg-[color:var(--v2-fill)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-band)]"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* 동의 — 개인정보(필수, 펼쳐 보기) · 사례 공개(선택) */}
      <div className="flex flex-col gap-3 rounded-[28px] bg-[color:var(--v2-fill)] p-5">
        <div>
          <CheckRow id="exp-consentPrivacy" checked={f.consentPrivacy} onChange={(v) => set("consentPrivacy", v)} invalid={Boolean(errors.consentPrivacy)}>
            <span className="font-semibold text-[color:var(--v2-ink)]">{t("[필수] 개인정보 수집·이용에 동의합니다.", "[Required] I agree to the collection and use of my personal information.")}</span>
          </CheckRow>
          <details className="group ml-9 mt-1">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[14px] font-medium text-[color:var(--v2-muted)] [&::-webkit-details-marker]:hidden">
              {t("자세히 보기", "Details")}
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <dl className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4 text-[14px] leading-[1.6]">
              {PRIVACY_CONSENT_DETAILS.map((d) => (
                <div key={d.label.ko}>
                  <dt className="font-semibold text-[color:var(--v2-ink-2)]">{tc(d.label)}</dt>
                  <dd className="mt-0.5 text-[color:var(--v2-ink-3)]">{tc(d.value)}</dd>
                </div>
              ))}
            </dl>
          </details>
          {errors.consentPrivacy ? <ErrorText id="exp-consentPrivacy-err">{errors.consentPrivacy}</ErrorText> : null}
        </div>
        <div>
          <CheckRow id="exp-consentCaseStudy" checked={f.consentCaseStudy} onChange={(v) => set("consentCaseStudy", v)}>
            <span className="font-semibold text-[color:var(--v2-ink)]">{t("[선택] 익명 사례 공개에 동의합니다.", "[Optional] I agree to share my case anonymously.")}</span>
          </CheckRow>
          <p className="ml-9 mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{tc(CASE_STUDY_CONSENT)}</p>
        </div>
      </div>

      {notice ? (
        <p role="status" className={`rounded-2xl px-4 py-3.5 text-[15px] font-semibold leading-[1.5] ${notice.tone === "info" ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[#fdf2f3] text-[color:var(--v2-attention)]"}`}>
          {notice.text}
        </p>
      ) : null}

      <div>
        <Button full onClick={() => void submit()} disabled={busy}>
          {busy ? (
            <>
              <Spinner /> {t("보내는 중…", "Sending…")}
            </>
          ) : (
            t("무료 상담 신청하기 →", "Apply for free →")
          )}
        </Button>
        <p className="mt-3 text-center text-[13px] leading-[1.5] text-[color:var(--v2-faint)]">
          {t(`매주 화요일 ${WEEKLY_SLOTS}명을 선정해 개별 연락드려요.`, `Every Tuesday we select ${WEEKLY_SLOTS} people and contact them individually.`)}
        </p>
      </div>
    </form>
  );
}

function inputCls(error?: string) {
  return `h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)] focus:ring-2 ${error ? "ring-2 ring-[color:var(--v2-attention)]" : "ring-[color:var(--v2-accent)]"}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** 파일 고르기 — 회색 둥근 칸 + '파일 선택'. 고르면 이름·크기와 지우기(×). id 는 오류 시 포커스 대상(칸 전체). */
function FilePicker({ id, t, file, error, onChange }: { id: string; t: PlatformT; file: File | null; error?: string; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const describedBy = error ? `${id}-err` : `${id}-hint`;
  return (
    <div
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy}
      className={`flex min-h-[56px] items-center gap-3 rounded-2xl bg-[color:var(--v2-fill)] py-2 pl-4 pr-2 outline-none ${error ? "ring-2 ring-[color:var(--v2-attention)]" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          // 같은 파일을 다시 골라도 onChange 가 오도록 비운다.
          e.target.value = "";
          if (picked) onChange(picked);
        }}
      />
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[color:var(--v2-faint)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
      {file ? (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[color:var(--v2-ink)]">{file.name}</span>
            <span className="block text-[13px] tabular-nums text-[color:var(--v2-muted)]">{formatFileSize(file.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t(`${file.name} 지우기`, `Remove ${file.name}`)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--v2-muted)] transition hover:bg-[color:var(--v2-band)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-[15px] text-[color:var(--v2-faint)]">{t("파일 없음", "No file")}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-10 shrink-0 rounded-full bg-white px-4 text-[14px] font-bold text-[color:var(--v2-accent)] transition hover:opacity-90 active:scale-[0.98]"
          >
            {t("파일 선택", "Choose file")}
          </button>
        </>
      )}
    </div>
  );
}

function Field({ id, label, required, error, hint, right, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; right?: ReactNode; children: ReactNode }) {
  const t = usePlatformT();
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold text-[color:var(--v2-ink-2)]">
          {label}
          {required ? (
            <span className="ml-1 text-[color:var(--v2-accent)]" aria-hidden>*</span>
          ) : (
            <span className="ml-1.5 text-[13px] font-medium text-[color:var(--v2-faint)]">{t("선택", "Optional")}</span>
          )}
        </label>
        {right}
      </div>
      {children}
      {error ? <ErrorText id={`${id}-err`}>{error}</ErrorText> : hint ? <p id={`${id}-hint`} className="mt-2 text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">{hint}</p> : null}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-2 text-[13px] font-semibold leading-[1.5] text-[color:var(--v2-attention)]">
      {children}
    </p>
  );
}

/** 체크 한 줄 — 큰 둥근 체크(누르기 쉬운 크기). */
function CheckRow({ id, checked, onChange, invalid, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; invalid?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[15px] leading-[1.5]">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-invalid={invalid || undefined} />
      <span
        aria-hidden
        className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--v2-accent)] ${checked ? "bg-[color:var(--v2-accent)] text-white" : invalid ? "bg-white text-transparent ring-2 ring-[color:var(--v2-attention)]" : "bg-[color:var(--v2-line)] text-white"}`}
      >
        ✓
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  );
}

/** 접수 완료 — 폼 자리에 다음 단계와 둘러볼 곳. */
function Completion({ t }: { t: PlatformT }) {
  const steps = [
    t("매주 화요일, 신청서를 읽고 2명을 선정해요.", `Every Tuesday we read applications and select ${WEEKLY_SLOTS} people.`),
    t("선정되면 적어 주신 이메일(또는 연락처)로 개별 연락드려요.", "If selected, we'll contact you at the email (or phone) you gave."),
    t("상담 일정과 방식(온라인·오프라인)을 함께 정해요.", "We'll set the time and method (online or in person) together.")
  ];
  return (
    <div className="mx-auto max-w-[560px] text-center">
      <span aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[30px] font-bold text-[color:var(--v2-accent)]">✓</span>
      <p className="mt-5 text-[15px] font-semibold text-[color:var(--v2-accent)]">{t("접수 완료", "Application received")}</p>
      <h2 className="mt-2 whitespace-pre-line text-[30px] font-bold leading-[1.22] tracking-[-0.035em] text-[color:var(--v2-ink)] min-[360px]:text-[32px] md:text-[44px]">
        {t("신청해 주셔서\n고마워요.", "Thanks for\napplying.")}
      </h2>
      <p className="mt-3 text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">
        {t("이번 주에 선정되지 않아도 4주 동안 다음 선정 대상에 자동으로 포함돼요.", "If you're not picked this week, you stay in the running for the next 4 weeks.")}
      </p>
      <ol className="mt-8 flex flex-col gap-3 text-left">
        {steps.map((s, i) => (
          <li key={s} className="flex items-start gap-4 rounded-[28px] bg-[color:var(--v2-fill)] px-5 py-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[color:var(--v2-accent)]">{i + 1}</span>
            <span className="pt-1 text-[16px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)]">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-[28px] bg-[#eef3ff] px-6 py-8">
        <p className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("기다리는 동안 어플라이를 둘러보세요", "Explore Aply while you wait")}</p>
        <p className="mx-auto mt-2 max-w-[380px] text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
          {t("가입하면 이력서·자기소개서를 만들고 외국인 채용 공고에 바로 지원할 수 있어요.", "Sign up to build your resume and cover letter and apply to jobs open to international talent.")}
        </p>
        <div className="mt-6 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:justify-center">
          <Button href="/talent/signup">{t("어플라이 가입하기", "Sign up for Aply")}</Button>
          <Button href="/talent/jobs" variant="white">{t("채용 공고 보기", "Browse jobs")}</Button>
        </div>
      </div>
    </div>
  );
}

/** 자주 묻는 질문 — 회색 띠 위 흰 카드, 눌러서 펼치기. */
function Faq({ t }: { t: PlatformT }) {
  const items: [string, string][] = [
    [
      t("선정은 언제, 어떻게 하나요?", "When and how are people selected?"),
      t(`매주 월요일에 신청서를 검토하고, 화요일에 ${WEEKLY_SLOTS}명을 선정해 개별로 연락드려요. 상담은 그 주 수~금요일에 진행해요.`, `We review applications on Monday and select ${WEEKLY_SLOTS} people on Tuesday, contacting them individually. Consultations run Wednesday to Friday that week.`)
    ],
    [
      t("선정되지 않으면 연락이 오나요?", "Will I hear back if I'm not selected?"),
      t("선정된 분께만 개별 연락드려요. 선정되지 않아도 신청일로부터 4주 동안 다음 주 선정 대상에 자동으로 포함되니 다시 신청하지 않아도 돼요.", "We contact selected applicants only. If you're not selected, you're automatically included in the following weeks' selection for 4 weeks — no need to reapply.")
    ],
    [
      t("상담은 얼마나, 무엇을 해 주나요?", "What does the consultation include?"),
      t(`1인당 ${EXPERT_SCOPE.ko}을 제공해요. 상담 방식(온라인 화상 또는 오프라인)과 시간은 선정 후 함께 정해요.`, `Each person gets ${EXPERT_SCOPE.en.charAt(0).toLowerCase()}${EXPERT_SCOPE.en.slice(1)}. We'll agree on the method (video call or in person) and time after selection.`)
    ],
    [
      t("기존 자기소개서가 없어도 되나요?", "Do I need an existing cover letter?"),
      t("네, 이력서만 있어도 돼요. 전문가가 이력서 속 경험을 찾아 자소서 문장으로 바꿔 드려요.", "No — your resume is enough. The expert will find the experiences in it and turn them into cover letter sentences.")
    ],
    [
      t("사례 공개 동의는 꼭 해야 하나요?", "Do I have to agree to share my case?"),
      t("아니요, 선택이에요. 동의한 분의 사례만 이름 등 개인을 알 수 없게 가려 Before/After로 공개하고, 언제든 철회할 수 있어요. 동의하지 않아도 선정에 영향은 없어요.", "No, it's optional. Only cases with consent are shared, anonymized, as before/after examples, and you can withdraw anytime. It doesn't affect selection.")
    ],
    [
      t("외국인도 신청할 수 있나요?", "Can international students apply?"),
      t("네. 한국 취업을 준비하는 외국인 유학생과 구직자를 위한 캠페인이에요.", "Yes. This campaign is for international students and job seekers preparing to work in Korea.")
    ]
  ];
  return (
    <section className="px-4 py-14 md:px-8">
      <Headline eyebrow="FAQ" title={t("자주 묻는 질문", "Questions")} />
      <div className="mx-auto mt-8 flex max-w-[640px] flex-col gap-2">
        {items.map(([q, a]) => (
          <details key={q} className="group rounded-2xl bg-white px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[16px] font-semibold text-[color:var(--v2-ink)] [&::-webkit-details-marker]:hidden">
              {q}
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[color:var(--v2-faint)] transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-5 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
