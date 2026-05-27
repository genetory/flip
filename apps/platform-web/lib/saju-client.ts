import { readAccessToken } from "./auth-client";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

// Slugs this browser created are remembered locally so the result page can
// tell the owner ("share with friends") apart from a visitor who opened a
// shared link ("try it yourself"). Purely a UX hint — no security meaning.
const OWN_SLUGS_KEY = "aply_saju_mine";

export function markSajuOwned(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(OWN_SLUGS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(slug)) {
      list.push(slug);
      window.localStorage.setItem(OWN_SLUGS_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function isSajuOwned(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(OWN_SLUGS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(slug);
  } catch {
    return false;
  }
}

export type SajuPredictionRequest = {
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime?: string;
  calendarType?: "solar" | "lunar";
  locale?: string;
};

export type SajuPredictionResponse = {
  id: string;
  shareSlug: string;
};

export type SajuPositionItem = {
  id: string;
  title: string;
  preferredJobRole: string | null;
  workLocation: string | null;
  thumbnailImages: string[];
  sourceProvider: "INTERNAL" | "BUDDIES" | "KOWORK" | "WANTED" | "OTHER";
  sourceKind: "INTERNAL" | "EXTERNAL";
  sourceUrl: string | null;
  partnerOrganization: {
    id: string;
    name: string;
    companyLogoImageData?: string | null;
  } | null;
};

export type SajuRoleReasoning = {
  role: string;
  reason: string;
};

export type SajuSuccessFactor = {
  title: string;
  detail: string;
};

export type SajuElementBalance = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type SajuCareerType = {
  label: string;
  tagline: string;
};

export type SajuDetails = {
  careerType?: SajuCareerType | null;
  strengths: string[];
  workEnvironment: string[];
  cautionAdvice: string;
  roleReasonings: SajuRoleReasoning[];
  specificRoles: string[];
  elementBalance: SajuElementBalance | null;
  dayMaster: string;
  recommendedIndustries: string[];
  rolesToAvoid: string[];
  growthPattern: string;
  successFactors?: SajuSuccessFactor[];
  motto: string;
};

export type SajuResultPayload = {
  prediction: {
    id: string;
    shareSlug: string;
    name: string;
    gender: "male" | "female";
    birthDate: string;
    birthTime: string | null;
    calendarType: "solar" | "lunar";
    interpretation: string;
    details: SajuDetails | null;
    recommendedRoleNames: string[];
    isAuthenticated: boolean;
    isClaimed: boolean;
    createdAt: string;
  };
  positions: SajuPositionItem[];
  totalPredictions: number;
};

export async function predictSaju(input: SajuPredictionRequest): Promise<SajuPredictionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/saju/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  if (!response.ok || data?.ok !== true) {
    throw new Error(data?.message || "사주 풀이에 실패했습니다.");
  }
  return { id: data.id, shareSlug: data.shareSlug };
}

// --- Career lead (Profile Pool) ---------------------------------------

export type SajuLeadKoreanLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
export type SajuLeadWorkType = "INTERN" | "PART_TIME" | "PROJECT" | "FULL_TIME";
export type SajuLeadContactType = "EMAIL" | "PHONE" | "KAKAO" | "WHATSAPP";

export type SajuLeadRequest = {
  shareSlug: string;
  nationality?: string;
  school?: string;
  major?: string;
  visaType?: string;
  koreanLevel?: SajuLeadKoreanLevel;
  englishLevel?: SajuLeadKoreanLevel;
  preferredJobRole?: string;
  workType?: SajuLeadWorkType;
  contact?: string;
  contactType?: SajuLeadContactType;
  hasResume?: boolean;
  consentCareer?: boolean;
  consentRecommend?: boolean;
  locale?: string;
};

export type SajuLeadRecommendation = {
  recommendedRoles: string[];
  improvements: string[];
  status: "UNVERIFIED" | "NEEDS_WORK" | "RECOMMENDABLE";
};

export async function submitSajuLead(
  input: SajuLeadRequest
): Promise<{ leadId: string; recommendation: SajuLeadRecommendation }> {
  // Hard timeout so a slow / cold-starting API can never leave the UI stuck
  // on the "analyzing..." spinner — the caller surfaces the thrown error.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${getApiBaseUrl()}/saju/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.ok !== true) {
      throw new Error(data?.message || "정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    return { leadId: data.leadId, recommendation: data.recommendation };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSajuResult(slug: string, locale?: string): Promise<SajuResultPayload> {
  const token = readAccessToken();
  const url = new URL(`${getApiBaseUrl()}/saju/result/${encodeURIComponent(slug)}`);
  if (locale) url.searchParams.set("locale", locale);
  const response = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok || data?.ok !== true) {
    throw new Error(data?.message || "사주 결과를 불러오지 못했습니다.");
  }
  return {
    prediction: data.prediction,
    positions: data.positions,
    totalPredictions: typeof data.totalPredictions === "number" ? data.totalPredictions : 0
  };
}
