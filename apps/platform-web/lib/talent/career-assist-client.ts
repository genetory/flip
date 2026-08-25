// 커리어 어시스턴트 호출부 — /api/career-assist(LLM) 우선, 실패 시 규칙 기반 폴백.
// 항상 resolve(throw 없음)해서 UI 처리를 단순하게 유지한다.
import { classifyCareerNote, SECTION_META, type CareerSection } from "./career-chat";
import { refineText, normalizeMonth } from "./resume-doc";

export interface CareerAssistPrev {
  text: string;
  section: CareerSection;
  needsPeriod: boolean;
}

export interface CareerAssistResult {
  relevant: boolean;
  mode: "new" | "update";
  section: CareerSection;
  title: string;
  refined: string;
  startDate: string;
  endDate: string;
  followUp: string;
  source: "llm" | "fallback";
}

export async function careerAssist(text: string, hintSection?: CareerSection, prev?: CareerAssistPrev): Promise<CareerAssistResult> {
  const trimmed = text.trim();
  try {
    const res = await fetch("/api/career-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, hintSection, prev })
    });
    if (res.ok) {
      const d = (await res.json()) as { relevant?: boolean; mode?: string; section?: string; title?: string; refined?: string; startDate?: string; endDate?: string; followUp?: string };
      const section = (hintSection ?? d.section) as CareerSection;
      if (section && SECTION_META[section]) {
        return {
          relevant: d.relevant !== false,
          mode: d.mode === "update" ? "update" : "new",
          section,
          title: (d.title ?? "").trim(),
          refined: (d.refined ?? trimmed).trim() || trimmed,
          startDate: normalizeMonth(d.startDate ?? ""),
          endDate: normalizeMonth(d.endDate ?? ""),
          followUp: (d.followUp ?? "").trim(),
          source: "llm"
        };
      }
    }
  } catch {
    /* 네트워크 실패 → 폴백 */
  }
  // 폴백: 규칙 기반 분류 + 문어체 정리(오프라인은 관련성/맥락 판단 불가 → 새 항목).
  const section = hintSection ?? classifyCareerNote(trimmed);
  const meta = SECTION_META[section];
  // 폴백 제목 — 오프라인엔 요약 불가하니 입력의 첫 구절을 간결하게.
  const fallbackTitle = trimmed.split(/[·\n,.!?]/)[0].trim().slice(0, 20);
  return {
    relevant: true,
    mode: "new",
    section,
    title: fallbackTitle,
    refined: refineText(trimmed),
    startDate: "",
    endDate: "",
    followUp: `${meta.label}에 잘 담아뒀어요. 한 문장만 더 붙여주면 훨씬 좋아져요 — 예: 언제, 무엇을 해서 어떻게 됐는지요 🙂`,
    source: "fallback"
  };
}
