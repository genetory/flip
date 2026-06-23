"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CircleNotch, Copy as CopyIcon, Plus, Sparkle, Target, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeBackBar } from "./ResumeBackBar";
import { ResumeToolPreview } from "./ResumeToolPreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import type { ResumeContent } from "../../lib/member-profile-client";
import { fetchJobPosting, getBuilderState, getDraftResume, resumeToPlainText, saveResumeContent, tailorResume, type TailorResult } from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { DEFAULT_DESIGN, type ResumeBuilderState, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { useTailorCopy } from "../../lib/resume-maker-i18n/tailor";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

function scoreColor(score: number): string {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#0B46E8";
  if (score >= 30) return "#d97706";
  return "#dc2626";
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export function ResumeTailorPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useTailorCopy();
  const picker = useToolPickerCopy();
  const [loading, setLoading] = useState(true);
  const [resumeTitle, setResumeTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [builder, setBuilder] = useState<ResumeBuilderState | null>(null);
  const [builderContent, setBuilderContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  const [jobText, setJobText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  // 드래프트 — 요약·자기소개를 편집하고 저장/취소로 확정. 저장 전까진 실제 이력서 미변경.
  const [draftSummary, setDraftSummary] = useState("");
  const [draftIntro, setDraftIntro] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        const b = getBuilderState(resume);
        setResumeTitle(resume.title);
        setContent(resume.content);
        setBuilder(b);
        setBuilderContent(compileResumeContent(b, resume.content));
        setDesign(b.design ?? DEFAULT_DESIGN);
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : t.loadFailed);
        router.replace("/resume-maker");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  async function analyze() {
    if (!builderContent || analyzing) return;
    let jd = jobText.trim();
    if (!jd) {
      toast.info(t.needInput);
      return;
    }
    setAnalyzing(true);
    try {
      // 한 줄짜리 URL을 붙여넣으면 먼저 그 페이지의 공고 본문을 가져온다.
      if (/^https?:\/\/\S+$/i.test(jd)) {
        setFetching(true);
        let fetched = "";
        try {
          fetched = await fetchJobPosting(jd);
        } finally {
          setFetching(false);
        }
        if (!fetched) {
          toast.error(t.urlFailed);
          return;
        }
        jd = fetched;
        setJobText(fetched);
      }
      const r = await tailorResume({
        resumeText: resumeToPlainText(builderContent),
        jobText: jd,
        desiredJobRole: builderContent.desiredJobRole?.trim() || undefined
      });
      setResult(r);
      // 분석할 때마다 드래프트를 현재 이력서 값으로 초기화.
      setDraftSummary(content?.summary ?? "");
      setDraftIntro(content?.selfIntroduction ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.failed);
    } finally {
      setAnalyzing(false);
    }
  }

  function adoptSummary() {
    if (!result?.summary) return;
    setDraftSummary(result.summary);
    toast.success(t.adoptedToast);
  }

  function addSuggestionToIntro(text: string) {
    if (!text.trim()) return;
    setDraftIntro((prev) => [prev.trim(), text.trim()].filter(Boolean).join("\n"));
    toast.success(t.introAddedToast);
  }

  async function save() {
    if (!content || saving) return;
    setSaving(true);
    const next = { ...content, summary: draftSummary, selfIntroduction: draftIntro };
    setContent(next);
    if (builder) setBuilderContent(compileResumeContent(builder, next));
    try {
      await saveResumeContent(resumeId, next);
      toast.success(t.appliedToast);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.failed);
    } finally {
      setSaving(false);
    }
  }

  function cancelDraft() {
    setDraftSummary(content?.summary ?? "");
    setDraftIntro(content?.selfIntroduction ?? "");
  }

  function copyText(text: string) {
    void navigator.clipboard?.writeText(text).then(() => toast.success(t.copiedToast)).catch(() => {});
  }

  // 저장 안 한 변경 여부.
  const dirty =
    result !== null && content !== null && (draftSummary !== (content.summary ?? "") || draftIntro !== (content.selfIntroduction ?? ""));

  // 우측 미리보기 — 드래프트(요약·자기소개)를 반영해 라이브로.
  const previewContent =
    result && builder && content ? compileResumeContent(builder, { ...content, summary: draftSummary, selfIntroduction: draftIntro }) : builderContent;

  // 라이브 점수 — 부족 키워드가 드래프트(요약·자기소개)에 채워질수록 baseScore→100 으로 보정.
  const draftBlob = norm(`${draftSummary}\n${draftIntro}`);
  const covered = new Set(result ? result.missing.filter((k) => k && draftBlob.includes(norm(k))) : []);
  const totalKw = result ? result.matched.length + result.missing.length : 0;
  const liveScore = result
    ? totalKw > 0
      ? Math.min(100, Math.round(result.score + (covered.size / totalKw) * (100 - result.score)))
      : result.score
    : 0;

  return (
    <ResumeMakerShell>
      <ResumeBackBar backHref="/resume-maker" backLabel={picker.resumeList} title={resumeTitle} />
      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative flex min-w-0 flex-col px-5 py-6 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:py-8">
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex items-center gap-2">
                <Target weight="bold" className="h-6 w-6 text-[#0B46E8]" aria-hidden />
                <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>{t.title}</h2>
              </div>
              <p className="mt-2 text-[14px] text-muted-foreground">{t.desc}</p>

              <label className="mt-6 block text-[12.5px] font-medium text-foreground/80">
                {t.jdLabel}
                <textarea
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder={t.jdPlaceholder}
                  rows={7}
                  maxLength={6000}
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                />
              </label>
              <Button variant="default" size="lg" className="mt-3 w-full" disabled={analyzing} onClick={() => void analyze()}>
                {analyzing ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
                {analyzing ? (fetching ? t.fetchingUrl : t.analyzing) : result ? t.reanalyze : t.analyze}
              </Button>

              {!result ? (
                <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-[13px] text-muted-foreground">
                  {t.emptyHint}
                </p>
              ) : (
                <div className="mt-6 space-y-5 pb-4">
                  {/* 점수 — 라이브 */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <p className="text-[12px] font-bold text-muted-foreground">{t.scoreLabel}</p>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="text-4xl font-black tracking-tight transition-colors" style={{ color: scoreColor(liveScore) }}>{liveScore}</span>
                      <span className="mb-1.5 text-[13px] text-muted-foreground">/ 100</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${liveScore}%`, background: scoreColor(liveScore) }} />
                    </div>
                  </div>

                  {/* 보유 / 부족 (드래프트에 채워진 부족 키워드는 완료 표시) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {result.matched.length > 0 ? (
                      <div>
                        <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700">
                          <CheckCircle weight="fill" className="h-4 w-4" /> {t.matchedTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.matched.map((m, i) => (
                            <span key={i} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-800">{m}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {result.missing.length > 0 ? (
                      <div>
                        <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-amber-700">
                          <WarningCircle weight="fill" className="h-4 w-4" /> {t.missingTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.missing.map((m, i) =>
                            covered.has(m) ? (
                              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 line-through">
                                <CheckCircle weight="fill" className="h-3 w-3" /> {m}
                              </span>
                            ) : (
                              <span key={i} className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-800">{m}</span>
                            )
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* 이력서에 반영 — 요약·자기소개 직접 편집(추가·삭제) */}
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    <p className="text-[12.5px] font-bold text-[#0B46E8]">{t.applyTitle}</p>
                    <label className="mt-2 block text-[12px] font-medium text-foreground/70">
                      {t.summaryField}
                      <input
                        value={draftSummary}
                        onChange={(e) => setDraftSummary(e.target.value)}
                        maxLength={200}
                        className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="mt-3 block text-[12px] font-medium text-foreground/70">
                      {t.introField}
                      <textarea
                        value={draftIntro}
                        onChange={(e) => setDraftIntro(e.target.value)}
                        rows={6}
                        maxLength={4000}
                        className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                      />
                    </label>
                  </div>

                  {/* 맞춤 요약 제안 */}
                  {result.summary ? (
                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <p className="text-[12.5px] font-bold text-foreground/80">{t.summaryTitle}</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/90">{result.summary}</p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => adoptSummary()}>{t.adoptSummary}</Button>
                        <Button size="sm" variant="ghost" onClick={() => copyText(result.summary)}>
                          <CopyIcon weight="bold" /> {t.copy}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* 맞춤 제안 */}
                  {result.suggestions.length > 0 ? (
                    <div>
                      <p className="text-[12.5px] font-bold text-foreground/80">{t.suggestionsTitle}</p>
                      <div className="mt-2 space-y-2">
                        {result.suggestions.map((s, i) => (
                          <div key={i} className="rounded-xl border border-border bg-card p-3.5">
                            {s.title ? <p className="text-[13px] font-semibold text-[#0B1227]">{s.title}</p> : null}
                            {s.text ? <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/75">{s.text}</p> : null}
                            {s.text ? (
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => addSuggestionToIntro(s.text)}>
                                  <Plus weight="bold" /> {t.addToIntro}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => copyText(s.text)}>
                                  <CopyIcon weight="bold" /> {t.copy}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* 저장 / 취소 — 변경이 있을 때만, 하단 고정 */}
            {dirty ? (
              <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background/95 py-3 backdrop-blur">
                <div className="mx-auto flex w-full max-w-2xl gap-2">
                  <Button variant="ghost" size="lg" onClick={cancelDraft} disabled={saving}>
                    {t.cancel}
                  </Button>
                  <Button variant="default" size="lg" className="flex-1" onClick={() => void save()} disabled={saving}>
                    {saving ? <CircleNotch className="animate-spin" weight="bold" /> : null}
                    {t.save}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <ResumeToolPreview content={previewContent} design={design} expandLabel={picker.expand} previewLabel={picker.preview} />
        </div>
      )}
    </ResumeMakerShell>
  );
}
