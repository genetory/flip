import { readAccessToken, refreshPlatformSession } from "./auth-client";

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

type ApiPayload<T = unknown> = {
  ok?: boolean;
  code?: string;
  message?: string;
  item?: T;
  items?: T[];
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

function resolveApiErrorMessage(payload: { message?: unknown }, fallback: string) {
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  return fallback;
}

async function authedJsonFetch<T>(path: string, init: RequestInit = {}) {
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
  sourceProvider: "INTERNAL" | "BUDDIES" | "KOWORK" | "OTHER";
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
  createdAt: string;
  updatedAt: string;
  matchingParticipantsCount: number;
  partnerOrganization: {
    id: string;
    name: string;
    industry: string;
    companySize: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
    officeAddress: string | null;
  } | null;
};

export type PublicPositionsPage = {
  items: PublicPositionListItem[];
  nextCursor: string | null;
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
  website?: string | null;
  officeAddress?: string | null;
  description?: string | null;
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

export async function getPublicPositionsPage(input?: {
  cursor?: string | null;
  limit?: number;
  search?: string;
  jobRoles?: string[];
  sortOrder?: "asc" | "desc";
  sourceProviders?: Array<PublicPositionListItem["sourceProvider"]>;
}) {
  const params = new URLSearchParams();
  if (input?.cursor) params.set("cursor", input.cursor);
  if (input?.limit && Number.isFinite(input.limit)) params.set("limit", String(Math.max(1, Math.floor(input.limit))));
  if (input?.search && input.search.trim()) params.set("search", input.search.trim());
  if (input?.jobRoles?.length) {
    for (const role of Array.from(new Set(input.jobRoles.map((r) => r.trim()).filter((r) => r.length > 0)))) {
      params.append("jobRole", role);
    }
  }
  if (input?.sortOrder) params.set("sortOrder", input.sortOrder);
  if (input?.sourceProviders?.length) {
    for (const provider of Array.from(new Set(input.sourceProviders))) {
      params.append("sourceProvider", provider);
    }
  }
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
  };
  if (!response.ok || payload.ok !== true) {
    throw new Error(resolveApiErrorMessage(payload, "포지션 목록을 불러오지 못했습니다."));
  }
  return {
    items: payload.items ?? [],
    nextCursor: typeof payload.nextCursor === "string" && payload.nextCursor.trim() ? payload.nextCursor : null
  } satisfies PublicPositionsPage;
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

export async function getPublicPositionById(id: string) {
  const response = await fetch(`${getApiBaseUrl()}/positions/${encodeURIComponent(id)}`, {
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
};

export async function getMyApplications() {
  const result = await authedJsonFetch<MyApplication>("/members/me/applications", {
    method: "GET"
  });
  return (result.items ?? []) as MyApplication[];
}

export async function withdrawMyApplication(applicationId: string) {
  return authedJsonFetch<{ id: string; status: string }>(`/members/me/applications/${encodeURIComponent(applicationId)}/withdraw`, {
    method: "POST"
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

export async function addMyFavoritePosition(positionId: string) {
  const result = await authedJsonFetch<unknown>(`/members/me/positions/${encodeURIComponent(positionId)}/favorite`, {
    method: "POST"
  });
  return result;
}

export async function removeMyFavoritePosition(positionId: string) {
  const result = await authedJsonFetch<unknown>(`/members/me/positions/${encodeURIComponent(positionId)}/favorite`, {
    method: "DELETE"
  });
  return result;
}

export async function applyMyPosition(positionId: string) {
  const result = await authedJsonFetch<unknown>(`/members/me/positions/${encodeURIComponent(positionId)}/apply`, {
    method: "POST"
  });
  return result;
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

export async function joinMyPartnerOrganizationByCode(code: string) {
  const result = await authedJsonFetch<MyPartnerOrganization | null>("/members/me/partner-organization/join", {
    method: "POST",
    body: JSON.stringify({ code })
  });
  return result.item ?? null;
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
  name: string;
  nationality: string | null;
  email: string;
  positionId: string;
  positionTitle: string;
  languages: string[];
  school: string | null;
  major: string | null;
  residence: string | null;
  appliedAt: string | null;
  recommendation: "HIGH" | "NORMAL" | "CHECK";
  status: PartnerApplicantStatus;
};

export type PartnerApplicantDetail = PartnerApplicantListItem & {
  summary: string | null;
  motivation: string | null;
  portfolioUrl: string | null;
  availableStartDate: string | null;
  memo: string | null;
};

export async function getMyPartnerApplicants() {
  const result = await authedJsonFetch<PartnerApplicantListItem>("/partner/applicants", {
    method: "GET"
  });
  return result.items ?? [];
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
  const result = await authedJsonFetch<CareerReadinessReport>("/members/me/career-readiness", {
    method: "POST",
    body: JSON.stringify(locale ? { locale } : {})
  });
  if (!result.item) {
    throw new Error("응답에 리포트가 없습니다.");
  }
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
