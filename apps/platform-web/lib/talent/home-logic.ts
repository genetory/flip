// 홈 메인 카드 도메인 로직 — 사용자 상태에 따라 "지금 해야 할 한 가지"를 결정한다.
import { talentAppRoutes } from "./app-nav";
import type { Application, JourneyStepKey, StepState, TalentSnapshot } from "./types";

// 여정 각 단계의 설명 + 행동(홈의 "하나씩 만들어가는" 타임라인에서 사용).
export const journeyStepMeta: Record<JourneyStepKey, { desc: string; ctaLabel: string; href: string }> = {
  interest: { desc: "관심 있는 직무 방향을 정해요.", ctaLabel: "관심 직무 찾기", href: talentAppRoutes.profile },
  experiences: { desc: "해본 일을 취업에 쓸 이야기로 정리해요.", ctaLabel: "경험 정리하기", href: talentAppRoutes.experiences },
  profile: { desc: "나를 소개하는 커리어 프로필을 만들어요.", ctaLabel: "프로필 만들기", href: talentAppRoutes.profile },
  resume: { desc: "정리한 경험으로 첫 이력서를 완성해요.", ctaLabel: "이력서 만들기", href: talentAppRoutes.resume },
  cover: { desc: "문항에 답하며 자기소개서를 채워요.", ctaLabel: "자기소개서 쓰기", href: talentAppRoutes.coverLetters },
  apply: { desc: "맞는 공고를 찾아 지원을 준비해요.", ctaLabel: "공고 찾아보기", href: talentAppRoutes.jobs },
  interview: { desc: "예상 질문에 미리 답을 준비해요.", ctaLabel: "면접 준비하기", href: talentAppRoutes.interviews }
};

export interface MainAction {
  kind: "new" | "resume" | "applying" | "next";
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  // applying 상태에서만 표시하는 진행 단계.
  steps?: { label: string; state: StepState }[];
}

function activeApplication(apps: Application[]): Application | undefined {
  return apps.find((a) => a.status === "preparing") ?? apps.find((a) => a.status === "interview");
}

export function deriveMainAction(s: TalentSnapshot): MainAction {
  // 1) 신규 — 아직 정리한 경험이 없음
  if (s.experiences.length === 0) {
    return {
      kind: "new",
      title: "첫 취업 준비를 시작해볼까요?",
      body: "학교 과제, 아르바이트, 프로젝트처럼\n내가 해본 일을 하나씩 정리해볼게요.",
      ctaLabel: "내 경험 정리하기",
      ctaHref: talentAppRoutes.experiences
    };
  }

  // 2) 경험은 있지만 이력서가 없음
  if (s.resumes.length === 0) {
    return {
      kind: "resume",
      title: "정리한 경험으로\n첫 이력서를 만들어볼까요?",
      body: `현재 ${s.experiences.length}개의 경험이 준비되어 있어요.\n약 3분이면 첫 초안을 만들 수 있어요.`,
      ctaLabel: "첫 이력서 만들기",
      ctaHref: talentAppRoutes.resume
    };
  }

  // 3) 지원 중 — 준비 중이거나 면접 준비 중인 지원이 있음
  const app = activeApplication(s.applications);
  if (app) {
    return {
      kind: "applying",
      title: `${app.company} ${app.jobTitle} 지원을 준비하고 있어요.`,
      body: "지원 준비를 이어서 완성해볼까요?",
      ctaLabel: "지원 준비 계속하기",
      ctaHref: `${talentAppRoutes.applications}/${app.id}`,
      steps: app.steps.map((st) => ({ label: st.label, state: st.state }))
    };
  }

  // 4) 다음 단계 — 이력서는 있으나 아직 지원 준비 전
  return {
    kind: "next",
    title: "이력서가 준비됐어요.\n이제 지원을 준비해볼까요?",
    body: "나에게 맞는 공고를 찾고\n자기소개서까지 이어서 완성해요.",
    ctaLabel: "맞는 공고 찾아보기",
    ctaHref: talentAppRoutes.jobs
  };
}
