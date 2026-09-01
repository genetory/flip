// 공통 Career Profile — Phase 2.
// Career Launch 의 진단·직무·이력서·자소서·모의면접이 하나의 구조화된 사용자 정보를 공유하기 위한
// "순수 로직" 계층(DB 무의존 → 단위 테스트 가능). 저장/조회는 index.ts 의 repository 가 담당한다.
//
// 원칙: AI 추론값(inferred)과 사용자 확인값(confirmed)을 구분하고, 확정된 정보는 다시 묻지 않으며,
//       거부된 해석은 같은 형태로 재제안하지 않는다. 전체를 매번 LLM 에 넘기지 않고 요약만 주입한다.

export type ProfileStatus =
  | "confirmed" // 사용자가 직접 확인한 사실
  | "inferred" // AI 가 경험 기반으로 추론
  | "missing" // 결과물에 필요하지만 아직 없음
  | "conflicted" // 기존 값과 새 답변이 충돌
  | "rejected" // 사용자가 거부한 AI 해석
  | "outdated"; // 업데이트가 필요할 수 있음

// 각 정보 단위의 값 + 메타데이터.
export type ProfileField = {
  value: unknown;
  status: ProfileStatus;
  source?: string; // resume | cover | diagnosis | jobs | materials | experienceBank | user | ai:<feature>
  confidence?: number; // 0..1
  confirmedAt?: string | null;
  updatedAt?: string;
  conflict?: { previous: unknown; incoming: unknown } | null;
  key?: string; // 다중값 항목의 안정 키
};

export type CareerProfileData = {
  areas: Partial<Record<ProfileAreaKey, ProfileField | ProfileField[]>>;
  // 사용자가 거부한 AI 해석 — 동일 형태 재제안을 막기 위해 보관.
  rejected: Array<{ area: ProfileAreaKey; value: unknown; at: string }>;
};

// 17개 정보 영역 + 단일/다중값 여부 + 한국어 라벨.
export const PROFILE_AREAS = {
  basicInfo: { multi: false, label: "기본 정보" },
  educations: { multi: true, label: "학력" },
  careers: { multi: true, label: "경력" },
  projects: { multi: true, label: "프로젝트" },
  activities: { multi: true, label: "활동 및 경험" },
  skills: { multi: true, label: "기술" },
  languages: { multi: true, label: "언어" },
  certifications: { multi: true, label: "자격증" },
  strengths: { multi: true, label: "강점" },
  workPreferences: { multi: false, label: "업무 선호" },
  interestRoles: { multi: true, label: "관심 직무" },
  targetRole: { multi: false, label: "목표 직무" },
  targetIndustry: { multi: true, label: "목표 산업" },
  workConditions: { multi: false, label: "희망 근무 조건" },
  signatureExperiences: { multi: true, label: "대표 경험" },
  achievements: { multi: true, label: "성과 및 근거" },
  targetPostings: { multi: true, label: "지원 기준 공고" }
} as const;

export type ProfileAreaKey = keyof typeof PROFILE_AREAS;
export const PROFILE_AREA_KEYS = Object.keys(PROFILE_AREAS) as ProfileAreaKey[];
export function isProfileAreaKey(x: unknown): x is ProfileAreaKey {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(PROFILE_AREAS, x);
}
export function isMultiArea(area: ProfileAreaKey): boolean {
  return PROFILE_AREAS[area].multi;
}

// ── 공통 유틸 ──────────────────────────────────────────────
function eq(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}
function clean(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}
function nonEmpty(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v as Record<string, unknown>).some((x) => nonEmpty(x));
  return true;
}
function mk(value: unknown, status: ProfileStatus, source: string, now: string, confidence?: number, key?: string): ProfileField {
  return {
    value,
    status,
    source,
    ...(confidence != null ? { confidence } : {}),
    confirmedAt: status === "confirmed" ? now : null,
    updatedAt: now,
    ...(key ? { key } : {})
  };
}
function emptyProfile(): CareerProfileData {
  return { areas: {}, rejected: [] };
}

