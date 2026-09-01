"use client";

// Phase 9 파일럿 운영 모니터링 — 준비 체크리스트 · 중단조건 · 전체/학생/문제 현황 · 퍼널 · 비용 · 정성 피드백 · 종료 리포트.
// 운영자 전용. 원문/민감정보 없음(설문·피드백은 category/척도 집계만). 실사용자 초대·발송 없음.
import { useCallback, useEffect, useState } from "react";
import { CircleNotch, Warning, CheckCircle, XCircle } from "@phosphor-icons/react";
import { trackCareerFunnel } from "../../../../lib/analytics";
import { studentStatusLabel } from "../../../../lib/launch/copy";
import { fetchCohorts, type OpsCohort } from "../../../../lib/launch/enrollment-client";
import {
  fetchPilotReadiness,
  fetchPilotMonitor,
  fetchPilotFunnel,
  fetchPilotCost,
  fetchPilotFeedback,
  setPilotStudentStatus,
  resolvePilotFeedback,
  type PilotReadiness,
  type PilotMonitor,
  type PilotFunnel,
  type PilotCost,
  type QualFeedback
} from "../../../../lib/launch/pilot-client";

const STATUS_TONE: Record<string, string> = {
  active: "bg-[#E7F7EF] text-[#0A9B59]",
  at_risk: "bg-[#FFFBEB] text-[#C77700]",
  intervention_required: "bg-[#FEF2F2] text-[#F04452]",
  onboarding: "bg-[#F5F8FF] text-[#0B46E8]",
  registered: "bg-[#FAFBFC] text-[#8B95A1]",
  invited: "bg-[#FAFBFC] text-[#8B95A1]",
  paused: "bg-[#F2F4F6] text-[#4E5968]",
  completed: "bg-[#EDEBFF] text-[#6339E5]",
  withdrawn: "bg-[#F2F4F6] text-[#8B95A1]"
};
const SEV_TONE: Record<string, string> = { critical: "text-[#F04452]", high: "text-[#C77700]", medium: "text-[#0B46E8]", low: "text-[#8B95A1]" };
const STATUS_OPTIONS = ["invited", "registered", "onboarding", "active", "at_risk", "intervention_required", "paused", "completed", "withdrawn"];

type Tab = "readiness" | "monitor" | "funnel" | "cost" | "feedback";

