// 이력서·자기소개서 버전 client — /members/me/doc-versions.
//
// 편집하는 문서는 하나 — 내용은 talent 문서(renewal-docs-store), 칸·순서 같은 구성은 편집 중 행(snapshot = null).
// '새 버전으로 저장'은 그 순간의 내용과 구성을 통째로 복사한 읽기 전용 저장본이다(지원할 때 고른다).
import { authedJsonFetch } from "../member-profile-client";
import type { BasicInfo } from "./basic-info";
import type { CoverDoc } from "./cover-doc";
import type { ResumeDoc } from "./resume-doc";

export type DocVersionKind = "resume" | "cover";

/** 섹션 항목이 아닌 고정 모듈 — 서버 doc-versions.ts FIXED_RESUME_MODULES 와 같다. */
export const FIXED_MODULES = { basic: "@basic", summary: "@summary", links: "@links" } as const;
export const isFixedModule = (id: string) => id.startsWith("@");

export type ResumeLayout = {
  template: "two" | "one";
  /** 1단이면 칸 1개, 2단이면 2개. 각 칸은 위→아래 모듈 id. */
  cols: string[][];
  /** 이력서에서 뺀 모듈(내용은 남아 있다). */
  hidden: string[];
};

export type CoverLayout = {
  questions: { id: string; prompt: string; limit: number | null; blocks: string[] }[];
  /** 문항에서 뺀 에피소드. 예전 구성엔 없다. */
  hidden?: string[];
};

export type ResumeSnapshot = { resume: ResumeDoc; basicInfo: BasicInfo };
/** basicInfo 는 A4 머리(이름·연락처)용 — 초기 저장본엔 없을 수 있다. */
export type CoverSnapshot = { cover: CoverDoc; basicInfo?: BasicInfo };

export type DocVersion<L = ResumeLayout | CoverLayout, S = ResumeSnapshot | CoverSnapshot> = {
  id: string;
  kind: DocVersionKind;
  /** 저장본 이름. 편집 중 행은 쓰지 않는다. */
  name: string;
  layout: L;
  /** null = 편집 중인 문서의 구성. 값이 있으면 읽기 전용 저장본. */
  snapshot: S | null;
  createdAt: string;
  updatedAt: string;
};

const base = "/members/me/doc-versions";

/** 편집 중 행(맨 앞, 처음이면 서버가 지금 문서 그대로 만든다) + 저장본(최근 것부터). */
export async function listDocVersions<L, S>(kind: DocVersionKind): Promise<{ talentResumeId: string | null; items: DocVersion<L, S>[] }> {
  const payload = (await authedJsonFetch<DocVersion<L, S>>(`${base}?kind=${kind}`, { method: "GET" })) as {
    items?: DocVersion<L, S>[];
    talentResumeId?: string | null;
  };
  return { talentResumeId: payload.talentResumeId ?? null, items: payload.items ?? [] };
}

/** 새 버전으로 저장 — 화면에 보이는 그대로(내용 + 구성)를 읽기 전용 저장본으로. */
export async function createSavedVersion<L, S>(input: { kind: DocVersionKind; name: string; layout: L; snapshot: S }): Promise<DocVersion<L, S>> {
  const payload = await authedJsonFetch<DocVersion<L, S>>(base, { method: "POST", body: JSON.stringify(input) });
  if (!payload.item) throw new Error("저장하지 못했어요.");
  return payload.item;
}

/** 편집 중 행은 layout 만, 저장본은 name 만. */
export async function updateDocVersion<L, S>(id: string, patch: { name?: string; layout?: L }): Promise<DocVersion<L, S>> {
  const payload = await authedJsonFetch<DocVersion<L, S>>(`${base}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  if (!payload.item) throw new Error("저장하지 못했어요.");
  return payload.item;
}

export async function deleteDocVersion(id: string): Promise<void> {
  await authedJsonFetch<unknown>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
