import { readAccessToken, refreshPlatformSession, storeAccessToken } from "./auth-client";
import { getBrowserLocale } from "./auth-messages";
import {
  trackAiAnalysisCompleted,
  trackAiAnalysisStart,
  trackPositionApply,
  trackPositionFavorite
} from "./analytics";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

const enableApiLogs =
  process.env.NEXT_PUBLIC_DEBUG_API_LOGS === "true" || process.env.NODE_ENV !== "production";

function summarizeRequestBodyForLog(body: RequestInit["body"]) {
  if (!body) return undefined;
  if (typeof body !== "string") return { type: typeof body };
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const thumbnailCount = Array.isArray(parsed.thumbnailImages) ? parsed.thumbnailImages.length : undefined;
    return {
      keys: Object.keys(parsed),
      thumbnailImages: thumbnailCount !== undefined ? `${thumbnailCount} item(s)` : undefined
    };
  } catch {
    return { textLength: body.length };
  }
}

function withOptionalBearerHeader(headers: HeadersInit = {}) {
  const token = readAccessToken();
  if (!token) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${token}`
  } satisfies HeadersInit;
}

async function getAccessTokenOrThrow() {
  let token = readAccessToken();
  if (!token) {
    await refreshPlatformSession();
    token = readAccessToken();
  }
  if (!token) throw new Error("로그인이 필요합니다.");
  return token;
}

type ZodFlatErrors = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

type ApiPayload<T = unknown> = {
  ok?: boolean;
  code?: string;
  message?: string;
  item?: T;
  items?: T[];
  errors?: ZodFlatErrors;
};

async function readApiPayload<T = unknown>(response: Response) {
  const text = await response.text();
  if (!text) return {} as ApiPayload<T>;
  try {
    return JSON.parse(text) as ApiPayload<T>;
  } catch {
    return { message: text.trim() || undefined } as ApiPayload<T>;
  }
}

// Translate the most common Zod field errors into something a user can act on.
// Keep this list small — anything not mapped falls through to "field: message".
const FIELD_LABELS_KO: Record<string, string> = {
  website: "웹사이트",
  email: "이메일",
  emergencyContactEmail: "비상연락처 이메일",
  birthDate: "생년월일",
  visaExpiryDate: "비자 만료일",
  programStartDate: "시작 가능 날짜",
  startDate: "시작일",
  endDate: "종료일",
  phoneNumber: "휴대폰 번호",
  name: "이름",
  realName: "실명",
  companyLogoImageData: "기업 로고",
  officePhotoImageData: "사무실 사진",
  businessRegistrationDocumentData: "사업자등록증",
  fourInsuranceSubscriberListData: "4대보험 가입자 명부",
  profileImageData: "프로필 사진"
};

function humanizeZodErrors(errors: ZodFlatErrors): string | null {
  if (!errors) return null;
  const fieldEntries = Object.entries(errors.fieldErrors ?? {}).filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0);
  const parts: string[] = [];

  for (const [field, msgs] of fieldEntries) {
    const label = FIELD_LABELS_KO[field] ?? field;
    const first = (msgs?.[0] ?? "").toLowerCase();
    let humanReason = msgs?.[0] ?? "잘못된 값";
    if (first.includes("invalid url")) humanReason = "URL 형식이 올바르지 않습니다";
    else if (first.includes("invalid email")) humanReason = "이메일 형식이 올바르지 않습니다";
    else if (first.includes("invalid date")) humanReason = "날짜 형식이 올바르지 않습니다";
    else if (first.includes("string must contain at most")) humanReason = "용량이 너무 큽니다 (이미지/파일 크기를 줄여주세요)";
    else if (first.includes("required")) humanReason = "필수 입력 항목입니다";
    parts.push(`${label}: ${humanReason}`);
  }

  if (errors.formErrors?.length) {
    parts.push(...errors.formErrors);
  }

  return parts.length > 0 ? parts.join(" / ") : null;
}

function resolveApiErrorMessage(payload: { message?: unknown; errors?: ZodFlatErrors }, fallback: string) {
  // If the server returned Zod field errors, surface them — much more useful
  // than the generic "invalid request" message.
  if (payload.errors) {
    const humanized = humanizeZodErrors(payload.errors);
    if (humanized) return humanized;
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    if (payload.message === "invalid request") return "입력값을 확인해 주세요.";
    return payload.message;
  }
  return fallback;
}

export async function authedJsonFetch<T>(path: string, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const bodySummary = summarizeRequestBodyForLog(init.body);
  if (enableApiLogs) {
    console.info("[platform-web][api][request]", { method, path, body: bodySummary });
  }

  const request = async () => {
    const token = await getAccessTokenOrThrow();
    return fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`
      }
    });
  };

  let response = await request();
  if (response.status === 401) {
    if (enableApiLogs) {
      console.warn("[platform-web][api][retry-after-401]", { method, path });
    }
    await refreshPlatformSession();
    response = await request();
  }

  const payload = await readApiPayload<T>(response);
  if (!response.ok || payload.ok !== true) {
    if (enableApiLogs) {
      console.warn("[platform-web][api][error-response]", {
        method,
        path,
        status: response.status,
        code: typeof payload.code === "string" ? payload.code : undefined,
        message: resolveApiErrorMessage(payload, "요청을 처리하지 못했습니다."),
        payload
      });
    }
    throw new MemberProfileApiError(
      resolveApiErrorMessage(payload, "요청을 처리하지 못했습니다."),
      response.status,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }

  if (enableApiLogs) {
    console.info("[platform-web][api][response]", { method, path, status: response.status });
  }

  // AI 호출이 성공하면 티켓 잔량이 바뀌므로, 잔량을 보는 화면(GNB 등)에 갱신 신호를 보낸다.
  if (method === "POST" && path.startsWith("/members/me/ai/") && typeof window !== "undefined") {
    window.dispatchEvent(new Event("aply:ai-usage-changed"));
  }

  return payload;
}

/**
 * Multipart upload variant of authedJsonFetch. Skips Content-Type header so
 * the browser sets the multipart boundary, retries once on 401 via session
 * refresh, and surfaces the same MemberProfileApiError shape on failure.
 */
async function authedMultipartFetch<T>(path: string, body: FormData) {
  const request = async () => {
    const token = await getAccessTokenOrThrow();
    return fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body
    });
  };

  let response = await request();
  if (response.status === 401) {
    await refreshPlatformSession();
    response = await request();
  }

  const payload = await readApiPayload<T>(response);
  if (!response.ok || payload.ok !== true) {
    throw new MemberProfileApiError(
      resolveApiErrorMessage(payload, "파일 업로드에 실패했습니다."),
      response.status,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }
  return payload;
}

class MemberProfileApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "MemberProfileApiError";
    this.status = status;
    this.code = code;
  }
}

export function isMemberNotFoundError(error: unknown) {
  return error instanceof MemberProfileApiError && error.status === 404;
}

export type CandidateVisaType =
  | "D10_JOB_SEEKING"
  | "D2_STUDENT"
  | "D4_GENERAL_TRAINING"
  | "F2_RESIDENCE"
  | "F4_OVERSEAS_KOREAN"
  | "F5_PERMANENT_RESIDENCE"
  | "F6_MARRIAGE_IMMIGRATION"
  | "E7_SPECIFIC_ACTIVITY"
  | "H1_WORKING_HOLIDAY"
  | "OTHER";

export type CandidateEducationType =
  | "HIGH_SCHOOL"
  | "ASSOCIATE"
  | "BACHELOR"
  | "MASTER"
  | "DOCTOR"
  | "BOOTCAMP"
  | "CERTIFICATE"
  | "OTHER";

export type CandidateEducationStatus =
  | "ENROLLED"
  | "GRADUATED"
  | "LEAVE_OF_ABSENCE"
  | "DROPPED_OUT"
  | "OTHER";

export type CandidateLanguageType =
  | "KOREAN"
  | "ENGLISH"
  | "CHINESE"
  | "JAPANESE"
  | "VIETNAMESE"
  | "INDONESIAN"
  | "THAI"
  | "MALAY"
  | "FILIPINO"
  | "HINDI"
  | "SPANISH"
  | "FRENCH"
  | "GERMAN"
  | "OTHER";

export type CandidateLanguageLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";

export type CandidateActivityType =
  | "PROJECT"
  | "VOLUNTEER"
  | "INTERNSHIP"
  | "CERTIFICATE"
  | "AWARD"
  | "EXTRACURRICULAR"
  | "OTHER";

export type CandidateEducation = {
  id: string;
  schoolName: string;
  educationType: CandidateEducationType;
  major?: string | null;
  status: CandidateEducationStatus;
  country?: string | null;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isKoreanSchool?: boolean | null;
};

export type CandidateLanguageSkill = {
  id: string;
  language: CandidateLanguageType;
  level: CandidateLanguageLevel;
  testName?: string | null;
  score?: string | null;
};

export type CandidateCareer = {
  id: string;
  companyName: string;
  position: string;
  department?: string | null;
  isCurrent?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
};

export type CandidateActivityExperience = {
  id: string;
  title: string;
  activityType: CandidateActivityType;
  organization?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  skills?: string[];
};

export type MyCandidateProfile = {
  userId: string;
  visaType?: CandidateVisaType | null;
  educations?: CandidateEducation[];
  languageSkills?: CandidateLanguageSkill[];
  careers?: CandidateCareer[];
  activityExperiences?: CandidateActivityExperience[];
  residenceProvince?: string | null;
  programStartOption?: "ASAP" | "SPECIFIC_DATE" | null;
  programStartDate?: string | null;
  preferenceConditionNote?: string | null;
  skills?: string[];
  selfIntroduction?: string | null;
  programMotivation?: string | null;
  additionalInfoNote?: string | null;
  favoritePositionIds?: string[];
  appliedPositionIds?: string[];
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  coverLetterUrl?: string | null;
  coverLetterFileName?: string | null;
  portfolioUrl?: string | null;
  portfolioFileName?: string | null;
  passportImageUrl?: string | null;
  passportImageFileName?: string | null;
};

