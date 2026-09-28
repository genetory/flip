// 리뉴얼 이력서/자기소개서의 서버 소스 스토어(계정 귀속).
// 이력서·자소서는 localStorage 가 아니라 로그인한 계정(서버)에 저장된다.
// 유저당 서버 Resume 1건에 두 문서를 함께 담는다:
//   content.renewalResume    = ResumeDoc (verbatim)
//   content.renewalCover     = CoverDoc  (verbatim)
//   content.coverLetterItems = [{id, prompt, answer}]  // 레거시/지원 스냅샷 호환용 미러
// resume-doc / cover-doc 두 스토어가 같은 row 를 공유하므로, 저장은 항상 두 문서를
// 병합한 content 를 debounce PATCH 한다(부분 저장으로 서로의 필드를 지우지 않도록).
import { createMyResume, getMyResumes, updateMyResume, type ResumeContent } from "../member-profile-client";
import { resumeContentToRenewalDoc } from "./resume-content-to-doc";
import type { ResumeDoc } from "./resume-doc";
import type { CoverDoc } from "./cover-doc";
import type { BasicInfo } from "./basic-info";
import type { FeedEntry } from "./career-feed";
import type { SelfMockRecord } from "./self-mock";

export type RenewalDocsStatus = "idle" | "loading" | "loaded";

// 저장 표시용 상태 — 이력서·자소서는 긴 글을 쓰는 화면이라 "저장됐나?"가 불안 요소다.
// pending=변경됨(debounce 대기) · saving=PATCH 중 · saved=반영 완료 · error=실패(재시도 예정).
export type DocsSaveState = "idle" | "pending" | "saving" | "saved" | "error";

// 문서 버전 스냅샷 — "며칠 전 버전으로 되돌리기"용. 같은 Resume.content 안에 보관한다
// (content 가 JSON 이라 스키마 변경은 필요 없다).
// 저장은 매번 content 전체를 PATCH 하므로 히스토리가 곧 업로드 용량이다 → 개수를 조인다.
export type DocVersion<T> = { savedAt: number; doc: T };
const MAX_VERSIONS = 3;
// 스냅샷 간격 — 타이핑마다 쌓이면 10분 전 버전만 3개 남아 쓸모가 없다.
const MIN_SNAPSHOT_GAP_MS = 10 * 60 * 1000;

