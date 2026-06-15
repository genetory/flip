"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  ClipboardText,
  Gift,
  Sparkle,
  UsersThree
} from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Reveal } from "../site/Reveal";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { paperlogy } from "../../lib/fonts";
import {
  submitHanpassSurvey,
  type HanpassAvailableFrom,
  type HanpassJobField,
  type HanpassJobIntent,
  type HanpassLanguage,
  type HanpassVisaType,
  type HanpassWantsConsulting
} from "../../lib/hanpass-event-client";

// ---------------------------------------------------------------------------
// /events/hanpass — 한패스 × Aply 취업 지원 확인 이벤트.
// 한패스 이용자(한국 거주 외국인)에게 문자로 전달되는 링크로 접속 → 인페이지
// 설문 작성 → 이력서 첨삭/취업 컨설팅을 원하면 회원가입 안내.
// 선착순 첨삭 10명 안내는 운영팀이 응답을 보고 수동으로 개별 연락한다.
// 참고 랜딩 HTML 의 GNB 는 무시하고 사이트 표준 Header/Footer 를 사용한다.
// ---------------------------------------------------------------------------

const DEADLINE_LABEL = "2026년 6월 26일(금)";
// 이력서 첨삭 신청은 회원가입/로그인이 전제. 가입·로그인 후 다시 이 페이지로 복귀.
// `?next=/events/...` 는 SignupPage 에서 계정 유형 선택을 건너뛰는 원탭 가입 플로우.
const SIGNUP_HREF = "/signup?next=%2Fevents%2Fhanpass";
const LOGIN_HREF = "/login?next=%2Fevents%2Fhanpass";

type Option<T extends string> = { value: T; label: string };

const JOB_INTENT_OPTIONS: Option<HanpassJobIntent>[] = [
  { value: "active_seeking", label: "네, 적극적으로 구직 중이에요" },
  { value: "open_to_offers", label: "네, 좋은 기회가 있으면 이직·취업을 희망해요" },
  { value: "not_seeking", label: "아니요, 현재는 구직 의향이 없어요" },
  { value: "unsure", label: "아직 잘 모르겠어요" }
];

const AVAILABLE_FROM_OPTIONS: Option<HanpassAvailableFrom>[] = [
  { value: "immediately", label: "즉시 가능" },
  { value: "within_1m", label: "1개월 이내" },
  { value: "within_3m", label: "3개월 이내" },
  { value: "undecided", label: "아직 미정" },
  { value: "not_available", label: "현재는 근무가 가능하지 않아요" }
];

const JOB_FIELD_OPTIONS: Option<HanpassJobField>[] = [
  { value: "manufacturing", label: "제조/생산" },
  { value: "logistics", label: "물류/창고" },
  { value: "service", label: "서비스/매장" },
  { value: "office", label: "사무/관리" },
  { value: "translation", label: "통번역" },
  { value: "it", label: "IT/개발" },
  { value: "design_marketing", label: "디자인/마케팅" },
  { value: "research", label: "연구/전문직" },
  { value: "other", label: "기타" }
];

const VISA_OPTIONS: Option<HanpassVisaType>[] = [
  { value: "D-2", label: "D-2 유학" },
  { value: "D-4", label: "D-4 어학연수" },
  { value: "D-10", label: "D-10 구직" },
  { value: "E-7", label: "E-7 특정활동" },
  { value: "F-2", label: "F-2 거주" },
  { value: "F-4", label: "F-4 재외동포" },
  { value: "F-5", label: "F-5 영주" },
  { value: "F-6", label: "F-6 결혼이민" },
  { value: "other", label: "기타" },
  { value: "unsure", label: "잘 모르겠어요" }
];

const WANTS_CONSULTING_OPTIONS: Option<HanpassWantsConsulting>[] = [
  { value: "yes", label: "네, 신청하고 싶어요" },
  { value: "info_only", label: "아니요, 채용 정보 안내만 받고 싶어요" },
  { value: "unsure", label: "아직 잘 모르겠어요" }
];

