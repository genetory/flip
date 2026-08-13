// AI 커리어 상담 클라이언트 — /api/career-advisor 와 대화하며 나에게 맞는 직무·방향을 찾는다.
// 추천 직무는 직무 택소노미(소분류)에서만 나온다 → 그대로 관심 직무로 저장 가능.
import { JOB_TAXONOMY } from "./job-taxonomy";

export type AdvisorMsg = { role: "user" | "assistant"; content: string };
export type AdvisorResult = { reply: string; recommendedRoles: string[] };

// 직무 후보 풀 — 소분류(leaf) 전체.
function jobPool(): string[] {
  const out: string[] = [];
  for (const major of JOB_TAXONOMY) {
    for (const mid of major.middles) {
      for (const minor of mid.minors) out.push(minor);
    }
  }
  return out;
}

export async function careerAdvise(messages: AdvisorMsg[], interests: string[] = []): Promise<AdvisorResult> {
  try {
    const res = await fetch("/api/career-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, interests, pool: jobPool() })
    });
    if (res.ok) {
      const d = (await res.json()) as { reply?: string; recommendedRoles?: string[] };
      return {
        reply: (d.reply ?? "").trim(),
        recommendedRoles: Array.isArray(d.recommendedRoles) ? d.recommendedRoles : []
      };
    }
  } catch {
    // 네트워크 실패 → 폴백
  }
  return { reply: "", recommendedRoles: [] };
}
