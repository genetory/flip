// 한패스 × Aply 이벤트 설문 client. 비로그인 공개 제출이므로 authedJsonFetch 가
// 아니라 saju/lead 와 동일한 공개 fetch 패턴을 사용. 백엔드(POST
// /events/hanpass/survey) 와 1:1 매핑.

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export type HanpassJobIntent = "active_seeking" | "open_to_offers" | "not_seeking" | "unsure";
export type HanpassAvailableFrom =
  | "immediately"
  | "within_1m"
  | "within_3m"
  | "undecided"
  | "not_available";
export type HanpassJobField =
  | "manufacturing"
  | "logistics"
  | "service"
  | "office"
  | "translation"
  | "it"
  | "design_marketing"
  | "research"
  | "other";
export type HanpassVisaType =
  | "D-2"
  | "D-4"
  | "D-10"
  | "E-7"
  | "F-2"
  | "F-4"
  | "F-5"
  | "F-6"
  | "other"
  | "unsure";
export type HanpassWantsConsulting = "yes" | "info_only" | "unsure";
export type HanpassLanguage = "ko" | "en";

export type HanpassSurveyInput = {
  name: string;
  phone: string;
  email: string;
  jobIntent: HanpassJobIntent;
  availableFrom: HanpassAvailableFrom;
  jobFields: HanpassJobField[];
  jobFieldOther?: string;
  visaType: HanpassVisaType;
  wantsConsulting: HanpassWantsConsulting;
  consultLanguages: HanpassLanguage[];
  privacyConsent: true;
  locale?: string;
  source?: string;
};

export type HanpassSurveyResult = {
  id: string;
  wantsConsulting: HanpassWantsConsulting;
  createdAt: string;
};

export async function submitHanpassSurvey(input: HanpassSurveyInput): Promise<HanpassSurveyResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${getApiBaseUrl()}/events/hanpass/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.ok !== true) {
      throw new Error(data?.message || "설문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    return data.item as HanpassSurveyResult;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
