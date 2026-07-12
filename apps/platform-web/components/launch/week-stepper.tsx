"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, type Step } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { STEP_KIND, isStepDone } from "../../lib/launch/step-status";

// 주차 페이지용 스텝 목록 — 1주차처럼 순차 잠금 + 스텝별(섹션별) 결과 표시.
// 완료 상태는 백엔드(progress)에 저장돼 기기 간 동기화된다.
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

  const eduN = resume.educations?.length ?? 0;
  const expN = resume.experiences?.length ?? 0;
  const skillN = resume.skills?.length ?? 0;
  const langN = resume.languages?.length ?? 0;
  const resumeBasicDone = Boolean(resume.basic?.name || resume.basic?.summary);
  const resumeExpDone = expN > 0;
  const resumeReady = hasResumeContent(resume);
  const coverReady = hasCoverContent(cover);
  const coverN = (cover.items ?? []).filter((x) => (x.answer ?? "").trim().length > 0).length;

  const isDone = (id: string) => isStepDone(id, { progress: prog, resume, cover });

  const toggle = (id: string) => {
    if (STEP_KIND[id]) return; // 결과 스텝은 수동 체크 불가
    const cur = prog.doneSteps ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setProg((p) => ({ ...p, doneSteps: next }));
    void patchProgress({ doneSteps: next }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  // 스텝별 결과 패널 — 해당 섹션 데이터가 있으면 그 내용을, 없으면 null(→ 시작하기).
  const stepResult = (id: string) => {
    const kind = STEP_KIND[id];
    if (!kind) return null;

    if (kind === "diag" && prog.diagnosis && typeof prog.diagnosis.percent === "number") {
      const d = prog.diagnosis;
      return (
        <ResultCard continueHref="/career-launch/diagnosis" continueLabel="다시 보기" restartHref="/career-launch/diagnosis?restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">취업 준비도 <span className="text-[#0B46E8]">{d.percent}%</span></p>
          {d.level ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{d.level}</p> : null}
          {d.strengths?.length ? (
            <div className="mt-2">
              <p className="text-[11.5px] font-bold text-[#3A6B00]">강점</p>
              <ul className="mt-1 space-y-0.5">
                {d.strengths.map((x, i) => (
                  <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">✓</span>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {d.improvements?.length ? (
            <div className="mt-2">
              <p className="text-[11.5px] font-bold text-[#8B95A1]">보완점</p>
              <ul className="mt-1 space-y-0.5">
                {d.improvements.map((x, i) => (
                  <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#B0B8C1]">•</span>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </ResultCard>
      );
    }
    if (kind === "jobs" && (prog.selectedJobs?.length ?? 0) > 0) {
      return (
        <ResultCard continueHref="/career-launch/jobs" continueLabel="이어서" restartHref="/career-launch/jobs?restart=1">
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
    if (kind === "materials" && (prog.materials?.length ?? 0) > 0) {
      return (
        <ResultCard continueHref="/career-launch/materials" continueLabel="이어서 정리" restartHref="/career-launch/materials?restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">선정 직무 정보 <span className="text-[#0B46E8]">{prog.materials!.length}개</span> 정리</p>
          <ul className="mt-2 space-y-1.5">
            {prog.materials!.map((m, i) => (
              <li key={i} className="flex gap-1.5 break-keep rounded-lg bg-white/70 px-2.5 py-2 text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">•</span>{m}</li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 이력서 — 기본정보·한줄소개
    if (kind === "resume-basic" && resumeBasicDone) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=basic" continueLabel="이어하기" restartHref="/career-launch/resume-collect?section=basic&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 기본정보 · 한줄소개</p>
          {resume.basic?.name ? <p className="mt-1 text-[12.5px] font-semibold text-[#333D4B]">{[resume.basic.name, resume.basic.email, resume.basic.phone].filter(Boolean).join(" · ")}</p> : null}
          {resume.basic?.summary ? <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">“{resume.basic.summary}”</p> : null}
        </ResultCard>
      );
    }
    // 이력서 — 학력
    if (kind === "resume-edu" && eduN > 0) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=edu" continueLabel="이어하기" restartHref="/career-launch/resume-collect?section=edu&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 학력 <span className="text-[#0B46E8]">{eduN}개</span></p>
          <ul className="mt-1.5 space-y-1">
            {resume.educations!.map((e, i) => (
              <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]">
                <span className="text-[#3A6B00]">•</span>{[e.school, e.major, e.period].filter(Boolean).join(" · ")}
              </li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 이력서 — 경력·경험
    if (kind === "resume-exp" && resumeExpDone) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=exp" continueLabel="이어하기" restartHref="/career-launch/resume-collect?section=exp&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 경력·경험 <span className="text-[#0B46E8]">{expN}개</span></p>
          <ul className="mt-2 space-y-2">
            {resume.experiences!.map((x, i) => (
              <li key={i} className="rounded-lg bg-white/70 p-2.5">
                <p className="text-[13px] font-bold text-[#191F28]">{[x.title, x.org].filter(Boolean).join(" · ")}{x.period ? <span className="font-normal text-[#8B95A1]"> ({x.period})</span> : null}</p>
                {x.bullets?.length ? (
                  <ul className="mt-1 space-y-0.5">
                    {x.bullets.map((b, bi) => (
                      <li key={bi} className="flex gap-1.5 break-keep text-[12px] text-[#4E5968]"><span className="text-[#0B46E8]">•</span>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 이력서 — 스킬
    if (kind === "resume-skill" && skillN > 0) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=skill" continueLabel="이어하기" restartHref="/career-launch/resume-collect?section=skill&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 스킬 <span className="text-[#0B46E8]">{skillN}개</span></p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {resume.skills!.map((s, i) => (
              <span key={i} className="rounded-full bg-white/70 px-2 py-0.5 text-[11.5px] font-semibold text-[#0B46E8]">{s}</span>
            ))}
          </div>
        </ResultCard>
      );
    }
    // 이력서 — 어학
    if (kind === "resume-lang" && langN > 0) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=lang" continueLabel="이어하기" restartHref="/career-launch/resume-collect?section=lang&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 어학 <span className="text-[#0B46E8]">{langN}개</span></p>
          <p className="mt-1.5 text-[12.5px] text-[#4E5968]">{resume.languages!.map((l) => [l.language, l.level].filter(Boolean).join(" ")).join(" · ")}</p>
        </ResultCard>
      );
    }
    // 자기소개서 — 문항별(한 스텝 = 한 문항). 해당 문항의 질문+답변만 보여준다.
    if (kind === "cover1" || kind === "cover2" || kind === "cover3" || kind === "cover4") {
      const idx = kind === "cover1" ? 0 : kind === "cover2" ? 1 : kind === "cover3" ? 2 : 3;
      const section = (["motive", "growth", "strength", "aspiration"] as const)[idx];
      const filled = (cover.items ?? []).filter((x) => (x.answer ?? "").trim());
      const it = filled[idx];
      if (!it) return null;
      return (
        <ResultCard continueHref={`/career-launch/cover-collect?section=${section}`} continueLabel="이어하기" restartHref={`/career-launch/cover-collect?section=${section}&restart=1`}>
          <p className="break-keep text-[12.5px] font-bold text-[#191F28]">📝 {it.question}</p>
          <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#4E5968]">{it.answer}</p>
        </ResultCard>
      );
    }
    // 이력서 + 자기소개서 최종 점검 — 요약을 보여주고, 고칠 곳은 각각 week2/week3 로 이동해 수정.
    if (kind === "both" && (resumeReady || coverReady)) {
      const filledCover = (cover.items ?? []).filter((x) => (x.answer ?? "").trim());
      return (
        <div className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          {resumeReady ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-[#191F28]">📄 이력서 — 경력 {expN} · 스킬 {skillN}</p>
                <Link href="/career-launch/week/2" className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] underline">이력서 수정하기</Link>
              </div>
              {expN > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {resume.experiences!.map((x, i) => (
                    <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#3A6B00]">•</span>{[x.title, x.org].filter(Boolean).join(" · ")}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {coverReady ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-[#191F28]">📝 자기소개서 — 문항 {coverN}개{cover.company ? ` · ${cover.company}` : ""}</p>
                <Link href="/career-launch/week/3" className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] underline">자기소개서 수정하기</Link>
              </div>
              <ul className="mt-1.5 space-y-1">
                {filledCover.map((it, i) => (
                  <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#3A6B00]">•</span>{it.question}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      );
    }
    return null;
  };

  const doneN = steps.filter((s) => isDone(s.id)).length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF1F5]">
          <div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${steps.length ? (doneN / steps.length) * 100 : 0}%` }} />
        </div>
        <span className="shrink-0 text-[12px] font-bold text-[#4E5968]">{doneN}/{steps.length} 완료</span>
      </div>
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = isDone(s.id);
        const last = i === steps.length - 1;
        const result = Boolean(STEP_KIND[s.id]);
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
    </>
  );
}

// 결과 카드 — 진단/직무/이력서 섹션 공통 래퍼. 우상단에 이어하기 + 다시하기 링크.
function ResultCard({ continueHref, continueLabel, restartHref, children }: { continueHref: string; continueLabel: string; restartHref: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link href={continueHref} className="text-[12.5px] font-bold text-[#0B46E8] underline">{continueLabel}</Link>
          <Link href={restartHref} className="text-[12px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">다시하기</Link>
        </div>
      </div>
    </div>
  );
}
