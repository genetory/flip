// 피드 글 → 이력서/자소서 자동 추출 클라이언트.
// LLM(/api/feed-extract) 우선, 실패(키 없음·429·오프라인) 시 키워드 폴백.
import { classifyCareerNote } from "./career-chat";
import { refineText } from "./resume-doc";

export interface FeedExtraction {
  resume?: { section: string; text: string };
  cover?: { question: string; text: string };
}

// 폴백: 커리어 관련 키워드가 잡히면 이력서 항목으로만 근사(자소서는 LLM 없이는 생략).
function fallbackExtract(text: string): FeedExtraction {
  const t = text.trim();
  if (!t) return {};
  const section = classifyCareerNote(t);
  // classifyCareerNote 는 항상 섹션을 반환하므로, 너무 짧은 잡담은 제외.
  if (t.replace(/\s/g, "").length < 8) return {};
  return { resume: { section, text: refineText(t) } };
}

export async function extractFromFeedPost(input: { text: string; name?: string }): Promise<FeedExtraction> {
  const text = input.text.trim();
  if (!text) return {};
  try {
    const res = await fetch("/api/feed-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, name: input.name })
    });
    if (!res.ok) return fallbackExtract(text);
    const data = (await res.json()) as FeedExtraction & { error?: string };
    if (data.error) return fallbackExtract(text);
    return { resume: data.resume, cover: data.cover };
  } catch {
    return fallbackExtract(text);
  }
}
