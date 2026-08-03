// 내 커리어 채팅 — 사용자가 편하게 남긴 한 줄을 이력서/프로필의 어느 섹션으로
// 정리할지 분류한다. 지금은 키워드 규칙(mock). 추후 실제 LLM으로 교체.

export type CareerSection = "education" | "certificate" | "experience" | "project" | "skill" | "award" | "activity";

export interface SectionMeta {
  key: CareerSection;
  label: string; // 정리될 섹션 이름
  emoji: string;
}

export const SECTION_META: Record<CareerSection, SectionMeta> = {
  education: { key: "education", label: "학력", emoji: "🎓" },
  certificate: { key: "certificate", label: "자격증", emoji: "📜" },
  experience: { key: "experience", label: "경험", emoji: "🧩" },
  project: { key: "project", label: "프로젝트", emoji: "🚀" },
  skill: { key: "skill", label: "역량·스킬", emoji: "⚡" },
  award: { key: "award", label: "수상", emoji: "🏆" },
  activity: { key: "activity", label: "대외활동", emoji: "🌱" }
};

// 섹션별 트리거 키워드(간단 규칙). 위에서부터 우선.
const RULES: { section: CareerSection; keywords: string[] }[] = [
  { section: "education", keywords: ["학교", "대학교", "대학", "전공", "졸업", "학점", "재학", "학위", "학사", "석사", "편입", "입학", "고등학교"] },
  { section: "certificate", keywords: ["자격증", "자격", "취득", "합격", "토익", "toeic", "opic", "컴활", "기사", "면허", "점수"] },
  { section: "award", keywords: ["수상", "대상", "우수상", "장려상", "1등", "입상", "공모전", "해커톤", "우승"] },
  { section: "project", keywords: ["프로젝트", "개발", "만들", "출시", "런칭", "구현", "설계", "팀플", "과제"] },
  { section: "activity", keywords: ["동아리", "봉사", "학생회", "인턴", "대외활동", "서포터즈", "스터디", "부트캠프"] },
  { section: "skill", keywords: ["배웠", "익혔", "다룰", "사용", "python", "figma", "엑셀", "sql", "리액트", "스킬", "역량", "능력"] },
  { section: "experience", keywords: ["알바", "아르바이트", "근무", "일했", "경험", "업무", "매장", "카페", "고객"] }
];

export function classifyCareerNote(text: string): CareerSection {
  const t = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => t.includes(k.toLowerCase()))) return rule.section;
  }
  // 매칭이 없으면 기본은 '경험'으로.
  return "experience";
}

// 분류 결과에 맞춰 AI가 되묻는 한 줄(구체화 유도).
const FOLLOW_UP: Record<CareerSection, string> = {
  education: "학교·전공·재학 기간(또는 졸업 여부)을 알려주면 정리할게요.",
  certificate: "언제 취득했는지, 점수나 등급이 있다면 같이 알려주세요.",
  experience: "무엇을 했고 그래서 어떤 변화가 있었는지 한 줄만 더 붙여볼까요?",
  project: "어떤 역할이었고 결과(수치·성과)가 있으면 함께 정리할게요.",
  skill: "어느 정도 다룰 수 있는지, 어디에 써봤는지 알려주면 좋아요.",
  award: "어떤 대회에서, 몇 명 중 받은 상인지 알려주면 더 돋보여요.",
  activity: "언제부터 얼마나 활동했고 맡은 역할이 있었는지 알려주세요."
};

export function buildAssistantReply(text: string): { section: CareerSection; summary: string; followUp: string } {
  const section = classifyCareerNote(text);
  const meta = SECTION_META[section];
  const summary = text.trim().replace(/\s+/g, " ").slice(0, 60);
  return { section, summary, followUp: `${meta.emoji} ${meta.label}에 정리해 둘게요. ${FOLLOW_UP[section]}` };
}