// ── 초기 병합: 이력서·자소서·진행상태 → Career Profile ──────────
// 기존 사용자 데이터를 손실 없이 최초 1회 병합한다. 원본 테이블은 그대로 둔다.
export type ResumeContentInput = {
  basic?: { name?: string | null; email?: string | null; phone?: string | null; summary?: string | null } | null;
  educations?: Array<{ school?: string | null; major?: string | null; degree?: string | null; period?: string | null; note?: string | null }> | null;
  experiences?: Array<{ kind?: "work" | "other" | null; title?: string | null; org?: string | null; period?: string | null; bullets?: string[] }> | null;
  skills?: Array<string> | null;
  languages?: Array<{ language?: string | null; level?: string | null }> | null;
};
export type CoverContentInput = { company?: string | null; items?: Array<{ question?: string | null; answer?: string | null }> | null };
export type ProgressInput = {
  diagnosis?: { percent?: number; level?: string; strengths?: string[]; improvements?: string[] } | null;
  selectedJobs?: string[] | null;
  materials?: string[] | null;
  experienceBank?: Array<Record<string, unknown>> | null;
};
export type InitialMergeInputs = { resume?: ResumeContentInput | null; cover?: CoverContentInput | null; progress?: ProgressInput | null };

export function buildInitialCareerProfile(inputs: InitialMergeInputs, now: string): CareerProfileData {
  const p = emptyProfile();
  const resume = inputs.resume ?? {};
  const cover = inputs.cover ?? {};
  const prog = inputs.progress ?? {};
  const set = (area: ProfileAreaKey, v: ProfileField | ProfileField[]) => {
    p.areas[area] = v;
  };
  const missing = (area: ProfileAreaKey) => set(area, mk(null, "missing", "init", now));
  const listOr = (area: ProfileAreaKey, items: ProfileField[]) => (items.length ? set(area, items) : missing(area));

  // 기본 정보 — 이력서 basic(사용자 입력 = 사실).
  const basic = resume.basic ?? {};
  if (nonEmpty(basic.name) || nonEmpty(basic.email) || nonEmpty(basic.phone) || nonEmpty(basic.summary)) {
    set("basicInfo", mk({ name: clean(basic.name), email: clean(basic.email), phone: clean(basic.phone), summary: clean(basic.summary) }, "confirmed", "resume", now));
  } else missing("basicInfo");

  // 학력.
  listOr(
    "educations",
    (resume.educations ?? [])
      .filter((e) => nonEmpty(e?.school) || nonEmpty(e?.major))
      .map((e, i) => mk({ school: clean(e.school), major: clean(e.major), degree: clean(e.degree), period: clean(e.period), note: clean(e.note) }, "confirmed", "resume", now, undefined, `edu-${i}`))
  );

  // 경력(회사경험 = kind !== other) / 활동·경험(kind === other).
  const exps = resume.experiences ?? [];
  const workItems = exps.filter((x) => x?.kind !== "other").filter((x) => nonEmpty(x?.title) || nonEmpty(x?.org));
  const otherItems = exps.filter((x) => x?.kind === "other").filter((x) => nonEmpty(x?.title) || nonEmpty(x?.org));
  const expField = (x: NonNullable<ResumeContentInput["experiences"]>[number], key: string) =>
    mk({ title: clean(x.title), org: clean(x.org), period: clean(x.period), bullets: (x.bullets ?? []).filter((b) => nonEmpty(b)) }, "confirmed", "resume", now, undefined, key);
  listOr("careers", workItems.map((x, i) => expField(x, `career-${i}`)));
  listOr("activities", otherItems.map((x, i) => expField(x, `act-${i}`)));

  // 프로젝트 — 별도 수집 필드 없음(Phase 4/5에서 정제). 초기엔 없음.
  missing("projects");

  // 기술 / 언어.
  listOr("skills", (resume.skills ?? []).filter(nonEmpty).map((s, i) => mk(clean(s), "confirmed", "resume", now, undefined, `skill-${i}`)));
  listOr("languages", (resume.languages ?? []).filter((l) => nonEmpty(l?.language)).map((l, i) => mk({ language: clean(l.language), level: clean(l.level) }, "confirmed", "resume", now, undefined, `lang-${i}`)));

  // 자격증 — 아직 별도 수집 없음.
  missing("certifications");

  // 강점 — 진단 결과(AI 추론).
  const strengths = (prog.diagnosis?.strengths ?? []).filter(nonEmpty);
  listOr("strengths", strengths.map((s, i) => mk(clean(s), "inferred", "diagnosis", now, 0.5, `str-${i}`)));

  // 업무 선호 — 미수집.
  missing("workPreferences");

  // 관심 직무 — 사용자가 선정(사실).
  listOr("interestRoles", (prog.selectedJobs ?? []).filter(nonEmpty).map((r, i) => mk(clean(r), "confirmed", "jobs", now, undefined, `role-${i}`)));

  // 목표 직무 — 아직 확정 안 함(Phase 4 확정). 미수집.
  missing("targetRole");
  missing("targetIndustry");
  missing("workConditions");

  // 대표 경험 — Experience Bank(AI 정리 추론).
  const bank = (prog.experienceBank ?? []).filter((x) => x && typeof x === "object").slice(0, 8);
  listOr("signatureExperiences", bank.map((x, i) => mk(x, "inferred", "experienceBank", now, 0.5, `exp-${i}`)));

  // 성과 및 근거 — 이력서 경력 bullet(정량 성과 후보, 추론).
  const achievements = workItems.flatMap((x) => (x.bullets ?? [])).filter(nonEmpty).slice(0, 12);
  listOr("achievements", achievements.map((b, i) => mk(clean(b), "inferred", "resume", now, 0.4, `ach-${i}`)));

  // 지원 기준 공고 — 자소서 대상 회사(추론).
  const company = clean(cover.company);
  if (company) set("targetPostings", [mk({ company }, "inferred", "cover", now, 0.5, "post-0")]);
  else missing("targetPostings");

  return normalizeProfile(p);
}

