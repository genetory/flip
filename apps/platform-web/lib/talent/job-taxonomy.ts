// 표준 직무 분류(대분류 → 중분류 → 소분류). 원티드/사람인/잡코리아류 카테고리 참고.
// 소분류(leaf) 라벨이 관심 직무 UI 선택값으로 저장된다.
import { JOB_CATEGORIES, type JobCategory } from "../job-categories";

export interface JobMiddle {
  label: string; // 중분류
  minors: string[]; // 소분류(leaf)
}
export interface JobMajor {
  label: string; // 대분류
  emoji: string;
  middles: JobMiddle[];
}

export const JOB_TAXONOMY: JobMajor[] = [
  {
    label: "개발",
    emoji: "💻",
    middles: [
      { label: "소프트웨어", minors: ["백엔드 개발", "프론트엔드 개발", "풀스택 개발", "웹 개발", "소프트웨어 엔지니어"] },
      { label: "모바일", minors: ["안드로이드 개발", "iOS 개발", "크로스플랫폼 개발"] },
      { label: "인프라·데브옵스", minors: ["DevOps", "인프라 엔지니어", "시스템/네트워크", "SRE"] },
      { label: "보안·QA", minors: ["보안 엔지니어", "QA 엔지니어"] }
    ]
  },
  {
    label: "데이터·AI",
    emoji: "📊",
    middles: [
      { label: "데이터", minors: ["데이터 분석가", "데이터 엔지니어", "데이터 사이언티스트", "BI 분석가"] },
      { label: "AI·ML", minors: ["머신러닝 엔지니어", "AI 리서처", "MLOps"] }
    ]
  },
  {
    label: "디자인",
    emoji: "🎨",
    middles: [
      { label: "프로덕트·UX", minors: ["UX 디자이너", "UI 디자이너", "프로덕트 디자이너"] },
      { label: "그래픽·브랜드", minors: ["그래픽 디자이너", "브랜드 디자이너", "BX 디자이너"] },
      { label: "콘텐츠·영상", minors: ["영상 디자이너", "모션 디자이너", "3D 디자이너"] }
    ]
  },
  {
    label: "기획·PM",
    emoji: "📝",
    middles: [
      { label: "프로덕트", minors: ["프로덕트 매니저(PM)", "프로덕트 오너(PO)", "서비스 기획"] },
      { label: "전략·사업", minors: ["사업 기획", "전략 기획", "프로젝트 매니저(PjM)"] }
    ]
  },
  {
    label: "마케팅·광고",
    emoji: "📣",
    middles: [
      { label: "디지털 마케팅", minors: ["퍼포먼스 마케팅", "그로스 마케팅", "콘텐츠 마케팅", "SNS 마케팅"] },
      { label: "브랜드·PR", minors: ["브랜드 마케팅", "PR/홍보", "CRM 마케팅"] }
    ]
  },
  {
    label: "영업·제휴",
    emoji: "🤝",
    middles: [
      { label: "영업", minors: ["B2B 영업", "B2C 영업", "해외 영업", "기술 영업"] },
      { label: "제휴·세일즈", minors: ["제휴/BD", "세일즈 매니저"] }
    ]
  },
  {
    label: "고객·CS",
    emoji: "🎧",
    middles: [{ label: "고객 지원", minors: ["고객 상담(CS)", "고객 경험(CX)", "온보딩/서포트"] }]
  },
  {
    label: "경영·비즈니스",
    emoji: "🏢",
    middles: [
      { label: "경영지원", minors: ["경영 기획", "운영 매니저", "총무", "법무"] },
      { label: "전략·컨설팅", minors: ["비즈니스 애널리스트", "컨설턴트"] }
    ]
  },
  {
    label: "인사·HR",
    emoji: "👥",
    middles: [{ label: "HR", minors: ["채용(리크루터)", "인사(HRM)", "조직문화(HRD)", "노무"] }]
  },
  {
    label: "재무·회계",
    emoji: "💰",
    middles: [{ label: "재무·회계", minors: ["회계", "재무", "세무", "IR", "감사"] }]
  },
  {
    label: "미디어·콘텐츠",
    emoji: "🎬",
    middles: [{ label: "콘텐츠", minors: ["콘텐츠 에디터", "카피라이터", "영상 편집", "PD"] }]
  },
  {
    label: "생산·물류",
    emoji: "🏭",
    middles: [
      { label: "생산·품질", minors: ["생산 관리", "품질 관리(QC)", "설비"] },
      { label: "물류·무역", minors: ["물류 관리", "구매/자재", "무역/수출입"] }
    ]
  }
];

// ── 관심 직무 → 공고 필터 매핑 ────────────────────────────────────────────
// positions의 preferredJobRole은 JOB_CATEGORIES(원티드 parent_tag·INTERNAL select의
// 단일 소스)만 값으로 갖는다. 관심 직무는 더 세분화된 소분류라서, 서버 필터에 걸리려면
// 소분류 → 대분류 → JobCategory 로 변환해서 질의해야 한다(원티드·CIP 모두 매칭).
const MAJOR_TO_JOB_CATEGORY: Record<string, JobCategory> = {
  "개발": "개발",
  "데이터·AI": "개발",
  "디자인": "디자인",
  "기획·PM": "경영·비즈니스",
  "마케팅·광고": "마케팅·광고",
  "영업·제휴": "영업",
  "고객·CS": "고객 서비스",
  "경영·비즈니스": "경영·비즈니스",
  "인사·HR": "HR·총무",
  "재무·회계": "금융",
  "미디어·콘텐츠": "미디어·콘텐츠",
  "생산·물류": "제조·생산"
};

// 소분류 라벨 → 소속 대분류 라벨.
const MINOR_TO_MAJOR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const major of JOB_TAXONOMY) {
    for (const mid of major.middles) {
      for (const minor of mid.minors) map[minor] = major.label;
    }
  }
  return map;
})();

// 관심 직무(소분류/커스텀) 배열 → positions 질의용 JobCategory 배열(중복 제거).
// 매핑되지 않는 커스텀 입력은 조용히 제외한다(공고 vocabulary에 없어 매칭 불가).
export function jobCategoriesForInterests(interests: string[]): string[] {
  const out = new Set<string>();
  for (const raw of interests) {
    const it = raw.trim();
    if (!it) continue;
    if ((JOB_CATEGORIES as readonly string[]).includes(it)) {
      out.add(it);
      continue;
    }
    const major = MINOR_TO_MAJOR[it];
    const cat = major ? MAJOR_TO_JOB_CATEGORY[major] : undefined;
    if (cat) out.add(cat);
  }
  return Array.from(out);
}
