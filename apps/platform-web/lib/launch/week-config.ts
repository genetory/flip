// UX Phase 4 — 주차별 화면 config(핵심 질문·결과물·다음 주 예고). 미션 흐름은 기존 WEEKS.steps 재사용.
// step id·route 는 유지하고, 화면 표현/문구만 이 config 로 오버레이한다.

export type WeekConfig = {
  week: number;
  question: string; // 이번 주 핵심 질문
  resultLabels: string[]; // 완료 시 얻는 결과물(카드/칩)
  ctaLabel: string; // 주차 대표 CTA
  nextWeekTeaser?: string; // 다음 주 예고(완료 화면)
};

export const WEEK_CONFIG: Record<number, WeekConfig> = {
  1: {
    week: 1,
    question: "나는 어떤 일을 잘할 수 있고, 어떤 직무에서 그 강점을 활용할 수 있을까요?",
    resultLabels: ["대표 경험", "발견한 강점", "추천 직무 3개", "직무 체험 2개", "목표 직무", "직무 결정 리포트"],
    ctaLabel: "첫 상담 시작하기",
    nextWeekTeaser: "다음 주에는 대표 경험을 실제 지원서로 바꿔요."
  },
  2: {
    week: 2,
    question: "내 경험을 목표 직무와 실제 공고에 맞춰 어떻게 지원서로 만들까요?",
    resultLabels: ["대표 이력서", "기준 공고", "공고 분석", "공고 맞춤 이력서", "자기소개서", "지원 준비도", "예상 면접 질문"],
    ctaLabel: "서류 전략 확인하기",
    nextWeekTeaser: "다음 주에는 이 서류를 바탕으로 실전면접을 진행해요."
  },
  3: {
    week: 3,
    question: "실제 면접에서 내 답변은 어디에서 약해질까요?",
    resultLabels: ["면접 전략", "최초 모의면접", "질문별 피드백", "반복 취약 패턴", "핵심 오답", "Week 4 훈련계획"],
    ctaLabel: "코치의 면접 전략 확인하기",
    nextWeekTeaser: "다음 주에는 같은 질문과 유사 질문을 반복해서 연습해요."
  },
  4: {
    week: 4,
    question: "피드백을 적용해 다른 질문에서도 더 좋은 답변을 할 수 있을까요?",
    resultLabels: ["해결한 오답", "유사 질문 통과", "최종 모의면접", "최초·최종 비교", "성장 리포트", "30일 행동계획"],
    ctaLabel: "이번 주 훈련계획 확인하기",
    nextWeekTeaser: "4주 프로그램을 완료했어요. 목표 직무·지원서·면접 성장을 모두 확인했어요."
  }
};

// 주차 상태(잠금/진행/완료 등) — 사용자 표현. 중앙 copy.ts 단일 소스 재사용(UX Phase 7).
export { MISSION_STATUS_LABEL as WEEK_STATUS_LABEL } from "./copy";
