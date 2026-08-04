// 이력서 문서(1개) — 기본 정보 + 커리어 피드로 만든 초안을 편집/저장.
// 저장은 localStorage 가 아니라 로그인한 계정(서버 Resume)에 귀속된다(renewal-docs-store).
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setResumeDoc as storeSetResume, snapshotResume, snapshotStatus, subscribeDocs, syncUser, type RenewalDocsStatus } from "./renewal-docs-store";
import type { CareerSection } from "./career-chat";
import type { FeedEntry } from "./career-feed";

export interface ResumeItem {
  id: string;
  section: CareerSection;
  text: string;
  startDate?: string; // 시작 날짜 (예: "2023.03")
  endDate?: string; // 종료 날짜 (예: "2024.02" / "현재")
  refId?: string; // 피드 글 등 출처와 매핑(중복 삽입 방지)
}

// 날짜 저장 포맷 = "YYYY-MM"(월 인풋) 또는 "현재" 또는 "".
export function normalizeMonth(s: string): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  if (/현재|재직|진행|present|current/i.test(t)) return "현재";
  const m = t.replace(/[./]/g, "-").match(/(\d{4})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  const y = t.match(/^(\d{4})$/); // 연도만 → 1월로 근사
  if (y) return `${y[1]}-01`;
  return "";
}

// 표시 포맷: "YYYY-MM" → "YYYY.MM", "현재"는 그대로.
export function displayMonth(s: string): string {
  if (!s) return "";
  if (s === "현재") return "현재";
  const m = s.match(/(\d{4})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}` : s;
}

// 날짜(기간)를 기본으로 표시하는 섹션(스킬은 제외).
export const SECTION_HAS_DATE: Record<CareerSection, boolean> = {
  education: true,
  certificate: true,
  experience: true,
  project: true,
  skill: false,
  award: true,
  activity: true
};

export interface ResumeDoc {
  targetRole: string;
  items: ResumeItem[];
  showPhoto?: boolean; // 이력서에 프로필 사진 표시 여부(기본 true)
  createdAt: number;
  updatedAt: number;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// 저장 — 계정(서버)에 반영. 실제 쓰기는 공유 스토어가 debounce 처리한다.
export function saveResumeDoc(doc: ResumeDoc): void {
  storeSetResume({ ...doc, updatedAt: Date.now() });
}

export function clearResumeDoc(): void {
  storeSetResume(null);
}

// 커리어 피드 → 이력서 초안(오래된→최신 순으로 항목화).
export function generateResumeDoc(feed: FeedEntry[], targetRole = ""): ResumeDoc {
  const items: ResumeItem[] = [...feed]
    .reverse()
    .map((e) => ({ id: uid(), section: e.section, text: refineText(e.text), startDate: "", endDate: "" }));
  const now = Date.now();
  return { targetRole, items, showPhoto: false, createdAt: now, updatedAt: now };
}

// 이력서 완성도(0~100) — 핵심 구성요소가 채워졌는지로 계산.
export function resumeCompleteness(doc: ResumeDoc | null): number {
  if (!doc) return 0;
  const has = (secs: CareerSection[]) => doc.items.some((i) => secs.includes(i.section));
  const checks = [
    has(["education"]),
    has(["experience", "project"]),
    has(["skill"]),
    has(["certificate", "award", "activity"]),
    doc.items.length >= 4
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function addResumeItem(doc: ResumeDoc, section: CareerSection, text: string, startDate = "", endDate = ""): { doc: ResumeDoc; id: string } {
  const id = uid();
  return { doc: { ...doc, items: [...doc.items, { id, section, text, startDate, endDate }] }, id };
}

// refId 로 매핑된 이력서 항목을 멱등 삽입(피드 자동 추출용). 문서가 없으면 새로 만든다.
// 이미 같은 refId 항목이 있으면 아무것도 하지 않는다(사용자가 사후 수정한 내용 보존).
export function ensureResumeItemByRef(refId: string, section: CareerSection, text: string): void {
  const t = text.trim();
  if (!t) return;
  const now = Date.now();
  const doc = snapshotResume() ?? { targetRole: "", items: [], showPhoto: false, createdAt: now, updatedAt: now };
  if (doc.items.some((i) => i.refId === refId)) return;
  const item: ResumeItem = { id: uid(), section, text: t, startDate: "", endDate: "", refId };
  saveResumeDoc({ ...doc, items: [...doc.items, item] });
}

// 사후 수정 — 잘못 분류된 항목의 섹션을 변경.
export function updateResumeItemSection(id: string, section: CareerSection): void {
  const doc = snapshotResume();
  if (!doc) return;
  saveResumeDoc({ ...doc, items: doc.items.map((i) => (i.id === id ? { ...i, section } : i)) });
}

// 항목 삭제(빌더에서 사용). 이미 있으면 재사용.
export function removeResumeItem(id: string): void {
  const doc = snapshotResume();
  if (!doc) return;
  saveResumeDoc({ ...doc, items: doc.items.filter((i) => i.id !== id) });
}

// 계정 귀속 — 로그인한 유저의 서버 이력서를 구독한다. 계정이 바뀌면 자동으로
// 캐시를 비우고 새 계정의 문서를 로드한다.
export function useResumeDoc(): ResumeDoc | null {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotResume, () => null);
}

// 서버 로드 상태 — 빌더가 "문서 없음"으로 판단해 자동 생성하기 전에 로드 완료를 기다린다.
export function useRenewalDocsStatus(): RenewalDocsStatus {
  return useSyncExternalStore(subscribeDocs, snapshotStatus, () => "idle" as RenewalDocsStatus);
}

// mock "AI로 다듬기" — 대화체를 이력서 개조식(명사형 종결)으로. 추후 LLM 교체.
export function refineText(text: string): string {
  let t = text.trim().replace(/\s+/g, " ");
  const rules: [RegExp, string][] = [
    [/했었?어요|했었?습니다|했었?음|했어|했다/g, "함"],
    [/됐어요|됐습니다|됐음|되었어요|되었습니다|되었음|됐어/g, "됨"],
    [/였어요|였습니다|였음|이었어요|이었습니다/g, "임"],
    [/받았어요|받았습니다|받았음/g, "받음"],
    [/땄어요|땄습니다|취득했어요|취득했습니다/g, "취득"],
    [/완료했어요|완료했습니다|끝냈어요|끝냈습니다|마무리했어요/g, "완료"],
    [/배웠어요|배웠습니다|익혔어요|익혔습니다/g, "습득"],
    [/있어요|있습니다/g, "있음"],
    [/없어요|없습니다/g, "없음"],
    [/합니다|해요/g, "함"]
  ];
  for (const [re, rep] of rules) t = t.replace(re, rep);
  // 이력서 개조식: 끝 마침표 제거.
  t = t.replace(/[.!?…]+$/g, "").trim();
  return t;
}
