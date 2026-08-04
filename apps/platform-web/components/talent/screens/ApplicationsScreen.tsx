"use client";

// 지원 현황 — 실제 서버 지원 내역(getMyApplications). 상태 탭(전체/지원 완료/면접/결과).
// 별도 상세 화면 없이 리스트 카드에서 바로 이벤트(공고 보기·지원 철회·면접 안내)를 처리한다.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, WarningCircle, ChatCircleDots, PaperPlaneTilt, CalendarCheck } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TEmpty, TError, TLoading } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyApplications, withdrawMyApplication, getApplicationMessages, sendApplicationMessage, getInterviewSlotsForApplication, selectInterviewSlot, type MyApplication, type ApplicationMessage, type InterviewSlot } from "../../../lib/member-profile-client";

// 면접 시간 표기 — 8월 12일 (화) 오후 2:00
function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
}

type Tab = "all" | "submitted" | "interview_wait" | "interview_set" | "accepted" | "rejected" | "withdrawn";

// 탭 = 상태 + (면접은 일정 확정 여부)로 세분화.
const TABS: { key: Tab; label: string; match: (a: MyApplication) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "submitted", label: "지원 완료", match: (a) => a.status === "SUBMITTED" },
  { key: "interview_wait", label: "면접 대기", match: (a) => a.status === "INTERVIEW" && !a.interviewSelectedAt },
  { key: "interview_set", label: "면접 확정", match: (a) => a.status === "INTERVIEW" && !!a.interviewSelectedAt },
  { key: "accepted", label: "합격", match: (a) => a.status === "ACCEPTED" },
  { key: "rejected", label: "불합격", match: (a) => a.status === "REJECTED" },
  { key: "withdrawn", label: "철회", match: (a) => a.status === "WITHDRAWN" }
];

function inTab(a: MyApplication, tab: Tab): boolean {
  return (TABS.find((t) => t.key === tab) ?? TABS[0]).match(a);
}

