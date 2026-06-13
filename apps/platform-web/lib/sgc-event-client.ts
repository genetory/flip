// SGC 6주 일경험 프로그램 지원 client. 회원 전용 — getMyResumes 와 동일한
// authedJsonFetch 패턴을 사용. 백엔드(POST /events/sgc/applications) 와
// 1:1 매핑.

import { authedJsonFetch } from "./member-profile-client";

export type SgcVisaType = "D-2" | "D-10" | "OTHER";
export type SgcDesiredJob = "MARKETING" | "SALES" | "TRANSLATION" | "DEV" | "OTHER";
export type SgcStatus = "SUBMITTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export type SgcApplicationInput = {
  resumeId: string;
  // 졸업 / 졸업 예정일 — 자유 입력 (예: "2026년 3월").
  expectedGraduation: string;
  visaType: SgcVisaType;
  visaOther?: string;
  healthNote: string;
  desiredJob: SgcDesiredJob;
  desiredJobOther?: string;
  motivation: string;
  marketingOptIn: boolean;
  privacyConsent: true;
  // 사전 교육(최종 합격자 익일) 필수 참여 동의 — 항상 true.
  preTrainingConsent: true;
  locale?: string;
};

export type SgcApplication = {
  id: string;
  status: SgcStatus;
  visaType?: SgcVisaType;
  desiredJob?: SgcDesiredJob;
  resumeId?: string;
  createdAt: string;
  updatedAt?: string;
};

// authedJsonFetch 는 응답 body 전체를 그대로 반환. API 는 { ok, application }
// 또는 { ok, application, alreadyApplied } 형태로 응답하므로 그대로 풀어 씀.
type ApplicationResponse = { ok: boolean; application: SgcApplication | null; alreadyApplied?: boolean };

export async function getMySgcApplication(): Promise<SgcApplication | null> {
  const result = await authedJsonFetch<ApplicationResponse>(
    "/events/sgc/applications/me",
    { method: "GET" }
  );
  const payload = result as unknown as ApplicationResponse;
  return payload?.application ?? null;
}

export async function submitSgcApplication(input: SgcApplicationInput): Promise<{
  application: SgcApplication;
  alreadyApplied: boolean;
}> {
  const result = await authedJsonFetch<ApplicationResponse>(
    "/events/sgc/applications",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
  const payload = result as unknown as ApplicationResponse;
  return {
    application: payload.application!,
    alreadyApplied: Boolean(payload.alreadyApplied)
  };
}
