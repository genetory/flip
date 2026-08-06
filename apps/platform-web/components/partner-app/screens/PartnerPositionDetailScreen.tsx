"use client";

// 파트너 공고 상세 — 지원자(탤런트)에게 보이는 것과 동일한 화면(공용 렌더 재사용) + 관리 액션.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PencilSimple } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { PositionDetailHeaderCard, PositionDetailSections } from "../../talent/screens/JobDetailScreen";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import {
  getMyPartnerPositionById,
  getMyPartnerOrganization,
  updateMyPartnerPosition,
  deleteMyPartnerPosition,
  getPositionMockInterviewParticipants,
  proposeToMockInterviewCandidate,
  type PartnerPosition,
  type MyPartnerOrganization,
  type PublicPositionListItem,
  type MockInterviewParticipant
} from "../../../lib/member-profile-client";

// 파트너 공고(+조직) → 지원자 상세 렌더용 PublicPositionListItem.
function toPublicItem(p: PartnerPosition, org: MyPartnerOrganization | null): PublicPositionListItem {
  return {
    ...(p as unknown as PublicPositionListItem),
    sourceKind: "INTERNAL",
    sourceProvider: "INTERNAL",
    sourceExternalId: null,
    sourceUrl: null,
    sourceFetchedAt: null,
    sourceCompanyName: org?.name ?? null,
    sourceDeadlineDate: null,
    sourceDeadlineRolling: false,
    matchingParticipantsCount: 0,
    partnerOrganization: org
      ? {
          id: org.id,
          name: org.name,
          industry: org.industry,
          companySize: org.companySize ?? null,
          officeAddress: org.officeAddress ?? null,
          description: org.description ?? null,
          strengths: org.strengths ?? null,
          website: org.website ?? null,
          socialMedia: org.socialMedia ?? null,
          companyLogoImageData: org.companyLogoImageData ?? null,
          officePhotoImageData: org.officePhotoImageData ?? null
        }
      : null
  };
}

