// 이력서·자기소개서 버전(용도별 구성) client — /members/me/doc-versions.
//
// 모듈(경력 한 건, 에피소드 한 단락)의 내용 원본은 talent 문서(renewal-docs-store)이고,
// 버전은 그중 무엇을 어떤 순서·배치로 넣을지(layout)와 이 버전에서만 고친 문구(overrides)만 갖는다.
import { authedJsonFetch } from "../member-profile-client";

export type DocVersionKind = "resume" | "cover";

/** 섹션 항목이 아닌 고정 모듈 — 서버 doc-versions.ts FIXED_RESUME_MODULES 와 같다. */
export const FIXED_MODULES = { basic: "@basic", summary: "@summary", links: "@links" } as const;
export const isFixedModule = (id: string) => id.startsWith("@");

export type ResumeLayout = {
  template: "two" | "one";
  /** 1단이면 칸 1개, 2단이면 2개. 각 칸은 위→아래 모듈 id. */
  cols: string[][];
  /** 이 버전에서 뺀 모듈. */
  hidden: string[];
};

export type CoverLayout = {
  questions: { id: string; prompt: string; limit: number | null; blocks: string[] }[];
  /** 이 버전에서 뺀 에피소드. 예전 저장본엔 없다. */
  hidden?: string[];
};

/** { [moduleId]: { [field]: 문구 } } — 이 버전에서만 따로 고친 문구. */
export type Overrides = Record<string, Record<string, string>>;

export type DocVersion<L = ResumeLayout | CoverLayout> = {
  id: string;
  kind: DocVersionKind;
  name: string;
  isPrimary: boolean;
  layout: L;
  overrides: Overrides;
  createdAt: string;
  updatedAt: string;
};

const base = "/members/me/doc-versions";

/** 버전 목록. 처음이면 서버가 지금 문서 그대로 '기본'(대표) 버전을 만들어 준다. */
export async function listDocVersions<L>(kind: DocVersionKind): Promise<{ talentResumeId: string | null; items: DocVersion<L>[] }> {
  const payload = (await authedJsonFetch<DocVersion<L>>(`${base}?kind=${kind}`, { method: "GET" })) as {
    items?: DocVersion<L>[];
    talentResumeId?: string | null;
  };
  return { talentResumeId: payload.talentResumeId ?? null, items: payload.items ?? [] };
}

export async function createDocVersion<L>(input: { kind: DocVersionKind; name: string; copyFrom?: string }): Promise<DocVersion<L>> {
  const payload = await authedJsonFetch<DocVersion<L>>(base, { method: "POST", body: JSON.stringify(input) });
  if (!payload.item) throw new Error("버전을 만들지 못했어요.");
  return payload.item;
}

export async function updateDocVersion<L>(
  id: string,
  patch: { name?: string; layout?: L; overrides?: Overrides }
): Promise<DocVersion<L>> {
  const payload = await authedJsonFetch<DocVersion<L>>(`${base}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  if (!payload.item) throw new Error("버전을 저장하지 못했어요.");
  return payload.item;
}

export async function deleteDocVersion(id: string): Promise<void> {
  await authedJsonFetch<unknown>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function setPrimaryDocVersion<L>(id: string): Promise<DocVersion<L>> {
  const payload = await authedJsonFetch<DocVersion<L>>(`${base}/${encodeURIComponent(id)}/primary`, { method: "POST" });
  if (!payload.item) throw new Error("대표로 정하지 못했어요.");
  return payload.item;
}