export type CandidateDocumentKind = "resume" | "coverLetter" | "portfolio" | "passportImage";

export type CandidateDocumentUploadResult = {
  ok: boolean;
  kind: CandidateDocumentKind;
  url: string;
  fileName: string;
};

export type MyPartnerOrganization = {
  id: string;
  slug?: string | null;
  partnerType: "UNIVERSITY" | "COMPANY" | "AGENCY";
  name: string;
  companySize?: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
  officeAddress?: string | null;
  website?: string | null;
  socialMedia?: string | null;
  industry:
    | "EDUCATION"
    | "AGRICULTURE"
    | "AGRICULTURAL_PRODUCTS"
    | "PETS"
    | "FITNESS"
    | "WELLNESS"
    | "BEAUTY"
    | "TRAVEL"
    | "GOLF"
    | "IT"
    | "DEVELOPMENT"
    | "AI"
    | "LLM"
    | "DEEP_LEARNING"
    | "IOT"
    | "IMAGE_PROCESSING"
    | "THREE_D"
    | "DEVICE"
    | "APP_TECH"
    | "STARTUP"
    | "PLATFORM"
    | "COMMERCE"
    | "AGENCY"
    | "COMMUNITY"
    | "GLOBAL"
    | "B2B"
    | "SAAS"
    | "PRODUCTIVITY"
    | "CRM"
    | "AUTOMATION"
    | "CONSULTING"
    | "ADVERTISING"
    | "MARKETING"
    | "CONTENT"
    | "WEB_NOVEL"
    | "K_POP"
    | "CHARACTER"
    | "AVATAR"
    | "VIRTUAL"
    | "PUBLIC_DATA"
    | "CONSTRUCTION"
    | "FOREIGNER"
    | "HR"
    | "MENTAL_CARE"
    | "B2C"
    | "HEALTHCARE"
    | "OTHER";
  description?: string | null;
  strengths?: string | null;
  adminMemo?: string | null;
  businessRegistrationDocumentData?: string | null;
  fourInsuranceSubscriberListData?: string | null;
  companyLogoImageData?: string | null;
  officePhotoImageData?: string | null;
  verification?: {
    isVerified: boolean;
    isApproved?: boolean;
    hasRequiredDocuments?: boolean;
    uploadedCount: number;
    requiredCount: number;
    missingItems: string[];
  };
  permissions?: {
    canPostPositions: boolean;
    canContactCandidates: boolean;
  };
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MembersMeta = {
  partnerIndustries: string[];
  partnerCompanySizes: string[];
};

export type PositionsMeta = {
  partnerIndustries: string[];
  partnerCompanySizes: string[];
  jobRoles: string[];
  candidateVisaTypes: string[];
  workTypes: string[];
};

export type PublicPositionListItem = {
  id: string;
  sourceKind: "INTERNAL" | "EXTERNAL";
  sourceProvider: "INTERNAL" | "BUDDIES" | "WANTED" | "OTHER";
  sourceExternalId: string | null;
  sourceUrl: string | null;
  sourceFetchedAt: string | null;
  sourceCompanyName?: string | null;
  sourceDeadlineDate?: string | null;
  sourceDeadlineRolling?: boolean;
  title: string;
  status: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
  workType: "On-site" | "Hybrid" | "Remote" | null;
  employmentType: "FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN";
  employmentClassification?:
    | "UNPAID_INTERN_EXPERIENCE"
    | "UNPAID_INTERN_CONVERSION"
    | "PAID_INTERN_EXPERIENCE"
    | "PAID_INTERN_CONVERSION"
    | "PART_TIME"
    | "FULL_TIME"
    | null;
  thumbnailImages: string[];
  eligibleVisas: string[];
  preferredNationalities: string[];
  communicationLanguages: string[];
  hiringProcess: string | null;
  preferredJobRole: string | null;
  hiringCount: number | null;
  workingHours: string | null;
  workLocation: string | null;
  startDate: string | null;
  mainResponsibilities: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  dressCode: string | null;
  wantsPreTraining: boolean | null;
  additionalNotes: string | null;
  mockInterviewIntent?: string | null;
  mockInterviewQuestions?: string[];
  createdAt: string;
  updatedAt: string;
  matchingParticipantsCount: number;
  partnerOrganization: {
    id: string;
    name: string;
    industry: string;
    companySize: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
    officeAddress: string | null;
    description?: string | null;
    strengths?: string | null;
    website?: string | null;
    socialMedia?: string | null;
    companyLogoImageData?: string | null;
    officePhotoImageData?: string | null;
  } | null;
};

export type PublicPositionsPage = {
  items: PublicPositionListItem[];
  nextCursor: string | null;
  total?: number | null;
  page?: number | null;
  pageSize?: number | null;
};

export type PublicPremiumPositionBannerItem = {
  id: string;
  positionId: string;
  bannerImageUrl: string;
  bannerTitle: string;
  bannerSubtitle: string | null;
  priority: number;
  position: PublicPositionListItem;
};

export type PartnerPosition = {
  id: string;
  partnerOrganizationId: string | null;
  title: string;
  status: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
  workType: "On-site" | "Hybrid" | "Remote" | null;
  employmentType: "FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN";
  employmentClassification?:
    | "UNPAID_INTERN_EXPERIENCE"
    | "UNPAID_INTERN_CONVERSION"
    | "PAID_INTERN_EXPERIENCE"
    | "PAID_INTERN_CONVERSION"
    | "PART_TIME"
    | "FULL_TIME"
    | null;
  thumbnailImages: string[];
  eligibleVisas: string[];
  preferredNationalities: string[];
  communicationLanguages: string[];
  hiringProcess: string | null;
  preferredJobRole: string | null;
  hiringCount: number | null;
  workingHours: string | null;
  workLocation: string | null;
  startDate: string | null;
  mainResponsibilities: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  dressCode: string | null;
  wantsPreTraining: boolean | null;
  additionalNotes: string | null;
  mockInterviewIntent?: string | null;
  mockInterviewQuestions?: string[];
  mockInterviewParticipantCount?: number;
  viewCount?: number;
  adminMemo: string | null;
  postingProgressLogs?: Array<{
    id: string;
    message: string;
    createdAt: string;
    createdBy: { id: string; name: string | null; email: string } | null;
  }>;
  statusHistories?: Array<{
    id: string;
    fromStatus: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED" | null;
    toStatus: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
    note: string | null;
    createdAt: string;
    createdBy: { id: string; name: string | null; email: string } | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export async function getMyCandidateProfile() {
  const result = await authedJsonFetch<MyCandidateProfile | null>("/members/me/profile", { method: "GET" });
  return result.item ?? null;
}

export async function uploadMyCandidateDocument(kind: CandidateDocumentKind, file: File) {
  const body = new FormData();
  body.append("file", file, file.name);
  const result = await authedMultipartFetch<unknown>(`/members/me/candidate-documents/${kind}`, body);
  return result as unknown as CandidateDocumentUploadResult;
}

export async function deleteMyCandidateDocument(kind: CandidateDocumentKind) {
  await authedJsonFetch<unknown>(`/members/me/candidate-documents/${kind}`, { method: "DELETE" });
}

export async function getMyPartnerOrganization() {
  const result = await authedJsonFetch<MyPartnerOrganization | null>("/members/me/partner-organization", { method: "GET" });
  return result.item ?? null;
}

export function isPartnerOrganizationProfileComplete(org: MyPartnerOrganization | null) {
  if (!org) return false;
  return Boolean(org.name?.trim()) && Boolean(org.industry);
}

export function isPartnerOrganizationVerificationComplete(org: MyPartnerOrganization | null) {
  if (!org) return false;
  return Boolean(org.businessRegistrationDocumentData)
    && Boolean(org.fourInsuranceSubscriberListData);
}

export async function updateMyPartnerOrganizationBasic(input: {
  name?: string;
  industry?: string;
  companySize?: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
  website?: string | null;
  socialMedia?: string | null;
  officeAddress?: string | null;
  description?: string | null;
  strengths?: string | null;
  businessRegistrationDocumentData?: string | null;
  fourInsuranceSubscriberListData?: string | null;
  companyLogoImageData?: string | null;
  officePhotoImageData?: string | null;
}) {
  const result = await authedJsonFetch<MyPartnerOrganization | null>("/members/me/partner-organization", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.item ?? null;
}

export async function getMembersMeta() {
  const response = await fetch(`${getApiBaseUrl()}/members/meta`, { method: "GET" });
  const payload = (await readApiPayload(response)) as {
    ok?: boolean;
    message?: string;
    partnerIndustries?: string[];
    partnerCompanySizes?: string[];
  };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "메타 정보를 불러오지 못했습니다."));
  }
  return {
    partnerIndustries: payload.partnerIndustries ?? [],
    partnerCompanySizes: payload.partnerCompanySizes ?? []
  } satisfies MembersMeta;
}

export async function getPositionsMeta() {
  const response = await fetch(`${getApiBaseUrl()}/positions/meta`, { method: "GET" });
  const payload = (await readApiPayload(response)) as {
    ok?: boolean;
    message?: string;
    partnerIndustries?: string[];
    partnerCompanySizes?: string[];
    jobRoles?: string[];
    candidateVisaTypes?: string[];
    workTypes?: string[];
  };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "포지션 메타 정보를 불러오지 못했습니다."));
  }
  return {
    partnerIndustries: payload.partnerIndustries ?? [],
    partnerCompanySizes: payload.partnerCompanySizes ?? [],
    jobRoles: payload.jobRoles ?? [],
    candidateVisaTypes: payload.candidateVisaTypes ?? [],
    workTypes: payload.workTypes ?? []
  } satisfies PositionsMeta;
}

