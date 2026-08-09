"use client";

// 파트너 — 모의 면접 참여자 상세. 답변 전문 + 프로필 + (미지원 시) 제안.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Clock, ArrowUpRight, FileText, Note } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { ProposeCandidateModal } from "../ProposeCandidateModal";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMockInterviewParticipantDetail, type MockInterviewParticipantDetail } from "../../../lib/member-profile-client";

export function PartnerMockParticipantDetailScreen({ positionId, userId }: { positionId: string; userId: string }) {
  const [m, setM] = useState<MockInterviewParticipantDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [propose, setPropose] = useState(false);

  function load() {
    setStatus("loading");
    getMockInterviewParticipantDetail(positionId, userId)
      .then((d) => {
        setM(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId, userId]);

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" fallback={`${partnerRoutes.positions}/${positionId}`} />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && m ? (
        <div className="flex flex-col gap-6">
          {/* 헤더 */}
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{m.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{m.name}</p>
                  {m.applied ? (
                    <span className="rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">지원함</span>
                  ) : (
                    <span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">미지원</span>
                  )}
                  {m.bestScore != null ? <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">🎤 최고 {m.bestScore}점</span> : null}
                </div>
                <p className="mt-1.5 truncate text-[13px] font-semibold text-[#4E5968]">{m.positionTitle}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#8B95A1]">
                  {m.nationality ? <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-[#B0B8C1]" /> {m.nationality}</span> : null}
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#B0B8C1]" /> {formatRelativeTime(new Date(m.lastPracticedAt).getTime())} 연습</span>
                </div>
              </div>
            </div>

            {/* 액션 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {m.applied ? (
                <Link
                  href={`${partnerRoutes.applicants}/${encodeURIComponent(`${m.userId}:${m.positionId}`)}`}
                  className="inline-flex h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  지원자 상세 보기 <ArrowUpRight className="h-4 w-4" weight="bold" />
                </Link>
              ) : m.connectionStatus === "ACCEPTED" ? (
                <Link href={`${partnerRoutes.talent}/${encodeURIComponent(m.userId)}`} className="inline-flex h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0A9B59] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A8A4F]">
                  수락됨 · 연락처 보기 <ArrowUpRight className="h-4 w-4" weight="bold" />
                </Link>
              ) : m.connectionStatus === "PENDING" ? (
                <span className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[13.5px] font-bold text-[#8B95A1]">제안 보냄</span>
              ) : m.connectionStatus === "DECLINED" ? (
                <span className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-[#FDECEE] px-4 text-[13.5px] font-bold text-[#F04452]">제안 거절됨</span>
              ) : (
                <button type="button" onClick={() => setPropose(true)} className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  제안하기
                </button>
              )}
            </div>
          </div>

          {/* 서류 — 이력서/자기소개서 */}
          <section>
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">서류</h2>
            <div className="flex flex-col gap-2.5">
              <Link href={`${partnerRoutes.positions}/${m.positionId}/mock/${encodeURIComponent(m.userId)}/resume`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><FileText className="h-5 w-5" weight="fill" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-[#191F28]">이력서</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.resumeTitle || (m.resumeShareSlug ? "제출된 이력서 보기" : "이력서 확인")}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
              </Link>
              <Link href={`${partnerRoutes.positions}/${m.positionId}/mock/${encodeURIComponent(m.userId)}/cover`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Note className="h-5 w-5" weight="fill" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-[#191F28]">자기소개서</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.coverLetterTitle || (m.coverLetterShareSlug ? "제출된 자기소개서 보기" : "자기소개서 확인")}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
              </Link>
            </div>
          </section>

          {/* 모의 면접 답변 */}
          <section>
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">모의 면접 답변 ({m.answeredCount})</h2>
            {m.answers.length ? (
              <div className="flex flex-col gap-3">
                {m.answers.map((a, i) => (
                  <div key={i} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-keep text-[13.5px] font-bold text-[#191F28]">Q{i + 1}. {a.question}</p>
                      {a.score != null ? <span className="shrink-0 rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{a.score}점</span> : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{a.answer || "답변 없음"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center text-[13px] text-[#8B95A1]">아직 저장된 답변이 없어요.</div>
            )}
          </section>

          {!m.applied ? (
            <p className="break-keep text-center text-[12px] text-[#8B95A1]">지원하지 않았지만 이 공고 모의 면접을 풀어본 인재예요. 제안을 보내 먼저 연결할 수 있어요.</p>
          ) : null}
        </div>
      ) : null}

      {propose && m ? (
        <ProposeCandidateModal
          positionId={m.positionId}
          userId={m.userId}
          name={m.name}
          onClose={() => setPropose(false)}
          onDone={() => {
            setM((prev) => (prev ? { ...prev, connectionStatus: "PENDING" } : prev));
            setPropose(false);
          }}
        />
      ) : null}
    </PartnerAppShell>
  );
}
