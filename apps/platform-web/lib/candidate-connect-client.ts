// 파트너 인재 검색 + 연결 요청 / 학생 연결 수락·인재풀 동의 클라이언트.
import { authedJsonFetch } from "./member-profile-client";

export type ConnectionStatus = "PENDING" | "ACCEPTED" | "DECLINED" | null;

export type PartnerCandidateCard = {
  candidateUserId: string;
  name: string | null;
  nationality: string | null;
  school: string | null;
  major: string | null;
  desiredJobRole: string | null;
  workType: string | null;
  visa: string | null;
  skills: string[];
  careerCount: number;
  activityCount: number;
  summary: string | null;
  updatedAt: string;
  connectionStatus: ConnectionStatus;
  contactUnlocked: boolean;
  // AI 매칭 검색 결과에만 존재 — 적합도 점수(0~100) + 한 줄 이유.
  score?: number;
  reason?: string;
};

export type CandidateCoverLetter = { title: string; company: string | null; items: { prompt: string; answer: string }[] };

export type PartnerCandidateDetail = {
  candidateUserId: string;
  name: string | null;
  nationality: string | null;
  contact: { email: string | null; phone: string | null } | null;
  content: Record<string, unknown>;
  coverLetter: CandidateCoverLetter | null;
  updatedAt: string;
  connectionStatus: ConnectionStatus;
  contactUnlocked: boolean;
};

export type MyConnection = {
  id: string;
  orgName: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  partnerEmail: string | null;
  createdAt: string;
  respondedAt: string | null;
};

export type CandidateSearchParams = { q?: string; skill?: string; jobRole?: string; page?: number };

export async function searchPartnerCandidates(
  params: CandidateSearchParams = {}
): Promise<{ items: PartnerCandidateCard[]; total: number; page: number; pageSize: number }> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.skill?.trim()) qs.set("skill", params.skill.trim());
  if (params.jobRole?.trim()) qs.set("jobRole", params.jobRole.trim());
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const query = qs.toString();
  const r = (await authedJsonFetch<PartnerCandidateCard>(`/partner/candidates${query ? `?${query}` : ""}`, { method: "GET" })) as {
    items?: PartnerCandidateCard[];
    total?: number;
    page?: number;
    pageSize?: number;
  };
  return { items: r.items ?? [], total: r.total ?? 0, page: r.page ?? 1, pageSize: r.pageSize ?? 24 };
}

// 자연어 LLM 매칭 검색 — 적합도 점수 포함.
export async function aiSearchCandidates(query: string): Promise<{ items: PartnerCandidateCard[]; ai: boolean }> {
  const r = (await authedJsonFetch<PartnerCandidateCard>("/partner/candidates/search", { method: "POST", body: JSON.stringify({ query }) })) as {
    items?: PartnerCandidateCard[];
    ai?: boolean;
  };
  return { items: r.items ?? [], ai: r.ai ?? false };
}

export async function getPartnerCandidate(candidateUserId: string): Promise<PartnerCandidateDetail | null> {
  const r = (await authedJsonFetch<PartnerCandidateDetail>(`/partner/candidates/${encodeURIComponent(candidateUserId)}`, { method: "GET" })) as {
    item?: PartnerCandidateDetail;
  };
  return r.item ?? null;
}

export async function requestPartnerConnect(candidateUserId: string, message?: string): Promise<void> {
  await authedJsonFetch(`/partner/candidates/${encodeURIComponent(candidateUserId)}/connect`, {
    method: "POST",
    body: JSON.stringify({ message: message?.trim() || undefined })
  });
}

export async function listMyConnections(): Promise<MyConnection[]> {
  const r = (await authedJsonFetch<MyConnection>("/members/me/connections", { method: "GET" })) as { items?: MyConnection[] };
  return r.items ?? [];
}

export async function respondConnection(id: string, action: "accept" | "decline"): Promise<void> {
  await authedJsonFetch(`/members/me/connections/${encodeURIComponent(id)}/respond`, {
    method: "POST",
    body: JSON.stringify({ action })
  });
}

export async function setTalentPool(optIn: boolean): Promise<void> {
  await authedJsonFetch("/members/me/talent-pool", { method: "POST", body: JSON.stringify({ optIn }) });
}
