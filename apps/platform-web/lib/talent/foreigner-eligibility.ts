// 공고의 "외국인 지원 가능" 판정 상태와 그 근거.
//
// 왜 상태를 나누는가: 지금 화면은 eligibleVisas 에 FOREIGNER_FRIENDLY 가 있으면 무조건
// "외국인 지원 가능" 이라고 단정해 보여 줬다. 그 플래그는 외부 공고(원티드 등) 원문의
// 태그에서 온 것이라 기업이 확인해 준 사실이 아니고, 비자 종류별 요건도 담고 있지 않다.
// 사용자가 이 표시를 믿고 지원했다가 비자 요건으로 막히면 그 피해는 사용자가 진다.
//
// 데이터 현실(2026-10 프로덕션 표본 500건): eligibleVisas 가 채워진 공고는 21% 이고 값은
// FOREIGNER_FRIENDLY 하나뿐이다. employmentClassification·workType·communicationLanguages 는
// 전부 비어 있다. 그래서 상태는 기존 필드로 파생만 하고, 새 컬럼은 만들지 않았다.

export type ForeignerEligibility = "VERIFIED" | "LIKELY" | "REVIEW_REQUIRED" | "NOT_AVAILABLE";

export type EligibilityInput = {
  eligibleVisas?: string[] | null;
  /** "EXTERNAL" 이면 외부 수집 공고(기업이 직접 올린 게 아니다). */
  sourceKind?: string | null;
};

/** FOREIGNER_FRIENDLY 는 "외국인 가능" 일반 태그이고, 그 외 값은 구체적인 비자 코드다. */
const GENERIC_FLAG = "FOREIGNER_FRIENDLY";

export function deriveForeignerEligibility(input: EligibilityInput): ForeignerEligibility {
  const visas = (input.eligibleVisas ?? []).map((v) => (v ?? "").trim()).filter(Boolean);
  if (visas.length === 0) return "REVIEW_REQUIRED"; // 정보 없음 — '불가'로 단정하지 않는다
  const specific = visas.filter((v) => v !== GENERIC_FLAG);
  const isPartnerPosting = input.sourceKind !== "EXTERNAL";
  // 기업이 직접 올린 공고에 받을 수 있는 비자를 구체적으로 적었다 → 확인된 것으로 본다.
  if (isPartnerPosting && specific.length > 0) return "VERIFIED";
  // 구체 비자 코드가 있지만 외부 수집분이거나, 일반 태그만 있는 경우 → 가능성이 높다(단정 금지).
  return "LIKELY";
}

/** 상태별 사용자 문구. "가능성 높음" 을 확정적인 지원 가능으로 쓰지 않는다. */
export function eligibilityLabel(state: ForeignerEligibility, t: (ko: string, en: string) => string): string {
  switch (state) {
    case "VERIFIED":
      return t("외국인 지원 확인", "Confirmed open to foreigners");
    case "LIKELY":
      return t("지원 가능성 높음", "Likely open to foreigners");
    case "REVIEW_REQUIRED":
      return t("비자 조건 확인 필요", "Visa conditions to check");
    case "NOT_AVAILABLE":
      return t("현재 지원 어려움", "Not open right now");
  }
}

/** 왜 이 상태인지 — 사용자가 판단 근거를 볼 수 있게 한다. */
export function eligibilityReason(state: ForeignerEligibility, t: (ko: string, en: string) => string): string {
  switch (state) {
    case "VERIFIED":
      return t(
        "기업이 이 공고에 받을 수 있는 비자를 직접 적었어요. 그래도 개인 요건은 기업과 확인이 필요해요.",
        "The employer listed the visas they accept for this role. Your own requirements still need checking with them."
      );
    case "LIKELY":
      return t(
        "공고 원문에 외국인 지원 가능 표시가 있어요. 받을 수 있는 비자 종류는 적혀 있지 않아, 기업 확인이 필요해요.",
        "The original posting is tagged as open to foreigners, but it doesn't say which visas. Confirm with the employer."
      );
    case "REVIEW_REQUIRED":
      return t(
        "이 공고에는 외국인 채용 정보가 없어요. 지원 전에 비자 요건을 기업에 확인해 주세요.",
        "This posting has no information about hiring foreigners. Check visa requirements with the employer before applying."
      );
    case "NOT_AVAILABLE":
      return t("이 공고는 외국인 지원을 받지 않는다고 확인됐어요.", "This posting is confirmed as not open to foreign applicants.");
  }
}

/** 배지 색 — 상태를 색으로도 구분한다(초록=확인, 파랑=가능성, 회색=확인 필요). */
export function eligibilityTone(state: ForeignerEligibility): { bg: string; fg: string } {
  switch (state) {
    case "VERIFIED":
      return { bg: "#E7F8EF", fg: "#0A9B59" };
    case "LIKELY":
      return { bg: "#EDF1FD", fg: "#0B46E8" };
    case "REVIEW_REQUIRED":
      return { bg: "#F2F4F6", fg: "#6B7684" };
    case "NOT_AVAILABLE":
      return { bg: "#FEF2F2", fg: "#C0392B" };
  }
}