const LANGUAGE_OPTIONS: Option<HanpassLanguage>[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "영어" }
];

const PRIVACY_NOTICE =
  "입력하신 정보는 플리퍼스(Aply)가 한패스 연계 취업 지원, 채용 정보 안내, 채용 매칭, 이력서 첨삭 및 취업 컨설팅 제공을 위해 수집·이용하며, 향후 적합한 채용 기회와 Aply의 취업 지원 서비스 안내를 위해 보관 및 활용될 수 있습니다.\n\n개인정보 활용에 동의하지 않으시는 경우 설문 제출 및 취업 지원 안내가 제한될 수 있습니다.";

type FormState = {
  name: string;
  phone: string;
  email: string;
  jobIntent: HanpassJobIntent | "";
  availableFrom: HanpassAvailableFrom | "";
  jobFields: HanpassJobField[];
  jobFieldOther: string;
  visaType: HanpassVisaType | "";
  wantsConsulting: HanpassWantsConsulting | "";
  consultLanguages: HanpassLanguage[];
  privacyConsent: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  jobIntent: "",
  availableFrom: "",
  jobFields: [],
  jobFieldOther: "",
  visaType: "",
  wantsConsulting: "",
  consultLanguages: [],
  // 개인정보 활용 동의는 기본적으로 "동의합니다" 가 선택된 상태로 시작.
  privacyConsent: true
};

function normalizePhone(raw: string) {
  return raw.replace(/[^0-9]/g, "");
}