// 포지션 탐색 필터 옵션(직무 카테고리 facet) — 실제 데이터 값 + 건수. 칩 렌더용.
export async function getPositionFacets(): Promise<{ jobRoles: Array<{ value: string; count: number }> }> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/positions/facets`, {
      method: "GET",
      headers: withOptionalBearerHeader()
    });
    const payload = (await readApiPayload(response)) as { ok?: boolean; jobRoles?: Array<{ value: string; count: number }> };
    if (!response.ok || payload.ok !== true) return { jobRoles: [] };
    return { jobRoles: payload.jobRoles ?? [] };
  } catch {
    return { jobRoles: [] };
  }
}

export async function getPublicPositionsPage(input?: {
  cursor?: string | null;
  page?: number; // 번호 페이징(offset). 주어지면 total 반환.
  limit?: number;
  search?: string;
  jobRoles?: string[];
  sortOrder?: "asc" | "desc";
  sort?: "latest" | "deadline" | "relevance";
  sourceProviders?: Array<PublicPositionListItem["sourceProvider"]>;
  // 고용형태 필터(정규직/인턴/파트타임/무급인턴) — 다중.
  employmentTypes?: Array<"FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN">;
  // 지역(시·도) 필터 — 다중. 예: "서울","경기".
  locations?: string[];
  // 외국인 지원 가능(eligibleVisas에 FOREIGNER_FRIENDLY 포함)만 필터링.
  foreignerEligible?: boolean;
  // 특정 회사(파트너 조직명)의 공고만 — 회사 상세/관심 회사용(정확 일치, 검색과 무관).
  company?: string;
  // Forwards to the API so INTERNAL postings come back translated to English
  // for any non-Korean locale (Korean keeps the original copy).
  locale?: string;
}) {
  const params = new URLSearchParams();
  if (input?.cursor) params.set("cursor", input.cursor);
  if (input?.page && Number.isFinite(input.page)) params.set("page", String(Math.max(1, Math.floor(input.page))));
  if (input?.limit && Number.isFinite(input.limit)) params.set("limit", String(Math.max(1, Math.floor(input.limit))));
  if (input?.search && input.search.trim()) params.set("search", input.search.trim());
  if (input?.jobRoles?.length) {
    for (const role of Array.from(new Set(input.jobRoles.map((r) => r.trim()).filter((r) => r.length > 0)))) {
      params.append("jobRole", role);
    }
  }
  if (input?.sortOrder) params.set("sortOrder", input.sortOrder);
  if (input?.sort) params.set("sort", input.sort);
  if (input?.sourceProviders?.length) {
    for (const provider of Array.from(new Set(input.sourceProviders))) {
      params.append("sourceProvider", provider);
    }
  }
  if (input?.employmentTypes?.length) {
    for (const et of Array.from(new Set(input.employmentTypes))) {
      params.append("employmentType", et);
    }
  }
  if (input?.locations?.length) {
    for (const loc of Array.from(new Set(input.locations.map((l) => l.trim()).filter((l) => l.length > 0)))) {
      params.append("location", loc);
    }
  }
  if (input?.foreignerEligible) params.set("foreignerEligible", "true");
  if (input?.company && input.company.trim()) params.set("company", input.company.trim());
  if (input?.locale) params.set("locale", input.locale);
  const query = params.toString();

  const response = await fetch(`${getApiBaseUrl()}/positions${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: withOptionalBearerHeader()
  });
  const payload = (await readApiPayload(response)) as {
    ok?: boolean;
    message?: string;
    items?: PublicPositionListItem[];
    nextCursor?: string | null;
    total?: number;
    page?: number;
    pageSize?: number;
  };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "포지션 목록을 불러오지 못했습니다."));
  }
  return {
    items: payload.items ?? [],
    nextCursor: typeof payload.nextCursor === "string" && payload.nextCursor.trim() ? payload.nextCursor : null,
    total: typeof payload.total === "number" ? payload.total : null,
    page: typeof payload.page === "number" ? payload.page : null,
    pageSize: typeof payload.pageSize === "number" ? payload.pageSize : null
  } satisfies PublicPositionsPage;
}

