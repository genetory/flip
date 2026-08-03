// 이력서 미리보기/완성도 코칭 로직 — 정리한 경험을 이력서 문장(Before/After)으로,
// 부족한 부분은 "점수"가 아니라 "다음 단계 + 힌트"로 안내한다.
import type { TalentSnapshot } from "./types";

export interface ResumeItem {
  id: string;
  title: string;
  period?: string;
  before: string; // 있는 그대로 말한 경험
  after: string; // 취업 언어로 정리된 문장
  hasNumber: boolean; // 성과에 숫자가 있는지
}

export interface CoachingStep {
  key: string;
  label: string;
  done: boolean;
  hint?: string;
}

export interface ResumePreviewData {
  name: string;
  headline?: string;
  targetRole?: string;
  items: ResumeItem[];
  coaching: CoachingStep[];
  filledCount: number;
  totalCount: number;
}

export function buildResumePreview(snapshot: TalentSnapshot, targetRole?: string): ResumePreviewData {
  const items: ResumeItem[] = snapshot.experiences.map((e) => {
    const after = e.summary ?? "";
    return {
      id: e.id,
      title: e.title,
      period: e.period,
      before: e.answers?.what ?? `${e.title} 경험`,
      after: after || `${e.title}에서 맡은 역할과 결과를 정리해보세요.`,
      hasNumber: /\d/.test(after)
    };
  });

  const role = targetRole ?? snapshot.resumes[0]?.targetRole ?? snapshot.profile.interests[0];
  const headline = snapshot.profile.headline;

  const coaching: CoachingStep[] = [
    {
      key: "exp",
      label: "경험 2개 이상 정리하기",
      done: items.length >= 2,
      hint: items.length < 2 ? "경험이 많을수록 이력서가 단단해져요." : undefined
    },
    {
      key: "number",
      label: "성과에 숫자 넣기",
      done: items.some((i) => i.hasNumber),
      hint: "'주문 누락 30% 감소'처럼 숫자를 넣으면 훨씬 설득력 있어요."
    },
    {
      key: "role",
      label: "지원 직무 정하기",
      done: Boolean(role),
      hint: role ? undefined : "지원 직무를 정하면 그 직무에 맞춰 다듬어드려요."
    },
    {
      key: "headline",
      label: "한 줄 소개 쓰기",
      done: Boolean(headline),
      hint: headline ? undefined : "나를 한 문장으로 소개하면 첫인상이 좋아져요."
    }
  ];

  return {
    name: snapshot.profile.displayName,
    headline,
    targetRole: role,
    items,
    coaching,
    filledCount: coaching.filter((c) => c.done).length,
    totalCount: coaching.length
  };
}

// 이력서 템플릿(미리보기 스타일 프리셋).
export const resumeTemplates: { key: string; label: string; accent: string; desc: string }[] = [
  { key: "clean", label: "심플", accent: "#0B46E8", desc: "깔끔하고 담백한 신입용" },
  { key: "warm", label: "따뜻", accent: "#3A6B00", desc: "부드러운 인상" },
  { key: "bold", label: "강조", accent: "#0B1227", desc: "또렷하고 힘있는" }
];