// 저장된 JSON 을 안전한 CareerProfileData 로 정규화(누락 영역은 missing 으로 채움).
export function normalizeProfile(raw: unknown, now?: string): CareerProfileData {
  const stamp = now ?? "";
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<CareerProfileData>;
  const areas = (src.areas && typeof src.areas === "object" ? src.areas : {}) as CareerProfileData["areas"];
  const rejected = Array.isArray(src.rejected) ? src.rejected : [];
  const out: CareerProfileData = { areas: {}, rejected };
  for (const area of PROFILE_AREA_KEYS) {
    const v = areas[area];
    if (v == null) {
      if (stamp) out.areas[area] = mk(null, "missing", "init", stamp);
      continue;
    }
    out.areas[area] = v;
  }
  return out;
}

// ── 업데이트 상태머신 ──────────────────────────────────────
export type ProfileUpdate = {
  area: ProfileAreaKey;
  value: unknown;
  // user = 사용자 확인(confirmed), ai = AI 추론(inferred), reject = 거부, resolve = 충돌 해결(confirmed)
  intent: "user" | "ai" | "reject" | "resolve";
  source?: string;
  confidence?: number;
  itemKey?: string; // 다중값 항목 지정(없으면 신규 추가)
};
export type ProfileEvent = {
  area: ProfileAreaKey;
  itemKey?: string;
  action: "init_merge" | "confirm" | "infer" | "reject" | "conflict" | "update" | "outdate" | "noop";
  status?: ProfileStatus;
  source?: string;
  before?: unknown;
  after?: unknown;
};

