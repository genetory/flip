"use client";

// Phase 7 운영자 개입 관리 — 규칙 기반 신호 스캔 + 우선순위 목록 + 상태/담당/AI 요약(사실과 분리).
import { useEffect, useState } from "react";
import { CircleNotch, Sparkle, ShieldWarning } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../../components/AplyFooter";
import { trackCareerFunnel } from "../../../../lib/analytics";
import { fetchInterventions, scanInterventions, updateIntervention, generateInterventionSummary, type Intervention } from "../../../../lib/launch/league";

const PRIORITY_TONE: Record<string, string> = { critical: "bg-[#FEF2F2] text-[#F04452] border-[#F04452]/30", high: "bg-[#FFFBEB] text-[#C77700] border-[#C77700]/30", medium: "bg-[#F5F8FF] text-[#0B46E8] border-[#0B46E8]/20", low: "bg-[#FAFBFC] text-[#8B95A1] border-[#EEF1F5]", resolved: "bg-[#E7F7EF] text-[#0A9B59] border-[#0A9B59]/20" };
const REASON_LABEL: Record<string, string> = { human_review_requested: "사람 검토 요청", fatigue_or_quit: "피로/중단 의사", document_critical: "지원서 critical", deadline_low_progress: "마감·저진행", stalled_7d: "7일 정체", stalled_4d: "4일 정체", mission_incomplete: "필수 미션 미완", repeated_weakness: "반복 취약점", unsupported_claims: "근거 부족 주장", low_ai_confidence: "AI 낮은 확신" };

export default function OpsInterventionsPage() {
  const [items, setItems] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [cohortId, setCohortId] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await fetchInterventions());
    } catch {
      /* 권한 없거나 실패 */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    trackCareerFunnel("career_admin_cohort_dashboard_viewed");
    void reload();
  }, []);

  const scan = async () => {
    if (!cohortId.trim()) return;
    setBusy("scan");
    setMsg("");
    try {
      const r = await scanInterventions(cohortId.trim());
      setMsg(`스캔 완료: ${r.scanned}명 중 ${r.created}건 신규`);
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };
  const patch = async (id: string, p: Parameters<typeof updateIntervention>[1], eventName?: "career_intervention_status_changed" | "career_intervention_resolved" | "career_intervention_assigned") => {
    setBusy(id);
    try {
      await updateIntervention(id, p);
      if (eventName) trackCareerFunnel(eventName);
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };
  const summarize = async (id: string) => {
    setBusy(`ai-${id}`);
    try {
      await generateInterventionSummary(id);
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-4xl px-5 pt-8">
          <h1 className="text-[24px] font-black tracking-[-0.02em] text-[#191F28]"><ShieldWarning className="mr-1 inline h-6 w-6 text-[#C77700]" weight="fill" /> 개입 관리</h1>
          <p className="mt-1 text-[13px] text-[#8B95A1]">규칙 기반 신호로 도움이 필요한 학생을 찾아요. AI 요약은 사실과 분리해 참고용으로만.</p>

          {/* 스캔 */}
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-3">
            <input value={cohortId} onChange={(e) => setCohortId(e.target.value)} placeholder="cohortId 입력 후 신호 스캔" className="min-w-0 flex-1 rounded-lg border border-[#E5E8EB] px-3 py-2 text-[13px] outline-none focus:border-[#0B46E8]" />
            <button type="button" onClick={() => void scan()} disabled={busy === "scan" || !cohortId.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#191F28] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60">{busy === "scan" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}신호 스캔</button>
          </div>
          {msg ? <p className="mt-2 text-[12px] text-[#4E5968]">{msg}</p> : null}

          {/* 목록 */}
          {loading ? (
            <p className="mt-6 flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> 불러오는 중…</p>
          ) : items.length === 0 ? (
            <p className="mt-6 text-[13px] text-[#8B95A1]">개입이 필요한 학생이 없어요. (cohortId로 신호를 스캔해 보세요.)</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {items.map((iv) => (
                <div key={iv.id} className={`rounded-2xl border p-3.5 ${PRIORITY_TONE[iv.priority] ?? PRIORITY_TONE.low}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-black text-[#191F28]">{iv.student?.name || iv.student?.email || `학생 …${iv.studentUserId.slice(-6)}`}</p>
                      <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em]">{iv.priority} · {iv.status}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {iv.reasonCodes.map((r) => <span key={r} className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-[#4E5968]">{REASON_LABEL[r] ?? r}</span>)}
                      </div>
                    </div>
                  </div>
                  {/* AI 요약(사실 분리) */}
                  {iv.aiSummary?.ai ? (
                    <div className="mt-2 rounded-xl bg-white/80 p-2.5 text-[12px] leading-relaxed">
                      {iv.aiSummary.facts?.length ? <p><b className="text-[#191F28]">사실</b> {iv.aiSummary.facts.join(" · ")}</p> : null}
                      {iv.aiSummary.ai.interpretation ? <p className="mt-1"><b className="text-[#0B46E8]">AI 해석</b> {iv.aiSummary.ai.interpretation}</p> : null}
                      {iv.aiSummary.ai.recommendedAction ? <p className="mt-1"><b className="text-[#3A6B00]">추천 조치</b> {iv.aiSummary.ai.recommendedAction}</p> : null}
                    </div>
                  ) : null}
                  {/* 액션 */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => void summarize(iv.id)} disabled={busy === `ai-${iv.id}`} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8] disabled:opacity-60">{busy === `ai-${iv.id}` ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />}AI 요약</button>
                    {iv.status !== "in_review" ? <button type="button" onClick={() => void patch(iv.id, { status: "in_review" }, "career_intervention_status_changed")} disabled={busy === iv.id} className="rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#4E5968]">검토 시작</button> : null}
                    {iv.status !== "resolved" ? <button type="button" onClick={() => void patch(iv.id, { status: "resolved", note: "해결" }, "career_intervention_resolved")} disabled={busy === iv.id} className="rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#0A9B59]">해결</button> : null}
                    <button type="button" onClick={() => { const reason = prompt("기각 사유"); if (reason) void patch(iv.id, { status: "dismissed", dismissReason: reason }, "career_intervention_status_changed"); }} disabled={busy === iv.id} className="rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#8B95A1]">기각</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
