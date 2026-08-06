"use client";

// 파트너 지원자 상세 — 2단 레이아웃.
// 상단(전폭): 프로필 + 채용 단계 스테퍼 + 상태 변경.
// 좌: 인적사항 · 지원 서류 · 이력서 | 우: 내부 메모 · 면접 · 메시지.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, PaperPlaneTilt, Plus, ArrowSquareOut, Check, CaretRight, CaretDown, Sparkle, Briefcase } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_APPLICANT_STATUS, PARTNER_RECOMMENDATION, PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import {
  getMyPartnerApplicantById,
  getMyPartnerPositionById,
  getPartnerApplicantDocumentSummary,
  updateMyPartnerApplicantState,
  getInterviewSlotsForApplication,
  proposeInterviewSlots,
  getPartnerApplicantMessages,
  sendPartnerApplicantMessage,
  type PartnerApplicantDetail,
  type PartnerApplicantStatus,
  type InterviewSlot,
  type PartnerApplicantMessage,
  type PartnerPosition
} from "../../../lib/member-profile-client";

const EMPLOYMENT_LABEL: Record<PartnerPosition["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
  UNPAID_INTERN: "무급 인턴"
};

const STATUS_ACTIONS: PartnerApplicantStatus[] = ["REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED"];
const STEPS: { label: string; reach: PartnerApplicantStatus[] }[] = [
  { label: "지원", reach: ["APPLIED", "REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "COMPLETED"] },
  { label: "검토", reach: ["REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "COMPLETED"] },
  { label: "면접", reach: ["INTERVIEW", "OFFERED", "ACCEPTED", "COMPLETED"] },
  { label: "합격", reach: ["OFFERED", "ACCEPTED", "COMPLETED"] }
];

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
}


// 면접 시간 선택 — 날짜 + 30분 단위 시간 드롭다운(00:00 ~ 24:00).
type SlotRow = { date: string; time: string; location: string };
const EMPTY_SLOT_ROW: SlotRow = { date: "", time: "", location: "" };
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h <= 23; h += 1) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  out.push("24:00"); // 자정(다음 날 00:00)
  return out;
})();
// 날짜·시간·장소가 모두 채워진 행만 유효한 슬롯으로 인정.
function slotsFromRows(rows: SlotRow[]): { startsAt: string; endsAt: string; location?: string }[] {
  return rows
    .filter((r) => r.date && r.time && r.location.trim())
    .map((r) => {
      // 24:00 은 다음 날 00:00 으로 처리.
      const d = r.time === "24:00" ? new Date(`${r.date}T00:00`) : new Date(`${r.date}T${r.time}`);
      if (r.time === "24:00") d.setDate(d.getDate() + 1);
      d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
      return {
        startsAt: d.toISOString(),
        endsAt: new Date(d.getTime() + 60 * 60000).toISOString(),
        location: r.location.trim() || undefined
      };
    });
}

function InterviewSlotRows({ rows, setRows, max = 3 }: { rows: SlotRow[]; setRows: React.Dispatch<React.SetStateAction<SlotRow[]>>; max?: number }) {
  const upd = (i: number, patch: Partial<SlotRow>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-xl bg-white p-2.5">
          <div className="flex gap-1.5">
            <input type="date" value={r.date} onChange={(e) => upd(i, { date: e.target.value })} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2 text-[13px] text-[#191F28] outline-none [color-scheme:light]" />
            <div className="relative w-[104px] shrink-0">
              <select value={r.time} onChange={(e) => upd(i, { time: e.target.value })} className="w-full appearance-none rounded-lg bg-[#F5F6F8] py-2 pl-2.5 pr-7 text-[13px] text-[#191F28] outline-none [color-scheme:light]">
                <option value="">시간</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input value={r.location} onChange={(e) => upd(i, { location: e.target.value })} placeholder="장소 · 예) 본사 3층 / 온라인" className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2 text-[13px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]" />
            {rows.length > 1 ? (
              <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="시간 삭제" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]"><X className="h-4 w-4" /></button>
            ) : null}
          </div>
        </div>
      ))}
      {rows.length < max ? (
        <button type="button" onClick={() => setRows((rs) => [...rs, { ...EMPTY_SLOT_ROW }])} className="inline-flex w-fit items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]"><Plus className="h-3.5 w-3.5" weight="bold" /> 시간 추가</button>
      ) : null}
    </div>
  );
}