// 순수 함수: 현재 데이터 + 업데이트 → { data(신규), event }. 클라이언트가 전체를 덮어쓰지 못하게
// 항상 "영역+값" 단위로만 반영한다.
export function applyProfileUpdate(data: CareerProfileData, up: ProfileUpdate, now: string): { data: CareerProfileData; event: ProfileEvent } {
  const next: CareerProfileData = { areas: { ...data.areas }, rejected: [...data.rejected] };
  const area = up.area;
  const multi = isMultiArea(area);

  // 거부 — 값 보관(재제안 금지) + 해당 항목/필드 rejected 처리.
  if (up.intent === "reject") {
    next.rejected = [...next.rejected, { area, value: up.value, at: now }];
    if (multi) {
      const arr = asArray(next.areas[area]);
      const idx = up.itemKey ? arr.findIndex((f) => f.key === up.itemKey) : arr.findIndex((f) => eq(f.value, up.value));
      if (idx >= 0) {
        const before = arr[idx];
        const copy = [...arr];
        copy[idx] = { ...before, status: "rejected", updatedAt: now };
        next.areas[area] = copy;
        return { data: next, event: { area, itemKey: before.key, action: "reject", status: "rejected", before: before.value, after: null } };
      }
    } else {
      const cur = asField(next.areas[area]);
      next.areas[area] = { ...(cur ?? mk(null, "rejected", up.source ?? "user", now)), status: "rejected", value: cur?.value ?? null, updatedAt: now };
    }
    return { data: next, event: { area, action: "reject", status: "rejected", before: null, after: null } };
  }

  const isUser = up.intent === "user" || up.intent === "resolve";
  const status: ProfileStatus = isUser ? "confirmed" : "inferred";
  const source = up.source ?? (isUser ? "user" : "ai");

  // 이전에 거부한 해석과 동일 형태면 재제안 무시(AI 추론에 한함).
  if (!isUser && next.rejected.some((r) => r.area === area && eq(r.value, up.value))) {
    return { data: next, event: { area, action: "noop", status: undefined } };
  }

  if (multi) {
    const arr = asArray(next.areas[area]).filter((f) => f.status !== "missing");
    const idx = up.itemKey ? arr.findIndex((f) => f.key === up.itemKey) : -1;
    if (idx >= 0) {
      const before = arr[idx];
      // 확정된 항목을 AI 추론이 다른 값으로 덮어쓰려 하면 충돌로 표시(확정 우선).
      if (!isUser && before.status === "confirmed" && !eq(before.value, up.value)) {
        const copy = [...arr];
        copy[idx] = { ...before, status: "conflicted", conflict: { previous: before.value, incoming: up.value }, updatedAt: now };
        next.areas[area] = copy;
        return { data: next, event: { area, itemKey: before.key, action: "conflict", status: "conflicted", before: before.value, after: up.value } };
      }
      const copy = [...arr];
      copy[idx] = { ...before, value: up.value, status, source, confidence: up.confidence, confirmedAt: isUser ? now : before.confirmedAt ?? null, conflict: null, updatedAt: now };
      next.areas[area] = copy;
      return { data: next, event: { area, itemKey: before.key, action: isUser ? "update" : "infer", status, source, before: before.value, after: up.value } };
    }
    // 신규 항목 추가.
    const key = up.itemKey ?? `${area}-${arr.length}-${hash(now + JSON.stringify(up.value))}`;
    const f = mk(up.value, status, source, now, up.confidence, key);
    next.areas[area] = [...arr, f];
    return { data: next, event: { area, itemKey: key, action: isUser ? "confirm" : "infer", status, source, before: null, after: up.value } };
  }

  // 단일값.
  const cur = asField(next.areas[area]);
  if (!isUser && cur && cur.status === "confirmed" && !eq(cur.value, up.value)) {
    // AI 추론이 확정값과 충돌 → 확정 유지 + 충돌 플래그.
    next.areas[area] = { ...cur, status: "conflicted", conflict: { previous: cur.value, incoming: up.value }, updatedAt: now };
    return { data: next, event: { area, action: "conflict", status: "conflicted", before: cur.value, after: up.value } };
  }
  if (!isUser && cur && cur.status === "confirmed" && eq(cur.value, up.value)) {
    return { data: next, event: { area, action: "noop", status: "confirmed" } };
  }
  next.areas[area] = { value: up.value, status, source, confidence: up.confidence, confirmedAt: isUser ? now : cur?.confirmedAt ?? null, conflict: null, updatedAt: now };
  return { data: next, event: { area, action: isUser ? (cur?.status === "confirmed" ? "update" : "confirm") : "infer", status, source, before: cur?.value ?? null, after: up.value } };
}