export function PartnerPositionDetailScreen({ positionId }: { positionId: string }) {
  const router = useRouter();
  const toast = useTalentPopup();
  const [p, setP] = useState<PartnerPosition | null>(null);
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState<MockInterviewParticipant[]>([]);
  const [proposeTarget, setProposeTarget] = useState<MockInterviewParticipant | null>(null);

  function load() {
    setStatus("loading");
    Promise.all([getMyPartnerPositionById(positionId), getMyPartnerOrganization().catch(() => null)])
      .then(([d, o]) => {
        setP(d);
        setOrg(o);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    void getPositionMockInterviewParticipants(positionId).then(setParticipants).catch(() => setParticipants([]));
  }

  function markProposed(userId: string) {
    setParticipants((prev) => prev.map((x) => (x.userId === userId ? { ...x, connectionStatus: "PENDING" } : x)));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId]);

  function close() {
    if (busy || !p || p.status === "CLOSED") return;
    if (!window.confirm("이 공고를 마감할까요? 지원자에게 더 이상 노출되지 않아요.")) return;
    setBusy(true);
    updateMyPartnerPosition(positionId, { status: "CLOSED" })
      .then((d) => {
        setP(d);
        toast.success("공고를 마감했어요");
      })
      .catch(() => toast.error("마감에 실패했어요."))
      .finally(() => setBusy(false));
  }
  function remove() {
    if (busy) return;
    if (!window.confirm("이 공고를 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusy(true);
    deleteMyPartnerPosition(positionId)
      .then(() => {
        toast.success("공고를 삭제했어요");
        router.push(partnerRoutes.positions);
      })
      .catch(() => toast.error("삭제에 실패했어요."))
      .finally(() => setBusy(false));
  }

  const item = p ? toPublicItem(p, org) : null;

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && p && item ? (
        <div className="flex flex-col">
          {/* 관리 액션 바 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[11.5px] font-bold ${PARTNER_POSITION_STATUS[p.status].cls}`}>{PARTNER_POSITION_STATUS[p.status].label}</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={remove} disabled={busy} className="inline-flex h-[40px] items-center justify-center rounded-xl bg-[#FDECEE] px-4 text-[13px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1] disabled:opacity-50">삭제</button>
              {p.status !== "CLOSED" ? (
                <button type="button" onClick={close} disabled={busy} className="inline-flex h-[40px] items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">마감</button>
              ) : null}
              <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
                <PencilSimple className="h-4 w-4" weight="bold" /> 수정하기
              </Link>
            </div>
          </div>

          {/* 모의 면접 관리 */}
          {(() => {
            const configured = Boolean(p.mockInterviewIntent || (p.mockInterviewQuestions?.length ?? 0) > 0);
            return (
              <div className="mb-6 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[17px]" aria-hidden>🎤</span>
                  <p className="text-[14.5px] font-bold text-[#191F28]">모의 면접</p>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${configured ? "bg-[#E7F8EF] text-[#0A9B59]" : "bg-[#FFF3E6] text-[#E8890C]"}`}>{configured ? "설정됨" : "미설정"}</span>
                  <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="ml-auto shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">{configured ? "수정" : "추가하기"}</Link>
                </div>
                <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">
                  {configured
                    ? `${p.mockInterviewIntent ? `${p.mockInterviewIntent} ` : ""}${(p.mockInterviewQuestions?.length ?? 0) > 0 ? `· 대표 질문 ${p.mockInterviewQuestions!.length}개` : ""}`
                    : "지원자가 지원 전에 이 포지션 모의 면접을 연습하고 AI 피드백을 받을 수 있어요. 준비 잘 된 지원자가 모입니다."}
                </p>
              </div>
            );
          })()}

          {/* 모의 면접 참여자 — 지원 안 해도 표시, 제안 가능 */}
          {participants.length ? (
            <div className="mb-6">
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">모의 면접 참여자 <span className="text-[#8B95A1]">{participants.length}</span></h2>
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {participants.map((m, i) => (
                  <div key={m.userId} className={`flex items-center gap-3 px-4 py-3.5 ${i === participants.length - 1 ? "" : "border-b border-[#F2F4F6]"}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">{m.name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[14px] font-bold text-[#191F28]">{m.name}</p>
                        {m.bestScore != null ? <span className="shrink-0 rounded-md bg-[#EDF1FD] px-1.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{m.bestScore}점</span> : null}
                        {m.applied ? <span className="shrink-0 rounded-md bg-[#E7F8EF] px-1.5 py-0.5 text-[10.5px] font-bold text-[#0A9B59]">지원함</span> : null}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">답변 {m.answeredCount}개{m.nationality ? ` · ${m.nationality}` : ""}</p>
                    </div>
                    {m.connectionStatus === "ACCEPTED" ? (
                      <span className="shrink-0 rounded-lg bg-[#E7F8EF] px-3 py-1.5 text-[12px] font-bold text-[#0A9B59]">수락됨</span>
                    ) : m.connectionStatus === "PENDING" ? (
                      <span className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#8B95A1]">제안 보냄</span>
                    ) : (
                      <button type="button" onClick={() => setProposeTarget(m)} className="shrink-0 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0A3ECB]">제안하기</button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-[#8B95A1]">지원하지 않았어도 이 공고 모의 면접을 푼 사람이에요. 제안을 보내 먼저 연결할 수 있어요.</p>
            </div>
          ) : null}

          {/* 지원자에게 보이는 화면과 동일 */}
          <PositionDetailHeaderCard item={item} />
          <PositionDetailSections item={item} />
        </div>
      ) : null}

      {proposeTarget ? (
        <ProposeCandidateModal
          positionId={positionId}
          participant={proposeTarget}
          onClose={() => setProposeTarget(null)}
          onDone={() => {
            markProposed(proposeTarget.userId);
            setProposeTarget(null);
          }}
        />
      ) : null}
    </PartnerAppShell>
  );
}

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 23; h += 1) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

// 제안 모달 — 메시지 + (선택) 면접 시간.
function ProposeCandidateModal({ positionId, participant, onClose, onDone }: { positionId: string; participant: MockInterviewParticipant; onClose: () => void; onDone: () => void }) {
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [message, setMessage] = useState("모의 면접 결과가 인상적이에요. 함께 이야기 나눠보고 싶습니다.");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  function submit() {
    if (saving) return;
    let interviewAt: string | undefined;
    if (date && time) {
      const d = new Date(`${date}T${time}`);
      d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
      interviewAt = d.toISOString();
    }
    setSaving(true);
    proposeToMockInterviewCandidate(positionId, participant.userId, { message: message.trim() || undefined, interviewAt })
      .then(() => {
        toast.success("제안을 보냈어요");
        onDone();
      })
      .catch(() => toast.error("제안에 실패했어요."))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{participant.name} 님에게 제안</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">수락하면 연락처가 공유돼요. 면접 시간을 함께 제안할 수 있어요.</p>
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">메시지</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">면접 시간 제안 <span className="font-normal text-[#B0B8C1]">(선택)</span></span>
            <div className="flex gap-1.5">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2.5 text-[13px] text-[#191F28] outline-none [color-scheme:light]" />
              <select value={time} onChange={(e) => setTime(e.target.value)} className="w-[110px] shrink-0 rounded-lg bg-[#F5F6F8] px-2.5 py-2.5 text-[13px] text-[#191F28] outline-none [color-scheme:light]">
                <option value="">시간</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </label>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">취소</button>
          <button type="button" onClick={submit} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#0B46E8] text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{saving ? "보내는 중…" : "제안 보내기"}</button>
        </div>
      </div>
    </div>
  );
}
