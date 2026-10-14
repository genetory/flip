"use client";

// "내 경험이 스펙이 되는 순간" — 어플라이 자소서 경험 발굴 캠페인(/experience). 로그인 없이 신청.
// v2 광고 페이지 결(V2InterviewsGuest): 가운데 정렬 · 아주 큰 제목 · 흰/회색(#f5f5f7) 띠가 번갈아 · 흰 타일 + 곱하기 합성 그림.
// 히어로 → 이런 고민 → Before/After(예시) → 컨설팅 안내 → 신청 폼(완료 화면으로 바뀜) → 자주 묻는 질문 → 마지막 권유,
// 휴대폰은 아래 고정 신청 버튼(폼이 보이면 숨김).
// 문구·제공 범위·보관 기간·예시는 lib/experience-campaign.ts 에서 바꾼다. 이 캠페인은 '무료'를 써도 된다(전액 무료 행사).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { V2Shell } from "../v2/V2Shell";
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
const EXPERIENCE_MIN = 30;
const EXPERIENCE_MAX = 4000;
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

  const offers = [
    {
      img: "/img_process_1.webp",
      eyebrow: t("전문가 1:1", "1:1 with an expert"),
      title: t(`매주 단 ${WEEKLY_SLOTS}명`, `Only ${WEEKLY_SLOTS} people a week`),
      desc: t(`어플라이 자소서 전문가가 직접 상담하고 첨삭해요. (${EXPERT_SCOPE.ko})`, `An Aply cover letter expert consults and edits with you. (${EXPERT_SCOPE.en})`)
    },
    {
      img: "/img_process_2.webp",
      eyebrow: t("상담 방식", "How we meet"),
      title: t("온라인 또는\n오프라인", "Online or\nin person"),
      desc: t("화상 상담도, 만나서 하는 상담도 돼요. 선정 후 편한 방식으로 맞춰요.", "Video call or face to face — we'll arrange what works for you after selection.")
    },
    {
      img: "/img_process_3.webp",
      eyebrow: t("비용", "Cost"),
      title: t("100% 무료", "100% free"),
      desc: t("상담부터 약속한 첨삭 결과물까지 비용이 전혀 없어요.", "From the consultation to the promised edits — completely free.")
    }
  ];

  return (
    <V2Shell>
      <Page>
        {/* ① 히어로 — 흰 바탕, 가운데 정렬, 아주 큰 제목 하나 */}
        <section className="px-5 pb-12 pt-12 text-center md:pt-20">
          <p className="text-[14px] font-bold tracking-[0.08em] text-[color:var(--v2-accent)]">APLY CAREER PROJECT</p>
          <h1 className="mt-3 whitespace-pre-line text-[32px] font-bold leading-[1.2] tracking-[-0.04em] text-[color:var(--v2-ink)] min-[360px]:text-[38px] md:text-[60px]">
            {t("당신의 경험이\n자소서가 됩니다.", "Your experience\nbecomes your\ncover letter.")}
          </h1>
          <p className="mx-auto mt-4 max-w-[440px] text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)] md:text-[20px]">
            {t("한국식 자기소개서가 어렵다면? 어플라이 자소서 전문가가 직접 도와드립니다.", "Korean-style cover letters feel hard? An Aply cover letter expert will help you in person.")}
          </p>
          <div className="mt-7 flex justify-center">
            <PillButton onClick={cta("hero")}>{t("무료 자소서 상담 신청하기 →", "Apply for a free consultation →")}</PillButton>
          </div>
          <p className="mt-4 text-[14px] text-[color:var(--v2-muted)]">
            {t(`매주 ${WEEKLY_SLOTS}명 선정 · 전문가 1:1 · 100% 무료`, `${WEEKLY_SLOTS} people a week · 1:1 expert · 100% free`)}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- 히어로 그림(흰 바탕 → 곱하기 합성) */}
          <img src="/img_coverletter.webp" alt="" aria-hidden className="mx-auto mt-8 h-[220px] w-full max-w-[340px] object-contain mix-blend-multiply md:h-[320px] md:max-w-[480px]" />
          <p className="mx-auto mt-6 max-w-[420px] text-[20px] font-bold leading-[1.45] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[24px]">
            {t("별거 아닌 경험은 없어요.", "No experience is too small.")}
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {t("편의점 알바도, 동아리 활동도 취업 스펙이 될 수 있습니다.", "A convenience store job or a student club can become a real qualification.")}
          </p>
        </section>

        {/* ② 이런 고민 — 회색 띠 위 흰 타일, 따옴표 문장 */}
        <section className="bg-[#f5f5f7] px-4 py-14 md:mx-5 md:rounded-[36px] md:px-8">
          <Headline eyebrow={t("이런 고민 있나요?", "Sound familiar?")} title={t("혼자 쓰기\n막막했다면.", "Stuck writing\nit alone?")} />
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {worries.map((w) => (
              <figure key={w} className="rounded-[28px] bg-white px-6 py-6">
                <span aria-hidden className="block text-[36px] font-bold leading-none text-[color:var(--v2-accent)]">&ldquo;</span>
                <blockquote className="mt-1 text-[18px] font-semibold leading-[1.5] tracking-[-0.02em] text-[color:var(--v2-ink)]">{w}</blockquote>
              </figure>
            ))}
          </div>
          <p className="mt-8 text-center text-[17px] font-semibold text-[color:var(--v2-ink-2)]">
            {t("그 경험, 전문가와 함께 자소서로 바꿔 봐요.", "Let's turn that experience into a cover letter — with an expert.")}
          </p>
        </section>

        {/* ③ Before / After — 예시(실제 사례로 교체 예정) */}
        <BeforeAfter t={t} />

        {/* ④ 컨설팅 안내 — 회색 띠 위 흰 타일 셋 + 주간 진행 */}
        <section className="bg-[#f5f5f7] px-4 py-14 md:mx-5 md:rounded-[36px] md:px-8">
          <Headline eyebrow={t("컨설팅 안내", "About the consultation")} title={t("전문가가\n직접 봐 드려요.", "An expert,\nwith you.")} />
          <div className="mt-10 flex flex-col gap-4">
            {offers.map((o) => (
              <article key={o.img} className="overflow-hidden rounded-[28px] bg-white px-6 pb-2 pt-9 text-center">
                <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{o.eyebrow}</p>
                <h3 className="mt-2 whitespace-pre-line text-[28px] font-bold leading-[1.22] tracking-[-0.03em] text-[color:var(--v2-ink)] md:text-[36px]">{o.title}</h3>
                <p className="mx-auto mt-3 max-w-[400px] text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">{o.desc}</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- 타일 그림(흰 바탕 → 곱하기 합성) */}
                <img src={o.img} alt="" aria-hidden className="mx-auto mt-4 h-[180px] w-full max-w-[260px] object-contain mix-blend-multiply" />
              </article>
            ))}
          </div>
          {/* 주간 진행 — 월 검토 · 화 선정·연락 · 수~금 상담 */}
          <div className="mt-4 rounded-[28px] bg-white px-6 py-7">
            <p className="text-center text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("매주 이렇게 진행돼요", "How each week works")}</p>
            <ol className="mx-auto mt-5 flex max-w-[420px] flex-col gap-4">
              {[
                [t("월", "Mon"), t("신청서 검토", "We review applications")],
                [t("화", "Tue"), t(`${WEEKLY_SLOTS}명 선정 · 개별 연락`, `${WEEKLY_SLOTS} selected · contacted`)],
                [t("수~금", "Wed–Fri"), t("1:1 상담 · 자소서 첨삭", "1:1 consultation & editing")]
              ].map(([day, what]) => (
                <li key={day} className="flex items-center gap-4">
                  <span className="flex h-12 min-w-[64px] items-center justify-center rounded-2xl bg-[color:var(--v2-accent-weak)] px-2 text-[15px] font-bold text-[color:var(--v2-accent)]">{day}</span>
                  <span className="text-[16px] font-semibold text-[color:var(--v2-ink-2)]">{what}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑤ 신청 폼 — 접수되면 이 자리가 완료 화면으로 바뀐다 */}
        <section id={FORM_ID} ref={formRef} className="scroll-mt-20 px-5 py-16">
          {submitted ? (
            <Completion t={t} />
          ) : (
            <>
              <Headline eyebrow={t("신청하기", "Apply")} title={t("내 경험,\n들려주세요.", "Tell us about\nyour experience.")} sub={t("작성은 3분이면 충분해요.", "It only takes about 3 minutes.")} />
              <ApplyForm t={t} tc={tc} locale={locale} utmRef={utmRef} onDone={() => setSubmitted(true)} />
            </>
          )}
        </section>

        {/* ⑥ 자주 묻는 질문 */}
        <Faq t={t} />

        {/* ⑦ 마지막 — 흰 바탕 가운데, 큰 제목과 버튼 하나 */}
        {!submitted ? (
          <section className="px-5 pb-8 pt-16 text-center">
            <h2 className="whitespace-pre-line text-[30px] font-bold leading-[1.22] tracking-[-0.04em] text-[color:var(--v2-ink)] min-[360px]:text-[34px] md:text-[48px]">
              {t("별거 아닌 경험은\n없어요.", "No experience\nis too small.")}
            </h2>
            <p className="mt-3 text-[17px] text-[color:var(--v2-ink-3)]">{t("이번 주 선정, 지금 신청하세요.", "Apply now for this week's selection.")}</p>
            <div className="mt-7 flex justify-center">
              <PillButton onClick={cta("footer")}>{t("무료 자소서 상담 신청하기 →", "Apply for a free consultation →")}</PillButton>
            </div>
          </section>
        ) : null}

        {/* 고정 버튼에 마지막 내용이 가리지 않게 */}
        <div aria-hidden className="h-20 md:hidden" />

        {/* 휴대폰 아래 고정 신청 버튼 — 폼이 보이는 동안·접수 후엔 숨긴다 */}
        {showSticky ? (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-white/90 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
            <button type="button" onClick={cta("sticky")} className="flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--v2-accent)] text-[16px] font-semibold text-white">
              {t("무료 자소서 상담 신청하기 →", "Apply for a free consultation →")}
            </button>
          </div>
        ) : null}
      </Page>
    </V2Shell>
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

/** 둥근 알약 버튼 — 광고 페이지의 주 행동(여기선 폼으로 스크롤). */
function PillButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-12 max-w-full items-center justify-center rounded-full bg-[color:var(--v2-accent)] px-6 text-[16px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98] min-[360px]:px-7 min-[360px]:text-[17px]">
      {children}
    </button>
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
        <span className="inline-flex rounded-full bg-[color:var(--v2-band)] px-3 py-1 text-[13px] font-semibold text-[color:var(--v2-muted)]">
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
      <div className="mx-auto mt-6 max-w-[560px] rounded-[28px] bg-[color:var(--v2-band)] p-3 min-[360px]:p-4">
        <div className="rounded-3xl bg-white p-5">
          <p className="text-[13px] font-bold tracking-[0.04em] text-[color:var(--v2-faint)]">BEFORE</p>
          <p className="mt-2 text-[17px] leading-[1.6] text-[color:var(--v2-muted)]">{t(ex.before.ko, ex.before.en)}</p>
        </div>
        <div aria-hidden className="flex justify-center py-2 text-[20px] font-bold text-[color:var(--v2-accent)]">↓</div>
        <div className="rounded-3xl bg-[color:var(--v2-accent-weak)] p-5">
          <p className="text-[13px] font-bold tracking-[0.04em] text-[color:var(--v2-accent)]">AFTER</p>
          <p className="mt-2 text-[18px] font-semibold leading-[1.6] text-[color:var(--v2-ink)]">{t(ex.after.ko, ex.after.en)}</p>
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
  experience: string;
  coverLetter: string;
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
  experience: "",
  coverLetter: "",
  consultMethod: "",
  consentPrivacy: false,
  consentCaseStudy: false
};

// 연락이 닿는 이메일이 꼭 있어야 한다 — 형식만 보되 흔한 오타(공백·@ 두 개·TLD 없음)는 걸러낸다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NATIONALITY_SUGGESTIONS = ["베트남", "중국", "우즈베키스탄", "몽골", "인도네시아", "일본", "네팔", "미국", "필리핀", "태국"];

function validate(f: Fields, t: PlatformT): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (!f.name.trim()) e.name = t("이름을 입력해 주세요.", "Please enter your name.");
  if (!f.email.trim()) e.email = t("연락받을 이메일을 입력해 주세요.", "Please enter an email we can reach you at.");
  else if (!EMAIL_RE.test(f.email.trim())) e.email = t("이메일 형식을 확인해 주세요.", "Please check your email address.");
  if (f.phone.trim() && !/^[+\d][\d\s-]{6,}$/.test(f.phone.trim())) e.phone = t("휴대폰 번호를 확인해 주세요.", "Please check your phone number.");
  if (!f.desiredRole.trim()) e.desiredRole = t("지원하려는 직무를 입력해 주세요.", "Please enter the role you're applying for.");
  const expLen = f.experience.trim().length;
  if (expLen === 0) e.experience = t("경험을 소개해 주세요.", "Please tell us about your experience.");
  else if (expLen < EXPERIENCE_MIN) e.experience = t(`조금만 더 써 주세요. (${EXPERIENCE_MIN}자 이상)`, `Please write a bit more (${EXPERIENCE_MIN}+ characters).`);
  if (!f.consultMethod) e.consultMethod = t("상담 방식을 골라 주세요.", "Please choose a consultation method.");
  if (!f.consentPrivacy) e.consentPrivacy = t("개인정보 수집·이용에 동의해야 신청할 수 있어요.", "You need to agree to the privacy terms to apply.");
  return e;
}

