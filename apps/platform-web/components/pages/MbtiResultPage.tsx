"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { JOB_ROLE_TAXONOMY } from "../../lib/saju-taxonomy";

// Same visa enum + labels as the Saju lead form so MBTI captures the same
// shape of profile info. Korean copy only — MBTI lands in Korean.
const VISA_VALUES: Array<{ value: string; code: string; desc: string }> = [
  { value: "D10_JOB_SEEKING", code: "D-10", desc: "구직" },
  { value: "D2_STUDENT", code: "D-2", desc: "유학" },
  { value: "D4_GENERAL_TRAINING", code: "D-4", desc: "일반연수" },
  { value: "F2_RESIDENCE", code: "F-2", desc: "거주" },
  { value: "F4_OVERSEAS_KOREAN", code: "F-4", desc: "재외동포" },
  { value: "F5_PERMANENT_RESIDENCE", code: "F-5", desc: "영주" },
  { value: "F6_MARRIAGE_IMMIGRATION", code: "F-6", desc: "결혼이민" },
  { value: "E7_SPECIFIC_ACTIVITY", code: "E-7", desc: "특정활동" },
  { value: "H1_WORKING_HOLIDAY", code: "H-1", desc: "워킹홀리데이" }
];

type LangLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
type ContactType = "EMAIL" | "KAKAO" | "WHATSAPP" | "PHONE";

const LANG_LEVELS: Array<{ value: LangLevel; label: string }> = [
  { value: "BEGINNER", label: "초급" },
  { value: "INTERMEDIATE", label: "중급" },
  { value: "ADVANCED", label: "고급" },
  { value: "NATIVE", label: "원어민" }
];