export default function PilotOpsPage() {
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [cohortId, setCohortId] = useState("");
  const [tab, setTab] = useState<Tab>("monitor");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [readiness, setReadiness] = useState<PilotReadiness | null>(null);
  const [monitor, setMonitor] = useState<PilotMonitor | null>(null);
  const [funnel, setFunnel] = useState<PilotFunnel | null>(null);
  const [cost, setCost] = useState<PilotCost | null>(null);
  const [feedback, setFeedback] = useState<{ categories: { key: string; label: string; severity: string }[]; feedback: QualFeedback[] } | null>(null);

  useEffect(() => {
    trackCareerFunnel("career_admin_cohort_dashboard_viewed");
    void (async () => {
      try {
        const list = await fetchCohorts();
        setCohorts(list);
        if (list[0]) setCohortId(list[0].id);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "기수를 불러오지 못했어요.");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!cohortId) return;
    setLoading(true);
    setErr("");
    try {
      if (tab === "readiness") setReadiness(await fetchPilotReadiness(cohortId));
      else if (tab === "monitor") setMonitor(await fetchPilotMonitor(cohortId));
      else if (tab === "funnel") setFunnel(await fetchPilotFunnel(cohortId));
      else if (tab === "cost") setCost(await fetchPilotCost(cohortId));
      else if (tab === "feedback") setFeedback(await fetchPilotFeedback(cohortId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [cohortId, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const overrideStatus = async (userId: string, status: string) => {
    try {
      await setPilotStudentStatus(userId, status || null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    }
  };
  const markResolved = async (id: string) => {
    try {
      await resolvePilotFeedback(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    }
  };

  return (
    <div className="py-6">
      <div className="w-full max-w-[1120px] mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h1 className="text-[20px] font-bold text-[#191F28]">파일럿 운영 모니터링</h1>
            <p className="text-[13px] text-[#8B95A1] mt-0.5">10~20명 파일럿 기수의 진행·문제·비용을 한 화면에서 확인해요. (원문·민감정보 미표시)</p>
          </div>
          <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E5E8EB] bg-white text-[13px]">
            {cohorts.length === 0 && <option value="">기수 없음</option>}
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.university} {c.name} ({c.enrolledCount}명)
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 mb-4 border-b border-[#EEF1F5]">
          {([["monitor", "모니터링"], ["readiness", "준비 체크리스트"], ["funnel", "핵심 퍼널"], ["cost", "LLM 비용"], ["feedback", "정성 피드백"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-[13px] font-medium border-b-2 -mb-px ${tab === k ? "border-[#0B46E8] text-[#0B46E8]" : "border-transparent text-[#8B95A1]"}`}>
              {label}
            </button>
          ))}
        </div>

        {err && <div className="mb-3 px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#F04452] text-[13px]">{err}</div>}
        {loading && (
          <div className="flex items-center gap-2 text-[#8B95A1] text-[13px] py-8 justify-center">
            <CircleNotch className="animate-spin" size={18} /> 불러오는 중…
          </div>
        )}

        {!loading && tab === "monitor" && monitor && (
          <div className="flex flex-col gap-4">
            {monitor.stopConditions.triggered.length > 0 && (
              <div className={`rounded-xl border p-4 ${monitor.stopConditions.anyCritical ? "bg-[#FEF2F2] border-[#F04452]/30" : "bg-[#FFFBEB] border-[#C77700]/30"}`}>
                <div className="flex items-center gap-2 font-bold text-[14px] mb-2">
                  <Warning size={18} className={monitor.stopConditions.anyCritical ? "text-[#F04452]" : "text-[#C77700]"} />
                  중단 조건 감지 {monitor.stopConditions.anyCritical && "(치명적 — 확대 중단 검토)"}
                </div>
                <ul className="text-[13px] space-y-1">
                  {monitor.stopConditions.triggered.map((s) => (
                    <li key={s.key} className={SEV_TONE[s.severity]}>
                      • {s.label} — {s.detail}
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-[#8B95A1] mt-2">감지 시 feature flag 비활성화·복구 절차를 따르세요. 자동으로 프로덕션 설정을 변경하지 않습니다.</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["등록", monitor.overview.enrolled],
                ["오늘 활동", monitor.overview.activeToday],
                ["활성", monitor.overview.active],
                ["위험(3일+)", monitor.overview.stalled3d],
                ["개입 필요", monitor.overview.interventionRequired],
                ["완주", monitor.overview.completed],
                ["SLA 초과", monitor.problems.slaBreaches],
                ["긴급 피드백", monitor.problems.qualCritical]
              ].map(([label, v]) => (
                <div key={label as string} className="bg-white rounded-xl border border-[#EEF1F5] p-3">
                  <div className="text-[12px] text-[#8B95A1]">{label}</div>
                  <div className="text-[22px] font-bold text-[#191F28] tabular-nums">{v as number}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#EEF1F5] p-3">
              <div className="text-[13px] font-semibold mb-2">주차별 완료</div>
              <div className="flex gap-4 text-[13px]">
                {monitor.overview.weekCompletion.map((w) => (
                  <span key={w.week} className="tabular-nums">
                    W{w.week}: <b>{w.count}</b>
                  </span>
                ))}
              </div>
            </div>

            {monitor.interventions.length > 0 && (
              <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
                <div className="px-3 py-2 text-[13px] font-semibold border-b border-[#EEF1F5]">미해결 개입 · SLA</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[#8B95A1] text-left">
                        <th className="px-3 py-2 font-medium">학생</th>
                        <th className="px-3 py-2 font-medium">우선순위</th>
                        <th className="px-3 py-2 font-medium">상태</th>
                        <th className="px-3 py-2 font-medium">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitor.interventions.map((iv) => (
                        <tr key={iv.id} className="border-t border-[#F2F4F6]">
                          <td className="px-3 py-2">{iv.studentName ?? "—"}</td>
                          <td className="px-3 py-2">{iv.priority}</td>
                          <td className="px-3 py-2">{iv.status}</td>
                          <td className={`px-3 py-2 ${iv.sla.breached ? "text-[#F04452] font-semibold" : "text-[#8B95A1]"}`}>
                            {iv.sla.label} {iv.sla.breached ? `· ${iv.sla.hoursOverdue}h 초과` : "· 이내"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
              <div className="px-3 py-2 text-[13px] font-semibold border-b border-[#EEF1F5]">학생별 현황</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[#8B95A1] text-left">
                      <th className="px-3 py-2 font-medium">학생</th>
                      <th className="px-3 py-2 font-medium">상태</th>
                      <th className="px-3 py-2 font-medium">주차</th>
                      <th className="px-3 py-2 font-medium">최근활동</th>
                      <th className="px-3 py-2 font-medium">산출물</th>
                      <th className="px-3 py-2 font-medium">운영자 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitor.students.map((s) => (
                      <tr key={s.userId} className="border-t border-[#F2F4F6]">
                        <td className="px-3 py-2">{s.name ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[12px] ${STATUS_TONE[s.status] ?? ""}`} title={s.statusReasons.join(", ")}>
                            {studentStatusLabel(s.status)}
                          </span>
                          {s.needsConfirm && <span className="ml-1 text-[11px] text-[#C77700]">확인필요</span>}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{s.weeksCompleted}/4</td>
                        <td className="px-3 py-2 tabular-nums">{s.lastActivityDaysAgo == null ? "—" : `${s.lastActivityDaysAgo}일 전`}</td>
                        <td className="px-3 py-2 text-[12px] text-[#4E5968]">
                          {[s.targetConfirmed && "직무", s.packageFinalized && "패키지", s.initialMockDone && "초면접", s.transferPassed && "전이", s.finalMockDone && "최종"].filter(Boolean).join("·") || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <select value={s.statusSource === "operator" ? s.status : ""} onChange={(e) => overrideStatus(s.userId, e.target.value)} className="h-7 px-2 rounded border border-[#E5E8EB] text-[12px]">
                            <option value="">(자동)</option>
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {studentStatusLabel(o)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-3 py-2 text-[12px] text-[#8B95A1]">withdrawn·intervention_required 는 자동 확정하지 않아요. 근거(상태에 마우스오버)를 보고 운영자가 확정하세요.</p>
            </div>
          </div>
        )}

        {!loading && tab === "readiness" && readiness && (
          <div className="bg-white rounded-xl border border-[#EEF1F5] p-4">
            <div className={`mb-3 px-3 py-2 rounded-lg text-[13px] font-semibold ${readiness.readiness.ready ? "bg-[#E7F7EF] text-[#0A9B59]" : "bg-[#FFFBEB] text-[#C77700]"}`}>
              {readiness.readiness.ready ? "필수 항목 모두 충족 — 파일럿 활성화 가능(실제 활성화·초대는 승인 후)" : `필수 미충족 ${readiness.readiness.requiredMissing.length}건 — 활성화 전 보완 필요`}
            </div>
            <ul className="divide-y divide-[#F2F4F6]">
              {readiness.readiness.items.map((it) => (
                <li key={it.key} className="flex items-center gap-2 py-2 text-[13px]">
                  {it.ok ? <CheckCircle size={18} className="text-[#0A9B59]" weight="fill" /> : <XCircle size={18} className={it.required ? "text-[#F04452]" : "text-[#C9CDD2]"} weight="fill" />}
                  <span className={it.ok ? "text-[#191F28]" : "text-[#4E5968]"}>{it.label}</span>
                  {it.required && <span className="text-[11px] text-[#F04452]">필수</span>}
                  {!it.auto && <span className="text-[11px] text-[#8B95A1]">수동확인</span>}
                  {it.note && <span className="text-[12px] text-[#8B95A1] ml-auto">{it.note}</span>}
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-[#8B95A1] mt-2">수동확인 항목은 monitoringConfiguration.manualChecks 로 기록하세요. 실제 활성화·사용자 초대는 명시 승인 전에는 실행하지 않습니다.</p>
          </div>
        )}

        {!loading && tab === "funnel" && funnel && (
          <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
            <div className="px-3 py-2 text-[13px] font-semibold border-b border-[#EEF1F5] flex items-center justify-between">
              <span>핵심 퍼널 (총 {funnel.funnel.total}명)</span>
              {funnel.smallSample && <span className="text-[12px] text-[#C77700]">표본 &lt;8 — 전환율보다 실인원으로 해석</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[#8B95A1] text-left">
                    <th className="px-3 py-2 font-medium">단계</th>
                    <th className="px-3 py-2 font-medium">인원</th>
                    <th className="px-3 py-2 font-medium">직전대비</th>
                    <th className="px-3 py-2 font-medium">시작대비</th>
                    <th className="px-3 py-2 font-medium">중앙 소요</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.funnel.steps.map((s) => (
                    <tr key={s.key} className="border-t border-[#F2F4F6]">
                      <td className="px-3 py-2">{s.label}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">{s.count}</td>
                      <td className={`px-3 py-2 tabular-nums ${s.conversionFromPrev != null && s.conversionFromPrev < 50 ? "text-[#C77700]" : ""}`}>{s.conversionFromPrev == null ? "—" : `${s.conversionFromPrev}%`}</td>
                      <td className="px-3 py-2 tabular-nums">{s.conversionFromStart == null ? "—" : `${s.conversionFromStart}%`}</td>
                      <td className="px-3 py-2 tabular-nums text-[#8B95A1]">{s.medianHoursFromStart == null ? "—" : `${s.medianHoursFromStart}h`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {funnel.engagement && (
              <div className="border-t border-[#EEF1F5] p-3">
                <div className="text-[13px] font-semibold mb-2">참여(engagement) {funnel.engagementNote && <span className="text-[12px] font-normal text-[#8B95A1]">— {funnel.engagementNote}</span>}</div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-[#4E5968]">
                  {funnel.engagement.byWeek.map((w) => (
                    <span key={w.week} className="tabular-nums">W{w.week}: {w.activeMinutes}분·재진입 {w.reEntries}</span>
                  ))}
                  <span className="tabular-nums">제안 수락률: {funnel.engagement.suggestion.acceptRatePct == null ? "—" : `${funnel.engagement.suggestion.acceptRatePct}%`}</span>
                  <span className="tabular-nums">건너뛰기 {funnel.engagement.signals.skip}·잘모름 {funnel.engagement.signals.unsure}·리그조회 {funnel.engagement.signals.leagueViews}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && tab === "cost" && cost && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["총 추정비용", `$${cost.totals.estCostUsd}`],
                ["호출 수", cost.totals.calls],
                ["실패율", `${cost.totals.failRatePct}%`],
                ["완주자당", cost.totals.perCompleterUsd == null ? "—" : `$${cost.totals.perCompleterUsd}`]
              ].map(([label, v]) => (
                <div key={label as string} className="bg-white rounded-xl border border-[#EEF1F5] p-3">
                  <div className="text-[12px] text-[#8B95A1]">{label}</div>
                  <div className="text-[20px] font-bold text-[#191F28] tabular-nums">{v as string}</div>
                </div>
              ))}
            </div>
            {cost.today.spike && <div className="px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#F04452] text-[13px]">오늘 비용(${cost.today.costUsd})이 기준(${cost.today.baselineDailyUsd})의 3배를 초과했어요.</div>}
            <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
              <div className="px-3 py-2 text-[13px] font-semibold border-b border-[#EEF1F5]">기능별 비용(추정)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[#8B95A1] text-left">
                      <th className="px-3 py-2 font-medium">기능</th>
                      <th className="px-3 py-2 font-medium">호출</th>
                      <th className="px-3 py-2 font-medium">입력토큰</th>
                      <th className="px-3 py-2 font-medium">출력토큰</th>
                      <th className="px-3 py-2 font-medium">재시도</th>
                      <th className="px-3 py-2 font-medium">실패</th>
                      <th className="px-3 py-2 font-medium">비용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cost.byFeature.map((f) => (
                      <tr key={f.feature} className="border-t border-[#F2F4F6]">
                        <td className="px-3 py-2">{f.feature}</td>
                        <td className="px-3 py-2 tabular-nums">{f.calls}</td>
                        <td className="px-3 py-2 tabular-nums">{f.inputTokens.toLocaleString()}</td>
                        <td className="px-3 py-2 tabular-nums">{f.outputTokens.toLocaleString()}</td>
                        <td className="px-3 py-2 tabular-nums">{f.retries}</td>
                        <td className={`px-3 py-2 tabular-nums ${f.failures > 0 ? "text-[#F04452]" : ""}`}>{f.failures}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold">${f.estCostUsd}</td>
                      </tr>
                    ))}
                    {cost.byFeature.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-[#8B95A1]">아직 집계된 비용이 없어요.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="px-3 py-2 text-[12px] text-[#8B95A1]">단가는 근사 추정으로 실제 청구와 다를 수 있어요. 캐시로 절감되면 호출 수가 줄어드는 형태로 반영됩니다.</p>
            </div>
          </div>
        )}

        {!loading && tab === "feedback" && feedback && (
          <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
            <div className="px-3 py-2 text-[13px] font-semibold border-b border-[#EEF1F5]">정성 피드백 (원문 없음 · category/severity)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[#8B95A1] text-left">
                    <th className="px-3 py-2 font-medium">학생</th>
                    <th className="px-3 py-2 font-medium">분류</th>
                    <th className="px-3 py-2 font-medium">심각도</th>
                    <th className="px-3 py-2 font-medium">주차/단계</th>
                    <th className="px-3 py-2 font-medium">처리</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.feedback.map((f) => {
                    const label = feedback.categories.find((c) => c.key === f.category)?.label ?? f.category;
                    return (
                      <tr key={f.id} className="border-t border-[#F2F4F6]">
                        <td className="px-3 py-2">{f.name ?? "—"}</td>
                        <td className="px-3 py-2">{label}</td>
                        <td className={`px-3 py-2 ${SEV_TONE[f.severity]}`}>{f.severity}</td>
                        <td className="px-3 py-2 text-[12px] text-[#8B95A1]">{f.currentWeek ? `W${f.currentWeek}` : ""} {f.currentStep ?? ""}</td>
                        <td className="px-3 py-2">
                          {f.resolvedAt ? <span className="text-[12px] text-[#0A9B59]">해결됨</span> : <button onClick={() => markResolved(f.id)} className="text-[12px] text-[#0B46E8]">해결 표시</button>}
                        </td>
                      </tr>
                    );
                  })}
                  {feedback.feedback.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-[#8B95A1]">아직 피드백이 없어요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !cohortId && <div className="text-center text-[#8B95A1] py-12 text-[13px]">기수를 먼저 생성하세요.</div>}
      </div>
    </div>
  );
}