const listeners = new Set<() => void>();
let status: RenewalDocsStatus = "idle";
let loadedForUser: string | null = null;
let resumeRowId: string | null = null;
let resumeDoc: ResumeDoc | null = null;
let coverDoc: CoverDoc | null = null;
let basicInfo: BasicInfo | null = null;
let jobInterests: string[] | null = null;
// 계정 귀속 소셜/활동 데이터(같은 Resume.content 에 함께 보관).
let follows: string[] | null = null;
let bookmarks: string[] | null = null;
let dailySteps: string[] | null = null;
let careerFeed: FeedEntry[] | null = null;
// 내 서류 기반 self 모의 면접 기록(문항별 답변·점수·피드백).
let selfMock: SelfMockRecord | null = null;
// 첫 실행 온보딩을 마쳤(또는 웰컴 카드를 닫았)는지.
let onboardingSeen = false;
// 커리어 피드에서 사용자가 지운 refId(이력서/자소서 유래 항목이 sync로 되살아나지 않게).
let careerFeedDismissed: string[] | null = null;
// 지원 준비 100% 축하 배너를 닫았는지.
let applyCelebrated = false;
// 알림 설정(opt-out; 기본 false = 켜짐). push=공고/추천 알림, email=이메일 소식.
let notifPushOptOut = false;
let notifEmailOptOut = false;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving = false;
let dirty = false;
let saveState: DocsSaveState = "idle";
let resumeHistory: DocVersion<ResumeDoc>[] = [];
let coverHistory: DocVersion<CoverDoc>[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeDocs(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function snapshotResume(): ResumeDoc | null {
  return resumeDoc;
}
export function snapshotCover(): CoverDoc | null {
  return coverDoc;
}
export function snapshotSaveState(): DocsSaveState {
  return saveState;
}
export function snapshotResumeHistory(): DocVersion<ResumeDoc>[] {
  return resumeHistory;
}
export function snapshotCoverHistory(): DocVersion<CoverDoc>[] {
  return coverHistory;
}

// 되돌리기 — 복원 자체도 되돌릴 수 있어야 하므로 현재 문서를 히스토리에 먼저 넣는다.
// 그 스냅샷은 간격 제한을 우회한다(복원은 드물고, 못 되돌리면 데이터를 잃는다).
export function restoreResumeVersion(savedAt: number): boolean {
  const v = resumeHistory.find((x) => x.savedAt === savedAt);
  if (!v) return false;
  const rest = resumeHistory.filter((x) => x.savedAt !== savedAt);
  resumeHistory = resumeDoc ? [{ savedAt: Date.now(), doc: resumeDoc }, ...rest].slice(0, MAX_VERSIONS) : rest;
  resumeDoc = v.doc;
  emit();
  scheduleSave();
  return true;
}
export function restoreCoverVersion(savedAt: number): boolean {
  const v = coverHistory.find((x) => x.savedAt === savedAt);
  if (!v) return false;
  const rest = coverHistory.filter((x) => x.savedAt !== savedAt);
  coverHistory = coverDoc ? [{ savedAt: Date.now(), doc: coverDoc }, ...rest].slice(0, MAX_VERSIONS) : rest;
  coverDoc = v.doc;
  emit();
  scheduleSave();
  return true;
}
export function snapshotStatus(): RenewalDocsStatus {
  return status;
}
export function snapshotBasicInfo(): BasicInfo | null {
  return basicInfo;
}
export function snapshotJobInterests(): string[] | null {
  return jobInterests;
}
export function snapshotFollows(): string[] | null {
  return follows;
}
export function snapshotBookmarks(): string[] | null {
  return bookmarks;
}
export function snapshotDailySteps(): string[] | null {
  return dailySteps;
}
export function snapshotCareerFeed(): FeedEntry[] | null {
  return careerFeed;
}
export function snapshotSelfMock(): SelfMockRecord | null {
  return selfMock;
}
export function snapshotOnboardingSeen(): boolean {
  return onboardingSeen;
}
export function snapshotCareerFeedDismissed(): string[] | null {
  return careerFeedDismissed;
}
export function snapshotApplyCelebrated(): boolean {
  return applyCelebrated;
}
export function snapshotNotifPushOptOut(): boolean {
  return notifPushOptOut;
}
export function snapshotNotifEmailOptOut(): boolean {
  return notifEmailOptOut;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// content 빌드/파싱 ----------------------------------------------------------
// 이전 문서를 히스토리에 밀어넣는다. 내용이 실제로 달라졌고, 마지막 스냅샷이 충분히
// 오래됐을 때만 쌓는다(연속 편집이 히스토리를 통째로 잡아먹지 않게).
// export 는 테스트용 — 스냅샷 규칙이 틀리면 히스토리가 통째로 낭비되거나 데이터가 남지 않는다.
export function pushVersion<T>(history: DocVersion<T>[], prev: T | null, next: T | null): DocVersion<T>[] {
  if (!prev) return history;
  if (next && JSON.stringify(prev) === JSON.stringify(next)) return history;
  const newest = history[0]?.savedAt ?? 0;
  if (Date.now() - newest < MIN_SNAPSHOT_GAP_MS) return history;
  return [{ savedAt: Date.now(), doc: prev }, ...history].slice(0, MAX_VERSIONS);
}

function buildContent(): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  if (resumeDoc) {
    content.renewalResume = resumeDoc;
    if (resumeDoc.targetRole) content.desiredJobRole = resumeDoc.targetRole;
  }
  if (coverDoc) {
    content.renewalCover = coverDoc;
    content.coverLetterItems = coverDoc.items.map((c) => ({ id: c.id, prompt: c.question, answer: c.text }));
  }
  if (basicInfo) content.renewalBasicInfo = basicInfo;
  if (jobInterests) content.renewalJobInterests = jobInterests;
  if (follows) content.renewalFollows = follows;
  if (bookmarks) content.renewalBookmarks = bookmarks;
  if (dailySteps) content.renewalDailySteps = dailySteps;
  if (careerFeed) content.renewalCareerFeed = careerFeed;
  if (selfMock) content.renewalMockInterview = selfMock;
  if (onboardingSeen) content.renewalOnboardingSeen = true;
  if (careerFeedDismissed) content.renewalCareerFeedDismissed = careerFeedDismissed;
  if (applyCelebrated) content.renewalApplyCelebrated = true;
  if (notifPushOptOut) content.renewalNotifPushOptOut = true;
  if (notifEmailOptOut) content.renewalNotifEmailOptOut = true;
  if (resumeHistory.length) content.renewalResumeHistory = resumeHistory;
  if (coverHistory.length) content.renewalCoverHistory = coverHistory;
  return content;
}

function parseContent(content: Record<string, unknown> | null | undefined): {
  resume: ResumeDoc | null;
  cover: CoverDoc | null;
  basic: BasicInfo | null;
  interests: string[] | null;
  follows: string[] | null;
  bookmarks: string[] | null;
  dailySteps: string[] | null;
  careerFeed: FeedEntry[] | null;
  selfMock: SelfMockRecord | null;
  onboardingSeen: boolean;
  careerFeedDismissed: string[] | null;
  applyCelebrated: boolean;
  notifPushOptOut: boolean;
  notifEmailOptOut: boolean;
  resumeHistory: DocVersion<ResumeDoc>[];
  coverHistory: DocVersion<CoverDoc>[];
} {
  const c = content ?? {};
  const resume = (c.renewalResume as ResumeDoc | undefined) ?? null;
  let cover = (c.renewalCover as CoverDoc | undefined) ?? null;
  // 리뉴얼 이전/레거시 데이터: coverLetterItems({id,prompt,answer}) → CoverDoc 로 역매핑.
  if (!cover && Array.isArray(c.coverLetterItems)) {
    const items = (c.coverLetterItems as Array<{ id?: string; prompt?: string; answer?: string }>)
      .map((it) => ({ id: it.id ?? uid(), question: it.prompt ?? "", text: (it.answer ?? "").trim() }))
      .filter((it) => it.text.length > 0);
    if (items.length) {
      const now = Date.now();
      cover = { items, showPhoto: false, createdAt: now, updatedAt: now };
    }
  }
  const basic = (c.renewalBasicInfo as BasicInfo | undefined) ?? null;
  const interests = Array.isArray(c.renewalJobInterests) ? (c.renewalJobInterests as string[]) : null;
  const follows = Array.isArray(c.renewalFollows) ? (c.renewalFollows as string[]) : null;
  const bookmarks = Array.isArray(c.renewalBookmarks) ? (c.renewalBookmarks as string[]) : null;
  const dailySteps = Array.isArray(c.renewalDailySteps) ? (c.renewalDailySteps as string[]) : null;
  const careerFeed = Array.isArray(c.renewalCareerFeed) ? (c.renewalCareerFeed as FeedEntry[]) : null;
  const sm = c.renewalMockInterview as SelfMockRecord | undefined;
  const selfMock = sm && Array.isArray(sm.answers) ? sm : null;
  const onboardingSeen = c.renewalOnboardingSeen === true;
  const careerFeedDismissed = Array.isArray(c.renewalCareerFeedDismissed) ? (c.renewalCareerFeedDismissed as string[]) : null;
  const applyCelebrated = c.renewalApplyCelebrated === true;
  const notifPushOptOut = c.renewalNotifPushOptOut === true;
  const notifEmailOptOut = c.renewalNotifEmailOptOut === true;
  // 저장된 히스토리는 신뢰하지 않고 모양을 검사한다(구버전·손상 데이터로 화면이 깨지지 않게).
  const parseHistory = <T,>(v: unknown): DocVersion<T>[] =>
    Array.isArray(v)
      ? (v as DocVersion<T>[])
          .filter((x) => x && typeof x === "object" && typeof x.savedAt === "number" && x.doc != null)
          .slice(0, MAX_VERSIONS)
      : [];
  const resumeHistory = parseHistory<ResumeDoc>(c.renewalResumeHistory);
  const coverHistory = parseHistory<CoverDoc>(c.renewalCoverHistory);
  return { resumeHistory, coverHistory, resume, cover, basic, interests, follows, bookmarks, dailySteps, careerFeed, selfMock, onboardingSeen, careerFeedDismissed, applyCelebrated, notifPushOptOut, notifEmailOptOut };
}

// resume-maker 형식(Career Launch 미러 / 구형 이력서)인지 — renewal 키가 있으면 아니다.
// api 의 isResumeMakerContent 와 같은 규칙.
function isResumeMakerShape(c: Record<string, unknown> | null | undefined): boolean {
  if (!c) return false;
  if (Object.keys(c).some((k) => k.startsWith("renewal"))) return false;
  return (
    Array.isArray(c.educations) || Array.isArray(c.careers) || Array.isArray(c.activities) ||
    Array.isArray(c.skills) || Array.isArray(c.languages) || Array.isArray(c.certifications) ||
    typeof c.summary === "string" || typeof c.basicName === "string"
  );
}

// 로드 ----------------------------------------------------------------------
async function load(userId: string) {
  status = "loading";
  emit();
  try {
    const resumes = await getMyResumes();
    // 로드 도중 계정이 바뀌었으면 폐기.
    if (loadedForUser !== userId) return;
    // 리뉴얼 문서 = content.renewalResume/renewalCover 를 가진 row(최신 우선).
    const renewal = resumes
      .filter((r) => {
        const rc = r.content as unknown as Record<string, unknown> | null;
        return rc != null && Object.keys(rc).some((k) => k.startsWith("renewal"));
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    if (renewal) {
      resumeRowId = renewal.id;
      const parsed = parseContent(renewal.content as unknown as Record<string, unknown>);
      resumeDoc = parsed.resume;
      coverDoc = parsed.cover;
      basicInfo = parsed.basic;
      jobInterests = parsed.interests;
      follows = parsed.follows;
      bookmarks = parsed.bookmarks;
      dailySteps = parsed.dailySteps;
      careerFeed = parsed.careerFeed;
      selfMock = parsed.selfMock;
      onboardingSeen = parsed.onboardingSeen;
      careerFeedDismissed = parsed.careerFeedDismissed;
      applyCelebrated = parsed.applyCelebrated;
      notifPushOptOut = parsed.notifPushOptOut;
      notifEmailOptOut = parsed.notifEmailOptOut;
      resumeHistory = parsed.resumeHistory;
      coverHistory = parsed.coverHistory;
    } else {
      resumeRowId = null;
      resumeDoc = null;
      coverDoc = null;
      basicInfo = null;
      jobInterests = null;
      follows = null;
      bookmarks = null;
      dailySteps = null;
      careerFeed = null;
      selfMock = null;
      onboardingSeen = false;
      careerFeedDismissed = null;
      applyCelebrated = false;
      notifPushOptOut = false;
      notifEmailOptOut = false;
      resumeHistory = [];
      coverHistory = [];

      // [시딩] 리뉴얼 문서가 아직 없고 Career Launch 미러(또는 구형) 이력서가 있으면,
      // 그 내용을 리뉴얼 문서 모양으로 변환해 에디터를 미리 채운다.
      //
      // 저장하지 않는다(resumeRowId 는 null 유지) — 사용자가 실제로 편집할 때 비로소
      // 새 행이 만들어진다. Career Launch 미러 행을 그대로 claim 하면 이후 저장이 그 행에
      // renewal 키를 심어, API 쪽 가드가 Career Launch 미러링을 막아버린다(원본과 단절).
      // 그래서 '읽어서 채우기'만 하고 소유권은 가져오지 않는다.
      //
      // basicInfo 도 함께 채운다 — 이게 없으면 ProfileGate 에 막혀 시딩한 이력서를
      // 아예 볼 수 없다.
      // 대표 이력서를 우선한다 — 지원에 실제로 쓰이는 문서이므로 사용자가 '내 이력서'로
      // 인식하는 것이다. 대표가 없으면 최근 수정 순.
      const seed = resumes
        .filter((r) => isResumeMakerShape(r.content as unknown as Record<string, unknown> | null))
        .sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          return a.updatedAt < b.updatedAt ? 1 : -1;
        })[0];
      if (seed) {
        try {
          const { doc, info } = resumeContentToRenewalDoc(seed.content as unknown as ResumeContent);
          if (doc.items.length > 0) {
            resumeDoc = doc;
            basicInfo = info;
          }
        } catch {
          /* 변환 실패는 무시 — 빈 상태로 시작한다 */
        }
      }
    }
    status = "loaded";
    emit();
  } catch {
    if (loadedForUser !== userId) return;
    // 로드 실패해도 편집은 가능하도록 빈 상태로 loaded 처리.
    resumeRowId = null;
    resumeDoc = null;
    coverDoc = null;
    basicInfo = null;
    jobInterests = null;
    follows = null;
    bookmarks = null;
    dailySteps = null;
    careerFeed = null;
    selfMock = null;
    onboardingSeen = false;
    careerFeedDismissed = null;
    applyCelebrated = false;
    notifPushOptOut = false;
    notifEmailOptOut = false;
    resumeHistory = [];
    coverHistory = [];
    status = "loaded";
    emit();
  }
}

// 계정 동기화 — useResumeDoc/useCoverDoc 이 현재 로그인 유저로 호출한다.
// 계정이 바뀌면 캐시를 비우고(다른 회원의 문서가 남지 않도록) 새로 로드한다.
export function syncUser(userId: string | null): void {
  if (userId !== loadedForUser) {
    loadedForUser = userId;
    resumeRowId = null;
    resumeDoc = null;
    coverDoc = null;
    basicInfo = null;
    jobInterests = null;
    follows = null;
    bookmarks = null;
    dailySteps = null;
    careerFeed = null;
    selfMock = null;
    onboardingSeen = false;
    careerFeedDismissed = null;
    applyCelebrated = false;
    notifPushOptOut = false;
    notifEmailOptOut = false;
    status = "idle";
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    dirty = false;
    saveState = "idle";
    resumeHistory = [];
    coverHistory = [];
    emit();
  }
  if (userId && status === "idle") {
    void load(userId);
  }
}

// 저장 ----------------------------------------------------------------------
function scheduleSave() {
  dirty = true;
  saveState = "pending";
  emit();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flush();
  }, 700);
}

