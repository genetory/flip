// 한국형 자기소개서(자소서) client — 이력서와 별개 컬렉션(/members/me/cover-letters).
// 회사/공고마다 다르게 제출하므로 지원 건당 한 레코드로 관리한다.

import { authedJsonFetch, type ResumeCoverLetterItem } from "./member-profile-client";

export type CoverLetter = {
  id: string;
  userId: string;
  title: string; // 식별 라벨(예: "삼성전자 — 마케팅")
  company: string | null; // 지원 회사명(선택)
  resumeId: string | null; // 근거/연결 이력서(선택)
  items: ResumeCoverLetterItem[];
  shareSlug?: string; // 공개 공유 slug
  createdAt: string;
  updatedAt: string;
};

// items 가 JSON 이라 타입이 헐거울 수 있어 안전하게 정규화.
function normalize(raw: CoverLetter): CoverLetter {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    ...raw,
    items: items
      .filter((it): it is ResumeCoverLetterItem => Boolean(it && typeof it === "object"))
      .map((it) => ({ id: String(it.id ?? ""), prompt: String(it.prompt ?? ""), answer: String(it.answer ?? "") }))
  };
}

// 자소서를 AI 컨텍스트용 평문으로 직렬화(문항 + 답변). 답변이 있는 문항만.
export function coverLetterToPlainText(cl: Pick<CoverLetter, "company" | "items">): string {
  const lines: string[] = [];
  if (cl.company && cl.company.trim()) lines.push(`지원 회사: ${cl.company.trim()}`);
  for (const it of cl.items) {
    if (it.answer && it.answer.trim()) lines.push(`[${(it.prompt || "문항").trim()}]\n${it.answer.trim()}`);
  }
  return lines.join("\n\n");
}

export async function getMyCoverLetters(): Promise<CoverLetter[]> {
  const result = await authedJsonFetch<CoverLetter>("/members/me/cover-letters", { method: "GET" });
  return (result.items ?? []).map(normalize);
}

export type SharedCoverLetter = { id: string; title: string; company: string | null; items: ResumeCoverLetterItem[]; shareSlug: string };

// 공개(로그인 불필요) 자소서 조회 — /cover-letters/share/:slug. 이력서 공유와 동일 패턴.
export async function getSharedCoverLetter(slug: string): Promise<SharedCoverLetter> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/cover-letters/share/${encodeURIComponent(slug)}`, { cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as { ok?: boolean; item?: CoverLetter; message?: string } | null;
  if (!res.ok || !payload?.item) throw new Error(payload?.message ?? "자기소개서를 불러오지 못했어요.");
  const raw = payload.item;
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((it): it is ResumeCoverLetterItem => Boolean(it && typeof it === "object"))
        .map((it) => ({ id: String(it.id ?? ""), prompt: String(it.prompt ?? ""), answer: String(it.answer ?? "") }))
    : [];
  return { id: raw.id, title: raw.title, company: raw.company ?? null, items, shareSlug: raw.shareSlug ?? slug };
}

export async function getCoverLetter(id: string): Promise<CoverLetter> {
  const result = await authedJsonFetch<CoverLetter>(`/members/me/cover-letters/${encodeURIComponent(id)}`, { method: "GET" });
  if (!result.item) throw new Error("자기소개서를 찾을 수 없습니다.");
  return normalize(result.item);
}

export async function createCoverLetter(input: { title: string; company?: string; resumeId?: string }): Promise<CoverLetter> {
  const result = await authedJsonFetch<CoverLetter>("/members/me/cover-letters", {
    method: "POST",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("자기소개서 생성에 실패했습니다.");
  return normalize(result.item);
}

export async function updateCoverLetter(
  id: string,
  patch: { title?: string; company?: string | null; resumeId?: string | null; items?: ResumeCoverLetterItem[] }
): Promise<CoverLetter> {
  const result = await authedJsonFetch<CoverLetter>(`/members/me/cover-letters/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  if (!result.item) throw new Error("저장에 실패했습니다.");
  return normalize(result.item);
}

export async function deleteCoverLetter(id: string): Promise<void> {
  await authedJsonFetch<CoverLetter>(`/members/me/cover-letters/${encodeURIComponent(id)}`, { method: "DELETE" });
}
