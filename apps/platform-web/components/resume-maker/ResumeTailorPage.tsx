"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, CircleNotch, Copy as CopyIcon, Plus, Target, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AiQuotaModal } from "./AiQuotaModal";
import { AiTicketCost } from "./AiTicketCost";
import { ResumeBackBar } from "./ResumeBackBar";
import { ToolPreviewColumn } from "./ToolPreviewColumn";
import { PositionPagination } from "./PositionPagination";
import { Button } from "../ui/button";
import { trackCareerFunnel } from "../../lib/analytics";
import { useToast } from "../toast/ToastProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { PositionRow, mapPublicPositionToCard } from "../pages/PositionsPage";
import { getMyResumes, type PublicPositionListItem, type ResumeContent } from "../../lib/member-profile-client";
import { AiQuotaError, fetchJobPosting, getBuilderState, getDraftResume, resumeToPlainText, saveResumeContent, tailorResume, type TailorResult } from "../../lib/resume-maker-client";
import { setActiveResumeId } from "../../lib/resume-maker-active";
import { coverLetterToPlainText, getCoverLetter, type CoverLetter } from "../../lib/cover-letter-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { DEFAULT_DESIGN, type ResumeBuilderState, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { positionToJobText } from "../../lib/resume-maker-position-jd";
import { usePositionPager } from "../../lib/resume-maker-positions-pager";
import { useAiUsage } from "../../lib/resume-maker-ai-usage";
import { useTailorCopy } from "../../lib/resume-maker-i18n/tailor";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

function scoreColor(score: number): string {
  if (score >= 75) return "#15C47E";
  if (score >= 50) return "#0B46E8";
  if (score >= 30) return "#d97706";
  return "#dc2626";
}

