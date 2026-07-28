// 스텝 완료 판정 공용 로직 — WeekStepper(주차 페이지)와 대시보드 퍼널이 공유한다.
import type { CareerProgress } from "./progress-client";
import { hasResumeContent, type ResumeData } from "./resume-data";
import { hasCoverContent, type CoverData } from "./cover-data";
import { WEEKS, type Step } from "./data";

// 스텝별로 어떤 결과(섹션)로 완료 판정하는지. 여기 없는 스텝은 doneSteps 수동 체크.
export const STEP_KIND: Record<string, string> = {
  w1s1: "diag",
  w1s2: "jobs",
  w1s3: "materials",
  // week2 이력서 — 표시 섹션 단위
  "w2-basic": "resume-basic",
  "w2-edu": "resume-edu",
  "w2-exp": "resume-exp-work",
  "w2-exp-other": "resume-exp-other",
  "w2-skill": "resume-skill",
  "w2-lang": "resume-lang",
  // week3 자기소개서 — 문항 단위(순서대로 누적)
  "w3-motive": "cover1",
  "w3-growth": "cover2",
  "w3-strength": "cover3",
  "w3-aspiration": "cover4",
  // week4
  w4s1: "both",
  "w4-self": "interview-self",
  "w4-job": "interview-job",
  "w4-fit": "interview-fit"
};

export type LaunchData = { progress: CareerProgress; resume: ResumeData; cover: CoverData };

export function isStepDone(id: string, d: LaunchData): boolean {
  const { progress: prog, resume, cover } = d;
  const doneMarked = (prog.doneSteps ?? []).includes(id);
  const kind = STEP_KIND[id];
  if (!kind) return doneMarked;

  const eduN = resume.educations?.length ?? 0;
  const skillN = resume.skills?.length ?? 0;
  const langN = resume.languages?.length ?? 0;
  const coverN = (cover.items ?? []).filter((x) => (x.answer ?? "").trim().length > 0).length;

  let kd = false;
  switch (kind) {
    case "diag": kd = Boolean(prog.diagnosis && typeof prog.diagnosis.percent === "number"); break;
    case "jobs": kd = (prog.selectedJobs?.length ?? 0) > 0; break;
    case "materials": kd = (prog.materials?.length ?? 0) > 0; break;
    case "resume-basic": kd = Boolean(resume.basic?.name || resume.basic?.summary); break;
    case "resume-edu": kd = eduN > 0; break;
    case "resume-exp-work": kd = (resume.experiences ?? []).some((x) => x.kind !== "other"); break;
    case "resume-exp-other": kd = (resume.experiences ?? []).some((x) => x.kind === "other"); break;
    case "resume-skill": kd = skillN > 0; break;
    case "resume-lang": kd = langN > 0; break;
    case "cover1": kd = coverN >= 1; break;
    case "cover2": kd = coverN >= 2; break;
    case "cover3": kd = coverN >= 3; break;
    case "cover4": kd = coverN >= 4; break;
    case "interview-self": kd = (prog.interview?.practiced ?? []).includes("self"); break;
    case "interview-job": kd = (prog.interview?.practiced ?? []).includes("job"); break;
    case "interview-fit": kd = (prog.interview?.practiced ?? []).includes("fit"); break;
    case "both": kd = hasResumeContent(resume) && hasCoverContent(cover); break;
    default: kd = false;
  }
  return kd || doneMarked;
}

export function weekDoneCount(steps: Step[], d: LaunchData): number {
  return steps.filter((s) => isStepDone(s.id, d)).length;
}

export function isWeekComplete(week: number, d: LaunchData): boolean {
  const w = WEEKS.find((x) => x.week === week);
  return Boolean(w && weekDoneCount(w.steps, d) === w.steps.length);
}

export type WeekOpen = { week: number; opensAt: string | null; forceOpen: boolean };

// 주차 잠금 규칙:
//  - 기수에 오픈 일정이 지정된 주차(forceOpen 또는 opensAt 설정)는 "날짜 기반" — 강제 오픈이거나
//    오픈일이 지났으면 열림(진행과 무관). 오픈일 전이면 잠김.
//  - 일정이 미설정인 주차는 기존 "진행 기반"(직전 주차 완료 시 열림)으로 폴백.
export function weekUnlocked(week: number, d: LaunchData, schedule?: WeekOpen[], now?: Date): boolean {
  const entry = schedule?.find((s) => s.week === week);
  const scheduled = Boolean(entry && (entry.forceOpen || entry.opensAt));
  if (scheduled && entry) {
    if (entry.forceOpen) return true;
    const nowMs = (now ?? new Date()).getTime();
    return entry.opensAt ? new Date(entry.opensAt).getTime() <= nowMs : false;
  }
  // 일정 미설정 → 진행 기반 폴백.
  if (week <= 1) return true;
  return isWeekComplete(week - 1, d);
}

// 잠긴 주차의 예정 오픈일(있으면) — 잠금 화면 안내용.
export function weekOpensAt(week: number, schedule?: WeekOpen[]): string | null {
  return schedule?.find((s) => s.week === week)?.opensAt ?? null;
}