export function PartnerApplicantDetailScreen({ applicantId }: { applicantId: string }) {
  const toast = useTalentPopup();
  const [app, setApp] = useState<PartnerApplicantDetail | null>(null);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [messages, setMessages] = useState<PartnerApplicantMessage[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [updating, setUpdating] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [memo, setMemo] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);
  const [pending, setPending] = useState<PartnerApplicantStatus | null>(null); // 변경 확인 대기 상태
  const [summary, setSummary] = useState<{ resumeBullets: string[]; coverBullets: string[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [position, setPosition] = useState<PartnerPosition | null>(null);

  function loadSlots(appId: string | null) {
    if (!appId) return;
    void getInterviewSlotsForApplication(appId).then(setSlots).catch(() => {});
  }
  function loadMessages(appId: string | null) {
    if (!appId) return;
    void getPartnerApplicantMessages(appId).then(setMessages).catch(() => {});
  }
  function load() {
    setStatus("loading");
    getMyPartnerApplicantById(applicantId)
      .then((d) => {
        setApp(d);
        setMemo(d.memo ?? "");
        setStatus("ready");
        loadSlots(d.applicationId);
        loadMessages(d.applicationId);
        // 지원 공고 정보(고용형태·근무지·상태) — 별도 로드.
        void getMyPartnerPositionById(d.positionId).then(setPosition).catch(() => setPosition(null));
        // LLM 문서 요약(불렛) — 별도 로드.
        setSummaryLoading(true);
        getPartnerApplicantDocumentSummary(applicantId)
          .then(setSummary)
          .catch(() => setSummary({ resumeBullets: [], coverBullets: [] }))
          .finally(() => setSummaryLoading(false));
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  // 상태 변경은 지원자에게 알림이 발송되므로 확인 팝업 후 실행한다.
  function requestStatus(next: PartnerApplicantStatus) {
    if (updating || !app || app.status === next) return;
    setPending(next);
  }
  // 상태 변경 + (선택) 부가 작업: 면접→시간 제안, 불합격→사유 메시지 전송.
  // 상태 변경과 부가 작업의 실패를 분리해 안내한다.
  async function confirmStatus(extra: { slots?: { startsAt: string; endsAt: string; location?: string }[]; reason?: string }) {
    const next = pending;
    if (updating || !app || !next) return;
    const appId = app.applicationId;
    const label = PARTNER_APPLICANT_STATUS[next].label;
    setUpdating(true);

    // 1) 상태 변경
    let updated: PartnerApplicantDetail;
    try {
      updated = await updateMyPartnerApplicantState(applicantId, { status: next });
      setApp(updated);
    } catch {
      toast.error("상태 변경에 실패했어요.");
      setUpdating(false);
      return;
    }

    // 2) 부가 작업(선택) — 여기서 실패해도 상태 변경은 유지된다.
    try {
      if (next === "INTERVIEW" && appId && extra.slots?.length) {
        await proposeInterviewSlots(appId, extra.slots);
        loadSlots(appId);
      }
      if (next === "REJECTED" && appId && extra.reason?.trim()) {
        await sendPartnerApplicantMessage(appId, extra.reason.trim());
        loadMessages(appId);
      }
      toast.success(`상태를 '${label}'로 바꿨어요`);
    } catch {
      toast.error(next === "INTERVIEW" ? "상태는 변경됐지만 면접 시간 제안에 실패했어요." : "상태는 변경됐지만 사유 전달에 실패했어요.");
    } finally {
      setPending(null);
      setUpdating(false);
    }
  }

  function saveMemo() {
    if (savingMemo || !app) return;
    setSavingMemo(true);
    updateMyPartnerApplicantState(applicantId, { memo: memo.trim() || null })
      .then((d) => {
        setApp(d);
        toast.success("메모를 저장했어요");
      })
      .catch(() => toast.error("메모 저장에 실패했어요."))
      .finally(() => setSavingMemo(false));
  }

  function send() {
    const t = text.trim();
    const appId = app?.applicationId;
    if (!t || sending || !appId) return;
    setSending(true);
    sendPartnerApplicantMessage(appId, t)
      .then(() => {
        setText("");
        loadMessages(appId);
      })
      .catch(() => toast.error("메시지 전송에 실패했어요."))
      .finally(() => setSending(false));
  }

  const chat = messages.filter((m) => m.visibility === "CANDIDATE");
  const rejected = app?.status === "REJECTED" || app?.status === "WITHDRAWN";

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-10">
          {/* 상단 전폭 — 프로필 + 단계 + 상태 변경 */}
          <section className="rounded-3xl bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">{app.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{app.name}</h1>
                {app.appliedAt ? <p className="mt-0.5 truncate text-[13.5px] text-[#8B95A1]">{new Date(app.appliedAt).toLocaleDateString("ko-KR")} 지원</p> : null}
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${PARTNER_RECOMMENDATION[app.recommendation].cls}`}>{PARTNER_RECOMMENDATION[app.recommendation].label}</span>
                {app.mockInterviewPracticed ? <span className="rounded-md bg-[#EDF1FD] px-2 py-1 text-[11px] font-bold text-[#0B46E8]">🎤 모의 면접 완료{app.mockInterviewScore != null ? ` · ${app.mockInterviewScore}점` : ""}</span> : null}
              </div>
            </div>

            {/* 지원 공고 */}
            <Link href={`${partnerRoutes.positions}/${app.positionId}`} className="mt-4 block rounded-xl bg-white px-3.5 py-3 transition hover:bg-[#EDF1FD]">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="fill" />
                <span className="text-[11px] font-bold text-[#8B95A1]">지원 공고</span>
                {position ? <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${PARTNER_POSITION_STATUS[position.status].cls}`}>{PARTNER_POSITION_STATUS[position.status].label}</span> : null}
                <CaretRight className="ml-auto h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </div>
              <p className="mt-1 truncate text-[14px] font-bold text-[#191F28]">{app.positionTitle}</p>
              {position ? (
                <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">
                  {[EMPLOYMENT_LABEL[position.employmentType], position.workType, position.workLocation, position.hiringCount != null ? `채용 ${position.hiringCount}명` : ""].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </Link>

            {/* 채용 단계 스테퍼 */}
            <div className="mt-5">
              {rejected ? (
                <div className={`rounded-xl px-3.5 py-2.5 text-[13px] font-bold ${PARTNER_APPLICANT_STATUS[app.status].cls}`}>
                  {PARTNER_APPLICANT_STATUS[app.status].label} 처리됨
                </div>
              ) : (
                <div className="flex items-center">
                  {STEPS.map((step, i) => {
                    const on = step.reach.includes(app.status);
                    return (
                      <div key={step.label} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black ${on ? "bg-[#0B46E8] text-white" : "bg-white text-[#B0B8C1] ring-1 ring-[#DCE3F0]"}`}>
                            {on ? <Check className="h-4 w-4" weight="bold" /> : i + 1}
                          </span>
                          <span className={`text-[11px] font-bold ${on ? "text-[#0B46E8]" : "text-[#B0B8C1]"}`}>{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 ? <span className={`mx-1 h-[2px] flex-1 rounded-full ${STEPS[i + 1].reach.includes(app.status) ? "bg-[#0B46E8]" : "bg-[#DCE3F0]"}`} /> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 상태 변경 */}
            <div className="mt-5">
              <p className="mb-2 text-[12px] font-bold text-[#8B95A1]">상태 변경</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS.map((s) => {
                  const active = app.status === s;
                  return (
                    <button key={s} type="button" onClick={() => requestStatus(s)} disabled={updating || active} className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition disabled:opacity-50 ${active ? "bg-[#0B46E8] text-white" : "bg-white text-[#4E5968] ring-1 ring-[#E4EAF2] hover:bg-[#EDF1FD]"}`}>
                      {PARTNER_APPLICANT_STATUS[s].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 2단 */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2">
            {/* 좌 — 정보/서류 */}
            <div className="flex flex-col gap-10">
              <section>
                <SectionHeader title="인적 사항" />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <dl className="flex flex-col gap-2.5">
                    <Row label="이메일" value={app.email} />
                    <Row label="학교 · 전공" value={[app.school, app.major].filter(Boolean).join(" · ")} />
                    <Row label="국적" value={app.nationality} />
                    <Row label="언어" value={app.languages?.length ? app.languages.join(", ") : null} />
                    <Row label="거주지" value={app.residence} />
                    <Row label="입사 가능일" value={app.availableStartDate} />
                  </dl>
                </div>
              </section>

              <section>
                <SectionHeader title="지원 서류" />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <div className="flex flex-col gap-4">
                    {app.resumeDoc || app.resumeShareSlug ? (
                      <DocItem
                        href={`${partnerRoutes.applicants}/${encodeURIComponent(applicantId)}/resume`}
                        emoji="📄"
                        title={`${app.name} 이력서`}
                        sub="이력서 보기"
                        bullets={summary?.resumeBullets ?? []}
                        loading={summaryLoading}
                      />
                    ) : null}
                    {app.coverDoc || app.coverLetterShareSlug ? (
                      <DocItem
                        href={`${partnerRoutes.applicants}/${encodeURIComponent(applicantId)}/cover`}
                        emoji="✍️"
                        title={`${app.name} 자기소개서`}
                        sub="자기소개서 보기"
                        bullets={summary?.coverBullets ?? []}
                        loading={summaryLoading}
                      />
                    ) : null}
                    {!app.resumeDoc && !app.resumeShareSlug && !app.coverDoc && !app.coverLetterShareSlug ? (
                      <p className="text-[13px] text-[#8B95A1]">제출된 서류가 없어요.</p>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>

            {/* 우 — 메모/면접/메시지 */}
            <div className="flex flex-col gap-10">
              {/* 내부 메모 */}
              <section>
                <SectionHeader title="내부 메모" right={<span className="rounded-md bg-[#F2F4F6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#8B95A1]">지원자에게 안 보임</span>} />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    placeholder="평가·다음 단계 등 팀 내부 메모를 남겨보세요."
                    className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                  />
                  <button type="button" onClick={saveMemo} disabled={savingMemo || memo === (app.memo ?? "")} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-40">
                    {savingMemo ? "저장 중…" : "메모 저장"}
                  </button>
                </div>
              </section>

              {/* 면접 */}
              <section>
                <SectionHeader
                  title="면접"
                  right={
                    app.applicationId ? (
                      <button type="button" onClick={() => setProposeOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                        <Plus className="h-3.5 w-3.5" weight="bold" /> 면접 시간 제안
                      </button>
                    ) : null
                  }
                />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  {!app.applicationId ? (
                    <p className="text-[13px] text-[#8B95A1]">지원 건이 연결되지 않아 면접 제안을 사용할 수 없어요.</p>
                  ) : slots.length ? (
                    <ul className="flex flex-col gap-2">
                      {slots.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded-xl bg-[#F5F6F8] px-3.5 py-2.5">
                          <span className="text-[13px] text-[#191F28]">{fmtWhen(s.startsAt)}{s.location ? ` · ${s.location}` : ""}</span>
                          <span className={`text-[11.5px] font-bold ${s.status === "SELECTED" ? "text-[#12B76A]" : s.status === "CANCELLED" ? "text-[#B0B8C1]" : "text-[#E8890C]"}`}>
                            {s.status === "SELECTED" ? "확정" : s.status === "CANCELLED" ? "취소" : "대기"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#8B95A1]">제안한 면접 시간이 없어요. 시간을 제안하면 지원자가 선택해요.</p>
                  )}
                </div>
              </section>

              {/* 메시지 */}
              <section>
                <SectionHeader title="지원자와의 대화" />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <div className="flex max-h-[380px] flex-col gap-2.5 overflow-y-auto">
                    {chat.length === 0 ? (
                      <p className="py-4 text-center text-[13px] text-[#B0B8C1]">아직 주고받은 메시지가 없어요.</p>
                    ) : (
                      chat.map((m) => {
                        const mine = m.authorRole !== "STUDENT";
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[#0B46E8] text-white" : "border border-[#EEF1F5] bg-white text-[#191F28]"}`}>
                              <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">{m.content}</p>
                              <p className={`mt-1 text-[10.5px] ${mine ? "text-white/60" : "text-[#B0B8C1]"}`}>{formatRelativeTime(new Date(m.createdAt).getTime())}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {app.applicationId ? (
                    <div className="mt-3 flex items-end gap-2">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        rows={1}
                        placeholder="지원자에게 메시지 보내기…"
                        className="max-h-28 flex-1 resize-none rounded-2xl bg-[#F2F4F6] px-4 py-2.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#0B46E8]/30"
                      />
                      <button type="button" onClick={send} disabled={!text.trim() || sending} aria-label="보내기" className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
                        <PaperPlaneTilt className="h-5 w-5" weight="fill" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-[13px] text-[#8B95A1]">지원 건이 연결되지 않아 메시지를 보낼 수 없어요.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {proposeOpen && app?.applicationId ? (
        <ProposeModal
          applicationId={app.applicationId}
          onClose={() => setProposeOpen(false)}
          onDone={() => {
            setProposeOpen(false);
            loadSlots(app.applicationId);
          }}
        />
      ) : null}

      {pending && app ? (
        <ConfirmStatusModal
          name={app.name}
          next={pending}
          busy={updating}
          hasApplication={Boolean(app.applicationId)}
          onClose={() => (updating ? null : setPending(null))}
          onConfirm={confirmStatus}
        />
      ) : null}
    </PartnerAppShell>
  );
}

// 섹션 타이틀 — 카드 밖. 다른 섹션 페이지와 동일한 스타일(18px font-black).
function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex min-h-[30px] items-center justify-between gap-3">
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      {right}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-[80px] shrink-0 text-[12.5px] text-[#8B95A1]">{label}</dt>
      <dd className="min-w-0 flex-1 break-keep text-[13.5px] text-[#191F28]">{value || "-"}</dd>
    </div>
  );
}

// 서류 열람 링크(이력서·자기소개서). internal=앱 내 이동(이력서 프리뷰), 아니면 공유 페이지 새 탭.
function DocLink({ href, emoji, title, sub, internal }: { href: string; emoji: string; title: string; sub: string; internal?: boolean }) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[16px]" aria-hidden>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-bold text-[#191F28]">{title}</span>
        <span className="block text-[11.5px] text-[#8B95A1]">{sub}</span>
      </span>
      {internal ? <CaretRight className="h-4 w-4 shrink-0 text-[#0B46E8]" /> : <ArrowSquareOut className="h-4 w-4 shrink-0 text-[#0B46E8]" />}
    </>
  );
  const cls = "flex items-center gap-2 rounded-xl border border-[#E4EAF2] bg-[#F8FAFF] px-3.5 py-3 transition hover:border-[#0B46E8]/40";
  return internal ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
  );
}

// 서류 항목 — 열람 링크(DocLink) + LLM 불렛 요약.
function DocItem({ href, emoji, title, sub, bullets, loading }: { href: string; emoji: string; title: string; sub: string; bullets: string[]; loading: boolean }) {
  return (
    <div>
      <DocLink href={href} emoji={emoji} title={title} sub={sub} internal />
      <div className="mt-2 rounded-xl bg-[#F8FAFB] px-3.5 py-2.5">
        <p className="flex items-center gap-1 text-[11px] font-bold text-[#8B95A1]"><Sparkle className="h-3 w-3 text-[#0B46E8]" weight="fill" /> AI 요약</p>
        {loading ? (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">요약 생성 중…</p>
        ) : bullets.length ? (
          <ul className="mt-1.5 flex flex-col gap-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#4E5968]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                <span className="min-w-0 flex-1 break-keep">{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">요약할 내용이 없어요.</p>
        )}
      </div>
    </div>
  );
}

// 상태 변경 확인 — 지원자에게 알림이 발송되므로 동의 후 진행.
// 면접: 면접 시간 제안(선택) / 불합격: 불합격 사유 지원자 전달(선택) 을 같은 팝업에서 처리.
function ConfirmStatusModal({
  name,
  next,
  busy,
  hasApplication,
  onClose,
  onConfirm
}: {
  name: string;
  next: PartnerApplicantStatus;
  busy: boolean;
  hasApplication: boolean;
  onClose: () => void;
  onConfirm: (extra: { slots?: { startsAt: string; endsAt: string; location?: string }[]; reason?: string }) => void;
}) {
  useLockBodyScroll();
  const label = PARTNER_APPLICANT_STATUS[next].label;
  const isInterview = next === "INTERVIEW";
  const isReject = next === "REJECTED";
  const [rows, setRows] = useState<SlotRow[]>([{ ...EMPTY_SLOT_ROW }]);
  const [reason, setReason] = useState("");

  function confirm() {
    const slots = isInterview ? slotsFromRows(rows) : undefined;
    onConfirm({ slots, reason: isReject ? reason : undefined });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">상태를 ‘{label}’로 변경할까요?</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#4E5968]">
            <span className="font-bold text-[#191F28]">{name}</span> 님에게 상태 변경 <span className="font-bold text-[#0B46E8]">알림이 발송</span>됩니다.
          </p>

          {/* 면접: 시간 제안(선택) */}
          {isInterview && hasApplication ? (
            <div className="mt-4 rounded-2xl bg-[#F5F8FF] p-4">
              <p className="text-[13px] font-bold text-[#191F28]">면접 시간 제안 <span className="font-normal text-[#8B95A1]">(선택)</span></p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">시간을 넣으면 지원자가 그중 편한 시간을 선택해요.</p>
              <div className="mt-3">
                <InterviewSlotRows rows={rows} setRows={setRows} />
              </div>
            </div>
          ) : null}

          {/* 불합격: 사유(선택, 지원자에게 메시지로 전달) */}
          {isReject && hasApplication ? (
            <div className="mt-4 rounded-2xl bg-[#FDF2F3] p-4">
              <p className="text-[13px] font-bold text-[#191F28]">불합격 사유 <span className="font-normal text-[#8B95A1]">(선택)</span></p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">입력하면 지원자에게 메시지로 전달돼요.</p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="예) 이번 포지션의 요구 경력과 차이가 있어 아쉽게 전달드립니다." className="mt-2 w-full resize-none rounded-xl border border-[#F3D0D4] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#C9AEB1] focus:ring-2 focus:ring-[#F04452]/20" />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={busy} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">취소</button>
          <button type="button" onClick={confirm} disabled={busy} className={`h-[50px] flex-1 rounded-2xl text-[14.5px] font-bold text-white transition disabled:opacity-50 ${isReject ? "bg-[#F04452] hover:bg-[#DA3B48]" : "bg-[#0B46E8] hover:bg-[#0A3ECB]"}`}>{busy ? "변경 중…" : `‘${label}’로 변경`}</button>
        </div>
      </div>
    </div>
  );
}

// 면접 시간 제안 — 최대 3개 슬롯(시작 시각 + 장소).
function ProposeModal({ applicationId, onClose, onDone }: { applicationId: string; onClose: () => void; onDone: () => void }) {
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [rows, setRows] = useState<SlotRow[]>([{ ...EMPTY_SLOT_ROW }]);
  const [saving, setSaving] = useState(false);

  function submit() {
    const slots = slotsFromRows(rows);
    if (slots.length === 0 || saving) return;
    setSaving(true);
    proposeInterviewSlots(applicationId, slots)
      .then(() => {
        toast.success("면접 시간을 제안했어요");
        onDone();
      })
      .catch(() => toast.error("제안에 실패했어요."))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-5 py-4">
          <p className="text-[15px] font-bold text-[#191F28]">면접 시간 제안</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-3 bg-[#F5F8FF] px-5 py-4">
          <p className="text-[12.5px] text-[#8B95A1]">지원자가 그중 편한 시간을 선택합니다. (최대 3개)</p>
          <InterviewSlotRows rows={rows} setRows={setRows} />
        </div>
        <div className="px-5 pb-5">
          <button type="button" onClick={submit} disabled={saving || slotsFromRows(rows).length === 0} className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
            {saving ? "제안 중…" : "면접 시간 제안하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