const CONTACT_TYPES: Array<{ value: ContactType; label: string }> = [
  { value: "EMAIL", label: "이메일" },
  { value: "KAKAO", label: "카카오톡" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PHONE", label: "전화" }
];

// ---------------------------------------------------------------------------
// MBTI result page — three-tier reveal, matching the Saju lead-capture flow:
//
//   Tier 1 (anonymous, immediate):
//     - Hero (MBTI type + culture summary)
//     - 한 줄 해석
//     - 어울리는 직무 chips
//
//   Tier 2 (after the visitor fills a short profile form):
//     - 강점, 한국 직장 주의점, 회사 규모/팀 분위기, 면접 팁
//     - K-pop 유명인, 시너지 좋은 MBTI
//
//   Tier 3 (after signup/login):
//     - 잘 맞는 / 피하면 좋은 회사 시그널
//     - 매칭 채용 공고 + 사유
//
// Tier 2 gating is purely client-side for now — we set `revealMore` after
// the profile form is submitted, no backend persistence. (A future server
// endpoint can attach the profile to the MbtiPrediction row if we want to
// reuse it for matching.)
// ---------------------------------------------------------------------------

type Prediction = {
  id: string;
  mbtiType: string;
  name: string | null;
  nationality: string | null;
  recommendedRoleNames: string[];
  cultureSummary: string;
  interpretation: string;
  strengths: string[];
  koreanWorkplaceChallenges: string[];
  companySizeFit: string;
  teamVibe: string;
  interviewTips: string[];
  famousKoreans: string[];
  goodMatchMbtis: { type: string; reason: string }[];
  greenFlags: string[];
  redFlags: string[];
  shareSlug: string;
  locale: string;
  createdAt: string;
};

type Position = {
  id: string;
  title: string;
  preferredJobRole: string | null;
  partnerOrganization: { id: string; name: string } | null;
  matchReason: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  SOFTWARE_DEVELOPMENT: "소프트웨어 개발",
  FRONTEND_DEVELOPMENT: "프런트엔드 개발",
  BACKEND_DEVELOPMENT: "백엔드 개발",
  DATA_ANALYSIS_SCIENCE: "데이터 분석·사이언스",
  UI_UX_DESIGN: "UI/UX 디자인",
  PRODUCT_MANAGER: "PM·기획",
  MARKETING: "마케팅",
  SALES: "영업·BD",
  HR: "HR·People Ops",
  FINANCE_ACCOUNTING: "재무·회계",
  OPERATIONS_PLANNING: "운영·기획",
  OTHER: "기타"
};


export function MbtiResultPage({ slug }: { slug: string }) {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const { user } = useAuthSession();
  const isAuthenticated = Boolean(user);

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tier 2 gate — profile form (same fields as Saju lead capture)
  const [formOpen, setFormOpen] = useState(false);
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [nationality, setNationality] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [visaType, setVisaType] = useState("");
  const [koreanLevel, setKoreanLevel] = useState<LangLevel | "">("");
  const [englishLevel, setEnglishLevel] = useState<LangLevel | "">("");
  const [preferredJobRole, setPreferredJobRole] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<ContactType>("EMAIL");
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [consentCareer, setConsentCareer] = useState(false);
  const [consentRecommend, setConsentRecommend] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tier 2 unlocks via either: (a) form just submitted, or (b) authenticated.
  // Tier 3 unlocks via (b) only.
  const revealMore = profileSubmitted || isAuthenticated;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${apiBase}/mbti/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("결과를 찾을 수 없습니다.");
        const payload = (await response.json()) as { ok?: boolean; prediction?: Prediction; positions?: Position[] };
        if (cancelled) return;
        if (!payload.ok || !payload.prediction) throw new Error("결과를 찾을 수 없습니다.");
        setPrediction(payload.prediction);
        setPositions(payload.positions ?? []);
        // If the original quiz had a nationality stored, pre-fill so the
        // form is one less field for the visitor.
        if (payload.prediction.nationality) setNationality(payload.prediction.nationality);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "결과를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, slug]);

  function copyShareLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/mbti/result/${slug}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleProfileSubmit() {
    setFormError(null);
    // Match Saju's required fields: nationality, preferredJobRole, contact
    // and consentCareer must be present.
    if (!nationality.trim() || !preferredJobRole || !contact.trim()) {
      setFormError("필수 항목을 모두 입력해 주세요.");
      return;
    }
    if (!consentCareer) {
      setFormError("커리어 추천 정보 수집에 동의해 주세요.");
      return;
    }
    // Client-side gate only for now. (Future: POST to /mbti/profile to
    // attach this lead to the MbtiPrediction row for matching.)
    setProfileSubmitted(true);
    setFormOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const nextParam = typeof window !== "undefined"
    ? encodeURIComponent(`/events/mbti/result/${slug}`)
    : encodeURIComponent(`/events/mbti/result/${slug}`);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
        <main className="flex-1 px-4 py-5">
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground">결과를 불러오는 중...</p>
            ) : error ? (
              <p className="text-center text-sm text-destructive">{error}</p>
            ) : prediction ? (
              <>
                {/* ========================================================
                    Tier 1 — anonymous, immediate
                    ====================================================== */}

                {/* Hero card */}
                <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-white to-white p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Aply × MBTI</p>
                  {prediction.name ? (
                    <p className="mt-2 text-sm text-muted-foreground">{prediction.name}의 결과</p>
                  ) : null}
                  <p className="mt-3 font-display text-5xl font-black tracking-tight">
                    {prediction.mbtiType}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {prediction.cultureSummary}
                  </p>
                </section>

                {/* Interpretation */}
                <section className="rounded-2xl bg-white p-5">
                  <h2 className="text-sm font-semibold text-muted-foreground">한 줄 해석</h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
                    {prediction.interpretation}
                  </p>
                </section>

                {/* Recommended role categories (chips) */}
                <section className="rounded-2xl bg-white p-5">
                  <h2 className="text-sm font-semibold text-muted-foreground">어울리는 직무</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {prediction.recommendedRoleNames.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {ROLE_LABEL[code] ?? code}
                      </span>
                    ))}
                  </div>
                </section>

                {/* ========================================================
                    Gate #1 — profile form
                    ====================================================== */}

                {!revealMore && !formOpen ? (
                  <LockedTeaser
                    title="🔒 프로필 입력하면 더 자세한 결과가 열려요"
                    items={[
                      `💪 ${prediction.mbtiType}의 강점`,
                      "🏢 어울리는 회사 규모 & 팀 분위기",
                      "🎯 한국 면접 팁",
                      `🎤 같은 ${prediction.mbtiType} K-pop 아이돌`,
                      "🤝 시너지 좋은 동료 MBTI"
                    ]}
                    ctaLabel="프로필 입력하고 결과 더 보기"
                    onCta={() => setFormOpen(true)}
                  />
                ) : null}

                {!revealMore && formOpen ? (
                  <ProfileForm
                    nationality={nationality}
                    school={school}
                    major={major}
                    visaType={visaType}
                    koreanLevel={koreanLevel}
                    englishLevel={englishLevel}
                    preferredJobRole={preferredJobRole}
                    contact={contact}
                    contactType={contactType}
                    hasResume={hasResume}
                    consentCareer={consentCareer}
                    consentRecommend={consentRecommend}
                    consentContact={consentContact}
                    error={formError}
                    onChangeNationality={setNationality}
                    onChangeSchool={setSchool}
                    onChangeMajor={setMajor}
                    onChangeVisa={setVisaType}
                    onChangeKorean={setKoreanLevel}
                    onChangeEnglish={setEnglishLevel}
                    onChangeJobRole={setPreferredJobRole}
                    onChangeContact={setContact}
                    onChangeContactType={setContactType}
                    onChangeHasResume={setHasResume}
                    onChangeConsentCareer={setConsentCareer}
                    onChangeConsentRecommend={setConsentRecommend}
                    onChangeConsentContact={setConsentContact}
                    onSubmit={handleProfileSubmit}
                    onBack={() => setFormOpen(false)}
                  />
                ) : null}

                {/* ========================================================
                    Tier 2 — after profile (or if logged in)
                    ====================================================== */}

                {revealMore && prediction.strengths.length > 0 ? (
                  <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      💪 {prediction.mbtiType}의 강점
                    </h2>
                    <ul className="mt-3 space-y-2 text-[14px] text-foreground">
                      {prediction.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {revealMore && prediction.koreanWorkplaceChallenges.length > 0 ? (
                  <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      ⚠️ 한국 직장에서 주의할 점
                    </h2>
                    <ul className="mt-3 space-y-2 text-[14px] text-foreground">
                      {prediction.koreanWorkplaceChallenges.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {revealMore && (prediction.companySizeFit || prediction.teamVibe) ? (
                  <section className="grid grid-cols-1 gap-3">
                    {prediction.companySizeFit ? (
                      <div className="rounded-2xl bg-white p-5">
                        <h2 className="text-xs font-semibold text-muted-foreground">🏢 어울리는 회사 규모</h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{prediction.companySizeFit}</p>
                      </div>
                    ) : null}
                    {prediction.teamVibe ? (
                      <div className="rounded-2xl bg-white p-5">
                        <h2 className="text-xs font-semibold text-muted-foreground">🌱 어울리는 팀 분위기</h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{prediction.teamVibe}</p>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {revealMore && prediction.interviewTips.length > 0 ? (
                  <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      🎯 {prediction.mbtiType}을 위한 한국 면접 팁
                    </h2>
                    <ul className="mt-3 space-y-2 text-[14px] text-foreground">
                      {prediction.interviewTips.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary mt-1 font-semibold">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {revealMore && prediction.famousKoreans.length > 0 ? (
                  <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      🎤 같은 {prediction.mbtiType} K-pop 아이돌
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {prediction.famousKoreans.map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold text-foreground"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      ※ 인터넷·공개 인터뷰에서 회자되는 정보 기준이며, 실제 검사 결과는 아닙니다.
                    </p>
                  </section>
                ) : null}

                {revealMore && prediction.goodMatchMbtis.length > 0 ? (
                  <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      🤝 함께 일하면 시너지가 좋은 MBTI
                    </h2>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {prediction.goodMatchMbtis.map((m) => (
                        <div
                          key={m.type}
                          className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3"
                        >
                          <p className="font-display text-base font-black tracking-tight text-primary">
                            {m.type}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-foreground">
                            {m.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* ========================================================
                    Gate #2 — signup CTA
                    ====================================================== */}

                {revealMore && !isAuthenticated ? (
                  <SignupGate apiBase={apiBase} nextParam={nextParam} />
                ) : null}

                {/* ========================================================
                    Tier 3 — authenticated only
                    ====================================================== */}

                {isAuthenticated && (prediction.greenFlags.length > 0 || prediction.redFlags.length > 0) ? (
                  <section className="grid grid-cols-1 gap-3">
                    {prediction.greenFlags.length > 0 ? (
                      <div className="rounded-2xl bg-white p-5">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                          ✅ 잘 맞는 회사 시그널
                        </h2>
                        <ul className="mt-3 space-y-2 text-[14px] text-foreground">
                          {prediction.greenFlags.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-emerald-600 mt-1">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {prediction.redFlags.length > 0 ? (
                      <div className="rounded-2xl bg-white p-5">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                          🚩 피하면 좋은 회사 시그널
                        </h2>
                        <ul className="mt-3 space-y-2 text-[14px] text-foreground">
                          {prediction.redFlags.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-rose-500 mt-1">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {isAuthenticated ? (
                  <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      {prediction.mbtiType}에게 추천하는 채용 공고
                    </h2>
                    {positions.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        현재 매칭되는 채용 공고가 없어요. 새 공고가 올라오면 자동으로 알려드립니다.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {positions.map((p) => (
                          <Link
                            key={p.id}
                            href={`/positions/${p.id}`}
                            className="block rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {p.partnerOrganization?.name ?? "파트너 기업"}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-foreground">{p.title}</p>
                            {p.preferredJobRole ? (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {ROLE_LABEL[p.preferredJobRole] ?? p.preferredJobRole}
                              </p>
                            ) : null}
                            {p.matchReason ? (
                              <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary">
                                ✨ {p.matchReason}
                              </p>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {/* ========================================================
                    Bottom controls — always visible
                    ====================================================== */}

                <section className="rounded-2xl bg-white p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="h-11 rounded-xl border border-border/60 bg-white text-sm font-semibold"
                    >
                      {copied ? "복사됨!" : "결과 링크 복사"}
                    </button>
                    <Link
                      href="/events/mbti"
                      className="h-11 flex items-center justify-center rounded-xl border border-border/60 bg-white text-sm font-semibold"
                    >
                      다시 하기
                    </Link>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LockedTeaser({
  title,
  items,
  ctaLabel,
  onCta
}: {
  title: string;
  items: string[];
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <section className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/5 to-white p-6">
      <p className="text-center text-[15px] font-bold text-foreground">{title}</p>
      <ul className="mt-4 space-y-2">
        {items.map((label) => (
          <li
            key={label}
            className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3.5 py-2.5 text-[13px] text-muted-foreground"
          >
            <span className="text-base">🔒</span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        {ctaLabel} →
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        가입 없이 1분이면 가능해요
      </p>
    </section>
  );
}

// Light-themed parity copy of SajuCareerForm fields. Same shape, same
// required set (nationality / preferredJobRole / contact / consentCareer),
// same optional enrichers (school, major, visa, langs, hasResume, extra
// consents) — only the visual theme matches the MBTI page.
function ProfileForm(props: {
  nationality: string;
  school: string;
  major: string;
  visaType: string;
  koreanLevel: LangLevel | "";
  englishLevel: LangLevel | "";
  preferredJobRole: string;
  contact: string;
  contactType: ContactType;
  hasResume: boolean | null;
  consentCareer: boolean;
  consentRecommend: boolean;
  consentContact: boolean;
  error: string | null;
  onChangeNationality: (v: string) => void;
  onChangeSchool: (v: string) => void;
  onChangeMajor: (v: string) => void;
  onChangeVisa: (v: string) => void;
  onChangeKorean: (v: LangLevel | "") => void;
  onChangeEnglish: (v: LangLevel | "") => void;
  onChangeJobRole: (v: string) => void;
  onChangeContact: (v: string) => void;
  onChangeContactType: (v: ContactType) => void;
  onChangeHasResume: (v: boolean | null) => void;
  onChangeConsentCareer: (v: boolean) => void;
  onChangeConsentRecommend: (v: boolean) => void;
  onChangeConsentContact: (v: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const inputCls =
    "h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const selectCls =
    "h-11 w-full appearance-none rounded-xl border-0 bg-muted/40 px-3 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section className="rounded-3xl border border-primary/25 bg-white p-5">
      <p className="text-[15px] font-bold text-foreground">실제 내 이력으로 추천 가능성 확인하기</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        국적·전공·비자·언어 조건만 입력하면 한국 기업 매칭 가능성을 바로 확인해드려요.
      </p>

      <div className="mt-5 space-y-4">
        {/* Nationality (required) */}
        <div className="space-y-1.5">
          <FieldLabel required>국적</FieldLabel>
          <input
            value={props.nationality}
            onChange={(e) => props.onChangeNationality(e.target.value)}
            placeholder="예: 베트남"
            maxLength={80}
            className={inputCls}
          />
        </div>

        {/* Preferred job role (required) */}
        <div className="space-y-1.5">
          <FieldLabel required>희망 직무</FieldLabel>
          <div className="relative">
            <select
              value={props.preferredJobRole}
              onChange={(e) => props.onChangeJobRole(e.target.value)}
              className={selectCls}
            >
              <option value="" disabled>선택해 주세요</option>
              {JOB_ROLE_TAXONOMY.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
          </div>
        </div>

        {/* School (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>학교 <OptionalTag /></FieldLabel>
          <input
            value={props.school}
            onChange={(e) => props.onChangeSchool(e.target.value)}
            placeholder="예: 서울대학교"
            maxLength={120}
            className={inputCls}
          />
        </div>

        {/* Major (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>전공 <OptionalTag /></FieldLabel>
          <input
            value={props.major}
            onChange={(e) => props.onChangeMajor(e.target.value)}
            placeholder="예: 컴퓨터공학"
            maxLength={120}
            className={inputCls}
          />
        </div>

        {/* Visa (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>현재 비자 <OptionalTag /></FieldLabel>
          <div className="relative">
            <select
              value={props.visaType}
              onChange={(e) => props.onChangeVisa(e.target.value)}
              className={selectCls}
            >
              <option value="">선택해 주세요</option>
              {VISA_VALUES.map((v) => (
                <option key={v.value} value={v.value}>{v.code} ({v.desc})</option>
              ))}
              <option value="OTHER">기타</option>
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
          </div>
        </div>

        {/* Korean level (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>한국어 수준 <OptionalTag /></FieldLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {LANG_LEVELS.map((opt) => {
              const active = props.koreanLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => props.onChangeKorean(active ? "" : opt.value)}
                  className={`h-10 rounded-xl border text-[12px] font-semibold ${
                    active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* English level (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>영어 수준 <OptionalTag /></FieldLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {LANG_LEVELS.map((opt) => {
              const active = props.englishLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => props.onChangeEnglish(active ? "" : opt.value)}
                  className={`h-10 rounded-xl border text-[12px] font-semibold ${
                    active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Has resume (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>이력서를 가지고 있나요? <OptionalTag /></FieldLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => props.onChangeHasResume(props.hasResume === true ? null : true)}
              className={`h-10 rounded-xl border text-[12px] font-semibold ${
                props.hasResume === true ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
              }`}
            >
              있어요
            </button>
            <button
              type="button"
              onClick={() => props.onChangeHasResume(props.hasResume === false ? null : false)}
              className={`h-10 rounded-xl border text-[12px] font-semibold ${
                props.hasResume === false ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
              }`}
            >
              아직 없어요
            </button>
          </div>
        </div>

        {/* Contact (required) */}
        <div className="space-y-1.5">
          <FieldLabel required>연락처</FieldLabel>
          <div className="flex gap-2">
            <div className="relative w-[120px] shrink-0">
              <select
                value={props.contactType}
                onChange={(e) => props.onChangeContactType(e.target.value as ContactType)}
                className={selectCls}
              >
                {CONTACT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
            </div>
            <input
              value={props.contact}
              onChange={(e) => props.onChangeContact(e.target.value)}
              placeholder="이메일 / 카카오ID / WhatsApp 번호"
              maxLength={120}
              className={`${inputCls} flex-1`}
            />
          </div>
        </div>
      </div>

      {/* Consents */}
      <div className="mt-5 space-y-2.5 border-t border-border/40 pt-4">
        <ConsentRow
          checked={props.consentCareer}
          onChange={props.onChangeConsentCareer}
          label="커리어 추천을 위해 입력 정보 수집에 동의합니다."
          required
        />
        <ConsentRow
          checked={props.consentRecommend}
          onChange={props.onChangeConsentRecommend}
          label="한국 기업 추천 시 내 정보 제공에 동의합니다."
        />
        <ConsentRow
          checked={props.consentContact}
          onChange={props.onChangeConsentContact}
          label="결과 안내 및 채용 기회 관련 이메일·메시지 수신에 동의합니다."
        />
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        수집 항목: 국적·학교·전공·비자·언어·희망 직무·연락처 / 이용 목적: 커리어 추천 및 한국 기업 매칭 / 보유 기간:
        회원 미가입 시 수집일로부터 1년 후 파기.
      </p>

      {props.error ? (
        <p className="mt-3 text-[12.5px] text-destructive">{props.error}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={props.onBack}
          className="h-12 rounded-xl border border-border/60 bg-white text-sm font-semibold text-muted-foreground"
        >
          이전
        </button>
        <button
          type="button"
          onClick={props.onSubmit}
          className="col-span-2 h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          결과 더 보기 →
        </button>
      </div>
    </section>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-1 text-[12px] font-semibold text-foreground">
      {children}
      {required ? <span className="text-rose-500">*</span> : null}
    </label>
  );
}

function OptionalTag() {
  return <span className="text-[11px] font-normal text-muted-foreground">(선택)</span>;
}

function ConsentRow({
  checked,
  onChange,
  label,
  required
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border/60 text-primary focus-visible:ring-2 focus-visible:ring-ring"
      />
      <span>
        {label}{" "}
        <span className={required ? "text-rose-500" : "text-muted-foreground"}>
          ({required ? "필수" : "선택"})
        </span>
      </span>
    </label>
  );
}

function SignupGate({ apiBase, nextParam }: { apiBase: string; nextParam: string }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-white p-6 text-center">
      <p className="text-[15px] font-bold text-foreground">
        🔒 회원가입하면 더 자세한 결과가 열려요
      </p>
      <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
        <li>✅ 잘 맞는 / 🚩 피해야 할 회사 시그널</li>
        <li>🎯 MBTI 매칭 채용 공고 + 사유</li>
      </ul>
      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        Aply 가입하면 결과를 저장하고, 새 공고가 올라올 때 자동으로 매칭 알림을 보내드려요.
      </p>
      <div className="mt-5 flex w-full flex-col gap-2">
        <a
          href={`${apiBase}/auth/naver/start?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[14px] font-semibold text-white transition active:bg-[#02b551]"
        >
          <span aria-hidden className="text-base font-black">N</span>
          네이버로 시작
        </a>
        <a
          href={`${apiBase}/auth/kakao/start?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[14px] font-semibold text-[#191919] transition active:bg-[#f5dd00]"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
          </svg>
          카카오로 시작
        </a>
        <a
          href={`${apiBase}/auth/google/start?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-white text-[14px] font-semibold text-foreground transition active:bg-muted/30"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          구글로 시작
        </a>
        <Link
          href={`/signup?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 text-[14px] font-semibold text-foreground transition active:bg-muted/40"
        >
          이메일로 가입
        </Link>
      </div>
    </section>
  );
}