// 오래된 확정 정보를 outdated 로 표시(예: N일 경과). 순수 함수.
export function markOutdated(data: CareerProfileData, area: ProfileAreaKey, now: string): { data: CareerProfileData; event: ProfileEvent } {
  const next: CareerProfileData = { areas: { ...data.areas }, rejected: [...data.rejected] };
  const cur = asField(next.areas[area]);
  if (cur && cur.status === "confirmed") {
    next.areas[area] = { ...cur, status: "outdated", updatedAt: now };
    return { data: next, event: { area, action: "outdate", status: "outdated", before: cur.value, after: cur.value } };
  }
  return { data: next, event: { area, action: "noop" } };
}

// ── 소스 사실 최신화(비파괴) ────────────────────────────────
// 이력서/자소서/진단이 소스인 영역. 초기 병합 후 소스가 갱신돼도 프로필이 낡지 않게 한다.
export const SOURCE_BACKED_AREAS: ProfileAreaKey[] = [
  "basicInfo",
  "educations",
  "careers",
  "activities",
  "skills",
  "languages",
  "strengths",
  "interestRoles",
  "signatureExperiences",
  "achievements",
  "targetPostings"
];

// 해당 영역에 '사용자 결정'(직접 확인/거부/충돌)이 있으면 소스로 덮어쓰지 않는다.
function areaHasUserDecision(v: ProfileField | ProfileField[] | undefined): boolean {
  const arr = asArray(v);
  return arr.some((f) => f.status === "rejected" || f.status === "conflicted" || (f.status === "confirmed" && f.source === "user"));
}

// 저장된 프로필에 최신 소스 사실을 병합한다. 사용자 결정(confirm by user / reject / conflict)은 보존하고,
// 소스에서 온(missing/inferred/source-confirmed) 영역만 최신 소스값으로 갱신한다. 순수 함수.
export function mergeSourceFactsIntoProfile(stored: CareerProfileData, fresh: CareerProfileData, _now: string): { data: CareerProfileData; changed: boolean } {
  const next: CareerProfileData = { areas: { ...stored.areas }, rejected: [...stored.rejected] };
  let changed = false;
  for (const area of SOURCE_BACKED_AREAS) {
    if (areaHasUserDecision(stored.areas[area])) continue; // 사용자 결정 보존
    const freshArea = fresh.areas[area];
    if (freshArea == null) continue;
    if (!eq(freshArea, stored.areas[area] ?? null)) {
      next.areas[area] = freshArea;
      changed = true;
    }
  }
  return { data: next, changed };
}

// ── 중복 질문 방지 ─────────────────────────────────────────
// requiredAreas 중 아직 확정되지 않아 질문이 필요한 영역만 반환하고, 이미 아는 값은 known 으로 준다.
export function careerProfileAsksNeeded(
  data: CareerProfileData,
  requiredAreas: ProfileAreaKey[]
): { ask: ProfileAreaKey[]; known: Partial<Record<ProfileAreaKey, unknown>>; confirmedAreas: ProfileAreaKey[] } {
  const ask: ProfileAreaKey[] = [];
  const known: Partial<Record<ProfileAreaKey, unknown>> = {};
  const confirmedAreas: ProfileAreaKey[] = [];
  for (const area of requiredAreas) {
    const v = data.areas[area];
    const confirmed = isAreaConfirmed(v);
    if (confirmed) {
      confirmedAreas.push(area);
      known[area] = areaValue(v);
      continue;
    }
    // missing/inferred/conflicted/outdated/미존재 → 질문 후보.
    ask.push(area);
    const val = areaValue(v);
    if (nonEmpty(val)) known[area] = val; // 추론값이 있으면 확인용으로 전달.
  }
  return { ask, known, confirmedAreas };
}

// 특정 영역을 지금 질문해야 하는가(confirmed 면 false).
export function shouldAskArea(data: CareerProfileData, area: ProfileAreaKey): boolean {
  return !isAreaConfirmed(data.areas[area]);
}