// 적합도 점수 원형 게이지 — 점수에 따라 색이 바뀌고, 마운트 시 부드럽게 채워진다.
function ScoreRing({ score }: { score: number }) {
  const size = 136;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDF0F3" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

export function ResumeTailorPage({ resumeId }: { resumeId: string }) {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const coverLetterId = searchParams.get("cl");
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const t = useTailorCopy();
  const picker = useToolPickerCopy();
  const { locale } = useLanguage();
  const { resetAt, refresh: refreshUsage } = useAiUsage(); // 공용 AI 티켓(GNB 공유)
  const [loading, setLoading] = useState(true);
  const [quotaOpen, setQuotaOpen] = useState(false); // 한도 초과 모달
  const [resumeTitle, setResumeTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [builder, setBuilder] = useState<ResumeBuilderState | null>(null);
  const [builderContent, setBuilderContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  const [jobText, setJobText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  // 입력 모드 — 직접 입력(텍스트/URL) vs Aply 포지션에서 선택
  const [inputMode, setInputMode] = useState<"text" | "position">("text");
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const pager = usePositionPager((m) => toast.error(m || t.positionFailed));

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
        setLoading(false);
      } catch {
        // 선택된 이력서가 삭제/없음 — 다른 이력서가 있으면 '그 다음 이력서'로 자동 전환.
        if (!alive) return;
        try {
          const drafts = (await getMyResumes())
            .slice()
            .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
          if (!alive) return;
          const next = drafts.find((d) => d.id !== resumeId);
          if (next) {
            setActiveResumeId(next.id);
            router.replace(`/resume-maker/${next.id}/tailor`);
            return; // 전환 중 — 로딩 유지
          }
        } catch {
          /* 목록 조회 실패는 무시 */
        }
        // 이력서가 하나도 없음 — 홈(빈 이력서 카드)으로 보낸다(별도 선택 화면 없음).
        router.replace("/resume-maker");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  // 선택 화면에서 함께 고른 자기소개서(cl) — AI 분석 시 참고 자료로 전달.
  useEffect(() => {
    let alive = true;
    if (!coverLetterId) {
      setCoverLetter(null);
      return;
    }
    void (async () => {
      try {
        const clDoc = await getCoverLetter(coverLetterId);
        if (alive) setCoverLetter(clDoc);
      } catch {
        if (alive) setCoverLetter(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [coverLetterId]);

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
        coverLetterText: coverLetter ? coverLetterToPlainText(coverLetter) || undefined : undefined,
        desiredJobRole: builderContent.desiredJobRole?.trim() || undefined
      });
      setResult(r);
      trackCareerFunnel("job_match_completed");
      trackCareerFunnel("tailored_resume_generated");
      refreshUsage();
    } catch (err) {
      if (err instanceof AiQuotaError) {
        refreshUsage();
        setQuotaOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : t.failed);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  function selectPosition(p: PublicPositionListItem) {
    setSelectedPosId(p.id);
    setJobText(positionToJobText(p));
  }

  // content 갱신 + 미리보기 재컴파일 + 저장(맞춤 제안을 이력서에 바로 반영).
  async function applyContent(next: ResumeContent, msg: string) {
    setContent(next);
    if (builder) setBuilderContent(compileResumeContent(builder, next));
    try {
      await saveResumeContent(resumeId, next);
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.failed);
    }
  }

  // 맞춤 제안 문장을 자기소개에 한 줄로 덧붙여 바로 반영.
  function addSuggestionToIntro(text: string) {
    if (!content || !text.trim()) return;
    const intro = [content.selfIntroduction?.trim(), text.trim()].filter(Boolean).join("\n");
    void applyContent({ ...content, selfIntroduction: intro }, t.introAddedToast);
  }

  function copyText(text: string) {
    void navigator.clipboard?.writeText(text).then(() => toast.success(t.copiedToast)).catch(() => {});
  }

  // 결과 화면에서 접어 보여줄 "분석한 공고" — 포지션을 골랐으면 그 카드를, 아니면 입력 첫 줄을.
  const selectedPosition = pager.positions?.find((x) => x.id === selectedPosId) ?? null;
  const analyzedLabel = (() => {
    const first = jobText.trim().split("\n").find((l) => l.trim());
    return first ? first.replace(/^\[|\]$/g, "").slice(0, 60) : "—";
  })();
  // 점수대별 한 줄 판정.
  const verdict = (s: number) => (s >= 75 ? t.verdictGreat : s >= 50 ? t.verdictGood : s >= 30 ? t.verdictFair : t.verdictLow);


  return (
    <ResumeMakerShell>
      <ResumeBackBar backHref="/resume-maker" backLabel={picker.back} title={resumeTitle} />
      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative flex min-w-0 flex-col px-4 py-6 sm:px-5 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:py-8">
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex items-center gap-2">
                <Target weight="bold" className="h-6 w-6 text-[#0B46E8]" aria-hidden />
                <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#191F28] md:text-[26px]">{t.title}</h2>
              </div>
              <p className="mt-2 text-[14px] text-[#8B95A1]">{t.desc}</p>

              {!result ? (
                <>
              {/* 입력 모드 — 직접 입력 vs Aply 포지션 선택 (두꺼운 텍스트 탭) */}
              <div className="mt-6 flex items-center gap-6">
                {(["text", "position"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setInputMode(m);
                      if (m === "position" && pager.positions === null) pager.search();
                    }}
                    className={`relative -mb-px pb-2.5 text-[16px] font-extrabold tracking-[-0.01em] transition-colors ${
                      inputMode === m ? "text-[#191F28]" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "text" ? t.modeText : t.modePosition}
                    {inputMode === m ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                ))}
              </div>

              {inputMode === "text" ? (
                <label className="mt-3 block text-[12.5px] font-medium text-foreground/80">
                  {t.jdLabel}
                  <textarea
                    value={jobText}
                    onChange={(e) => {
                      setJobText(e.target.value);
                      setSelectedPosId(null);
                    }}
                    placeholder={t.jdPlaceholder}
                    rows={7}
                    maxLength={6000}
                    className="mt-1 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 py-2.5 text-[14px] leading-relaxed focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                  />
                </label>
              ) : (
                <div className="mt-3">
                  {/* 검색 — 입력은 다른 필드와 동일, 버튼은 우측 밖으로 */}
                  <div className="flex items-center gap-2">
                    <input
                      value={pager.query}
                      onChange={(e) => pager.setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          pager.search();
                        }
                      }}
                      placeholder={t.positionSearchPlaceholder}
                      className="h-11 w-full flex-1 rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] text-slate-800 focus:border-[#0B46E8] focus:bg-white focus:outline-none placeholder:text-slate-400"
                    />
                    <Button
                      size="lg"
                      type="button"
                      className="h-11 shrink-0 rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d]"
                      onClick={() => pager.search()}
                    >
                      {t.searchBtn}
                    </Button>
                  </div>
                  {/* 목록 — 포지션 탐색의 PositionRow 그대로(한 페이지 5개) */}
                  <div className="mt-3 space-y-2">
                    {pager.loading ? (
                      <div className="flex justify-center py-6 text-muted-foreground">
                        <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
                      </div>
                    ) : pager.positions && pager.positions.length > 0 ? (
                      pager.positions.map((p) => (
                        <PositionRow
                          key={p.id}
                          p={mapPublicPositionToCard(p, locale)}
                          isOwnPartnerPosting={false}
                          isStudentUser
                          isApplied={false}
                          isFavorite={false}
                          onToggleFavorite={() => {}}
                          onApply={() => {}}
                          locale={locale}
                          compact
                          onSelect={() => selectPosition(p)}
                          selected={selectedPosId === p.id}
                        />
                      ))
                    ) : (
                      <p className="py-6 text-center text-[13px] text-muted-foreground">{t.positionEmpty}</p>
                    )}
                  </div>
                  {/* 페이지네이션 — 숫자 페이지(1,2,3…N) */}
                  {!pager.loading ? (
                    <PositionPagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
                  ) : null}
                </div>
              )}

              <Button
                variant="default"
                size="lg"
                className="mt-3 w-full"
                disabled={analyzing || (inputMode === "position" ? !selectedPosId : !jobText.trim())}
                onClick={() => void analyze()}
              >
                {analyzing ? <CircleNotch className="animate-spin" weight="bold" /> : null}
                {analyzing ? (fetching ? t.fetchingUrl : t.analyzing) : t.analyze}
                {!analyzing ? <AiTicketCost feature="tailor_analyze" tone="plain" /> : null}
              </Button>

              <p className="mt-6 rounded-xl bg-[#F2F4F6] px-4 py-6 text-center text-[13px] text-muted-foreground">
                {t.emptyHint}
              </p>
                </>
              ) : (
                <>
                <style>{`@keyframes rmt-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
                {/* 분석한 공고 — 결과 화면에선 입력부를 접고, 고른 포지션은 카드 그대로 보여준다 */}
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-bold text-[#191F28]">{t.analyzedJob}</span>
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="shrink-0 text-[12.5px] font-semibold text-[#0B46E8] hover:underline"
                    >
                      {t.changeJob}
                    </button>
                  </div>
                  {selectedPosition ? (
                    <div className="mt-2">
                      <PositionRow
                        p={mapPublicPositionToCard(selectedPosition, locale)}
                        isOwnPartnerPosting={false}
                        isStudentUser
                        isApplied={false}
                        isFavorite={false}
                        onToggleFavorite={() => {}}
                        onApply={() => {}}
                        locale={locale}
                        compact
                        onSelect={() => {}}
                        selected
                      />
                    </div>
                  ) : (
                    <div className="mt-2 rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
                      {analyzedLabel}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3 pb-4">
                  {/* 점수 히어로 — 원형 게이지 + 판정 */}
                  <div className="rounded-3xl border border-[#F2F4F6] bg-white p-6 text-center shadow-card" style={{ animation: "rmt-rise 0.5s both" }}>
                    <div className="relative mx-auto h-[136px] w-[136px]">
                      <ScoreRing score={result.score} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[36px] font-extrabold leading-none tabular-nums" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                        <span className="mt-1 text-[12px] font-medium text-[#8B95A1]">/ 100</span>
                      </div>
                    </div>
                    <p className="mt-4 text-[18px] font-bold text-[#191F28]">{verdict(result.score)}</p>
                    <p className="mt-1 text-[13px] text-[#8B95A1]">{t.scoreLabel}</p>
                  </div>

                  {/* 보유 / 부족 — 스탯 카드 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {result.matched.length > 0 ? (
                      <div className="rounded-2xl border border-[#F2F4F6] bg-white p-4" style={{ animation: "rmt-rise 0.5s 0.05s both" }}>
                        <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#15C47E]">
                          <CheckCircle weight="fill" className="h-4 w-4" /> {t.matchedTitle}
                          <span className="ml-auto rounded-full bg-[#15C47E]/12 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#0E9E66]">{result.matched.length}</span>
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {result.matched.map((m, i) => (
                            <span key={i} className="rounded-full bg-[#15C47E]/10 px-2.5 py-1 text-[12px] font-medium text-[#0E9E66]">{m}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {result.missing.length > 0 ? (
                      <div className="rounded-2xl border border-[#F2F4F6] bg-white p-4" style={{ animation: "rmt-rise 0.5s 0.1s both" }}>
                        <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#D97706]">
                          <WarningCircle weight="fill" className="h-4 w-4" /> {t.missingTitle}
                          <span className="ml-auto rounded-full bg-[#D97706]/12 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#B45309]">{result.missing.length}</span>
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {result.missing.map((m, i) => (
                            <span key={i} className="rounded-full bg-[#FBEFD9] px-2.5 py-1 text-[12px] font-medium text-[#B45309]">{m}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* 맞춤 제안 — 번호 카드 */}
                  {result.suggestions.length > 0 ? (
                    <div className="rounded-2xl border border-[#F2F4F6] bg-white p-4" style={{ animation: "rmt-rise 0.5s 0.15s both" }}>
                      <p className="px-0.5 text-[14px] font-bold text-[#191F28]">{t.suggestionsTitle}</p>
                      <div className="mt-3 space-y-2.5">
                        {result.suggestions.map((s, i) => (
                          <div key={i} className="rounded-2xl bg-[#F8F9FB] p-3.5">
                            <div className="flex gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[12px] font-bold text-[#0B46E8]">{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                {s.title ? <p className="text-[13.5px] font-bold text-[#191F28]">{s.title}</p> : null}
                                {s.text ? <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#4E5968]">{s.text}</p> : null}
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                </>
              )}
            </div>
          </div>
          <ToolPreviewColumn resumeContent={builderContent} design={design} resumePdfHref={`/resume-maker/${resumeId}/preview`} coverLetter={coverLetter} />
        </div>
      )}
      {quotaOpen ? <AiQuotaModal resetAt={resetAt} onClose={() => setQuotaOpen(false)} /> : null}
    </ResumeMakerShell>
  );
}
