// 리뉴얼 이력서/자기소개서의 서버 소스 스토어(계정 귀속).
// 이력서·자소서는 localStorage 가 아니라 로그인한 계정(서버)에 저장된다.
// 유저당 서버 Resume 1건에 두 문서를 함께 담는다:
//   content.renewalResume    = ResumeDoc (verbatim)
//   content.renewalCover     = CoverDoc  (verbatim)
//   content.coverLetterItems = [{id, prompt, answer}]  // 레거시/지원 스냅샷 호환용 미러
// resume-doc / cover-doc 두 스토어가 같은 row 를 공유하므로, 저장은 항상 두 문서를
// 병합한 content 를 debounce PATCH 한다(부분 저장으로 서로의 필드를 지우지 않도록).
import { createMyResume, getMyResumes, updateMyResume } from "../member-profile-client";
import type { ResumeDoc } from "./resume-doc";
import type { CoverDoc } from "./cover-doc";
import type { BasicInfo } from "./basic-info";
import type { FeedEntry } from "./career-feed";

export type RenewalDocsStatus = "idle" | "loading" | "loaded";

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

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving = false;
let dirty = false;

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

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// content 빌드/파싱 ----------------------------------------------------------
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
  return { resume, cover, basic, interests, follows, bookmarks, dailySteps, careerFeed };
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
    status = "idle";
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    dirty = false;
    emit();
  }
  if (userId && status === "idle") {
    void load(userId);
  }
}

// 저장 ----------------------------------------------------------------------
function scheduleSave() {
  dirty = true;
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
  const content = buildContent();
  try {
    if (resumeRowId) {
      await updateMyResume(resumeRowId, { content, allowIncomplete: true });
    } else {
      const created = await createMyResume({ title: "내 이력서", content, allowIncomplete: true });
      if (loadedForUser === userId) resumeRowId = created.id;
    }
  } catch {
    dirty = true; // 실패 → 다음 변경/스케줄에 재시도
  } finally {
    saving = false;
    if (dirty && loadedForUser === userId) scheduleSave();
  }
}

export function setResumeDoc(doc: ResumeDoc | null): void {
  resumeDoc = doc;
  emit();
  scheduleSave();
}

export function setCoverDoc(doc: CoverDoc | null): void {
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
