// "내 경험이 스펙이 되는 순간" — 어플라이 자소서 경험 발굴 캠페인(/experience) 문구·설정.
// 마케팅·법무가 자주 바꿀 값은 전부 여기 모아 둔다(화면 코드는 components/pages/ExperienceCampaignPage.tsx).
// 문구는 { ko, en } — 다른 언어는 t() 규칙대로 영어로 보인다.

export type Copy = { ko: string; en: string };

/** 전문가 1인당 제공 범위 — 아직 확정 전(기본안). 바꾸면 화면 전체(안내·FAQ·완료 화면)에 반영된다. */
export const EXPERT_SCOPE: Copy = {
  ko: "30분 1:1 상담 + 자기소개서 1개 문항 첨삭",
  en: "A 30-min 1:1 consultation + editing of 1 cover letter question"
};

/** 매주 선정 인원. */
export const WEEKLY_SLOTS = 2;

/** 개인정보 보관 기간 — 법무 검토 전 임시 문구. */
export const PRIVACY_RETENTION: Copy = {
  ko: "캠페인 종료 후 6개월이 지나면 파기합니다.",
  en: "Deleted 6 months after the campaign ends."
};

/** 개인정보 수집·이용 동의 상세(필수). 내용을 바꾸면 API 의 EXPERIENCE_CONSENT_VERSION 도 함께 올린다. */
export const PRIVACY_CONSENT_DETAILS: { label: Copy; value: Copy }[] = [
  {
    label: { ko: "수집 항목", en: "What we collect" },
    value: {
      ko: "이름, 이메일, 지원 직무, 이력서 파일, 상담 방식 (선택: 휴대폰 번호, 국적, 자기소개서 파일)",
      en: "Name, email, desired role, resume file, consultation method (optional: phone, nationality, cover letter file)"
    }
  },
  {
    label: { ko: "이용 목적", en: "Purpose" },
    value: {
      ko: "캠페인 참가자 선정, 선정 안내 및 상담 일정 조율, 자기소개서 상담·첨삭 제공",
      en: "Selecting participants, contacting you about selection and scheduling, and providing the consultation and editing"
    }
  },
  { label: { ko: "보관 기간", en: "Retention" }, value: PRIVACY_RETENTION },
  {
    label: { ko: "동의 거부", en: "Your choice" },
    value: {
      ko: "동의하지 않을 수 있으며, 이 경우 캠페인 신청이 불가합니다.",
      en: "You may decline, but you won't be able to apply to the campaign."
    }
  }
];

/** 익명 사례 공개 동의(필수) 설명. 바꾸면 API 의 EXPERIENCE_CONSENT_VERSION 도 올린다. */
export const CASE_STUDY_CONSENT: Copy = {
  ko: "상담 전후 자기소개서를 이름·연락처 등 개인을 알 수 없게 가린 Before/After 사례로 어플라이 홈페이지·SNS에 소개할 수 있어요.",
  en: "Your before/after cover letter may be shared on Aply's website and social media as an anonymous example, with names, contacts and identifying details removed."
};

/** Before/After 예시 — 실제 상담 사례(공개 동의분)가 생기면 교체한다. */
export const BEFORE_AFTER_EXAMPLES: { tag: Copy; before: Copy; after: Copy }[] = [
  {
    tag: { ko: "편의점 아르바이트", en: "Convenience store job" },
    before: {
      ko: "편의점에서 2년 동안 일하면서 책임감을 배웠습니다.",
      en: "Working at a convenience store for 2 years taught me responsibility."
    },
    after: {
      ko: "판매 패턴을 분석하고 발주 개선을 제안한 경험을 영업관리 역량으로 연결했습니다.",
      en: "I analyzed sales patterns and proposed better ordering — and linked that to sales management skills."
    }
  },
  {
    tag: { ko: "동아리 활동", en: "Student club" },
    before: {
      ko: "동아리 회장으로 활동하며 리더십을 길렀습니다.",
      en: "As club president, I developed leadership."
    },
    after: {
      ko: "회원이 줄어든 이유를 설문으로 찾아 활동 방식을 바꾸고 참여율을 높인 경험을 조직 관리 역량으로 연결했습니다.",
      en: "I surveyed members to find why they were leaving, changed how we ran activities and raised participation — linked to team management skills."
    }
  },
  {
    tag: { ko: "통역 봉사", en: "Volunteer interpreting" },
    before: {
      ko: "외국인 관광객 안내 봉사를 하며 소통 능력을 키웠습니다.",
      en: "Guiding foreign tourists as a volunteer improved my communication skills."
    },
    after: {
      ko: "관광객이 자주 묻는 질문을 모아 다국어 안내 자료를 만든 경험을 해외 고객 응대 역량으로 연결했습니다.",
      en: "I collected tourists' most common questions and made multilingual guides — linked to global customer service skills."
    }
  }
];
