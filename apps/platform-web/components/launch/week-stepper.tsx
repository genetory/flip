"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, type Step } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";

// 결과로 완료되는 스텝(수동 체크 불가) — 실제 진행 결과로 완료 판정.
const RESULT_STEP = new Set(["w1s1", "w1s2", "w1s3", "w2s1", "w2s2", "w2s3", "w3s1", "w3s2", "w3s3", "w4s1"]);
// 이력서/자소서 데이터에 연결된 스텝.
const RESUME_STEP = new Set(["w2s1", "w2s2", "w2s3", "w3s2", "w3s3", "w4s1"]);
const COVER_STEP = new Set(["w3s1", "w3s2", "w3s3"]);

// 주차 페이지용 스텝 목록 — 1주차처럼 순차 잠금 + 스텝별 결과 표시. 완료 상태는
// 백엔드(progress)에 저장돼 기기 간 동기화된다.
export function WeekStepper({ steps }: { steps: Step[] }) {
  const [prog, setProg] = useState<CareerProgress>({});
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [p, r, c] = await Promise.all([fetchProgress(), fetchResumeData().catch(() => ({ data: {} })), fetchCoverData().catch(() => ({ data: {} }))]);
        if (!alive) return;
        setProg(p);
        setResume(r.data ?? {});
        setCover(c.data ?? {});
      } catch {
        // 조회 실패 시 빈 상태
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const resumeReady = hasResumeContent(resume);
  const coverReady = hasCoverContent(cover);

  // 완료 판정 — 결과 스텝은 실제 데이터로, 그 외는 doneSteps 수동 체크.
  const isDone = (id: string) => {
    if (id === "w1s1") return Boolean(prog.diagnosis && typeof prog.diagnosis.percent === "number");
    if (id === "w1s2") return (prog.selectedJobs?.length ?? 0) > 0;
    if (id === "w1s3") return (prog.materials?.length ?? 0) > 0;
    if (RESUME_STEP.has(id) && COVER_STEP.has(id)) return resumeReady && coverReady;
    if (RESUME_STEP.has(id)) return resumeReady;
    if (COVER_STEP.has(id)) return coverReady;
    return (prog.doneSteps ?? []).includes(id);
  };

  const toggle = (id: string) => {
    if (RESULT_STEP.has(id)) return; // 결과 스텝은 수동 체크 불가
    const cur = prog.doneSteps ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setProg((p) => ({ ...p, doneSteps: next }));
    void patchProgress({ doneSteps: next }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  // 스텝별 결과 패널 — 데이터가 있으면 그 내용을, 없으면 null(→ 시작하기 버튼).
  const stepResult = (id: string) => {
    if (id === "w1s1" && prog.diagnosis && typeof prog.diagnosis.percent === "number") {
      const d = prog.diagnosis;
      return (
        <ResultCard href="/career-launch/diagnosis" hrefLabel="다시 보기">
          <p className="text-[13.5px] font-bold text-[#191F28]">
            취업 준비도 <span className="text-[#0B46E8]">{d.percent}%</span>
          </p>
          {d.level ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{d.level}</p> : null}
          {d.strengths?.length ? (
            <ul className="mt-2 space-y-0.5">
              {d.strengths.map((x, i) => (
                <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">✓</span>{x}</li>
              ))}
            </ul>
          ) : null}
        </ResultCard>
      );
    }
    if (id === "w1s2" && (prog.selectedJobs?.length ?? 0) > 0) {
      return (
        <ResultCard href="/career-launch/jobs?restart=1" hrefLabel="다시 선정">
          <p className="text-[13.5px] font-bold text-[#191F28]">선정한 직무 <span className="text-[#0B46E8]">{prog.selectedJobs!.length}개</span></p>
          <ul className="mt-2 space-y-2">
            {prog.selectedJobs!.map((role) => {
              const job = RECOMMENDED_JOBS.find((x) => x.role === role);
              return (
                <li key={role} className="rounded-lg bg-white/70 p-2.5">
                  <p className="text-[13px] font-bold text-[#191F28]">{role}</p>
                  {job?.reason ? <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#4E5968]">{job.reason}</p> : null}
                </li>
              );
            })}
          </ul>
        </ResultCard>
      );
    }
    if (id === "w1s3" && (prog.materials?.length ?? 0) > 0) {
      return (
        <ResultCard href="/career-launch/materials" hrefLabel="이어서 정리">
          <p className="text-[13.5px] font-bold text-[#191F28]">선정 직무 정보 <span className="text-[#0B46E8]">{prog.materials!.length}개</span> 정리</p>
          <ul className="mt-2 space-y-1.5">
            {prog.materials!.map((m, i) => (
              <li key={i} className="flex gap-1.5 break-keep rounded-lg bg-white/70 px-2.5 py-2 text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">•</span>{m}</li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 이력서/자소서 연결 스텝 — 현재 작성 상태 요약.
    const showResume = RESUME_STEP.has(id) && resumeReady;
    const showCover = COVER_STEP.has(id) && coverReady;
    if (showResume || showCover) {
      const eduN = resume.educations?.length ?? 0;
      const expN = resume.experiences?.length ?? 0;
      const skillN = resume.skills?.length ?? 0;
      const coverN = (cover.items ?? []).filter((x) => (x.answer ?? "").trim().length > 0).length;
      return (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          {showResume ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-[#191F28]">📄 이력서 — 학력 {eduN} · 경력 {expN} · 스킬 {skillN}</p>
              <span className="flex shrink-0 items-center gap-2 text-[12.5px] font-bold">
                <Link href="/career-launch/resume-preview" className="text-[#0B46E8] underline">보기</Link>
                <Link href="/career-launch/resume-collect" className="text-[#0B46E8] underline">이어하기</Link>
              </span>
            </div>
          ) : null}
          {showCover ? (
            <div className={`flex items-center justify-between gap-2 ${showResume ? "mt-2" : ""}`}>
              <p className="text-[13px] font-bold text-[#191F28]">📝 자소서 — 문항 {coverN}개{cover.company ? ` · ${cover.company}` : ""}</p>
              <Link href="/career-launch/cover-collect" className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] underline">이어하기</Link>
            </div>
          ) : null}
        </div>
      );
    }
    return null;
  };

  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = isDone(s.id);
        const last = i === steps.length - 1;
        const result = RESULT_STEP.has(s.id);
        const panel = stepResult(s.id);
        // 순차 연계 — 이전 스텝을 모두 완료해야 이 스텝을 시작할 수 있다.
        const locked = ready && !done && !steps.slice(0, i).every((p) => isDone(p.id));
        const toggleable = !result && !locked;
        return (
          <li key={s.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!toggleable}
                onClick={toggleable ? () => toggle(s.id) : undefined}
                aria-label={toggleable ? (done ? "완료 취소" : "완료로 표시") : undefined}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-black shadow-sm transition ${
                  done
                    ? "bg-[#0B46E8] text-white"
                    : locked
                      ? "cursor-default border-2 border-[#E5E8EB] bg-[#F8FAFC] text-[#C9CDD2]"
                      : "border-2 border-[#D7DCE3] bg-white text-[#4E5968]"
                } ${toggleable ? "hover:border-[#0B46E8] hover:text-[#0B46E8]" : "cursor-default"}`}
              >
                {done ? "✓" : locked ? "🔒" : i + 1}
              </button>
              {!last ? <span className="mt-1.5 w-[2px] flex-1 rounded bg-[#E5E8EB]" /> : null}
            </div>
            <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-7"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`text-[15.5px] font-bold leading-snug tracking-[-0.01em] md:text-[16px] ${done ? "text-[#8B95A1]" : locked ? "text-[#B0B8C1]" : "text-[#191F28]"}`}>
                  {s.title}
                </p>
                {!done && !locked && s.minutes ? (
                  <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8B95A1]">⏱ 약 {s.minutes}분</span>
                ) : null}
              </div>
              <p className={`mt-1.5 break-keep text-[13.5px] leading-[1.7] ${done ? "text-[#B0B8C1]" : locked ? "text-[#C9CDD2]" : "text-[#4E5968]"}`}>
                {s.desc
                  .split(/(?<=\.)\s+/)
                  .filter(Boolean)
                  .map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
              </p>
              {locked ? (
                <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#B0B8C1]">🔒 이전 단계를 완료하면 시작할 수 있어요</p>
              ) : panel ? (
                panel
              ) : done ? (
                <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                  <span className="font-bold text-emerald-600">✓ 완료</span>
                  {toggleable ? (
                    <button type="button" onClick={() => toggle(s.id)} className="font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                      완료 취소
                    </button>
                  ) : s.action ? (
                    <Link href={s.action.href} className="font-semibold text-[#0B46E8] underline">
                      다시 하기
                    </Link>
                  ) : null}
                </div>
              ) : s.action ? (
                <Link
                  href={s.action.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#EDF1FD] px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]"
                >
                  {s.action.label} <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// 결과 카드 — 진단/직무/직무정보 공통 래퍼(우상단 링크 포함).
function ResultCard({ href, hrefLabel, children }: { href: string; hrefLabel: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        <Link href={href} className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] underline">{hrefLabel}</Link>
      </div>
    </div>
  );
}
