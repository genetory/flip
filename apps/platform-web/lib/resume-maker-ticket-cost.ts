// 클라이언트 표시용 티켓 비용표 — 서버 AI_FEATURE_COST(apps/api)와 동일하게 유지한다.
// 버튼/라벨의 소모 뱃지는 이 한 곳을 단일 출처로 쓴다(숫자 하드코딩 금지).
export const AI_TICKET_COST: Record<string, number> = {
  // 무거움(30)
  import_resume: 30,
  import_cover_letter: 30,
  interview_questions: 30,
  // 보통(20)
  tailor_analyze: 20,
  draft_intro: 20,
  generate_english_intro: 20,
  cover_letter: 20,
  // 가벼움(10)
  draft_resume_text: 10,
  experience_interview: 10,
  experience_bullets: 10,
  experience_title: 10,
  experience_tasks: 10,
  polish_intro: 10,
  polish_experience: 10,
  summarize_intro: 10,
  suggest_skills: 10,
  translate_texts: 10,
  // gpt-4o 사용(원가 높음) — 서버 AI_FEATURE_COST와 동일하게 20.
  interview_feedback: 20
};

export function ticketCost(feature: string): number {
  return AI_TICKET_COST[feature] ?? 0;
}