export const APPLICATION_STATUS: Record<MyApplication["status"], { label: string; cls: string }> = {
  SUBMITTED: { label: "지원 완료", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  INTERVIEW: { label: "면접 진행", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  ACCEPTED: { label: "합격", cls: "bg-[#E7F8EF] text-[#12B76A]" },
  REJECTED: { label: "불합격", cls: "bg-[#FDECEE] text-[#F04452]" },
  WITHDRAWN: { label: "지원 철회", cls: "bg-[#F2F4F6] text-[#8B95A1]" }
};

export function ApplicationsScreen() {
  const toast = useTalentPopup();
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("all");
  const [confirmApp, setConfirmApp] = useState<MyApplication | null>(null);
  const [messageApp, setMessageApp] = useState<MyApplication | null>(null);
  const [slotApp, setSlotApp] = useState<MyApplication | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  function load() {
    setStatus("loading");
    getMyApplications()
      .then((list) => {
        setApps(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  // 내 프로필 등에서 ?tab= 로 진입하면 해당 상태 탭으로 시작.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.key === t)) setTab(t as Tab);
  }, []);

  function confirmWithdraw() {
    const app = confirmApp;
    if (!app || withdrawing) return;
    setWithdrawing(true);
    withdrawMyApplication(app.id)
      .then(() => {
        setApps((prev) => (prev ? prev.map((a) => (a.id === app.id ? { ...a, status: "WITHDRAWN" } : a)) : prev));
        setConfirmApp(null);
        toast.success("지원을 철회했어요");
      })
      .catch(() => toast.error("철회에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setWithdrawing(false));
  }

  const counts = useMemo(() => {
    const a = apps ?? [];
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = a.filter(t.match).length;
    return c;
  }, [apps]);

  const list = useMemo(() => (apps ?? []).filter((a) => inTab(a, tab)), [apps, tab]);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">지원 현황</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">지원한 공고의 진행 상태를 확인해요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 상태 탭 — 포지션 탐색과 동일한 언더라인 탭 */}
            <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const active = tab === t.key;
                const n = counts[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={active ? "page" : undefined}
                    className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                  >
                    {t.label} ({n})
                    {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                );
              })}
            </div>

            {list.length === 0 ? (
              <TEmpty
                title={tab === "all" ? "아직 지원한 공고가 없어요" : "해당 상태의 지원이 없어요"}
                description="공고를 둘러보고 관심 있는 곳에 지원해보세요."
                action={<TalentButton href={talentAppRoutes.jobs} variant="soft" size="md">공고 둘러보기</TalentButton>}
              />
            ) : (
              <div className="flex flex-col gap-3.5">
                {list.map((a) => (
                  <AppCard key={a.id} app={a} onWithdraw={() => setConfirmApp(a)} onMessage={() => setMessageApp(a)} onSelectInterview={() => setSlotApp(a)} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {confirmApp ? (
        <WithdrawModal app={confirmApp} withdrawing={withdrawing} onClose={() => setConfirmApp(null)} onConfirm={confirmWithdraw} />
      ) : null}

      {messageApp ? (
        <MessageModal
          app={messageApp}
          onClose={() => {
            setMessageApp(null);
            load(); // 안 읽음 카운트 갱신
          }}
        />
      ) : null}

      {slotApp ? (
        <InterviewSlotModal
          app={slotApp}
          onClose={() => {
            setSlotApp(null);
            load(); // 확정 시 상태·면접 정보 갱신
          }}
        />
      ) : null}
    </TalentAppShell>
  );
}

// 회사 문의 — 지원 건별 메시지 스레드(쪽지). 학생↔회사.
function MessageModal({ app, onClose }: { app: MyApplication; onClose: () => void }) {
  useLockBodyScroll();
  const [messages, setMessages] = useState<ApplicationMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const reload = () => getApplicationMessages(app.id).then(setMessages).catch(() => setMessages([]));
  useEffect(() => {
    void reload();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    sendApplicationMessage(app.id, t)
      .then(() => {
        setText("");
        return reload();
      })
      .catch(() => {})
      .finally(() => setSending(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex h-[82vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[560px] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[#191F28]">{app.partnerOrganizationName ?? "비공개 기업"}</p>
            <p className="truncate text-[12px] text-[#8B95A1]">{app.positionTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAFBFC] px-5 py-4">
          {messages === null ? (
            <p className="py-10 text-center text-[13px] text-[#B0B8C1]">불러오는 중…</p>
          ) : messages.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13.5px] font-bold text-[#4E5968]">아직 주고받은 메시지가 없어요</p>
              <p className="mt-1 text-[12.5px] text-[#8B95A1]">궁금한 점을 회사에 남겨보세요.</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.authorRole !== "PARTNER";
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

        {/* 입력 */}
        <div className="flex items-end gap-2 border-t border-[#F2F4F6] px-4 py-3">
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
            placeholder="회사에 메시지 보내기…"
            className="max-h-28 flex-1 resize-none rounded-2xl bg-[#F2F4F6] px-4 py-2.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#0B46E8]/30"
          />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim() || sending}
            aria-label="보내기"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition hover:bg-[#0A3ECB] disabled:opacity-40"
          >
            <PaperPlaneTilt className="h-5 w-5" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({ app, withdrawing, onClose, onConfirm }: { app: MyApplication; withdrawing: boolean; onClose: () => void; onConfirm: () => void }) {
  useLockBodyScroll();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="지원 철회 확인"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6] hover:text-[#4E5968]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-7 pb-2 pt-9 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDECEE]">
            <WarningCircle className="h-7 w-7 text-[#F04452]" weight="bold" />
          </span>
          <h2 className="mt-5 break-keep text-[18px] font-black leading-[1.4] tracking-[-0.02em] text-[#0B1227]">지원을 철회할까요?</h2>
          <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">
            {app.partnerOrganizationName ? `${app.partnerOrganizationName} · ` : ""}
            {app.positionTitle}
            <br />철회하면 되돌릴 수 없어요.
          </p>
        </div>

        <div className="flex gap-2 px-7 pb-7 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#F2F4F6] px-5 text-[15px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={withdrawing}
            className="inline-flex h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#F04452] px-5 text-[15px] font-bold text-white transition hover:bg-[#D93A46] disabled:opacity-50"
          >
            {withdrawing ? "철회 중…" : "지원 철회"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppCard({ app, onWithdraw, onMessage, onSelectInterview }: { app: MyApplication; onWithdraw: () => void; onMessage: () => void; onSelectInterview: () => void }) {
  const s = APPLICATION_STATUS[app.status];
  const canWithdraw = app.status === "SUBMITTED" || app.status === "INTERVIEW";
  const canMessage = app.status !== "WITHDRAWN";
  const dimmed = app.status === "WITHDRAWN" || app.status === "REJECTED";

  return (
    <div className={`rounded-2xl border border-[#EEF1F5] p-5 ${dimmed ? "bg-[#FAFBFC]" : "bg-white"}`}>
      {/* 헤더 — 상태 + 문의 + 지원일 */}
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
        {app.unreadMessages > 0 ? <span className="rounded-md bg-[#FDECEE] px-2 py-1 text-[11px] font-bold text-[#F04452]">문의 {app.unreadMessages}</span> : null}
        <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">지원 · {formatRelativeTime(new Date(app.submittedAt).getTime())}</span>
      </div>

      <p className="mt-3 text-[16px] font-bold leading-snug tracking-[-0.01em] text-[#191F28]">{app.positionTitle}</p>
      {app.partnerOrganizationName ? (
        <Link
          href={`/talent/company/${encodeURIComponent(app.partnerOrganizationName)}`}
          className="mt-1 inline-block max-w-full truncate align-top text-[13px] text-[#8B95A1] transition hover:text-[#0B46E8] hover:underline"
        >
          {app.partnerOrganizationName}
        </Link>
      ) : (
        <p className="mt-1 text-[13px] text-[#8B95A1]">비공개 기업</p>
      )}

      {/* 상태별 안내 + 다음 액션 */}
      <StatusBlock app={app} onSelectInterview={onSelectInterview} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`${talentAppRoutes.jobs}/${app.positionId}`}
          className="inline-flex items-center rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
        >
          공고 보기
        </Link>
        {canMessage ? (
          <button
            type="button"
            onClick={onMessage}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
          >
            <ChatCircleDots className="h-4 w-4" /> 회사 문의
            {app.unreadMessages > 0 ? (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F04452] px-1 text-[10px] font-bold leading-none text-white">{app.unreadMessages}</span>
            ) : null}
          </button>
        ) : null}
        {canWithdraw ? (
          <button
            type="button"
            onClick={onWithdraw}
            className="ml-auto inline-flex items-center rounded-xl bg-[#FDECEE] px-4 py-2.5 text-[13px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1]"
          >
            지원 철회
          </button>
        ) : null}
      </div>
    </div>
  );
}

// 상태별 안내 블록 — 각 상황에서 무엇을 하면 되는지 알려준다.
function StatusBlock({ app, onSelectInterview }: { app: MyApplication; onSelectInterview: () => void }) {
  // 면접 확정
  if (app.status === "INTERVIEW" && app.interviewSelectedAt) {
    return (
      <div className="mt-3.5 rounded-xl bg-[#EDF1FD] px-4 py-3.5">
        <p className="text-[12px] font-bold text-[#0B46E8]">면접 확정</p>
        <p className="mt-1 text-[13px] font-semibold text-[#191F28]">{formatWhen(app.interviewSelectedAt)}</p>
        {app.interviewLocation ? <p className="mt-0.5 text-[12px] text-[#8B95A1]">{app.interviewLocation}</p> : null}
      </div>
    );
  }
  // 면접 일정 선택 대기 → 실제 선택 액션
  if (app.status === "INTERVIEW" && app.interviewPending) {
    return (
      <div className="mt-3.5 rounded-xl bg-[#FFF3E6] px-4 py-3.5">
        <p className="text-[12.5px] font-bold text-[#E8890C]">면접 일정을 선택해주세요</p>
        <p className="mt-0.5 text-[12px] text-[#B07B33]">회사가 제안한 시간 중 편한 시간을 골라주세요.</p>
        <button
          type="button"
          onClick={onSelectInterview}
          className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[#E8890C] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#D67D08]"
        >
          면접 시간 선택
        </button>
      </div>
    );
  }
  // 면접 단계지만 아직 슬롯 제안 전
  if (app.status === "INTERVIEW") {
    return (
      <div className="mt-3.5 rounded-xl bg-[#F5F8FF] px-4 py-3.5">
        <p className="text-[12.5px] text-[#4E5968]">면접 단계로 진행됐어요. 일정이 잡히면 알려드릴게요.</p>
      </div>
    );
  }
  if (app.status === "SUBMITTED") {
    return (
      <div className="mt-3.5 rounded-xl bg-[#F5F8FF] px-4 py-3.5">
        <p className="text-[12.5px] text-[#4E5968]">회사가 지원서를 검토하고 있어요. 결과가 나오면 알려드릴게요.</p>
      </div>
    );
  }
  if (app.status === "ACCEPTED") {
    return (
      <div className="mt-3.5 rounded-xl bg-[#E7F8EF] px-4 py-3.5">
        <p className="text-[13px] font-bold text-[#0A9B59]">🎉 합격을 축하해요!</p>
        <p className="mt-0.5 text-[12.5px] text-[#4E5968]">‘회사 문의’로 다음 절차(입사·서류 등)를 확인해보세요.</p>
      </div>
    );
  }
  if (app.status === "REJECTED") {
    return (
      <div className="mt-3.5 rounded-xl bg-[#F5F6F8] px-4 py-3.5">
        <p className="text-[12.5px] text-[#8B95A1]">이번엔 인연이 닿지 않았어요. 잘 맞는 다른 공고도 둘러보세요.</p>
      </div>
    );
  }
  return null; // WITHDRAWN
}

// 면접 시간 선택 — 회사가 제안한 슬롯 중 하나를 골라 확정한다.
function InterviewSlotModal({ app, onClose }: { app: MyApplication; onClose: () => void }) {
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [slots, setSlots] = useState<InterviewSlot[] | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    getInterviewSlotsForApplication(app.id).then(setSlots).catch(() => setSlots([]));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const proposed = (slots ?? []).filter((sl) => sl.status === "PROPOSED");
  const selected = (slots ?? []).find((sl) => sl.status === "SELECTED") ?? null;

  function choose(slotId: string) {
    if (selecting) return;
    setSelecting(slotId);
    selectInterviewSlot(slotId)
      .then(() => {
        toast.success("면접 시간을 확정했어요");
        onClose();
      })
      .catch(() => toast.error("확정에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setSelecting(null));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-[#191F28]">면접 시간 선택</p>
            <p className="truncate text-[12px] text-[#8B95A1]">{app.positionTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {slots === null ? (
            <p className="py-8 text-center text-[13px] text-[#B0B8C1]">불러오는 중…</p>
          ) : selected ? (
            <div className="rounded-2xl bg-[#EDF1FD] px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-[#0B46E8]">
                <CalendarCheck className="h-4 w-4" weight="bold" /> 이미 면접 시간이 확정됐어요
              </p>
              <p className="mt-1.5 text-[14px] font-bold text-[#191F28]">{formatWhen(selected.startsAt)}</p>
              {selected.location ? <p className="mt-0.5 text-[12px] text-[#8B95A1]">{selected.location}</p> : null}
            </div>
          ) : proposed.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#8B95A1]">아직 선택할 수 있는 면접 시간이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-[12.5px] text-[#8B95A1]">아래 시간 중 편한 시간을 선택하면 확정돼요.</p>
              {proposed.map((sl) => (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => choose(sl.id)}
                  disabled={!!selecting}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#EEF1F5] px-4 py-3.5 text-left transition hover:border-[#0B46E8]/50 hover:bg-[#F5F8FF] disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#191F28]">{formatWhen(sl.startsAt)}</p>
                    {sl.location ? <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{sl.location}</p> : null}
                  </div>
                  <span className="shrink-0 text-[12.5px] font-bold text-[#0B46E8]">{selecting === sl.id ? "확정 중…" : "선택"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
