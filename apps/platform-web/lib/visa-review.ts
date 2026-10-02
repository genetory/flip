// 비자 콘텐츠의 출처·검토 이력 구조.
//
// 비자 정보는 틀리면 사람의 체류 자격에 영향을 준다. 그래서 (1) 어디서 온 정보인지,
// (2) 마지막으로 사람이 확인한 날이 언제인지를 화면에 표시할 수 있어야 한다.
// lib/visa-details.ts 는 자동 생성 데이터라 손대지 않고, 검수 정보는 이 파일에서 따로 관리한다.
//
// ⚠️ 지금 비자 상세(/resources/visa/*)는 리뉴얼 정책상 308 로 차단돼 공개되지 않는다.
// 공개를 되살리기로 결정하면 이 구조를 그대로 쓰고 REVIEWS 를 채운다.

export type VisaSource = {
  /** 기관·문서명. 예: "법무부 출입국·외국인정책본부" */
  name: string;
  /** 원문 URL(있으면). 사용자가 직접 확인할 수 있어야 한다. */
  url?: string;
};

export type VisaReview = {
  /** 사람이 마지막으로 내용을 확인한 날(ISO yyyy-mm-dd). 추정값을 넣지 않는다. */
  lastReviewedAt: string;
  /** 검토한 사람·팀(내부 식별용. 개인 이메일은 넣지 않는다). */
  reviewedBy: string;
  sources: VisaSource[];
};

/**
 * 비자 코드 → 검수 정보. 비어 있으면 화면에서 "검토일 미확인"으로 보여 주고,
 * 확인된 날짜가 있는 것처럼 꾸미지 않는다.
 */
export const VISA_REVIEWS: Record<string, VisaReview> = {};

export function visaReviewOf(code: string): VisaReview | null {
  return VISA_REVIEWS[code.toUpperCase()] ?? null;
}

/**
 * 모든 비자 콘텐츠에 함께 붙이는 고지. 결과를 보장하지 않는다는 점을 분명히 한다
 * (법률·비자 결과 보장 금지 규칙).
 */
export const VISA_DISCLAIMER_KO =
  "이 내용은 일반 안내이며 법률 자문이 아닙니다. 실제 심사 기준은 개인 상황과 출입국 판단에 따라 달라질 수 있고, APLY 는 비자 발급이나 체류 자격을 보장하지 않습니다.";
export const VISA_DISCLAIMER_EN =
  "This is general information, not legal advice. Actual requirements depend on your situation and immigration review. Aply does not guarantee visa issuance or residency status.";
