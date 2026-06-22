"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { useResumeMakerAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import type { ResumeContent } from "../../lib/member-profile-client";
import { getBuilderState, getDraftResume } from "../../lib/resume-maker-client";
import {
  RESUME_PURPOSES,
  START_METHODS,
  type ResumeBuilderState,
  type ResumePurpose,
  type ResumeStartMethod
} from "../../lib/resume-maker-types";
import { trackResumeJobSelected, trackResumePurposeSelected } from "../../lib/analytics";

const TOTAL_STEPS = 3;

export function ResumeMakerOnboardingPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [baseContent, setBaseContent] = useState<ResumeContent>({});
  const [builder, setBuilder] = useState<ResumeBuilderState | null>(null);
  const [step, setStep] = useState(1);
  const [finishing, setFinishing] = useState(false);

  const { status, schedule, flush } = useResumeMakerAutosave(resumeId, baseContent);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        setBaseContent(resume.content);
        setTitle(resume.title);
        const state = getBuilderState(resume);
        setBuilder(state);
        // 온보딩 단계 진입점 — 이미 채워진 곳 다음부터.
        if (!state.onboarding.purpose) setStep(1);
        else if (state.onboarding.jobCategories.length === 0) setStep(2);
        else setStep(3);
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : "이력서를 불러오지 못했어요.");
        router.replace("/resume-maker");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // resumeId 만 의존 — toast/router 는 안정 참조.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  function update(next: ResumeBuilderState) {
    setBuilder(next);
    schedule(next);
  }

  function selectPurpose(purpose: ResumePurpose) {
    if (!builder) return;
    update({ ...builder, onboarding: { ...builder.onboarding, purpose } });
    trackResumePurposeSelected(purpose);
    setStep(2);
  }

  // 직무는 고르지 않고 문장으로 받는다. 자유 텍스트를 jobCategories 한 항목으로
  // 저장해 AI 호출/검증 등 기존 소비처는 그대로 동작.
  function setJobText(text: string) {
    if (!builder) return;
    update({
      ...builder,
      onboarding: { ...builder.onboarding, jobCategories: text.trim() ? [text] : [] }
    });
  }

  function selectStartMethod(method: ResumeStartMethod) {
    if (!builder) return;
    update({ ...builder, onboarding: { ...builder.onboarding, startMethod: method } });
  }

  function setForeigner(value: boolean) {
    if (!builder) return;
    update({ ...builder, onboarding: { ...builder.onboarding, isForeigner: value } });
  }

  async function finish() {
    if (!builder || finishing) return;
    setFinishing(true);
    const completed: ResumeBuilderState = {
      ...builder,
      onboarding: { ...builder.onboarding, completedAt: new Date().toISOString() }
    };
    setBuilder(completed);
    schedule(completed);
    trackResumeJobSelected(builder.onboarding.jobCategories);
    try {
      await flush();
    } catch {
      /* flush 는 내부에서 상태 처리 — 진행은 막지 않음 */
    }
    router.push(`/resume-maker/${resumeId}/experiences`);
  }

  if (loading || !builder) {
    return (
      <ResumeMakerShell>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> 불러오는 중...
          </span>
        </div>
      </ResumeMakerShell>
    );
  }

  const o = builder.onboarding;
  const jobText = o.jobCategories[0] ?? "";
  const canNext = step === 1 ? Boolean(o.purpose) : step === 2 ? o.jobCategories.length > 0 : Boolean(o.startMethod);

  return (
    <ResumeMakerShell right={<AutoSaveIndicator status={status} onRetry={() => void flush()} />} title={title}>
      <section className="container max-w-2xl px-5 py-10 md:py-14">
        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-[12px] font-semibold text-muted-foreground">
            <span>온보딩</span>
            <span>
              {step} / {TOTAL_STEPS}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        {step === 1 ? (
          <div>
            {/* 외국인 여부 — 외국인이면 기본 정보에 비자 항목을 추가 */}
            <div className="mb-7 rounded-2xl border border-border bg-card p-4">
              <p className="text-[15px] font-bold text-[#0B1227]">한국 국적이 아닌 외국인이신가요?</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">외국인이면 기본 정보에 비자 항목을 추가해 드려요.</p>
              <div className="mt-3 flex gap-2">
                {[
                  { v: true, t: "네, 외국인이에요" },
                  { v: false, t: "아니요" }
                ].map((opt) => {
                  const selected = o.isForeigner === opt.v;
                  return (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setForeigner(opt.v)}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-[13.5px] font-semibold transition ${
                        selected ? "border-primary bg-primary/10 text-[#0B46E8]" : "border-border bg-card text-foreground/80 hover:border-primary/40"
                      }`}
                    >
                      {opt.t}
                    </button>
                  );
                })}
              </div>
            </div>

            <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>
              어떤 상황에서 사용할 이력서인가요?
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">상황에 맞춰 질문과 문장 톤을 조절해 드려요.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {RESUME_PURPOSES.map((p) => {
                const selected = o.purpose === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => selectPurpose(p.value)}
                    className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span>
                      <span className="block text-[15px] font-bold text-[#0B1227]">{p.label}</span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">{p.desc}</span>
                    </span>
                    {selected ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" weight="bold" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>
              어떤 일을 하고 싶나요?
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">고를 필요 없이 편하게 적어주세요. 아직 잘 모르겠다면 그렇게 적어도 괜찮아요.</p>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="예: 외국인 대상 서비스 기획을 해보고 싶어요. / 마케팅이나 콘텐츠 쪽이요. / 아직 잘 모르겠어요."
              className="mt-5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>
              현재 작성된 자료가 있나요?
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">없어도 괜찮아요. 질문에 답하며 처음부터 만들 수 있어요.</p>
            <div className="mt-6 grid gap-3">
              {START_METHODS.map((m) => {
                const selected = o.startMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => selectStartMethod(m.value)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span>
                      <span className="block text-[15px] font-bold text-[#0B1227]">{m.label}</span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">{m.desc}</span>
                    </span>
                    {selected ? <Check className="h-5 w-5 shrink-0 text-primary" weight="bold" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            {o.startMethod && o.startMethod !== "scratch" ? (
              <p className="mt-3 rounded-xl bg-amber-50/70 px-4 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
                업로드·붙여넣기 연동은 다음 단계에서 이어집니다. 지금은 선택만 저장돼요.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* 하단 내비게이션 */}
        <div className="mt-10 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className={step === 1 ? "invisible" : ""}
          >
            <ArrowLeft weight="bold" /> 이전
          </Button>
          {step < TOTAL_STEPS ? (
            <Button variant="default" size="lg" onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))} disabled={!canNext}>
              다음 <ArrowRight weight="bold" />
            </Button>
          ) : (
            <Button variant="hero" size="lg" onClick={() => void finish()} disabled={!canNext || finishing}>
              {finishing ? <CircleNotch className="animate-spin" weight="bold" /> : null}
              경험 추가하러 가기 <ArrowRight weight="bold" />
            </Button>
          )}
        </div>
      </section>
    </ResumeMakerShell>
  );
}