async function flush() {
  if (saving || !dirty) return;
  const userId = loadedForUser;
  if (!userId) return;
  saving = true;
  dirty = false;
  saveState = "saving";
  emit();
  const content = buildContent();
  try {
    if (resumeRowId) {
      await updateMyResume(resumeRowId, { content, allowIncomplete: true });
    } else {
      const created = await createMyResume({ title: "내 이력서", content, allowIncomplete: true });
      if (loadedForUser === userId) resumeRowId = created.id;
    }
    if (loadedForUser === userId) saveState = "saved";
  } catch {
    dirty = true; // 실패 → 다음 변경/스케줄에 재시도
    if (loadedForUser === userId) saveState = "error";
  } finally {
    saving = false;
    emit();
    if (dirty && loadedForUser === userId) scheduleSave();
  }
}

export function setResumeDoc(doc: ResumeDoc | null): void {
  resumeHistory = pushVersion(resumeHistory, resumeDoc, doc);
  resumeDoc = doc;
  emit();
  scheduleSave();
}

export function setCoverDoc(doc: CoverDoc | null): void {
  coverHistory = pushVersion(coverHistory, coverDoc, doc);
  coverDoc = doc;
  emit();
  scheduleSave();
}

export function setBasicInfo(info: BasicInfo | null): void {
  basicInfo = info;
  emit();
  scheduleSave();
}

