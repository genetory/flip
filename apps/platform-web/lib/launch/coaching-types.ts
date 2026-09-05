// UX Phase 3 — 전담 커리어 코치 상담 공통 타입 모델.
// 모든 상담(첫 상담·경험 발굴·직무 결정·서류 전략·면접 전략·오답 코칭)이 하나의 shell/설정을 공유한다.

// 구조화 메시지 타입 — 일반 말풍선으로만 처리하지 않는다.
export type CoachingMessage =
  | { id: string; role: "coach"; type: "text"; text: string }
  | { id: string; role: "coach"; type: "insight"; text: string } // 코치의 해석
  | { id: string; role: "coach"; type: "judgment"; text: string; grounds?: string[] } // 코치의 판단 + 근거
  | { id: string; role: "coach"; type: "confirmation"; text: string } // 확인 요청(맞아요/일부만/다르게)
  | { id: string; role: "coach"; type: "choices"; text?: string; choices: { key: string; label: string; hint?: string }[]; multi?: boolean }
  | { id: string; role: "coach"; type: "artifact_update"; artifactLabel: string; text: string; changeHref?: string }
  | { id: string; role: "coach"; type: "profile_update"; text: string; facts: { label: string; value: string }[] }
  | { id: string; role: "coach"; type: "warning"; text: string } // 경고·사실 확인(충돌)
  | { id: string; role: "coach"; type: "human_review"; text: string } // 사람 검토 안내
  | { id: string; role: "user"; type: "text"; text: string }
  | { id: string; role: "user"; type: "choice"; text: string };

export type CoachingMessageType = CoachingMessage["type"];

// 상담 진행 단계(목표 기반 — 메시지 수 아님).
export type CoachingStepStatus = "upcoming" | "current" | "completed" | "skipped";
export type CoachingStep = { key: string; label: string; status: CoachingStepStatus };

// 빠른 응답 — 실제 지원 action 과 연결. 상황별로만 노출.
export type QuickReplyContext = "common" | "confirm" | "draft";
export type QuickReply = { key: string; label: string; action: string };
export const QUICK_REPLIES: Record<QuickReplyContext, QuickReply[]> = {
  common: [
    { key: "unsure", label: "잘 모르겠어요", action: "unsure" },
    { key: "skip", label: "건너뛰기", action: "skip" },
    { key: "recommend", label: "코치가 추천해 주세요", action: "recommend" },
    { key: "from_prev", label: "이전 답변에서 가져오기", action: "from_prev" }
  ],
  confirm: [
    { key: "agree", label: "맞아요", action: "confirm_yes" },
    { key: "partial", label: "일부만 맞아요", action: "confirm_partial" },
    { key: "edit", label: "수정할게요", action: "confirm_edit" }
  ],
  draft: [
    { key: "use", label: "이 문장으로 사용할게요", action: "draft_accept" },
    { key: "concise", label: "조금 더 간결하게", action: "draft_concise" },
    { key: "another", label: "다른 방향으로 제안해 주세요", action: "draft_another" },
    { key: "manual", label: "직접 수정할게요", action: "draft_manual" }
  ]
};

// Career Profile 내부 상태 → 사용자 표현 매핑(내부 구조 미노출).
export const PROFILE_STATUS_LABEL: Record<string, string> = {
  confirmed: "확인한 내용",
  inferred: "코치가 이렇게 이해했어요",
  missing: "결과물에 필요한 내용",
  conflicted: "다시 확인할 내용",
  outdated: "업데이트가 필요할 수 있어요"
  // rejected 는 화면 기본 노출 제외.
};

// 상담 시작 화면 설정.
export type CoachingIntro = {
  title: string; // 오늘 상담 제목
  problem: string; // 오늘 해결할 문제
  estimateText: string; // 예상 소요(정확한 시간 없으면 "핵심 질문 N개 정도")
  artifactLabel: string; // 만들어질 결과물
  known: string[]; // 코치가 이미 알고 있는 핵심 정보
  toConfirm: string[]; // 추가 확인이 필요한 정보
  ctaLabel: string; // 시작 CTA
};

// 상담 종료 요약.
export type CoachingCompletion = {
  discovered: string; // 새롭게 발견한 점
  judgment: string; // 코치의 판단
  reflectedIn: string; // 결과물에 반영된 내용
  nextAction: string; // 다음 행동
  artifactHref?: string; // 결과물 CTA
};

// 세션 유형(분석 이벤트·설정 분기).
export type CoachingSessionType = "first_consult" | "experience" | "job_decision" | "document_strategy" | "interview_strategy" | "correction";

// 사용자에게 노출하는 AI 안내(오해 방지). 기술 강조 아님.
export const AI_DISCLOSURE = "AI 커리어 코치가 지금까지 확인한 정보를 바탕으로 상담합니다. 중요한 사실과 최종 결과물은 직접 확인해 주세요.";