const FIELD_ORDER: FieldKey[] = ["name", "email", "phone", "nationality", "desiredRole", "experience", "coverLetter", "consultMethod", "consentPrivacy"];

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
      const res = await fetch(`${apiBase()}/public/experience-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: f.name.trim(),
          email: f.email.trim().toLowerCase(),
          phone: f.phone.trim() || undefined,
          nationality: f.nationality.trim() || undefined,
          desiredRole: f.desiredRole.trim(),
          experience: f.experience.trim(),
          coverLetter: f.coverLetter.trim() || undefined,
          consultMethod: f.consultMethod,
          consentPrivacy: true,
          consentCaseStudy: f.consentCaseStudy,
          ...utmRef.current,
          locale
        })
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackExperienceCampaign("experience_form_submit", {
        consult_method: f.consultMethod,
        case_study: f.consentCaseStudy,
        has_cover_letter: Boolean(f.coverLetter.trim()),
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

  const expLen = f.experience.trim().length;
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

      <Field
        id="exp-experience"
        label={t("경험 소개", "Your experience")}
        required
        error={errors.experience}
        hint={t("아르바이트, 동아리, 봉사, 수업 프로젝트 등 무엇이든 좋아요. 언제, 무엇을, 어떻게 했는지 편하게 적어 주세요.", "Part-time jobs, clubs, volunteering, class projects — anything. Tell us when, what and how.")}
        right={
          <span className={`text-[13px] tabular-nums ${expLen > 0 && expLen < EXPERIENCE_MIN ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`}>
            {expLen}
            {t("자", " chars")} / {t(`최소 ${EXPERIENCE_MIN}자`, `min ${EXPERIENCE_MIN}`)}
          </span>
        }
      >
        <textarea id="exp-experience" value={f.experience} onChange={(e) => set("experience", e.target.value)} rows={6} maxLength={EXPERIENCE_MAX} placeholder={t("예: 편의점에서 2년 동안 일하면서 주말 발주를 맡았어요. 잘 팔리는 시간대를 기록해서…", "e.g. I worked at a convenience store for 2 years and handled weekend orders. I tracked busy hours and…")} className={`${inputCls(errors.experience)} h-auto resize-none py-3.5 leading-[1.65]`} aria-invalid={Boolean(errors.experience)} aria-describedby={errors.experience ? "exp-experience-err" : "exp-experience-hint"} />
      </Field>

      <Field id="exp-coverLetter" label={t("기존 자기소개서", "Existing cover letter")} hint={t("있으면 붙여 넣어 주세요. 없어도 괜찮아요.", "Paste it here if you have one. It's fine if you don't.")}>
        <textarea id="exp-coverLetter" value={f.coverLetter} onChange={(e) => set("coverLetter", e.target.value)} rows={4} maxLength={8000} className={`${inputCls()} h-auto resize-none py-3.5 leading-[1.65]`} aria-describedby="exp-coverLetter-hint" />
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
      <div className="mt-10 rounded-[28px] bg-[#f5f5f7] px-6 py-8">
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
      t("네. 경험만 있으면 충분해요. 전문가와 함께 경험을 찾고 자소서 문장으로 바꿔 드려요.", "No. Your experience is enough — the expert will help you find it and turn it into cover letter sentences.")
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
    <section className="bg-[#f5f5f7] px-4 py-14 md:mx-5 md:rounded-[36px] md:px-8">
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