export function setJobInterests(roles: string[]): void {
  jobInterests = roles;
  emit();
  scheduleSave();
}

export function setFollows(list: string[]): void {
  follows = list;
  emit();
  scheduleSave();
}

export function setBookmarks(list: string[]): void {
  bookmarks = list;
  emit();
  scheduleSave();
}

export function setDailySteps(list: string[]): void {
  dailySteps = list;
  emit();
  scheduleSave();
}

export function setCareerFeed(list: FeedEntry[]): void {
  careerFeed = list;
  emit();
  scheduleSave();
}

export function setSelfMock(record: SelfMockRecord | null): void {
  selfMock = record;
  emit();
  scheduleSave();
}

export function setOnboardingSeen(v: boolean): void {
  onboardingSeen = v;
  emit();
  scheduleSave();
}

export function setCareerFeedDismissed(list: string[]): void {
  careerFeedDismissed = list;
  emit();
  scheduleSave();
}

export function setApplyCelebrated(v: boolean): void {
  applyCelebrated = v;
  emit();
  scheduleSave();
}

export function setNotifPushOptOut(v: boolean): void {
  notifPushOptOut = v;
  emit();
  scheduleSave();
}

export function setNotifEmailOptOut(v: boolean): void {
  notifEmailOptOut = v;
  emit();
  scheduleSave();
}
