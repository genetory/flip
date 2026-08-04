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

export type RenewalDocsStatus = "idle" | "loading" | "loaded";

const listeners = new Set<() => void>();
let status: RenewalDocsStatus = "idle";
let loadedForUser: string | null = null;
let resumeRowId: string | null = null;
let resumeDoc: ResumeDoc | null = null;
let coverDoc: CoverDoc | null = null;

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
  return content;
}

function parseContent(content: Record<string, unknown> | null | undefined): { resume: ResumeDoc | null; cover: CoverDoc | null } {
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
  return { resume, cover };
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
        return rc != null && ("renewalResume" in rc || "renewalCover" in rc);
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    if (renewal) {
      resumeRowId = renewal.id;
      const { resume, cover } = parseContent(renewal.content as unknown as Record<string, unknown>);
      resumeDoc = resume;
      coverDoc = cover;
    } else {
      resumeRowId = null;
      resumeDoc = null;
      coverDoc = null;
    }
    status = "loaded";
    emit();
  } catch {
    if (loadedForUser !== userId) return;
    // 로드 실패해도 편집은 가능하도록 빈 상태로 loaded 처리.
    resumeRowId = null;
    resumeDoc = null;
    coverDoc = null;
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