// ── LLM 컨텍스트 빌더(토큰 절약: 전체가 아니라 요약) ───────────
export function buildCareerProfileContext(data: CareerProfileData, opts?: { areas?: ProfileAreaKey[]; maxChars?: number }): string {
  const areas = opts?.areas ?? PROFILE_AREA_KEYS;
  const maxChars = opts?.maxChars ?? 1800;
  const confirmedLines: string[] = [];
  const inferredLines: string[] = [];
  const missingLabels: string[] = [];
  for (const area of areas) {
    const label = PROFILE_AREAS[area].label;
    const v = data.areas[area];
    if (isAreaConfirmed(v)) {
      confirmedLines.push(`- ${label}: ${summarizeValue(areaValue(v))}`);
    } else if (isAreaInferred(v)) {
      inferredLines.push(`- ${label}(추정): ${summarizeValue(areaValue(v))}`);
    } else if (isAreaConflicted(v)) {
      const f = asField(v) ?? asArray(v).find((x) => x.status === "conflicted");
      if (f?.conflict) inferredLines.push(`- ${label}(충돌·확인필요): 기존="${summarizeValue(f.conflict.previous)}" 새값="${summarizeValue(f.conflict.incoming)}"`);
    } else {
      missingLabels.push(label);
    }
  }
  const rejectedLines = data.rejected.slice(-8).map((r) => `- ${PROFILE_AREAS[r.area]?.label ?? r.area}: ${summarizeValue(r.value)}`);
  const parts: string[] = [];
  if (confirmedLines.length) parts.push(`[확정된 정보 — 다시 묻지 마세요]\n${confirmedLines.join("\n")}`);
  if (inferredLines.length) parts.push(`[추론된 정보 — 필요 시 확인]\n${inferredLines.join("\n")}`);
  if (missingLabels.length) parts.push(`[아직 없는 정보 — 이것부터 채우세요]\n- ${missingLabels.join(", ")}`);
  if (rejectedLines.length) parts.push(`[사용자가 거부한 해석 — 같은 형태로 다시 제안 금지]\n${rejectedLines.join("\n")}`);
  let out = parts.join("\n\n");
  if (out.length > maxChars) out = out.slice(0, maxChars) + "…";
  return out;
}

// 로그 안전용 — 값은 빼고 영역별 상태/개수만.
export function redactProfileForLog(data: CareerProfileData): Record<string, unknown> {
  const areas: Record<string, unknown> = {};
  for (const area of PROFILE_AREA_KEYS) {
    const v = data.areas[area];
    if (Array.isArray(v)) areas[area] = { count: v.length, statuses: tally(v.map((f) => f.status)) };
    else if (v) areas[area] = { status: (v as ProfileField).status };
  }
  return { areas, rejectedCount: data.rejected.length };
}

// ── 내부 헬퍼 ──────────────────────────────────────────────
function asArray(v: ProfileField | ProfileField[] | undefined): ProfileField[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}
function asField(v: ProfileField | ProfileField[] | undefined): ProfileField | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function isAreaConfirmed(v: ProfileField | ProfileField[] | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.some((f) => f.status === "confirmed");
  return v.status === "confirmed";
}
function isAreaInferred(v: ProfileField | ProfileField[] | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return !v.some((f) => f.status === "confirmed") && v.some((f) => f.status === "inferred");
  return v.status === "inferred";
}
function isAreaConflicted(v: ProfileField | ProfileField[] | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.some((f) => f.status === "conflicted");
  return v.status === "conflicted";
}
function areaValue(v: ProfileField | ProfileField[] | undefined): unknown {
  if (v == null) return null;
  if (Array.isArray(v)) return v.filter((f) => f.status !== "rejected" && f.status !== "missing").map((f) => f.value);
  return v.value;
}
function summarizeValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.slice(0, 120);
  if (Array.isArray(v)) return v.map((x) => summarizeValue(x)).filter(Boolean).slice(0, 6).join(", ").slice(0, 200);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.entries(o)
      .filter(([, val]) => nonEmpty(val))
      .map(([k, val]) => `${k}=${summarizeValue(val)}`)
      .join(" · ")
      .slice(0, 200);
  }
  return String(v);
}
function tally(xs: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const x of xs) m[x] = (m[x] ?? 0) + 1;
  return m;
}
// 결정적 짧은 해시(항목 키 생성용). Math.random 미사용.
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 6);
}