// 대표 이력서 임베딩 기반 개인화 추천. personalized:false 면 호출측이 관심직무 폴백.
export type RecommendedPositionItem = PublicPositionListItem & { matchScore?: number };
export async function getRecommendedPositions(input?: { limit?: number; locale?: string }): Promise<{
  personalized: boolean;
  items: RecommendedPositionItem[];
}> {
  const params = new URLSearchParams();
  if (input?.limit && Number.isFinite(input.limit)) params.set("limit", String(Math.max(1, Math.floor(input.limit))));
  if (input?.locale) params.set("locale", input.locale);
  const query = params.toString();
  try {
    const response = await fetch(`${getApiBaseUrl()}/positions/recommended${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: withOptionalBearerHeader()
    });
    const payload = (await readApiPayload(response)) as {
      ok?: boolean;
      personalized?: boolean;
      items?: RecommendedPositionItem[];
    };
    if (!response.ok || payload.ok !== true) return { personalized: false, items: [] };
    return { personalized: payload.personalized === true, items: payload.items ?? [] };
  } catch {
    return { personalized: false, items: [] };
  }
}

export async function getPublicPositions() {
  const merged: PublicPositionListItem[] = [];
  let cursor: string | null = null;

  for (let i = 0; i < 200; i += 1) {
    const page = await getPublicPositionsPage({ cursor, limit: 20 });
    merged.push(...page.items);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return merged;
}

export async function getPublicPositionById(id: string, opts?: { locale?: string }) {
  const url = new URL(`${getApiBaseUrl()}/positions/${encodeURIComponent(id)}`);
  if (opts?.locale) url.searchParams.set("locale", opts.locale);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: withOptionalBearerHeader()
  });
  const payload = (await readApiPayload(response)) as {
    ok?: boolean;
    message?: string;
    item?: PublicPositionListItem;
  };
  if (!response.ok || payload.ok !== true || !payload.item) {
    throw new Error(resolveApiErrorMessage(payload, "포지션 상세 정보를 불러오지 못했습니다."));
  }
  return payload.item;
}

export async function getPublicPremiumPositionBanners() {
  const response = await fetch(`${getApiBaseUrl()}/positions/premium-banners`, {
    method: "GET",
    headers: withOptionalBearerHeader()
  });
  const payload = (await readApiPayload(response)) as {
    ok?: boolean;
    message?: string;
    items?: PublicPremiumPositionBannerItem[];
  };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "프리미엄 배너를 불러오지 못했습니다."));
  }
  return payload.items ?? [];
}

// 홈 "이런 회사는 어때요" — 회사 id 목록의 소개 LLM 요약(공개, 캐시). { [orgId]: summary }.
export async function getCompanySummaries(ids: string[]): Promise<Record<string, string>> {
  const clean = ids.filter(Boolean);
  if (clean.length === 0) return {};
  const response = await fetch(`${getApiBaseUrl()}/public/company-summaries?ids=${encodeURIComponent(clean.join(","))}`, { method: "GET" });
  const payload = (await readApiPayload(response)) as { ok?: boolean; summaries?: Record<string, string> };
  if (!response.ok || payload.ok !== true) return {};
  return payload.summaries ?? {};
}

export async function getMyFavoritePositions() {
  const result = await authedJsonFetch<PublicPositionListItem>("/members/me/positions/favorites", {
    method: "GET"
  });
  return result.items ?? [];
}

export async function getMyAppliedPositions() {
  const result = await authedJsonFetch<PublicPositionListItem>("/members/me/positions/applied", {
    method: "GET"
  });
  return result.items ?? [];
}

export type MyApplication = {
  id: string;
  positionId: string;
  positionTitle: string;
  positionStatus: string;
  partnerOrganizationId: string | null;
  partnerOrganizationName: string | null;
  status: "SUBMITTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submittedAt: string;
  updatedAt: string;
  // 면접 일정 — 확정된 슬롯 시각(있으면) + 아직 선택 대기 중인지
  interviewSelectedAt: string | null;
  interviewSelectedEndsAt: string | null;
  interviewLocation: string | null;
  interviewPending: boolean;
  // 회사가 보낸 안 읽은 메시지 수(문의 뱃지용)
  unreadMessages: number;
};

export async function getMyApplications() {
  const result = await authedJsonFetch<MyApplication>("/members/me/applications", {
    method: "GET"
  });
  return (result.items ?? []) as MyApplication[];
}

// '나에게 관심을 준 회사' — 파트너가 나를 관심 목록에 담으면 여기서 보인다.
export type InterestedCompany = {
  organizationId: string;
  slug: string;
  name: string;
  industry: string;
  companySize: string | null;
  website: string | null;
  summary: string | null;
  logo: string | null;
  interestedAt: string;
};
export async function getInterestedCompanies(): Promise<InterestedCompany[]> {
  const result = (await authedJsonFetch<unknown>("/members/me/interested-companies", { method: "GET" })) as { items?: InterestedCompany[] };
  return Array.isArray(result?.items) ? result.items : [];
}

// 지원 이후 여정 — 진행 내역(상태 변경 + 면접 슬롯 이벤트) 시간순.
export type ApplicationTimelineEvent = { at: string; code: string };
export async function getApplicationTimeline(applicationId: string): Promise<ApplicationTimelineEvent[]> {
  const result = await authedJsonFetch<ApplicationTimelineEvent>(`/members/me/applications/${encodeURIComponent(applicationId)}/timeline`, {
    method: "GET"
  });
  return (result.items ?? []) as ApplicationTimelineEvent[];
}

export async function withdrawMyApplication(applicationId: string) {
  return authedJsonFetch<{ id: string; status: string }>(`/members/me/applications/${encodeURIComponent(applicationId)}/withdraw`, {
    method: "POST"
  });
}

// 서버 알림 — 지원 상태·면접·회사 메시지·새 포지션 등 실제 알림.
export type ServerNotification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  linkPath: string | null;
  applicationId: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function getMyNotifications(limit = 30): Promise<{ items: ServerNotification[]; unreadCount: number }> {
  const result = await authedJsonFetch<ServerNotification>(`/members/me/notifications?limit=${limit}`, { method: "GET" });
  return { items: (result.items ?? []) as ServerNotification[], unreadCount: (result as { unreadCount?: number }).unreadCount ?? 0 };
}

export async function markServerNotificationRead(id: string) {
  return authedJsonFetch<unknown>(`/members/me/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}
export async function markAllServerNotificationsRead() {
  return authedJsonFetch<unknown>("/members/me/notifications/read-all", { method: "PATCH" });
}

// 관심 회사(팔로우) — 이름 기반. 서버 CandidateProfile.followedCompanyNames.
export async function getMyFollowedCompanies(): Promise<string[]> {
  const result = await authedJsonFetch<never>("/members/me/followed-companies", { method: "GET" });
  return (result as { names?: string[] }).names ?? [];
}

export async function followCompany(name: string): Promise<string[]> {
  const result = await authedJsonFetch<never>("/members/me/followed-companies", { method: "POST", body: JSON.stringify({ name }) });
  return (result as { names?: string[] }).names ?? [];
}

// 파트너 → 지원자 메시지(지원 건별 스레드). 지원자에게 보이는 CANDIDATE 공개로 저장한다.
export type PartnerApplicantMessage = {
  id: string;
  content: string;
  authorRole: "STUDENT" | "PARTNER" | "OPERATOR";
  visibility: "INTERNAL" | "CANDIDATE";
  createdAt: string;
};

export async function getPartnerApplicantMessages(applicationId: string): Promise<PartnerApplicantMessage[]> {
  const result = await authedJsonFetch<PartnerApplicantMessage>(`/applications/${encodeURIComponent(applicationId)}/comments`, { method: "GET" });
  return (result.items ?? []) as PartnerApplicantMessage[];
}

export async function sendPartnerApplicantMessage(applicationId: string, content: string) {
  return authedJsonFetch<PartnerApplicantMessage>(`/applications/${encodeURIComponent(applicationId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: content.trim(), visibility: "CANDIDATE" })
  });
}

// 파트너 → 면접 시간 제안(최대 5개 슬롯). 지원자가 그중 하나를 선택해 확정한다.
export async function proposeInterviewSlots(applicationId: string, slots: { startsAt: string; endsAt: string; location?: string }[]) {
  return authedJsonFetch<InterviewSlot>(`/applications/${encodeURIComponent(applicationId)}/interview-slots`, {
    method: "POST",
    body: JSON.stringify({ slots })
  });
}

export async function unfollowCompany(name: string): Promise<string[]> {
  const result = await authedJsonFetch<never>(`/members/me/followed-companies?name=${encodeURIComponent(name)}`, { method: "DELETE" });
  return (result as { names?: string[] }).names ?? [];
}

// 지원자 ↔ 회사 메시지(쪽지) — 지원 건별 스레드. 백엔드는 ApplicationComment(visibility=CANDIDATE)를
// 재사용하며, 학생은 CANDIDATE 메시지만 보고, 학생이 보내면 자동으로 CANDIDATE 로 저장된다.
export type ApplicationMessage = {
  id: string;
  content: string;
  authorRole: "STUDENT" | "PARTNER" | "OPERATOR";
  createdAt: string;
  author?: { id: string; name: string | null; email: string; role: string } | null;
};

export async function getApplicationMessages(applicationId: string) {
  const result = await authedJsonFetch<ApplicationMessage>(`/applications/${encodeURIComponent(applicationId)}/comments`, {
    method: "GET"
  });
  return (result.items ?? []) as ApplicationMessage[];
}

export async function sendApplicationMessage(applicationId: string, content: string) {
  return authedJsonFetch<ApplicationMessage>(`/applications/${encodeURIComponent(applicationId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: content.trim() })
  });
}

export type InterviewSlot = {
  id: string;
  applicationId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: "PROPOSED" | "SELECTED" | "CANCELLED";
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
};

export async function getInterviewSlotsForApplication(applicationId: string) {
  const result = await authedJsonFetch<InterviewSlot>(`/applications/${encodeURIComponent(applicationId)}/interview-slots`, {
    method: "GET"
  });
  return (result.items ?? []) as InterviewSlot[];
}

export async function selectInterviewSlot(slotId: string) {
  return authedJsonFetch<InterviewSlot>(`/interview-slots/${encodeURIComponent(slotId)}/select`, {
    method: "PATCH"
  });
}

export type MyAssignment = {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
  assignedAt: string;
  submittedAt: string | null;
  submissionContent: string | null;
  submissionLinks: string[];
  feedbackContent: string | null;
  feedbackRating: number | null;
  reviewedAt: string | null;
  positionId: string;
  positionTitle: string;
  partnerOrganizationName: string | null;
  assignedByName: string | null;
};

export async function getMyAssignments() {
  const result = await authedJsonFetch<MyAssignment>("/members/me/assignments", {
    method: "GET"
  });
  return (result.items ?? []) as MyAssignment[];
}

export async function submitAssignment(assignmentId: string, payload: { submissionContent: string; submissionLinks?: string[] }) {
  return authedJsonFetch<MyAssignment>(`/assignments/${encodeURIComponent(assignmentId)}/submit`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export type MyProgram = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  application: { id: string; position: { id: string; title: string; partnerOrganization: { id: string; name: string } | null } };
  meetings: Array<{ id: string; scheduledAt: string; status: string }>;
  certificate: { id: string } | null;
  recommendation: { id: string } | null;
  schoolCreditRequest: { id: string; status: string } | null;
};
export async function getMyPrograms(): Promise<MyProgram[]> {
  const result = await authedJsonFetch<MyProgram>("/members/me/programs", { method: "GET" });
  return (result.items ?? []) as MyProgram[];
}

export async function addMyFavoritePosition(positionId: string) {
  const result = await authedJsonFetch<unknown>(`/members/me/positions/${encodeURIComponent(positionId)}/favorite`, {
    method: "POST"
  });
  trackPositionFavorite(positionId, "unknown", true);
  return result;
}

export async function removeMyFavoritePosition(positionId: string) {
  const result = await authedJsonFetch<unknown>(`/members/me/positions/${encodeURIComponent(positionId)}/favorite`, {
    method: "DELETE"
  });
  trackPositionFavorite(positionId, "unknown", false);
  return result;
}

export async function applyMyPosition(positionId: string, resumeId?: string, coverLetterId?: string) {
  const body: Record<string, string> = {};
  if (resumeId) body.resumeId = resumeId;
  if (coverLetterId) body.coverLetterId = coverLetterId;
  const result = await authedJsonFetch<unknown>(`/members/me/positions/${encodeURIComponent(positionId)}/apply`, {
    method: "POST",
    ...(Object.keys(body).length ? { body: JSON.stringify(body) } : {})
  });
  trackPositionApply(positionId, "unknown");
  return result;
}

// 회사 소개 AI 다듬기 — 초안을 매끄러운 소개문으로(없는 사실은 지어내지 않음).
export async function aiPolishCompanyDescription(input: { text: string; name?: string; industry?: string; locale?: string }): Promise<string> {
  const result = await authedJsonFetch<never>("/partner/company/ai-polish-description", { method: "POST", body: JSON.stringify(input) });
  const r = result as unknown as { description?: string };
  return r.description ?? "";
}

// 채용 공고 AI 초안 — 제목·직무로 주요 업무/자격 요건/우대 사항 초안 생성.
export type PositionDraft = { mainResponsibilities: string; requiredQualifications: string; preferredQualifications: string };
export async function aiDraftPositionContent(input: { title: string; jobRole?: string; employmentType?: string; companyName?: string; locale?: string }): Promise<PositionDraft> {
  const result = await authedJsonFetch<never>("/partner/positions/ai-draft", { method: "POST", body: JSON.stringify(input) });
  const r = result as unknown as { draft?: Partial<PositionDraft> };
  return {
    mainResponsibilities: r.draft?.mainResponsibilities ?? "",
    requiredQualifications: r.draft?.requiredQualifications ?? "",
    preferredQualifications: r.draft?.preferredQualifications ?? ""
  };
}

export async function getMyPartnerPositions() {
  const result = await authedJsonFetch<PartnerPosition>("/partner/positions", {
    method: "GET"
  });
  return result.items ?? [];
}

export async function createMyPartnerPosition(input: {
  title: string;
  status?: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
  workType?: "On-site" | "Hybrid" | "Remote";
  employmentType?: "FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN";
  employmentClassification?:
    | "UNPAID_INTERN_EXPERIENCE"
    | "UNPAID_INTERN_CONVERSION"
    | "PAID_INTERN_EXPERIENCE"
    | "PAID_INTERN_CONVERSION"
    | "PART_TIME"
    | "FULL_TIME";
  thumbnailImages?: string[];
  eligibleVisas?: string[];
  preferredNationalities?: string[];
  communicationLanguages?: string[];
  hiringProcess?: string;
  preferredJobRole?: string;
  hiringCount?: number;
  workingHours?: string;
  workLocation?: string;
  startDate?: string | null;
  mainResponsibilities?: string;
  requiredQualifications?: string;
  preferredQualifications?: string;
  dressCode?: string;
  wantsPreTraining?: boolean;
  additionalNotes?: string;
}) {
  const result = await authedJsonFetch<PartnerPosition>("/partner/positions", {
    method: "POST",
    body: JSON.stringify(input)
  });

  if (!result.item) {
    throw new Error("응답에 생성된 포지션이 없습니다.");
  }
  return result.item;
}

export async function createMyPartnerOrganizationJoinCode(expiresInMinutes?: number) {
  const result = await authedJsonFetch<{ code: string; expiresAt: string }>("/members/me/partner-organization/join-codes", {
    method: "POST",
    body: JSON.stringify(expiresInMinutes ? { expiresInMinutes } : {})
  });
  if (!result.item) throw new Error("응답에 초대코드 정보가 없습니다.");
  return result.item;
}

export type PartnerOrgMember = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  emailVerified: boolean;
  isActive: boolean;
  isMe: boolean;
};

export async function getMyPartnerOrganizationMembers(): Promise<PartnerOrgMember[]> {
  const result = await authedJsonFetch<PartnerOrgMember>("/members/me/partner-organization/members", { method: "GET" });
  return (result.items ?? []) as PartnerOrgMember[];
}

export async function updatePartnerOrgMemberRole(userId: string, role: "ADMIN" | "MEMBER") {
  await authedJsonFetch<never>(`/members/me/partner-organization/members/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export async function removePartnerOrgMember(userId: string) {
  await authedJsonFetch<never>(`/members/me/partner-organization/members/${encodeURIComponent(userId)}`, {
    method: "DELETE"
  });
}

export async function joinMyPartnerOrganizationByCode(code: string) {
  const result = await authedJsonFetch<MyPartnerOrganization | null>("/members/me/partner-organization/join", {
    method: "POST",
    body: JSON.stringify({ code })
  });
  return result.item ?? null;
}

// ─── 고객센터 문의 (푸터) — 기업 상담 엔드포인트 재사용 → Discord 웹훅 알림 ─────
export async function submitContactInquiry(input: {
  type: "general" | "business";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const typeLabel = input.type === "business" ? "기업 문의" : "일반 문의";
  const companyName =
    input.type === "business"
      ? input.company?.trim() || "-"
      : input.company?.trim() || "개인 문의";
  const phone = input.phone?.trim();
  const response = await fetch(`${getApiBaseUrl()}/company-consultations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName,
      contactName: input.name.trim(),
      email: input.email.trim(),
      ...(phone ? { phone } : {}),
      message: `[${typeLabel}]\n${input.message.trim()}`,
      source: "footer-contact"
    })
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.ok && payload?.ok === true) return { ok: true };
  return { ok: false, message: typeof payload?.message === "string" ? payload.message : "문의 전송에 실패했어요. 잠시 후 다시 시도해 주세요." };
}

