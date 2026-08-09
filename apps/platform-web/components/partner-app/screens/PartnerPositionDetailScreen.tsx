"use client";

// 파트너 공고 상세 — 지원자(탤런트)에게 보이는 것과 동일한 화면(공용 렌더 재사용) + 관리 액션.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PencilSimple, Copy } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { PositionDetailHeaderCard, PositionDetailSections } from "../../talent/screens/JobDetailScreen";
import { ProposeCandidateModal } from "../ProposeCandidateModal";
import { PartnerMoreLink, PartnerEmptyCard } from "../ui/cards";
import { PartnerApplicantCard, PartnerParticipantCard } from "../ListCards";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import {
  getMyPartnerPositionById,
  getMyPartnerOrganization,
  getMyPartnerApplicants,
  updateMyPartnerPosition,
  createMyPartnerPosition,
  deleteMyPartnerPosition,
  getPositionMockInterviewParticipants,
  type PartnerPosition,
  type MyPartnerOrganization,
  type PublicPositionListItem,
  type MockInterviewParticipant,
  type PartnerApplicantListItem
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
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
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
    void getMyPartnerApplicants()
      .then((all) => setApplicants(all.filter((a) => a.positionId === positionId)))
      .catch(() => setApplicants([]));
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
  // 공고 복제 — 내용을 그대로 복사해 새 DRAFT로 만들고 편집 화면으로.
  function duplicate() {
    if (busy || !p) return;
    setBusy(true);
    createMyPartnerPosition({
      title: `${p.title} (사본)`,
      status: "DRAFT",
      workType: p.workType ?? undefined,
      employmentType: p.employmentType,
      thumbnailImages: p.thumbnailImages ?? undefined,
      eligibleVisas: p.eligibleVisas ?? undefined,
      preferredNationalities: p.preferredNationalities ?? undefined,
      communicationLanguages: p.communicationLanguages ?? undefined,
      hiringProcess: p.hiringProcess ?? undefined,
      preferredJobRole: p.preferredJobRole ?? undefined,
      hiringCount: p.hiringCount ?? undefined,
      workingHours: p.workingHours ?? undefined,
      workLocation: p.workLocation ?? undefined,
      startDate: p.startDate ?? undefined,
      mainResponsibilities: p.mainResponsibilities ?? undefined,
      requiredQualifications: p.requiredQualifications ?? undefined,
      preferredQualifications: p.preferredQualifications ?? undefined,
      dressCode: p.dressCode ?? undefined,
      wantsPreTraining: p.wantsPreTraining ?? undefined,
      additionalNotes: p.additionalNotes ?? undefined
    })
      .then((created) => {
        toast.success("공고를 복제했어요. 내용을 확인하고 게시하세요.");
        router.push(`${partnerRoutes.positions}/${created.id}/edit`);
      })
      .catch(() => {
        toast.error("복제에 실패했어요.");
        setBusy(false);
      });
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
  // 최신순으로 3명까지 보여주기.
  const recentApplicants = [...applicants].sort((a, b) => (b.appliedAt ?? "").localeCompare(a.appliedAt ?? ""));
  const recentParticipants = [...participants].sort((a, b) => b.lastPracticedAt.localeCompare(a.lastPracticedAt));

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
              <button type="button" onClick={duplicate} disabled={busy} className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#F2F4F6] px-4 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50"><Copy className="h-4 w-4" weight="bold" /> 복제</button>
              <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
                <PencilSimple className="h-4 w-4" weight="bold" /> 수정하기
              </Link>
            </div>
          </div>

          {/* 지원자 */}
          <div className="mb-6">
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">지원자 ({applicants.length})</h2>
            {applicants.length ? (
              <>
                <div className="flex flex-col gap-2.5">
                  {recentApplicants.slice(0, 3).map((a) => (
                    <PartnerApplicantCard key={a.id} a={a} />
                  ))}
                </div>
                {applicants.length > 3 ? (
                  <PartnerMoreLink href={`${partnerRoutes.applicants}?position=${encodeURIComponent(positionId)}`} className="mt-2.5" />
                ) : null}
              </>
            ) : (
              <PartnerEmptyCard emoji="🧑‍💼" title="아직 지원자가 없어요" desc="게시 중이면 지원자가 여기에 모여요." />
            )}
          </div>

          {/* 모의 면접 참여자 — 지원 안 해도 표시, 제안 가능 */}
          {participants.length ? (
            <div className="mb-6">
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">모의 면접 참여자 ({participants.length})</h2>
              <div className="flex flex-col gap-2.5">
                {recentParticipants.slice(0, 3).map((m) => (
                  <PartnerParticipantCard
                    key={m.userId}
                    m={{ ...m, positionId, positionTitle: p.title }}
                    onPropose={() => setProposeTarget(m)}
                  />
                ))}
              </div>
              {participants.length > 3 ? (
                <PartnerMoreLink href={`${partnerRoutes.applicants}?position=${encodeURIComponent(positionId)}&tab=mock`} className="mt-2.5" />
              ) : null}
              <p className="mt-2 text-[12px] text-[#8B95A1]">지원하지 않았어도 이 공고 모의 면접을 푼 사람이에요. 제안을 보내 먼저 연결할 수 있어요.</p>
            </div>
          ) : null}

          {/* 모의 면접 관리 */}
          {(() => {
            const configured = Boolean(p.mockInterviewIntent || (p.mockInterviewQuestions?.length ?? 0) > 0);
            return (
              <div className="mb-6 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[17px]" aria-hidden>🎤</span>
                  <p className="text-[14.5px] font-bold text-[#191F28]">모의 면접</p>
                  <span className={`rounded-md px-2.5 py-0.5 text-[10.5px] font-bold ${configured ? "bg-[#E7F8EF] text-[#0A9B59]" : "bg-[#FFF3E6] text-[#E8890C]"}`}>{configured ? "설정됨" : "미설정"}</span>
                  <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="ml-auto shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">{configured ? "수정" : "추가하기"}</Link>
                </div>
                {configured ? (
                  <>
                    {p.mockInterviewIntent ? <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{p.mockInterviewIntent}</p> : null}
                    {(p.mockInterviewQuestions?.length ?? 0) > 0 ? (
                      <ol className="mt-2.5 flex flex-col gap-1.5">
                        {p.mockInterviewQuestions!.map((q, i) => (
                          <li key={i} className="flex gap-2 rounded-xl bg-white px-3 py-2 text-[12.5px] leading-relaxed text-[#191F28]">
                            <span className="shrink-0 font-bold text-[#0B46E8]">Q{i + 1}</span>
                            <span className="min-w-0 break-keep">{q}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">지원자가 지원 전에 이 포지션 모의 면접을 연습하고 AI 피드백을 받을 수 있어요. 준비 잘 된 지원자가 모입니다.</p>
                )}
              </div>
            );
          })()}

          {/* 지원자에게 보이는 화면과 동일 */}
          <PositionDetailHeaderCard item={item} />
          <PositionDetailSections item={item} />
        </div>
      ) : null}

      {proposeTarget ? (
        <ProposeCandidateModal
          positionId={positionId}
          userId={proposeTarget.userId}
          name={proposeTarget.name}
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
