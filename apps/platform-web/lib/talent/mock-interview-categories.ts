// 모의 면접 질문 카테고리 — 백엔드가 주는 영문 키를 사람이 읽는 라벨/색으로.
export const CATEGORY_META: Record<string, { label: string; emoji: string; badge: string }> = {
  intro: { label: "자기소개·지원동기", emoji: "🙋", badge: "bg-[#EDF1FD] text-[#0B46E8]" },
  competency: { label: "직무 역량", emoji: "💼", badge: "bg-[#E7F8EF] text-[#0A9B59]" },
  experience: { label: "경험 심층", emoji: "📂", badge: "bg-[#FFF3E6] text-[#E8890C]" },
  weakness: { label: "인성·상황", emoji: "🧭", badge: "bg-[#F3EEFF] text-[#7C4DFF]" },
  other: { label: "기타", emoji: "💬", badge: "bg-[#F2F4F6] text-[#4E5968]" }
};

// 정리 순서: 자기소개 → 직무 → 경험 → 인성 → 기타.
export const CATEGORY_ORDER = ["intro", "competency", "experience", "weakness", "other"];

export function catMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.other;
}