// ─── 이메일 팀원 초대 ───────────────────────────────────────────────
export type PartnerTeamInvite = {
  id: string;
  email: string;
  partnerOrgRole: "OWNER" | "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
  expired: boolean;
};

export type PartnerTeamInviteLookup = {
  email: string;
  orgName: string;
  inviterName: string | null;
  partnerOrgRole: "OWNER" | "ADMIN" | "MEMBER";
  accountExists: boolean;
};

export async function getPartnerTeamInvites(): Promise<PartnerTeamInvite[]> {
  const result = await authedJsonFetch<PartnerTeamInvite>("/partner/team/invites", { method: "GET" });
  return (result.items ?? []) as PartnerTeamInvite[];
}

export async function invitePartnerTeamMember(email: string, partnerOrgRole: "ADMIN" | "MEMBER") {
  const result = await authedJsonFetch<PartnerTeamInvite>("/partner/team/invites", {
    method: "POST",
    body: JSON.stringify({ email, partnerOrgRole })
  });
  return (result.item ?? null) as PartnerTeamInvite | null;
}

export async function revokePartnerTeamInvite(id: string) {
  await authedJsonFetch<never>(`/partner/team/invites/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// 초대 수락(로그인한 기존 계정). 실패 시 MemberProfileApiError(.code: EMAIL_MISMATCH 등)를 던진다.
export async function acceptPartnerTeamInvite(token: string) {
  return authedJsonFetch<never>("/partner/team/invites/accept", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

// 초대 미리보기 (공개) — 수락 페이지 진입 시 회사·이메일·계정 존재 여부 조회.
export async function lookupPartnerTeamInvite(
  token: string
): Promise<{ ok: true; data: PartnerTeamInviteLookup } | { ok: false; reason: string }> {
  const response = await fetch(`${getApiBaseUrl()}/partner/team/invites/lookup?token=${encodeURIComponent(token)}`, { method: "GET" });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.ok && payload?.ok === true) {
    return {
      ok: true,
      data: {
        email: String(payload.email ?? ""),
        orgName: String(payload.orgName ?? "회사"),
        inviterName: (payload.inviterName as string | null) ?? null,
        partnerOrgRole: (payload.partnerOrgRole as PartnerTeamInviteLookup["partnerOrgRole"]) ?? "MEMBER",
        accountExists: Boolean(payload.accountExists)
      }
    };
  }
  return { ok: false, reason: typeof payload?.reason === "string" ? payload.reason : "invalid" };
}

// 초대 링크에서 신규 계정 생성 후 합류 (공개) — 성공 시 액세스 토큰을 저장한다.
export async function registerFromPartnerTeamInvite(
  token: string,
  name: string,
  password: string
): Promise<{ ok: true } | { ok: false; message: string; code?: string }> {
  const response = await fetch(`${getApiBaseUrl()}/partner/team/invites/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, name: name.trim() || undefined, password })
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.ok && payload?.ok === true && typeof payload.token === "string") {
    storeAccessToken(payload.token);
    return { ok: true };
  }
  return {
    ok: false,
    message: typeof payload?.message === "string" ? payload.message : "가입에 실패했어요.",
    code: typeof payload?.code === "string" ? payload.code : undefined
  };
}

export async function getMyPartnerPositionById(id: string) {
  const result = await authedJsonFetch<PartnerPosition>(`/partner/positions/${encodeURIComponent(id)}`, {
    method: "GET"
  });

  if (!result.item) {
    throw new Error("응답에 포지션 정보가 없습니다.");
  }
  return result.item;
}

