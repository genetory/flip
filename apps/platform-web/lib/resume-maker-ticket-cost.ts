// 클라이언트 표시용 티켓 비용표 — 서버 AI_FEATURE_COST(apps/api)와 동일하게 유지한다.
// 버튼/라벨의 소모 뱃지는 이 한 곳을 단일 출처로 쓴다(숫자 하드코딩 금지).
export const AI_TICKET_COST: Record<string, number> = {
  // 무거움(3)
  import_resume: 3,
  import_cover_letter: 3,
  interview_questions: 3,
  // 보통(2)
  tailor_analyze: 2,
  draft_intro: 2,
  generate_english_intro: 2,
  cover_letter: 2,
  // 가벼움(1)
  draft_resume_text: 1,
  experience_interview: 1,
  experience_bullets: 1,
  experience_title: 1,
  experience_tasks: 1,
  polish_intro: 1,
  polish_experience: 1,
  summarize_intro: 1,
  suggest_skills: 1,
  translate_texts: 1,
  interview_feedback: 1
};

export function ticketCost(feature: string): number {
  return AI_TICKET_COST[feature] ?? 0;
}
