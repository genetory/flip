"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, type Step } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { ResumeRender } from "./resume-render";
import { CoverRender } from "./cover-render";

// 스텝별로 어떤 결과(섹션)를 다루는지 매핑. 여기 있는 스텝은 실제 데이터로 완료 판정
// (수동 체크 불가), 없는 스텝은 doneSteps 수동 체크.
const STEP_KIND: Record<string, string> = {
  w1s1: "diag",
  w1s2: "jobs",
  w1s3: "materials",
  w2s1: "resume-basic", // 기본정보·학력
  w2s2: "resume-exp", // 경력·경험
  w2s3: "resume-skills", // 스킬·어학
  w3s1: "cover", // 자소서 문항
  w3s2: "both", // 이력서·자소서 다듬기
  w3s3: "both", // 완성도 점검
  w4s1: "both" // 최종 확정
};

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
  const resumeBasicDone = Boolean(resume.basic?.name || eduN > 0);
  const resumeExpDone = expN > 0;
  const resumeReady = hasResumeContent(resume);
  const coverReady = hasCoverContent(cover);
  const coverN = (cover.items ?? []).filter((x) => (x.answer ?? "").trim().length > 0).length;

  // 종류별 완료 판정.
  const kindDone = (kind: string): boolean => {
    switch (kind) {
      case "diag": return Boolean(prog.diagnosis && typeof prog.diagnosis.percent === "number");
      case "jobs": return (prog.selectedJobs?.length ?? 0) > 0;
      case "materials": return (prog.materials?.length ?? 0) > 0;
      case "resume-basic": return resumeBasicDone;
      case "resume-exp": return resumeExpDone;
      case "resume-skills": return skillN > 0 || langN > 0;
      case "cover": return coverReady;
      case "both": return resumeReady && coverReady;
      default: return false;
    }
  };

  const isDone = (id: string) => {
    const kind = STEP_KIND[id];
    if (kind) return kindDone(kind);
    return (prog.doneSteps ?? []).includes(id);
  };

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
        <ResultCard href="/career-launch/diagnosis" hrefLabel="다시 보기">
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
    if (kind === "materials" && (prog.materials?.length ?? 0) > 0) {
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
    // 이력서 — 기본정보·학력
    if (kind === "resume-basic" && resumeBasicDone) {
      return (
        <ResultCard href="/career-launch/resume-collect" hrefLabel="이어하기">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 기본정보 · 학력</p>
          {resume.basic?.name ? <p className="mt-1 text-[12.5px] text-[#333D4B]">{resume.basic.name}{resume.basic.summary ? ` — ${resume.basic.summary}` : ""}</p> : null}
          {eduN > 0 ? (
            <ul className="mt-1.5 space-y-1">
              {resume.educations!.map((e, i) => (
                <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]">
                  <span className="text-[#3A6B00]">•</span>{[e.school, e.major, e.period].filter(Boolean).join(" · ")}
                </li>
              ))}
            </ul>
          ) : null}
        </ResultCard>
      );
    }
    // 이력서 — 경력·경험
    if (kind === "resume-exp" && resumeExpDone) {
      return (
        <ResultCard href="/career-launch/resume-collect" hrefLabel="이어하기">
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
    // 이력서 — 스킬·어학
    if (kind === "resume-skills" && (skillN > 0 || langN > 0)) {
      return (
        <ResultCard href="/career-launch/resume-collect" hrefLabel="이어하기">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 스킬 {skillN} · 어학 {langN}</p>
          {skillN > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {resume.skills!.map((s, i) => (
                <span key={i} className="rounded-full bg-white/70 px-2 py-0.5 text-[11.5px] font-semibold text-[#0B46E8]">{s}</span>
              ))}
            </div>
          ) : null}
          {langN > 0 ? (
            <p className="mt-1.5 text-[12.5px] text-[#4E5968]">{resume.languages!.map((l) => [l.language, l.level].filter(Boolean).join(" ")).join(" · ")}</p>
          ) : null}
        </ResultCard>
      );
    }
    // 자소서 — 문항 전문
    if (kind === "cover" && coverReady) {
      return <ResultBlock title={`자기소개서 — 문항 ${coverN}개${cover.company ? ` · ${cover.company}` : ""}`} href="/career-launch/cover-collect" hrefLabel="이어하기"><CoverRender data={cover} /></ResultBlock>;
    }
    // 이력서 + 자소서 전문 (다듬기·완성도·최종 확정)
    if (kind === "both" && (resumeReady || coverReady)) {
      return (
        <div className="mt-3 space-y-3">
          {resumeReady ? <ResultBlock title="이력서" href="/career-launch/resume-preview" hrefLabel="미리보기"><ResumeRender data={resume} /></ResultBlock> : null}
          {coverReady ? <ResultBlock title="자기소개서" href="/career-launch/cover-collect" hrefLabel="이어하기"><CoverRender data={cover} /></ResultBlock> : null}
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
  );
}

// 결과 블록 — 전문(이력서/자소서 전체 렌더) 위에 제목 + 링크 헤더.
function ResultBlock({ title, href, hrefLabel, children }: { title: string; href: string; hrefLabel: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-bold text-[#3A6B00]">{title}</p>
        <Link href={href} className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] underline">{hrefLabel}</Link>
      </div>
      {children}
    </div>
  );
}

// 결과 카드 — 진단/직무/이력서 섹션 공통 래퍼(우상단 링크 포함).
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