export async function updateMyPartnerPosition(
  id: string,
  input: {
    title?: string;
    status?: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
    workType?: "On-site" | "Hybrid" | "Remote";
    employmentType?: "FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN";
    employmentClassification?:
      | "UNPAID_INTERN_EXPERIENCE"
      | "UNPAID_INTERN_CONVERSION"
      | "PAID_INTERN_EXPERIENCE"
      | "PAID_INTERN_CONVERSION"
      | "PART_TIME"
      | "FULL_TIME";
    thumbnailImages?: string[];
    eligibleVisas?: string[];
    preferredNationalities?: string[];
    communicationLanguages?: string[];
    hiringProcess?: string;
    preferredJobRole?: string;
    hiringCount?: number;
    workingHours?: string;
    workLocation?: string;
    startDate?: string | null;
    mainResponsibilities?: string;
    requiredQualifications?: string;
    preferredQualifications?: string;
    dressCode?: string;
    wantsPreTraining?: boolean;
    additionalNotes?: string;
    mockInterviewIntent?: string | null;
    mockInterviewQuestions?: string[];
  }
) {
  const result = await authedJsonFetch<PartnerPosition>(`/partner/positions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });

  if (!result.item) {
    throw new Error("응답에 수정된 포지션 정보가 없습니다.");
  }
  return result.item;
}

export async function deleteMyPartnerPosition(id: string) {
  await authedJsonFetch<unknown>(`/partner/positions/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export type PartnerApplicantStatus =
  | "APPLIED"
  | "REVIEWING"
  | "INTERVIEW"
  | "OFFERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "COMPLETED";

export type PartnerApplicantListItem = {
  id: string;
  name: string | null; // 블라인드 — 면접 단계 전에는 null(이름 비공개)
  nationality: string | null;
  email: string | null;
  contactUnlocked?: boolean;
  positionId: string;
  positionTitle: string;
  languages: string[];
  school: string | null;
  major: string | null;
  residence: string | null;
  appliedAt: string | null;
  recommendation: "HIGH" | "NORMAL" | "CHECK";
  status: PartnerApplicantStatus;
  resumeTitle?: string | null;
  resumeShareSlug?: string | null;
  coverLetterTitle?: string | null;
  coverLetterShareSlug?: string | null;
  mockInterviewPracticed?: boolean;
  mockInterviewScore?: number | null;
  interviewSlotSelected?: boolean;
  applicationId?: string | null;
};

export type PartnerApplicantDetail = PartnerApplicantListItem & {
  summary: string | null;
  motivation: string | null;
  portfolioUrl: string | null;
  availableStartDate: string | null;
  memo: string | null;
  // 지원 건별 실제 Application.id — 메시지·면접 슬롯 API에서 사용(없을 수 있음).
  applicationId: string | null;
  // 리뉴얼 이력서/자소서 미리보기용(대표 이력서 content 의 renewal* 키). 없으면 null.
  resumeDoc?: unknown;
  resumeBasicInfo?: unknown;
  coverDoc?: unknown;
  // 모의 면접 결과·답변(연습했으면).
  mockInterview?: MockInterviewResult | null;
};

export type PartnerPendingMessage = {
  applicantId: string;
  applicationId: string;
  name: string;
  positionTitle: string;
  lastMessage: string;
  lastMessageAt: string;
};

// 답장을 기다리는 지원자 메시지(스레드 마지막이 지원자 발신).
export async function getPartnerPendingMessages(): Promise<PartnerPendingMessage[]> {
  const result = await authedJsonFetch<PartnerPendingMessage>("/partner/pending-messages", { method: "GET" });
  return (result.items ?? []) as PartnerPendingMessage[];
}

// AI 모의 면접 — 질문 생성 / 답변 피드백(둘 다 STUDENT + AI 지갑).
export type InterviewQuestion = { question: string; intent: string; category: string };
export async function aiInterviewQuestions(input: { resumeText: string; jobText?: string; coverLetterText?: string; desiredJobRole?: string; askedQuestions?: string[]; count?: number; category?: string; locale?: string }): Promise<InterviewQuestion[]> {
  const result = await authedJsonFetch<never>("/members/me/ai/interview-questions", { method: "POST", body: JSON.stringify(input) });
  const r = result as unknown as { questions?: InterviewQuestion[] };
  return Array.isArray(r.questions) ? r.questions : [];
}

export type InterviewFeedback = { score: number; strengths: string[]; improvements: string[]; sampleAnswer: string };
export async function aiInterviewFeedback(input: { question: string; answer: string; resumeText?: string; desiredJobRole?: string; locale?: string }): Promise<InterviewFeedback> {
  const result = await authedJsonFetch<never>("/members/me/ai/interview-feedback", { method: "POST", body: JSON.stringify(input) });
  const r = result as unknown as { feedback?: InterviewFeedback };
  return r.feedback ?? { score: 0, strengths: [], improvements: [], sampleAnswer: "" };
}

// 모의 면접 연습 기록(문항별 답변·점수 저장 → 회사에 결과 노출).
export async function recordMockInterviewPractice(positionId: string, data: { question?: string; answer?: string; score?: number }): Promise<void> {
  await authedJsonFetch<never>(`/members/me/mock-interviews/${encodeURIComponent(positionId)}/practice`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export type MockInterviewAnswer = { question: string; answer: string; score: number | null };
export type MockInterviewResult = { score: number | null; answeredCount: number; answers: MockInterviewAnswer[] };

// 공고 모의 면접 참여자(회사용) + 제안.
export type MockInterviewParticipant = {
  userId: string;
  name: string;
  nationality: string | null;
  bestScore: number | null;
  answeredCount: number;
  lastPracticedAt: string;
  applied: boolean;
  connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
};
export async function getPositionMockInterviewParticipants(positionId: string): Promise<MockInterviewParticipant[]> {
  const result = await authedJsonFetch<MockInterviewParticipant>(`/partner/positions/${encodeURIComponent(positionId)}/mock-interview-participants`, { method: "GET" });
  return (result.items ?? []) as MockInterviewParticipant[];
}
// 조직 전체 모의 면접 참여자(인재별 최고 점수 공고). positionId/positionTitle 포함 → 바로 제안 가능.
export type OrgMockInterviewParticipant = MockInterviewParticipant & { positionId: string; positionTitle: string };
export async function getOrgMockInterviewParticipants(): Promise<OrgMockInterviewParticipant[]> {
  const result = await authedJsonFetch<OrgMockInterviewParticipant>(`/partner/mock-interview-participants`, { method: "GET" });
  return (result.items ?? []) as OrgMockInterviewParticipant[];
}
export type MockInterviewParticipantDetail = {
  userId: string;
  name: string;
  nationality: string | null;
  positionId: string;
  positionTitle: string;
  bestScore: number | null;
  answeredCount: number;
  lastPracticedAt: string;
  applied: boolean;
  connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  answers: Array<{ question: string; answer: string; score: number | null }>;
  resumeDoc: unknown;
  resumeBasicInfo: unknown;
  coverDoc: unknown;
  resumeTitle: string | null;
  resumeShareSlug: string | null;
  coverLetterTitle: string | null;
  coverLetterShareSlug: string | null;
};
export async function getMockInterviewParticipantDetail(positionId: string, userId: string): Promise<MockInterviewParticipantDetail> {
  const result = await authedJsonFetch<MockInterviewParticipantDetail>(`/partner/positions/${encodeURIComponent(positionId)}/mock-interview-participants/${encodeURIComponent(userId)}`, { method: "GET" });
  if (!result.item) throw new Error("응답에 참여자 정보가 없습니다.");
  return result.item;
}

// 인재 검색(인재풀) — aply에 이력서를 등록하고 인재풀 공개에 동의한 사람.
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
  languages: string[];
  careerCount: number;
  activityCount: number;
  summary: string | null;
  updatedAt: string;
  connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  contactUnlocked: boolean;
  resumeBullets?: string[];
  coverBullets?: string[];
  score?: number;
  reason?: string;
  interestCount?: number; // 관심(저장)한 회사 수 — 핫한 인재 뱃지
  // Talent Passport — Career Launch 검증(Readiness·Verified 등급).
  passport?: { readiness: number; tier: "preparing" | "bronze" | "silver" | "gold"; verified: boolean };
};
export async function getPartnerCandidates(params: { q?: string; skill?: string; jobRole?: string; language?: string; page?: number; verifiedOnly?: boolean; minReadiness?: number } = {}): Promise<{ items: PartnerCandidateCard[]; total: number; page: number; pageSize: number }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.skill) qs.set("skill", params.skill);
  if (params.jobRole) qs.set("jobRole", params.jobRole);
  if (params.language) qs.set("language", params.language);
  if (params.verifiedOnly) qs.set("verifiedOnly", "true");
  if (params.minReadiness) qs.set("minReadiness", String(params.minReadiness));
  if (params.page) qs.set("page", String(params.page));
  // 옵셔널 인증 — 비회원(게스트)도 마스킹된 인재 카드를 볼 수 있다(authenticateOptional).
  // 토큰이 있으면 보내고, 없거나 만료면 서버가 게스트로 폴백한다.
  const response = await fetch(`${getApiBaseUrl()}/partner/candidates${qs.toString() ? `?${qs.toString()}` : ""}`, {
    method: "GET",
    headers: withOptionalBearerHeader()
  });
  const payload = (await readApiPayload(response)) as { ok?: boolean; message?: string; items?: PartnerCandidateCard[]; total?: number; page?: number; pageSize?: number };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "인재 목록을 불러오지 못했습니다."));
  }
  return { items: (payload.items ?? []) as PartnerCandidateCard[], total: payload.total ?? 0, page: payload.page ?? 1, pageSize: payload.pageSize ?? 20 };
}
// 관심 인재 shortlist — 저장/해제/목록.
export async function getSavedCandidates(): Promise<PartnerCandidateCard[]> {
  const result = await authedJsonFetch<PartnerCandidateCard>("/partner/saved-candidates", { method: "GET" });
  return ((result as { items?: PartnerCandidateCard[] }).items ?? []) as PartnerCandidateCard[];
}
export async function saveCandidate(candidateUserId: string) {
  return authedJsonFetch<unknown>(`/partner/saved-candidates/${encodeURIComponent(candidateUserId)}`, { method: "POST" });
}
export async function unsaveCandidate(candidateUserId: string) {
  return authedJsonFetch<unknown>(`/partner/saved-candidates/${encodeURIComponent(candidateUserId)}`, { method: "DELETE" });
}

export async function searchPartnerCandidatesAI(query: string): Promise<{ items: PartnerCandidateCard[]; ai: boolean }> {
  // 옵셔널 인증 — 게스트도 마스킹된 검색 결과 열람 가능(authenticateOptional).
  const response = await fetch(`${getApiBaseUrl()}/partner/candidates/search`, {
    method: "POST",
    headers: withOptionalBearerHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query })
  });
  const payload = (await readApiPayload(response)) as { ok?: boolean; message?: string; items?: PartnerCandidateCard[]; ai?: boolean };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "검색에 실패했습니다."));
  }
  return { items: (payload.items ?? []) as PartnerCandidateCard[], ai: Boolean(payload.ai) };
}

