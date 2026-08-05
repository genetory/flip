"use client";

// 파트너 지원자 상세 — 프로필·인적사항·서류 + 상태 변경 + 면접 시간 제안 + 지원자 메시지.
import { useEffect, useState } from "react";
import { X, PaperPlaneTilt, Plus } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { PARTNER_APPLICANT_STATUS, PARTNER_RECOMMENDATION } from "../../../lib/partner/labels";
import {
  getMyPartnerApplicantById,
  updateMyPartnerApplicantState,
  getInterviewSlotsForApplication,
  proposeInterviewSlots,
  getPartnerApplicantMessages,
  sendPartnerApplicantMessage,
  type PartnerApplicantDetail,
  type PartnerApplicantStatus,
  type InterviewSlot,
  type PartnerApplicantMessage
} from "../../../lib/member-profile-client";

const STATUS_ACTIONS: PartnerApplicantStatus[] = ["REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED"];

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
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

  // 메시지·면접 슬롯 API 는 지원 건별 실제 Application.id 를 쓴다(지원자 id 는 조합키라 안 됨).
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
        setStatus("ready");
        loadSlots(d.applicationId);
        loadMessages(d.applicationId);
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  function changeStatus(next: PartnerApplicantStatus) {
    if (updating || !app || app.status === next) return;
    setUpdating(true);
    updateMyPartnerApplicantState(applicantId, { status: next })
      .then((d) => {
        setApp(d);
        toast.success(`상태를 '${PARTNER_APPLICANT_STATUS[next].label}'로 바꿨어요`);
      })
      .catch(() => toast.error("상태 변경에 실패했어요."))
      .finally(() => setUpdating(false));
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

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-5">
          {/* 프로필 */}
          <section className="rounded-3xl bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">{app.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{app.name}</h1>
                <p className="mt-0.5 truncate text-[13.5px] text-[#8B95A1]">{app.positionTitle}{app.appliedAt ? ` · ${new Date(app.appliedAt).toLocaleDateString("ko-KR")} 지원` : ""}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${PARTNER_APPLICANT_STATUS[app.status].cls}`}>{PARTNER_APPLICANT_STATUS[app.status].label}</span>
              <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${PARTNER_RECOMMENDATION[app.recommendation].cls}`}>{PARTNER_RECOMMENDATION[app.recommendation].label}</span>
            </div>
          </section>

          {/* 상태 변경 */}
          <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <h2 className="text-[15px] font-bold text-[#191F28]">상태 변경</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_ACTIONS.map((s) => {
                const on = app.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(s)}
                    disabled={updating}
                    className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition disabled:opacity-50 ${on ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"}`}
                  >
                    {PARTNER_APPLICANT_STATUS[s].label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 인적 사항 */}
          <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <h2 className="text-[15px] font-bold text-[#191F28]">인적 사항</h2>
            <dl className="mt-3 flex flex-col gap-2.5">
              <Row label="이메일" value={app.email} />
              <Row label="학교 · 전공" value={[app.school, app.major].filter(Boolean).join(" · ")} />
              <Row label="국적" value={app.nationality} />
              <Row label="언어" value={app.languages?.length ? app.languages.join(", ") : null} />
              <Row label="거주지" value={app.residence} />
              <Row label="입사 가능일" value={app.availableStartDate} />
            </dl>
          </section>

          {/* 서류 */}
          {(app.summary || app.motivation || app.portfolioUrl) ? (
            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#191F28]">지원 서류</h2>
              <div className="mt-3 flex flex-col gap-3">
                {app.summary ? <Doc label="자기소개 요약" text={app.summary} /> : null}
                {app.motivation ? <Doc label="지원 동기" text={app.motivation} /> : null}
                {app.portfolioUrl ? (
                  <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">포트폴리오 열기 ↗</a>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 면접 */}
          <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-[#191F28]">면접</h2>
              {app.applicationId ? (
                <button type="button" onClick={() => setProposeOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  <Plus className="h-3.5 w-3.5" weight="bold" /> 면접 시간 제안
                </button>
              ) : null}
            </div>
            {!app.applicationId ? (
              <p className="mt-3 text-[13px] text-[#8B95A1]">지원 건이 연결되지 않아 면접 제안을 사용할 수 없어요.</p>
            ) : slots.length ? (
              <ul className="mt-3 flex flex-col gap-2">
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
              <p className="mt-3 text-[13px] text-[#8B95A1]">제안한 면접 시간이 없어요. 시간을 제안하면 지원자가 선택해요.</p>
            )}
          </section>

          {/* 메시지 */}
          <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <h2 className="text-[15px] font-bold text-[#191F28]">지원자와의 대화</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {chat.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[#B0B8C1]">아직 주고받은 메시지가 없어요.</p>
              ) : (
                chat.map((m) => {
                  const mine = m.authorRole !== "STUDENT";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[#0B46E8] text-white" : "border border-[#EEF1F5] bg-white text-[#191F28]"}`}>
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
          </section>
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
    </PartnerAppShell>
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

function Doc({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[12px] font-bold text-[#0B46E8]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{text}</p>
    </div>
  );
}

// 면접 시간 제안 — 최대 3개 슬롯(시작 시각 + 장소).
function ProposeModal({ applicationId, onClose, onDone }: { applicationId: string; onClose: () => void; onDone: () => void }) {
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [rows, setRows] = useState<{ when: string; location: string }[]>([{ when: "", location: "" }]);
  const [saving, setSaving] = useState(false);

  function submit() {
    const slots = rows
      .filter((r) => r.when)
      .map((r) => {
        const start = new Date(r.when);
        return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 60 * 60000).toISOString(), location: r.location.trim() || undefined };
      });
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
        <div className="flex flex-col gap-3 px-5 py-4">
          <p className="text-[12.5px] text-[#8B95A1]">지원자가 그중 편한 시간을 선택합니다. (최대 3개)</p>
          {rows.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-[#F5F6F8] p-3">
              <input
                type="datetime-local"
                value={r.when}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)))}
                className="rounded-lg bg-white px-3 py-2 text-[13px] text-[#191F28] outline-none [color-scheme:light]"
              />
              <input
                value={r.location}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, location: e.target.value } : x)))}
                placeholder="장소 (선택) · 예) 본사 3층 / 온라인"
                className="rounded-lg bg-white px-3 py-2 text-[13px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
              />
            </div>
          ))}
          {rows.length < 3 ? (
            <button type="button" onClick={() => setRows((rs) => [...rs, { when: "", location: "" }])} className="inline-flex w-fit items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]">
              <Plus className="h-3.5 w-3.5" weight="bold" /> 시간 추가
            </button>
          ) : null}
        </div>
        <div className="px-5 pb-5">
          <button type="button" onClick={submit} disabled={saving} className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
            {saving ? "제안 중…" : "면접 시간 제안하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