export function HanpassEventPage() {
  const toast = useToast();
  const { isAuthenticated } = useAuthSession();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { wantsConsulting: HanpassWantsConsulting }>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleArray = <T extends string>(key: "jobFields" | "consultLanguages", value: T) =>
    setForm((prev) => {
      const list = prev[key] as T[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });

  const validationError = useMemo(() => {
    if (!form.name.trim()) return "이름을 입력해 주세요.";
    const phone = normalizePhone(form.phone);
    if (!/^01\d{8,9}$/.test(phone)) return "연락 가능한 휴대폰 번호를 정확히 입력해 주세요. (예: 01012345678)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "이메일 주소를 정확히 입력해 주세요.";
    if (!form.jobIntent) return "구직 또는 이직 희망 여부를 선택해 주세요.";
    if (!form.availableFrom) return "근무 가능 시점을 선택해 주세요.";
    if (form.jobFields.length === 0) return "희망하는 일자리 분야를 한 가지 이상 선택해 주세요.";
    if (form.jobFields.includes("other") && !form.jobFieldOther.trim())
      return "기타 분야를 선택하셨다면 내용을 입력해 주세요.";
    if (!form.visaType) return "보유 중인 비자 종류를 선택해 주세요.";
    if (!form.wantsConsulting) return "이력서 첨삭 및 취업 컨설팅 신청 여부를 선택해 주세요.";
    if (form.consultLanguages.length === 0) return "상담 가능한 언어를 선택해 주세요.";
    if (!form.privacyConsent) return "개인정보 활용에 동의해야 설문을 제출할 수 있습니다.";
    return null;
  }, [form]);

  const handleSubmit = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitHanpassSurvey({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        email: form.email.trim(),
        jobIntent: form.jobIntent as HanpassJobIntent,
        availableFrom: form.availableFrom as HanpassAvailableFrom,
        jobFields: form.jobFields,
        jobFieldOther: form.jobFields.includes("other") ? form.jobFieldOther.trim() : undefined,
        visaType: form.visaType as HanpassVisaType,
        wantsConsulting: form.wantsConsulting as HanpassWantsConsulting,
        consultLanguages: form.consultLanguages,
        privacyConsent: true,
        locale: "ko",
        source: "hanpass"
      });
      setSubmitted({ wantsConsulting: result.wantsConsulting });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "설문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B1227] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px 480px at 18% -10%, rgba(11,70,232,0.45), transparent 60%), radial-gradient(700px 420px at 95% 0%, rgba(11,70,232,0.22), transparent 55%)"
          }}
        />
        <div className="relative mx-auto w-full max-w-[760px] px-5 py-16 sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              한패스 <span className="text-white/50">×</span> Aply
            </span>
          </Reveal>
          <Reveal delayMs={60}>
            <h1 className={`${paperlogy.className} mt-5 text-3xl font-bold leading-tight sm:text-4xl`}>
              한패스 이용자 취업 지원 확인
            </h1>
          </Reveal>
          <Reveal delayMs={120}>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/80 sm:text-base">
              {`Aply는 한패스와 함께 한국에서 취업을 희망하는 외국인 분들께 채용 정보, 이력서 첨삭, 취업 상담 안내를 도와드리고 있습니다.\n\n현재 구직 또는 이직 희망 여부와 취업 지원 필요 여부를 확인하기 위한 설문입니다. 응답은 약 30초~1분 정도 소요됩니다.`}
            </p>
          </Reveal>
          <Reveal delayMs={180}>
            <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Gift size={22} weight="fill" className="mt-0.5 shrink-0 text-[#7aa2ff]" />
                <p className="text-sm leading-relaxed text-white/90">
                  <strong className="font-semibold text-white">{DEADLINE_LABEL}까지</strong> 응답해 주신 분 중{" "}
                  <strong className="font-semibold text-white">선착순 10명</strong>에게 이력서 첨삭 및 취업 컨설팅을 우선 제공해 드립니다.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {submitted ? (
        <CompletionView wantsConsulting={submitted.wantsConsulting} isAuthenticated={isAuthenticated} />
      ) : (
        <main className="mx-auto w-full max-w-[760px] px-5 py-12 sm:py-16">
          {/* 안내 카드 */}
          <Reveal>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard
                icon={<ClipboardText size={20} weight="bold" />}
                title="간단한 설문"
                desc="약 30초~1분, 10개 문항"
              />
              <InfoCard
                icon={<UsersThree size={20} weight="bold" />}
                title="맞춤 취업 지원"
                desc="채용 정보 · 매칭 · 상담 안내"
              />
              <InfoCard
                icon={<CalendarBlank size={20} weight="bold" />}
                title="응답 기한"
                desc={`${DEADLINE_LABEL}까지`}
              />
            </div>
          </Reveal>

          {/* 설문 폼 */}
          <Reveal delayMs={80}>
            <div className="mt-10 space-y-8">
              <ShortAnswer
                index={1}
                label="이름"
                placeholder="예: 홍길동"
                value={form.name}
                onChange={(v) => set("name", v)}
              />
              <ShortAnswer
                index={2}
                label="연락 가능한 전화번호"
                placeholder="010으로 시작하는 11자리, 예: 01012345678"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                inputMode="numeric"
              />
              <ShortAnswer
                index={3}
                label="이메일 주소"
                placeholder="ㅇㅇㅇㅇ@ㅇㅇㅇ.com"
                value={form.email}
                onChange={(v) => set("email", v)}
                type="email"
              />

              <RadioGroup
                index={4}
                label="현재 구직 또는 이직을 희망하시나요?"
                options={JOB_INTENT_OPTIONS}
                value={form.jobIntent}
                onChange={(v) => set("jobIntent", v)}
              />
              <RadioGroup
                index={5}
                label="언제부터 근무가 가능하신가요?"
                options={AVAILABLE_FROM_OPTIONS}
                value={form.availableFrom}
                onChange={(v) => set("availableFrom", v)}
              />

              <CheckboxGroup
                index={6}
                label="희망하시는 일자리 분야를 선택해 주세요."
                hint="복수 선택 가능"
                options={JOB_FIELD_OPTIONS}
                values={form.jobFields}
                onToggle={(v) => toggleArray("jobFields", v)}
              />
              {form.jobFields.includes("other") && (
                <input
                  value={form.jobFieldOther}
                  onChange={(e) => set("jobFieldOther", e.target.value)}
                  placeholder="기타 희망 분야를 입력해 주세요."
                  className="-mt-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-[#0B46E8] focus:ring-2 focus:ring-[#0B46E8]/20"
                />
              )}

              <RadioGroup
                index={7}
                label="보유 중인 비자 종류를 선택해 주세요."
                options={VISA_OPTIONS}
                value={form.visaType}
                onChange={(v) => set("visaType", v)}
              />
              <div>
                <RadioGroup
                  index={8}
                  label="이력서 첨삭 및 취업 컨설팅을 신청하시겠어요?"
                  hint={`${DEADLINE_LABEL}까지 응답자 중 선착순 10명 우선 제공`}
                  options={WANTS_CONSULTING_OPTIONS}
                  value={form.wantsConsulting}
                  onChange={(v) => set("wantsConsulting", v)}
                />
                {form.wantsConsulting === "yes" && !isAuthenticated && (
                  <p className="mt-2 rounded-lg bg-[#0B46E8]/5 px-3 py-2 text-xs leading-relaxed text-[#0B46E8]">
                    이력서 첨삭 신청은 회원가입 또는 로그인 후 완료됩니다. 설문을 제출하면 다음 단계에서 안내해 드려요.
                  </p>
                )}
              </div>
              <CheckboxGroup
                index={9}
                label="상담이 가능한 언어를 선택해 주세요."
                hint="복수 선택 가능"
                options={LANGUAGE_OPTIONS}
                values={form.consultLanguages}
                onToggle={(v) => toggleArray("consultLanguages", v)}
              />

              {/* 개인정보 동의 */}
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <QuestionLabel index={10} label="개인정보 활용에 동의해 주세요." />
                <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {PRIVACY_NOTICE}
                </p>
                <div className="mt-4 space-y-2">
                  <ConsentRadio
                    checked={form.privacyConsent === true}
                    onChange={() => set("privacyConsent", true)}
                    label="동의합니다"
                  />
                  <ConsentRadio
                    checked={form.privacyConsent === false}
                    onChange={() => set("privacyConsent", false)}
                    label="동의하지 않습니다"
                    muted
                  />
                </div>
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "제출 중…" : "설문 제출하기"}
                {!submitting && <ArrowRight weight="bold" />}
              </Button>

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                문자 수신을 원하지 않으시면{" "}
                <a href="mailto:info@flip-ers.com?subject=한패스 문자 수신거부" className="font-medium text-[#0B46E8] underline underline-offset-2">
                  수신거부 의사
                </a>
                를 남겨주세요.
              </p>
            </div>
          </Reveal>
        </main>
      )}

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 완료 화면
// ---------------------------------------------------------------------------
function CompletionView({
  wantsConsulting,
  isAuthenticated
}: {
  wantsConsulting: HanpassWantsConsulting;
  isAuthenticated: boolean;
}) {
  const isApplicant = wantsConsulting === "yes";
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 py-16 sm:py-24">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B46E8]/10 text-[#0B46E8]">
            <CheckCircle size={40} weight="fill" />
          </span>
          <h2 className={`${paperlogy.className} mt-6 text-2xl font-bold sm:text-3xl`}>
            응답해주셔서 감사합니다.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Aply가 응답 내용을 확인한 뒤 필요한 경우 순차적으로 안내드리겠습니다.
          </p>
        </div>
      </Reveal>

      {/* 첨삭 신청자 — 회원가입/로그인 후 신청 완료 (이미 로그인 시 접수 안내) */}
      {isApplicant && isAuthenticated && (
        <Reveal delayMs={120}>
          <div className="mt-10 rounded-2xl border border-[#0B46E8]/20 bg-[#0B46E8]/5 p-6 text-center">
            <Sparkle size={24} weight="fill" className="mx-auto text-[#0B46E8]" />
            <h3 className="mt-3 text-lg font-bold">이력서 첨삭 신청이 접수되었습니다.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              선착순 10명 안내 대상은 운영팀이 응답을 확인한 뒤 개별적으로 연락드립니다.
            </p>
            <div className="mt-5 flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/positions">채용 정보 둘러보기</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      {isApplicant && !isAuthenticated && (
        <Reveal delayMs={120}>
          <div className="mt-10 rounded-2xl border border-[#0B46E8]/20 bg-[#0B46E8]/5 p-6 text-center">
            <Sparkle size={24} weight="fill" className="mx-auto text-[#0B46E8]" />
            <h3 className="mt-3 text-lg font-bold">이력서 첨삭 신청은 한 단계가 남았어요!</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              이력서 첨삭 신청은 <strong className="font-semibold text-foreground">회원가입 또는 로그인</strong> 후 완료됩니다. 선착순 10명 안내 대상은 운영팀이 응답을 확인한 뒤 개별적으로 연락드립니다.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild variant="hero" size="lg">
                <Link href={SIGNUP_HREF}>
                  회원가입 하고 신청 완료
                  <ArrowRight weight="bold" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={LOGIN_HREF}>이미 계정이 있어요 (로그인)</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      {!isApplicant && (
        <Reveal delayMs={120}>
          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Aply에서 더 많은 채용 정보를 확인하고 싶으시면 회원가입 후 맞춤 채용 정보를 받아보실 수 있어요.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Button asChild variant="dark" size="lg">
                  <Link href="/positions">
                    채용 정보 둘러보기
                    <ArrowRight weight="bold" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="dark" size="lg">
                    <Link href={SIGNUP_HREF}>
                      회원가입 하기
                      <ArrowRight weight="bold" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/positions">채용 정보 둘러보기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </Reveal>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// 폼 서브 컴포넌트
// ---------------------------------------------------------------------------
function QuestionLabel({ index, label, hint }: { index: number; label: string; hint?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold leading-relaxed sm:text-base">
        <span className="mr-1.5 text-[#0B46E8]">{index}.</span>
        {label}
        <span className="ml-1 text-[#e5484d]">*</span>
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ShortAnswer({
  index,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode
}: {
  index: number;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text" | "email";
}) {
  return (
    <div>
      <QuestionLabel index={index} label={label} />
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-[#0B46E8] focus:ring-2 focus:ring-[#0B46E8]/20"
      />
    </div>
  );
}

function RadioGroup<T extends string>({
  index,
  label,
  hint,
  options,
  value,
  onChange
}: {
  index: number;
  label: string;
  hint?: string;
  options: Option<T>[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <QuestionLabel index={index} label={label} hint={hint} />
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-[#0B46E8] bg-[#0B46E8]/5 font-medium"
                  : "border-input bg-background hover:border-[#0B46E8]/40 hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-[#0B46E8]" : "border-muted-foreground/40"
                }`}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-[#0B46E8]" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxGroup<T extends string>({
  index,
  label,
  hint,
  options,
  values,
  onToggle
}: {
  index: number;
  label: string;
  hint?: string;
  options: Option<T>[];
  values: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <QuestionLabel index={index} label={label} hint={hint} />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const active = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-[#0B46E8] bg-[#0B46E8]/5 font-medium"
                  : "border-input bg-background hover:border-[#0B46E8]/40 hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  active ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-muted-foreground/40"
                }`}
              >
                {active && <CheckCircle size={14} weight="bold" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConsentRadio({
  checked,
  onChange,
  label,
  muted
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
        checked
          ? muted
            ? "border-muted-foreground/50 bg-muted/60 font-medium"
            : "border-[#0B46E8] bg-[#0B46E8]/5 font-medium"
          : "border-input bg-background hover:bg-muted/40"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? (muted ? "border-muted-foreground" : "border-[#0B46E8]") : "border-muted-foreground/40"
        }`}
      >
        {checked && (
          <span className={`h-2.5 w-2.5 rounded-full ${muted ? "bg-muted-foreground" : "bg-[#0B46E8]"}`} />
        )}
      </span>
      {label}
    </button>
  );
}

function InfoCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B46E8]/10 text-[#0B46E8]">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
