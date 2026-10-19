"use client";

// 커리어런치 결과물 ↔ 탤런트 에디터 '하나의 문서' 연결(서버 /career-launch/editor-link).
import { authedJsonFetch } from "../member-profile-client";

export type EditorKind = "resume" | "cover";
export type EditorLinkState = { linked: boolean; launchHasContent: boolean; talentHasContent: boolean };

export async function getEditorLink(): Promise<Record<EditorKind, EditorLinkState>> {
  return (await authedJsonFetch<never>("/career-launch/editor-link", { method: "GET" })) as unknown as Record<EditorKind, EditorLinkState>;
}

/** 연결 — use='launch' 면 프로그램에서 쓴 내용으로 에디터 문서를 채우고, 'talent' 면 에디터 문서(내 이력서)를 그대로 쓴다. */
export async function linkEditor(kind: EditorKind, use: "launch" | "talent"): Promise<void> {
  await authedJsonFetch<never>("/career-launch/editor-link", { method: "POST", body: JSON.stringify({ kind, use }) });
}