export type PartnerCandidateDetail = {
  candidateUserId: string;
  name: string | null;
  nationality: string | null;
  contact: { email: string | null; phone: string | null } | null;
  content: Record<string, unknown>;
  coverLetter: { title: string | null; company: string | null; items: Array<{ prompt: string; answer: string }> } | null;
  updatedAt: string;
  connectionStatus: ConnectionPipelineStatus | null;
  connectionId: string | null;
  contactUnlocked: boolean;
};
// 인터뷰 파이프라인 — 수락 이후 파트너가 진행하는 단계까지 포함.
export type ConnectionPipelineStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "SCHEDULED" | "COMPLETED" | "PASSED" | "REJECTED";
export async function getPartnerCandidate(candidateUserId: string): Promise<PartnerCandidateDetail> {
  const result = await authedJsonFetch<PartnerCandidateDetail>(`/partner/candidates/${encodeURIComponent(candidateUserId)}`, { method: "GET" });
  if (!result.item) throw new Error("후보 정보를 불러오지 못했어요.");
  return result.item;
}
// 파트너: 인터뷰 파이프라인 진행(SCHEDULED→COMPLETED→PASSED/REJECTED).
export async function advanceConnectionStatus(connectionId: string, status: "SCHEDULED" | "COMPLETED" | "PASSED" | "REJECTED"): Promise<void> {
  await authedJsonFetch<never>(`/partner/connections/${encodeURIComponent(connectionId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
export async function connectPartnerCandidate(candidateUserId: string, message?: string): Promise<void> {
  await authedJsonFetch<never>(`/partner/candidates/${encodeURIComponent(candidateUserId)}/connect`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {})
  });
}
export async function getPartnerCandidateDocumentSummary(candidateUserId: string): Promise<{ resumeBullets: string[]; coverBullets: string[] }> {
  const result = await authedJsonFetch<never>(`/partner/candidates/${encodeURIComponent(candidateUserId)}/document-summary`, { method: "GET" });
  const r = result as unknown as { resumeBullets?: string[]; coverBullets?: string[] };
  return { resumeBullets: r.resumeBullets ?? [], coverBullets: r.coverBullets ?? [] };
}
export async function proposeToMockInterviewCandidate(positionId: string, userId: string, input: { message?: string; interviewAt?: string }): Promise<void> {
  await authedJsonFetch<never>(`/partner/positions/${encodeURIComponent(positionId)}/mock-interview-candidates/${encodeURIComponent(userId)}/propose`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export type MockInterviewRecord = {
  positionId: string;
  positionTitle: string;
  companyName: string | null;
  answeredCount: number;
  bestScore: number | null;
  lastPracticedAt: string;
};
export async function getMyMockInterviews(): Promise<MockInterviewRecord[]> {
  const result = await authedJsonFetch<MockInterviewRecord>("/members/me/mock-interviews", { method: "GET" });
  return (result.items ?? []) as MockInterviewRecord[];
}

export async function getMyPartnerApplicants() {
  const result = await authedJsonFetch<PartnerApplicantListItem>("/partner/applicants", {
    method: "GET"
  });
  return result.items ?? [];
}

// 지원자 이력서·자소서의 LLM 불렛 요약(서버 캐시).
export async function getPartnerApplicantDocumentSummary(id: string): Promise<{ resumeBullets: string[]; coverBullets: string[] }> {
  const result = await authedJsonFetch<never>(`/partner/applicants/${encodeURIComponent(id)}/document-summary`, { method: "GET" });
  const r = result as unknown as { resumeBullets?: string[]; coverBullets?: string[] };
  return { resumeBullets: r.resumeBullets ?? [], coverBullets: r.coverBullets ?? [] };
}

export async function getMyPartnerApplicantById(id: string) {
  const result = await authedJsonFetch<PartnerApplicantDetail>(`/partner/applicants/${encodeURIComponent(id)}`, {
    method: "GET"
  });
  if (!result.item) throw new Error("응답에 지원자 정보가 없습니다.");
  return result.item;
}

export async function updateMyPartnerApplicantState(
  id: string,
  input: { status?: PartnerApplicantStatus; memo?: string | null }
) {
  const result = await authedJsonFetch<PartnerApplicantDetail>(`/partner/applicants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 수정된 지원자 정보가 없습니다.");
  return result.item;
}

export async function updateMyBasicInfo(input: {
  realName?: string | null;
  name?: string;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  profileImageData?: string | null;
}) {
  const result = await authedJsonFetch<{
    id: string;
    email: string;
    realName?: string | null;
    name?: string | null;
    phoneNumber?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    role: "STUDENT" | "PARTNER" | "OPERATOR";
    profileImageUrl?: string | null;
    partnerType?: "UNIVERSITY" | "COMPANY" | "AGENCY" | null;
  }>("/members/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });

  if (!result.item) {
    throw new Error("응답에 회원 정보가 없습니다.");
  }
  return result.item;
}

export async function updateMyCandidateProfile(input: {
  visaType?: CandidateVisaType | null;
  residenceProvince?: string | null;
  programStartOption?: "ASAP" | "SPECIFIC_DATE" | null;
  programStartDate?: string | null;
  preferenceConditionNote?: string | null;
  skills?: string[];
  selfIntroduction?: string | null;
  programMotivation?: string | null;
  additionalInfoNote?: string | null;
}) {
  const result = await authedJsonFetch<MyCandidateProfile>("/members/me/profile", {
    method: "PATCH",
    body: JSON.stringify(input)
  });

  if (!result.item) {
    throw new Error("응답에 후보자 프로필이 없습니다.");
  }
  return result.item;
}

export type CareerReadinessReport = {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendedRoles: string[];
  generatedAt: string;
};

export async function fetchCareerReadinessReport(locale?: "ko" | "en" | "zh-CN" | "vi" | "ja" | "id") {
  trackAiAnalysisStart();
  const result = await authedJsonFetch<CareerReadinessReport>("/members/me/career-readiness", {
    method: "POST",
    body: JSON.stringify(locale ? { locale } : {})
  });
  if (!result.item) {
    throw new Error("응답에 리포트가 없습니다.");
  }
  trackAiAnalysisCompleted(result.item.score);
  return result.item;
}

export async function createMyEducation(input: {
  schoolName: string;
  educationType: CandidateEducationType;
  major?: string | null;
  status: CandidateEducationStatus;
  country?: string | null;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isKoreanSchool?: boolean | null;
}) {
  const result = await authedJsonFetch<CandidateEducation>("/members/me/educations", {
    method: "POST",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 학력 정보가 없습니다.");
  return result.item;
}

export async function updateMyEducation(
  educationId: string,
  input: {
    schoolName: string;
    educationType: CandidateEducationType;
    major?: string | null;
    status: CandidateEducationStatus;
    country?: string | null;
    city?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    isKoreanSchool?: boolean | null;
  }
) {
  const result = await authedJsonFetch<CandidateEducation>(`/members/me/educations/${encodeURIComponent(educationId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 수정된 학력 정보가 없습니다.");
  return result.item;
}

export async function deleteMyEducation(educationId: string) {
  return authedJsonFetch<unknown>(`/members/me/educations/${encodeURIComponent(educationId)}`, { method: "DELETE" });
}

export async function createMyLanguageSkill(input: {
  language: CandidateLanguageType;
  level: CandidateLanguageLevel;
  testName?: string | null;
  score?: string | null;
}) {
  const result = await authedJsonFetch<CandidateLanguageSkill>("/members/me/language-skills", {
    method: "POST",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 언어 능력 정보가 없습니다.");
  return result.item;
}

export async function updateMyLanguageSkill(
  languageSkillId: string,
  input: {
    language: CandidateLanguageType;
    level: CandidateLanguageLevel;
    testName?: string | null;
    score?: string | null;
  }
) {
  const result = await authedJsonFetch<CandidateLanguageSkill>(
    `/members/me/language-skills/${encodeURIComponent(languageSkillId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
  if (!result.item) throw new Error("응답에 수정된 언어 능력 정보가 없습니다.");
  return result.item;
}

export async function deleteMyLanguageSkill(languageSkillId: string) {
  return authedJsonFetch<unknown>(`/members/me/language-skills/${encodeURIComponent(languageSkillId)}`, { method: "DELETE" });
}

export async function createMyCareer(input: {
  companyName: string;
  position: string;
  department?: string | null;
  isCurrent?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}) {
  const result = await authedJsonFetch<CandidateCareer>("/members/me/careers", {
    method: "POST",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 경력 정보가 없습니다.");
  return result.item;
}

export async function updateMyCareer(
  careerId: string,
  input: {
    companyName: string;
    position: string;
    department?: string | null;
    isCurrent?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
  }
) {
  const result = await authedJsonFetch<CandidateCareer>(`/members/me/careers/${encodeURIComponent(careerId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 수정된 경력 정보가 없습니다.");
  return result.item;
}

export async function deleteMyCareer(careerId: string) {
  return authedJsonFetch<unknown>(`/members/me/careers/${encodeURIComponent(careerId)}`, { method: "DELETE" });
}

export async function createMyActivityExperience(input: {
  title: string;
  activityType: CandidateActivityType;
  organization?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  skills?: string[];
}) {
  const result = await authedJsonFetch<CandidateActivityExperience>("/members/me/activity-experiences", {
    method: "POST",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 활동 경험 정보가 없습니다.");
  return result.item;
}

export async function updateMyActivityExperience(
  activityExperienceId: string,
  input: {
    title: string;
    activityType: CandidateActivityType;
    organization?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
    skills?: string[];
  }
) {
  const result = await authedJsonFetch<CandidateActivityExperience>(
    `/members/me/activity-experiences/${encodeURIComponent(activityExperienceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
  if (!result.item) throw new Error("응답에 수정된 활동 경험 정보가 없습니다.");
  return result.item;
}

export async function deleteMyActivityExperience(activityExperienceId: string) {
  return authedJsonFetch<unknown>(`/members/me/activity-experiences/${encodeURIComponent(activityExperienceId)}`, { method: "DELETE" });
}

// ---- Resumes (multiple Korean-style resume versions) -------------------
// 기간(`startDate`/`endDate`)은 자유 입력 문자열 — `YYYY-MM`(month input)을
// 기본으로 받지만 "재직중", "Present", "2024-03~" 같은 표현도 그대로 저장.
// 표시 단계에서 빈 값/특수 값을 적절히 처리합니다.
export type ResumeEducationEntry = {
  schoolName?: string;
  educationType?: CandidateEducationType;
  major?: string;
  status?: CandidateEducationStatus;
  startDate?: string;
  endDate?: string;
};
export type ResumeCareerEntry = {
  companyName?: string;
  position?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};
export type ResumeActivityEntry = {
  title?: string;
  organization?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};
export type ResumeLanguageEntry = { language?: string; level?: string };
export type ResumeCertificationEntry = { name?: string; issuer?: string; date?: string };
export type ResumeLinkEntry = { label?: string; url?: string };

// 한국형 자기소개서 문항 1개 — 문항(prompt)과 작성한 답변(answer).
export type ResumeCoverLetterItem = {
  id: string;
  prompt: string;
  answer: string;
};

export type ResumeContent = {
  // 기본정보 — entered per-resume so the user can tailor the contact info
  // for each version (e.g. one in English with the romanized name). When
  // these are empty the detail view falls back to the User account fields.
  basicName?: string | null;
  basicEmail?: string | null;
  basicPhone?: string | null;
  basicResidence?: string | null;
  basicVisa?: CandidateVisaType | null;
  // 국적 — 외국인 인재 매칭의 핵심 식별 정보(APLY Profile 카드에 노출).
  nationality?: string | null;
  // Optional profile photo. The editor can upload a file → we POST a
  // base64 data URL; the server replaces it with a CDN URL on save and
  // returns it back. Always optional — Korean resumes work fine without.
  basicPhotoUrl?: string | null;
  // 희망직무
  desiredJobRole?: string | null;
  workType?: string | null;
  desiredLocation?: string | null;
  availableFrom?: string | null;
  // 학력 / 경력 / 활동
  educations?: ResumeEducationEntry[];
  careers?: ResumeCareerEntry[];
  activities?: ResumeActivityEntry[];
  // 스킬
  skills?: string[];
  // 자격 / 어학 / 수상
  languages?: ResumeLanguageEntry[];
  certifications?: ResumeCertificationEntry[];
  // 포트폴리오 / 링크
  links?: ResumeLinkEntry[];
  // 자기소개 / 요약
  summary?: string | null;
  selfIntroduction?: string | null;
  // 한국형 자기소개서(자소서) — 문항별 답변. 이력서 PDF와 별개로 보관/편집한다.
  coverLetterItems?: ResumeCoverLetterItem[];
  // 기업 추천 인재풀 등록 동의 — 학생이 결과 화면에서 동의하면 기록된다.
  // (운영자/풀 연동은 백엔드에서 이 플래그를 읽어 처리)
  poolOptIn?: { consentedAt: string } | null;
  // Legacy fields (read-only back-compat for resumes made before the
  // structured expansion).
  visaType?: CandidateVisaType | null;
  koreanLevel?: CandidateLanguageLevel | null;
  topik?: string | null;
  education?: ResumeEducationEntry | null;
  career?: ResumeCareerEntry | null;
};

// Korean translations of long-form fields, cached on save. Result screens
// (detail/share/coach) render the original + Korean side by side so a Korean
// hiring manager can read whatever language the candidate wrote in.
export type ResumeKoTranslations = {
  summary?: string;
  selfIntroduction?: string;
  careers?: Array<{ description?: string }>;
  activities?: Array<{ description?: string }>;
};

export type ResumeTranslations = {
  ko?: ResumeKoTranslations;
};

export type Resume = {
  id: string;
  title: string;
  content: ResumeContent;
  isPrimary: boolean;
  // Public share slug. Anyone with /resume/share/<shareSlug> can view a
  // read-only single-page rendering of the resume without signing in.
  shareSlug?: string;
  // Server-computed Coach score. Present on list endpoints so the cards can
  // render a score badge without a follow-up call. May be absent on legacy
  // endpoints that haven't been augmented yet — treat as optional.
  score?: ResumeScoresResult;
  // Per-locale translation cache. Currently only 'ko' is filled — built on
  // save whenever a long-form field reads as non-Korean. Older rows may have
  // this undefined; readers must treat as optional.
  translations?: ResumeTranslations | null;
  createdAt: string;
  updatedAt: string;
};

// Shared (public) resume payload — same shape as `Resume` plus the owner's
// display name fields joined in by the server. PII fields (email/phone/
// residence in content; email/phoneNumber on user) are stripped server-side
// for non-operator callers. `viewerScope` lets the UI know which it got.
export type SharedResume = Resume & {
  user?: {
    name?: string | null;
    realName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  viewerScope?: "public" | "operator";
};

export async function getMyResumes() {
  const result = await authedJsonFetch<Resume>("/members/me/resumes", { method: "GET" });
  return result.items ?? [];
}

export async function getMyResume(resumeId: string) {
  const result = await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, { method: "GET" });
  if (!result.item) throw new Error("응답에 이력서가 없습니다.");
  return result.item;
}

export async function createMyResume(input: { title: string; content?: ResumeContent | Record<string, unknown>; allowIncomplete?: boolean }) {
  const result = await authedJsonFetch<Resume>("/members/me/resumes", {
    method: "POST",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 이력서가 없습니다.");
  return result.item;
}

export async function updateMyResume(resumeId: string, input: { title?: string; content?: ResumeContent | Record<string, unknown>; allowIncomplete?: boolean }) {
  const result = await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  if (!result.item) throw new Error("응답에 수정된 이력서가 없습니다.");
  return result.item;
}

export async function deleteMyResume(resumeId: string) {
  return authedJsonFetch<unknown>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, { method: "DELETE" });
}

// Public read of a shared resume. Anonymous by default — but if the caller
// happens to be logged in (e.g. an OPERATOR viewing the link from the ops
// console), we forward the access token so the server can promote them to
// `viewerScope: "operator"` and surface the email/phone/residence fields.
export async function getSharedResume(slug: string): Promise<SharedResume> {
  const base = getApiBaseUrl();
  const headers: Record<string, string> = {};
  // 로컬 토큰이 있으면 함께 보냄 — 운영자 인증에 사용. 인증 실패는 무시.
  try {
    if (typeof window !== "undefined") {
      const t = window.localStorage.getItem("platform_access_token");
      if (t) headers["Authorization"] = `Bearer ${t}`;
    }
  } catch {
    // localStorage 접근 실패는 그냥 무시 (익명 호출로 진행)
  }
  const response = await fetch(`${base}/resumes/share/${encodeURIComponent(slug)}`, {
    method: "GET",
    cache: "no-store",
    headers
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok !== true || !data.item) {
    throw new Error(data?.message ?? "이력서를 찾을 수 없어요.");
  }
  return data.item as SharedResume;
}

export async function setMyPrimaryResume(resumeId: string) {
  const result = await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}/primary`, {
    method: "POST"
  });
  return result.item ?? null;
}

// ---------------------------------------------------------------------------
// Resume Coach types — mirror the backend shape exactly. Keep these in sync
// with apps/api/src/index.ts (`ResumeScoresResult`, `ResumeCoachAction`, etc.)
// when adjusting the rubric.
//
// Phase 1: 점수가 quality + readiness 로 분리됨. quality 는 "이력서가 얼마나
// 잘 쓰였나", readiness 는 "기업에 제출 가능한 수준인가". level 은 readiness
// 임계점에서 도출되는 배지 — 사용자에게 가장 먼저 보여줄 한 줄 신호.
// ---------------------------------------------------------------------------
export type ResumeReadinessLevel = "submittable" | "needs_polish" | "not_submittable";

export type ResumeQualityDimensions = {
  contentQuality: number;
  impact: number;
  uniqueness: number;
  visual: number;
};

export type ResumeReadinessDimensions = {
  contact: number;
  education: number;
  visa: number;
  koreaFit: number;
  portfolio: number;
};

export type ResumeScoresResult = {
  quality: { total: number; dimensions: ResumeQualityDimensions };
  readiness: { total: number; dimensions: ResumeReadinessDimensions };
  level: ResumeReadinessLevel;
};

export type ResumeCoachActionCategory = "required" | "recommended" | "optional";

export type ResumeCoachAction = {
  id: string;
  category: ResumeCoachActionCategory;
  title: string;
  description: string;
  impactPoints: number;
  targetSection: string;
  targetItemIndex?: number;
  llmEligible?: boolean;
};

export type ResumeCoachPositionMatch = {
  positionId: string;
  title: string;
  organizationName: string | null;
  matchScore: number;
  status: "applied" | "open";
  applicationStatus: string | null;
  thumbnailUrl: string | null;
  workLocation: string | null;
};

export type ResumeCoachData = {
  resumeId: string;
  title: string;
  score: ResumeScoresResult;
  actions: ResumeCoachAction[];
  matches: ResumeCoachPositionMatch[];
  updatedAt: string;
};

export async function getResumeCoach(resumeId: string): Promise<ResumeCoachData> {
  // authedJsonFetch 는 { ok, item, items } 기본 스키마만 타이핑하므로,
  // 커스텀 필드(coach/suggestion/reply)는 캐스팅으로 꺼낸다.
  const result = (await authedJsonFetch(
    `/members/me/resumes/${encodeURIComponent(resumeId)}/coach?locale=${encodeURIComponent(getBrowserLocale())}`,
    { method: "GET" }
  )) as unknown as { coach?: ResumeCoachData };
  if (!result.coach) throw new Error("coach response missing payload");
  return result.coach;
}

export type ResumeCoachSuggestInput = {
  targetSection: "selfIntroduction" | "summary" | "careers" | "activities";
  targetItemIndex?: number;
  tone?: "formal" | "concise" | "impactful";
};

export type ResumeCoachSuggestion = {
  before: string;
  after: string;
  why: string;
  targetSection: ResumeCoachSuggestInput["targetSection"];
  targetItemIndex?: number;
};

export async function postResumeCoachSuggest(
  resumeId: string,
  input: ResumeCoachSuggestInput
): Promise<ResumeCoachSuggestion> {
  const result = (await authedJsonFetch(
    `/members/me/resumes/${encodeURIComponent(resumeId)}/coach/suggest`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  )) as unknown as { suggestion?: ResumeCoachSuggestion };
  if (!result.suggestion) throw new Error("suggest response missing payload");
  return result.suggestion;
}

export type ResumeCoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function postResumeCoachChat(
  resumeId: string,
  messages: ResumeCoachChatMessage[]
): Promise<string> {
  const result = (await authedJsonFetch(
    `/members/me/resumes/${encodeURIComponent(resumeId)}/coach/chat`,
    {
      method: "POST",
      body: JSON.stringify({ messages })
    }
  )) as unknown as { reply?: string };
  if (typeof result.reply !== "string") throw new Error("chat response missing reply");
  return result.reply;
}

// 이력서 편집 페이지에서 저장 전 임시 텍스트도 받을 수 있는 generic AI
// 작성 도우미. resumeId 가 없어도 동작 — 본문 저장 여부와 무관하게 자기소개
// /경력/활동 description 의 초안을 만들거나 다듬을 때 사용.
export type DraftResumeTextFieldType = "selfIntroduction" | "summary" | "career" | "activity";
export type DraftResumeTextMode = "improve" | "expand" | "generate";

export type DraftResumeTextInput = {
  currentText: string;
  fieldType: DraftResumeTextFieldType;
  mode?: DraftResumeTextMode;
  context?: {
    companyName?: string;
    position?: string;
    title?: string;
  };
  hints?: string;
};

export type DraftResumeTextResult = {
  text: string;
  why: string;
  mode: DraftResumeTextMode;
  fieldType: DraftResumeTextFieldType;
};

export async function postDraftResumeText(input: DraftResumeTextInput): Promise<DraftResumeTextResult> {
  const result = (await authedJsonFetch("/members/me/ai/draft-resume-text", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { draft?: DraftResumeTextResult };
  if (!result.draft) throw new Error("draft response missing payload");
  return result.draft;
}
