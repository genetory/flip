"use client";

// 무료 비자·직무 진단 — 로그인 없이 4단계로 끝낸다.
// 긴 폼을 한 번에 보여주지 않고, 한 화면에 한 가지만 묻는다.
// 계산은 전부 규칙(lib/tools/visa-job-fit) — LLM 을 호출하지 않는다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Warning } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import {
  JOB_CATEGORIES,
  JOB_CATEGORY_QUERY,
  MAJOR_FIELDS,
  SUPPORTED_VISA_CODES,
  computeVisaJobFit,
  type ExperienceLevel,
  type GraduationStatus,
  type JobCategory,
  type KoreanLevel,
  type MajorField,
  type VisaJobFitInput
} from "../../lib/tools/visa-job-fit";
import { clearFitInput, loadFitInput, saveFitInput } from "../../lib/tools/visa-job-fit-storage";
import {
  trackRecommendedJobView,
  trackVisaJobFitComplete,
  trackVisaJobFitResultView,
  trackVisaJobFitSignupClick,
  trackVisaJobFitSignupComplete,
  trackVisaJobFitStart,
  trackVisaJobFitStepComplete
} from "../../lib/analytics";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";

const REGIONS = ["any", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

const EMPTY: VisaJobFitInput = {
  visa: "",
  majorField: "unknown",
  graduation: "none",
  experience: "unknown",
  interests: [],
  korean: "unknown",
  region: "any"
};

export function VisaJobFitWizard() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<VisaJobFitInput>(EMPTY);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  // 가입·로그인 후 같은 탭으로 돌아온 경우 입력을 복원한다(URL 에는 아무것도 담지 않는다).
  const restoreReported = useRef(false);
  useEffect(() => {
    const saved = loadFitInput();
    if (saved) {
      setInput(saved);
      setDone(true);
      // 저장된 입력이 있고 이미 로그인 상태면 = 가입·로그인을 거쳐 결과로 돌아온 것이다.
      if (isAuthenticated && !restoreReported.current) {
        restoreReported.current = true;
        trackVisaJobFitSignupComplete({
          locale,
          source: "tools_restore",
          visaCategory: saved.visa ? saved.visa.split("-")[0] : undefined,
          experienceLevel: saved.experience,
          interestedJobCategory: saved.interests[0],
          loggedIn: true
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fitProps = useMemo(
    () => ({
      locale,
      source: "tools_page",
      visaCategory: input.visa ? input.visa.split("-")[0] : undefined,
      experienceLevel: input.experience,
      interestedJobCategory: input.interests[0],
      loggedIn: isAuthenticated
    }),
    [locale, input.visa, input.experience, input.interests, isAuthenticated]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    trackVisaJobFitStart({ locale, source: "tools_page", loggedIn: isAuthenticated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = useMemo(() => (done ? computeVisaJobFit(input) : null), [done, input]);

  const next = useCallback(() => {
    trackVisaJobFitStepComplete(step + 1, fitProps);
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    saveFitInput(input);
    setDone(true);
    trackVisaJobFitComplete({ ...fitProps, resultCount: computeVisaJobFit(input).roles.length });
  }, [step, fitProps, input]);

  if (done && result) {
    return (
      <ResultView
        input={input}
        result={result}
        onRestart={() => {
          clearFitInput();
          setInput(EMPTY);
          setStep(0);
          setDone(false);
        }}
      />
    );
  }

  const canNext =
    (step === 0 && input.visa.trim().length > 0) ||
    (step === 1 && input.majorField !== "unknown") ||
    (step === 2 && input.experience !== "unknown") ||
    (step === 3 && input.interests.length > 0);

  return (
    <div>
      <ol className="flex gap-1.5" aria-label={t("진행 단계", "Steps")}>
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#0B46E8]" : "bg-[#E5E8EB]"}`} />
        ))}
      </ol>
      <p className="mt-4 text-[12.5px] font-bold text-[#0B46E8]">
        {t(`${step + 1} / 4 단계`, `Step ${step + 1} of 4`)}
      </p>

      {step === 0 ? (
        <Question title={t("지금 체류자격이 무엇인가요?", "What's your current status in Korea?")}>
          <Choices
            options={[...SUPPORTED_VISA_CODES.map((c) => ({ value: c, label: c })), { value: "other", label: t("그 외 / 모르겠어요", "Other / not sure") }]}
            selected={input.visa ? [input.visa] : []}
            onPick={(v) => setInput((s) => ({ ...s, visa: v }))}
          />
        </Question>
      ) : null}

      {step === 1 ? (
        <Question title={t("전공 계열과 졸업 상태를 알려주세요", "Your field of study and graduation status")}>
          <Choices
            options={MAJOR_FIELDS.map((m) => ({ value: m, label: majorLabel(m, t) }))}
            selected={input.majorField !== "unknown" ? [input.majorField] : []}
            onPick={(v) => setInput((s) => ({ ...s, majorField: v as MajorField }))}
          />
          <p className="mt-4 text-[13px] font-bold text-[#4E5968]">{t("졸업 상태", "Graduation")}</p>
          <Choices
            options={(["enrolled", "graduating", "graduated", "none"] as GraduationStatus[]).map((g) => ({ value: g, label: gradLabel(g, t) }))}
            selected={[input.graduation]}
            onPick={(v) => setInput((s) => ({ ...s, graduation: v as GraduationStatus }))}
          />
        </Question>
      ) : null}

      {step === 2 ? (
        <Question title={t("경력은 어느 정도인가요?", "How much work experience do you have?")}>
          <Choices
            options={(["none", "intern", "under3", "over3"] as ExperienceLevel[]).map((e) => ({ value: e, label: expLabel(e, t) }))}
            selected={input.experience !== "unknown" ? [input.experience] : []}
            onPick={(v) => setInput((s) => ({ ...s, experience: v as ExperienceLevel }))}
          />
          <p className="mt-2 text-[11.5px] text-[#8B95A1]">
            {t("고르지 않으면 경력을 추측하지 않아요.", "If you skip this, we won't guess your experience.")}
          </p>
        </Question>
      ) : null}

      {step === 3 ? (
        <Question title={t("관심 직무를 골라 주세요 (최대 3개)", "Pick up to 3 roles you're interested in")}>
          <Choices
            multi
            options={JOB_CATEGORIES.map((c) => ({ value: c, label: jobLabel(c, t) }))}
            selected={input.interests}
            onPick={(v) =>
              setInput((s) => {
                const c = v as JobCategory;
                const has = s.interests.includes(c);
                const nextList = has ? s.interests.filter((x) => x !== c) : [...s.interests, c].slice(0, 3);
                return { ...s, interests: nextList };
              })
            }
          />
          <p className="mt-4 text-[13px] font-bold text-[#4E5968]">{t("한국어 수준", "Korean level")}</p>
          <Choices
            options={(["none", "basic", "business", "fluent"] as KoreanLevel[]).map((k) => ({ value: k, label: koreanLabel(k, t) }))}
            selected={input.korean !== "unknown" ? [input.korean] : []}
            onPick={(v) => setInput((s) => ({ ...s, korean: v as KoreanLevel }))}
          />
          <p className="mt-4 text-[13px] font-bold text-[#4E5968]">{t("희망 지역", "Preferred region")}</p>
          <Choices
            options={REGIONS.map((r) => ({ value: r, label: r === "any" ? t("어디든", "Anywhere") : r }))}
            selected={[input.region]}
            onPick={(v) => setInput((s) => ({ ...s, region: v }))}
          />
        </Question>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13.5px] font-bold text-[#4E5968] disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" /> {t("이전", "Back")}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!canNext}
          className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:cursor-default disabled:opacity-40"
        >
          {step === 3 ? t("결과 보기", "See results") : t("다음", "Next")} <ArrowRight className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h2 className="break-keep text-[19px] font-black leading-snug tracking-[-0.02em] text-[#191F28]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Choices({
  options,
  selected,
  onPick,
  multi = false
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onPick: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(o.value)}
            className={`rounded-xl border px-3.5 py-2 text-[13.5px] font-bold transition ${
              on ? "border-[#0B46E8] bg-[#0B46E8]/[0.06] text-[#0B46E8]" : "border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ResultView({
  input,
  result,
  onRestart
}: {
  input: VisaJobFitInput;
  result: ReturnType<typeof computeVisaJobFit>;
  onRestart: () => void;
}) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const [jobs, setJobs] = useState<PublicPositionListItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const viewed = useRef(false);

  const topCategory = result.roles[0]?.category;

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackVisaJobFitResultView({
      locale,
      source: "tools_page",
      visaCategory: input.visa ? input.visa.split("-")[0] : undefined,
      experienceLevel: input.experience,
      interestedJobCategory: topCategory,
      resultCount: result.roles.length,
      loggedIn: isAuthenticated
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 관련 공고 — 추천 1순위 직무 키워드로 공개 공고를 센다(서버 필터 재사용, 개인정보 없음).
  useEffect(() => {
    if (!topCategory) return;
    let alive = true;
    // page=1 을 주면 서버가 total 을 돌려준다 → "관련 공고 N건"을 추측하지 않고 실제 수로 적는다.
    void getPublicPositionsPage({
      search: JOB_CATEGORY_QUERY[topCategory],
      foreignerEligible: true,
      page: 1,
      limit: 3,
      ...(input.region !== "any" ? { locations: [input.region] } : {})
    })
      .then((r: { items: PublicPositionListItem[]; total: number | null }) => {
        if (!alive) return;
        setJobs(r.items.slice(0, 3));
        setTotal(typeof r.total === "number" ? r.total : r.items.length);
      })
      .catch(() => {
        if (alive) setTotal(null);
      });
    return () => {
      alive = false;
    };
  }, [topCategory, input.region]);

  const maxVisible = isAuthenticated ? result.roles.length : Math.min(result.roles.length, 3);

  return (
    <div>
      <h2 className="break-keep text-[20px] font-black tracking-[-0.02em] text-[#191F28]">
        {t("입력한 조건으로 본 추천 직무", "Roles that match what you told us")}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8B95A1]">
        {t(
          "입력과의 일치도로 계산한 결과예요. 합격이나 취업 가능 여부를 뜻하지 않아요.",
          "Calculated from how well your answers match each role. It does not mean you will be hired."
        )}
      </p>

      <ol className="mt-4 flex flex-col gap-2.5">
        {result.roles.slice(0, maxVisible).map((r, i) => (
          <li key={r.category} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-black text-[#191F28]">
                {i + 1}. {jobLabel(r.category, t)}
              </p>
              <span className="shrink-0 rounded-full bg-[#F2F4F6] px-2 py-1 text-[11px] font-bold text-[#4E5968]">
                {t(`일치도 ${r.score}`, `match ${r.score}`)}
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {r.reasons.map((x, j) => (
                <li key={j} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-[#4E5968]">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0A9B59]" weight="fill" />
                  <span className="break-keep">{locale === "ko" ? x.ko : x.en}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <section className="mt-6 rounded-2xl border border-[#FFE8C2] bg-[#FFFBF2] p-4">
        <p className="flex items-center gap-1.5 text-[13.5px] font-black text-[#C77700]">
          <Warning className="h-4 w-4" weight="fill" /> {t("공식 확인이 필요한 항목", "Needs official confirmation")}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {result.visaChecks.map((c, i) => (
            <li key={i} className="break-keep text-[12.5px] leading-relaxed text-[#4E5968]">
              · {locale === "ko" ? c.ko : c.en}
            </li>
          ))}
        </ul>
      </section>

      {result.missingInputs.length > 0 ? (
        <p className="mt-3 break-keep text-[12px] leading-relaxed text-[#8B95A1]">
          {result.missingInputs.map((m) => (locale === "ko" ? m.ko : m.en)).join(" ")}
        </p>
      ) : null}

      <section className="mt-6">
        <p className="text-[14px] font-black text-[#191F28]">
          {total === null
            ? t("관련 공고를 불러오지 못했어요", "Couldn't load related jobs")
            : t(`관련 공고 ${total}건`, `${total} related jobs`)}
        </p>
        {jobs.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1.5">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/talent/jobs/${j.id}`}
                  onClick={() => trackRecommendedJobView(j.id, "visa_job_fit")}
                  className="block rounded-xl border border-[#EEF1F5] bg-white px-3.5 py-3 text-[13.5px] font-semibold text-[#333D4B] transition hover:border-[#0B46E8]/30"
                >
                  {j.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* primary CTA 는 하나 — 비로그인은 가입, 로그인 상태면 Career Launch 로. */}
      <div className="mt-7">
        {isAuthenticated ? (
          <Link
            href="/career-launch"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white"
          >
            {t("Career Launch 로 이어서 준비하기", "Continue with Career Launch")}
          </Link>
        ) : (
          <>
            <Link
              href="/talent/signup?next=%2Ftools%2Fvisa-job-fit"
              onClick={() =>
                trackVisaJobFitSignupClick({
                  locale,
                  source: "tools_result",
                  visaCategory: input.visa ? input.visa.split("-")[0] : undefined,
                  experienceLevel: input.experience,
                  interestedJobCategory: topCategory,
                  resultCount: result.roles.length,
                  loggedIn: false
                })
              }
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white"
            >
              {t("가입하고 전체 결과 저장하기", "Sign up and save the full result")}
            </Link>
            <p className="mt-2 text-center text-[11.5px] leading-relaxed text-[#8B95A1]">
              {t(
                "가입하면 지금 입력한 내용이 그대로 이어져요. 전체 추천 공고와 이력서 작성으로 바로 넘어갈 수 있어요.",
                "Sign up and your answers carry over. You can go straight to all recommended jobs and resume writing."
              )}
            </p>
          </>
        )}
        <button type="button" onClick={onRestart} className="mt-3 w-full text-[13px] font-bold text-[#8B95A1] underline underline-offset-2">
          {t("다시 진단하기", "Start over")}
        </button>
      </div>

      <p className="mt-6 break-keep text-[11.5px] leading-relaxed text-[#8B95A1]">
        {t(
          "이 결과는 일반 안내이며 법률 자문이 아니에요. APLY 는 취업이나 비자 발급을 보장하지 않습니다.",
          "This is general information, not legal advice. Aply does not guarantee employment or a visa."
        )}
      </p>
    </div>
  );
}

// ---- 라벨 ----
function majorLabel(m: MajorField, t: ReturnType<typeof usePlatformT>): string {
  const map: Record<MajorField, [string, string]> = {
    it: ["IT·컴퓨터", "IT / Computing"],
    engineering: ["공학", "Engineering"],
    business: ["경영·경제", "Business / Economics"],
    design: ["디자인·예술", "Design / Arts"],
    humanities: ["인문·어학", "Humanities / Languages"],
    science: ["자연과학", "Natural sciences"],
    service: ["관광·서비스", "Tourism / Service"],
    other: ["그 외", "Other"]
  };
  return t(map[m][0], map[m][1]);
}
function gradLabel(g: GraduationStatus, t: ReturnType<typeof usePlatformT>): string {
  const map: Record<GraduationStatus, [string, string]> = {
    enrolled: ["재학 중", "Enrolled"],
    graduating: ["졸업 예정", "Graduating soon"],
    graduated: ["졸업", "Graduated"],
    none: ["해당 없음", "Not applicable"]
  };
  return t(map[g][0], map[g][1]);
}
function expLabel(e: ExperienceLevel, t: ReturnType<typeof usePlatformT>): string {
  const map: Record<ExperienceLevel, [string, string]> = {
    none: ["없음", "None"],
    intern: ["인턴·아르바이트", "Internship / part-time"],
    under3: ["3년 미만", "Under 3 years"],
    over3: ["3년 이상", "3+ years"],
    unknown: ["모르겠어요", "Not sure"]
  };
  return t(map[e][0], map[e][1]);
}
function koreanLabel(k: KoreanLevel, t: ReturnType<typeof usePlatformT>): string {
  const map: Record<KoreanLevel, [string, string]> = {
    none: ["거의 못함", "Almost none"],
    basic: ["일상 대화", "Everyday conversation"],
    business: ["업무 가능", "Business level"],
    fluent: ["유창함", "Fluent"],
    unknown: ["모르겠어요", "Not sure"]
  };
  return t(map[k][0], map[k][1]);
}
function jobLabel(c: JobCategory, t: ReturnType<typeof usePlatformT>): string {
  const map: Record<JobCategory, [string, string]> = {
    dev: ["개발", "Software development"],
    data: ["데이터·AI", "Data / AI"],
    design: ["디자인", "Design"],
    marketing: ["마케팅", "Marketing"],
    sales: ["영업·세일즈", "Sales"],
    planning: ["기획·운영", "Planning / Operations"],
    manufacturing: ["생산·기술", "Manufacturing / Technical"],
    service: ["서비스·고객지원", "Service / Customer support"],
    translation: ["번역·통역", "Translation / Interpretation"]
  };
  return t(map[c][0], map[c][1]);
}
