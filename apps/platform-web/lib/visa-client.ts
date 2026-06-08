// VisaResultPage 의 회원가입 퍼널에서 사용하는 API 클라이언트. 익명 호출
// 이므로 인증 토큰 없이 fetch. saju-client 와 동일한 패턴.

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export type VisaLeadInput = {
  shareSlug: string;
  name?: string;
  contact?: string;
  contactType?: "email" | "phone" | "messenger";
  nationality?: string;
  currentVisa?: string;
  expectedJoinDate?: string;
  graduationDate?: string;
  university?: string;
  major?: string;
  preferredJobRole?: string;
  koreanLevel?: string;
  englishLevel?: string;
  consentCareer?: boolean;
  consentRecommend?: boolean;
  consentContact?: boolean;
  locale?: "ko" | "en" | "zh-CN" | "vi" | "ja" | "id";
};

export async function postVisaLead(input: VisaLeadInput): Promise<{ leadId: string }> {
  const response = await fetch(`${getApiBaseUrl()}/visa/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    leadId?: string;
    message?: string;
  } | null;
  if (!response.ok || !payload?.ok || !payload.leadId) {
    throw new Error(payload?.message ?? "리드 저장에 실패했습니다.");
  }
  return { leadId: payload.leadId };
}
