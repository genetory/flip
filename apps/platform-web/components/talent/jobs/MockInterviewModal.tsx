"use client";

// 회사 저작 모의 면접 — 지원 여부와 무관하게 이력서 기반으로 연습 + AI 피드백.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkle, CaretDown } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useResumeDoc } from "../../../lib/talent/resume-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { aiInterviewQuestions, aiInterviewFeedback, recordMockInterviewPractice, type PublicPositionListItem, type InterviewQuestion, type InterviewFeedback } from "../../../lib/member-profile-client";
import type { ResumeDoc } from "../../../lib/talent/resume-doc";
import type { BasicInfo } from "../../../lib/talent/basic-info";

function resumeToText(doc: ResumeDoc | null, info: BasicInfo): string {
  if (!doc || !Array.isArray(doc.items)) return "";
  const lines: string[] = [];
  if (info.realName) lines.push(`이름: ${info.realName}`);
  if (doc.targetRole) lines.push(`지원 직무: ${doc.targetRole}`);
  for (const it of doc.items) {
    const body = [it.company, it.text].filter(Boolean).join(" ");
    if (body) lines.push(`- [${it.section}] ${body}`);
  }
  return lines.join("\n").slice(0, 8000);
}

function jobToText(item: PublicPositionListItem): string {
  return [
    `공고: ${item.title}`,
    item.preferredJobRole ? `직무: ${item.preferredJobRole}` : "",
    item.mockInterviewIntent ? `면접 포커스: ${item.mockInterviewIntent}` : "",
    item.mainResponsibilities ? `주요 업무: ${item.mainResponsibilities}` : "",
    item.requiredQualifications ? `자격 요건: ${item.requiredQualifications}` : ""
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);
}

export function MockInterviewModal({ item, onClose }: { item: PublicPositionListItem; onClose: () => void }) {
  useLockBodyScroll();
  const doc = useResumeDoc();
  const info = useBasicInfo();
  const resumeText = resumeToText(doc, info);

  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 회사가 대표 질문을 넣었으면 그대로, 아니면 이력서+공고로 AI 생성.
    const authored = (item.mockInterviewQuestions ?? []).filter(Boolean);
    if (authored.length) {
      setQuestions(authored.map((q) => ({ question: q, intent: "", category: "" })));
      setLoading(false);
      return;
    }
    if (!resumeText) {
      setLoading(false);
      return;
    }
    setLoading(true);
    aiInterviewQuestions({ resumeText, jobText: jobToText(item), desiredJobRole: item.preferredJobRole ?? undefined })
      .then((qs) => setQuestions(qs))
      .catch(() => setError("질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[640px] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-black tracking-[-0.02em] text-[#0B1227]"><Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" /> 모의 면접</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{item.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!resumeText && !(item.mockInterviewQuestions ?? []).length ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">이력서가 필요해요</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">이력서를 만들면 그 내용에 맞춰 예상 질문을 만들어드려요.</p>
              <Link href={talentAppRoutes.resume} className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">이력서 만들기</Link>
            </div>
          ) : loading ? (
            <p className="py-10 text-center text-[13.5px] text-[#8B95A1]">예상 면접 질문을 준비하고 있어요…</p>
          ) : error ? (
            <p className="py-10 text-center text-[13.5px] text-[#F04452]">{error}</p>
          ) : questions && questions.length ? (
            <div className="flex flex-col gap-3">
              {item.mockInterviewIntent ? (
                <div className="rounded-2xl bg-[#F5F8FF] px-4 py-3">
                  <p className="text-[11.5px] font-bold text-[#0B46E8]">이 회사가 보려는 포인트</p>
                  <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#4E5968]">{item.mockInterviewIntent}</p>
                </div>
              ) : null}
              {questions.map((q, i) => (
                <QuestionCard key={i} index={i} q={q} resumeText={resumeText} desiredJobRole={item.preferredJobRole ?? undefined} positionId={item.id} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-[13.5px] text-[#8B95A1]">준비된 질문이 없어요.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ index, q, resumeText, desiredJobRole, positionId }: { index: number; q: InterviewQuestion; resumeText: string; desiredJobRole?: string; positionId: string }) {
  const [open, setOpen] = useState(index === 0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<InterviewFeedback | null>(null);

  function getFeedback() {
    const a = answer.trim();
    if (!a || busy) return;
    setBusy(true);
    aiInterviewFeedback({ question: q.question, answer: a, resumeText: resumeText || undefined, desiredJobRole })
      .then((f) => {
        setFb(f);
        // 연습 기록(회사엔 완료 신호만).
        void recordMockInterviewPractice(positionId, f.score).catch(() => {});
      })
      .catch(() => setFb(null))
      .finally(() => setBusy(false));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3.5 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[11px] font-black text-[#0B46E8]">{index + 1}</span>
        <span className="min-w-0 flex-1 break-keep text-[14px] font-bold text-[#191F28]">{q.question}</span>
        <CaretDown className={`h-4 w-4 shrink-0 text-[#B0B8C1] transition ${open ? "rotate-180" : ""}`} weight="bold" />
      </button>
      {open ? (
        <div className="border-t border-[#F2F4F6] px-4 py-3.5">
          {q.intent ? <p className="mb-2 rounded-lg bg-[#F8FAFB] px-3 py-2 text-[12px] text-[#8B95A1]">💡 {q.intent}</p> : null}
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="답변을 적어보세요. (STAR: 상황·과제·행동·결과)" className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
          <button type="button" onClick={getFeedback} disabled={!answer.trim() || busy} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
            <Sparkle className="h-3.5 w-3.5" weight="fill" /> {busy ? "평가 중…" : "AI 피드백 받기"}
          </button>

          {fb ? (
            <div className="mt-3 flex flex-col gap-2.5 rounded-2xl bg-[#F8FAFB] p-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#8B95A1]">완성도</span>
                <span className="text-[18px] font-black text-[#0B46E8]">{fb.score}</span>
                <span className="text-[12px] text-[#B0B8C1]">/ 100</span>
              </div>
              {fb.strengths.length ? (
                <div>
                  <p className="text-[11.5px] font-bold text-[#0A9B59]">잘한 점</p>
                  <ul className="mt-1 flex flex-col gap-0.5">{fb.strengths.map((s, i) => <li key={i} className="text-[12.5px] text-[#4E5968]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {fb.improvements.length ? (
                <div>
                  <p className="text-[11.5px] font-bold text-[#E8890C]">개선하면 좋아요</p>
                  <ul className="mt-1 flex flex-col gap-0.5">{fb.improvements.map((s, i) => <li key={i} className="text-[12.5px] text-[#4E5968]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {fb.sampleAnswer ? (
                <div>
                  <p className="text-[11.5px] font-bold text-[#0B46E8]">모범답안(내 이력서 기반)</p>
                  <p className="mt-1 whitespace-pre-wrap break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{fb.sampleAnswer}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
