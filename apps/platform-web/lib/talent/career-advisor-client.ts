// AI 커리어 상담 클라이언트 — /api/career-advisor 와 대화하며 나에게 맞는 직무·방향을 찾는다.
// 추천 직무(jobCategories)는 '실제 공고가 있는 직무(preferredJobRole facet)'에서만 나온다 →
// 그대로 실제 공고 조회(/positions?jobRole=)로 이어진다.
import { JOB_TAXONOMY } from "./job-taxonomy";
import { getPositionFacets } from "../member-profile-client";

export type AdvisorMsg = { role: "user" | "assistant"; content: string };
export type AdvisorResult = { reply: string; jobCategories: string[] };

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : []);

// 직무 후보 풀 폴백 — facet 조회 실패 시 택소노미 소분류(leaf) 전체.
function jobPoolFallback(): string[] {
  const out: string[] = [];
  for (const major of JOB_TAXONOMY) {
    for (const mid of major.middles) {
      for (const minor of mid.minors) out.push(minor);
    }
  }
  return out;
}

export async function careerAdvise(messages: AdvisorMsg[], interests: string[] = []): Promise<AdvisorResult> {
  // 실제 공고가 있는 직무를 후보 풀로 — 추천이 곧바로 실공고로 연결되게.
  let pool: string[] = [];
  try {
    const facets = await getPositionFacets();
    pool = facets.jobRoles.map((r) => r.value).filter(Boolean);
  } catch {
    pool = [];
  }
  if (!pool.length) pool = jobPoolFallback();

  try {
    const res = await fetch("/api/career-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, interests, pool })
    });
    if (res.ok) {
      const d = (await res.json()) as { reply?: string; jobCategories?: unknown };
      return { reply: (d.reply ?? "").trim(), jobCategories: asStringArray(d.jobCategories) };
    }
  } catch {
    // 네트워크 실패 → 폴백
  }
  return { reply: "", jobCategories: [] };
}
