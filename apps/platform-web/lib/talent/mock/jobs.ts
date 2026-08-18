// 채용공고 mock 풀. 실제 API(positions) 연결 전까지 사용.
import type { Job } from "../types";

export const mockJobs: Job[] = [
  {
    id: "job-content-intern",
    title: "콘텐츠 마케팅 인턴",
    company: "무브먼트랩",
    location: "서울 성동구",
    employmentType: "intern",
    isInternOrNew: true,
    workMode: "hybrid",
    deadline: "2026-08-20",
    majorFree: true,
    foreignerOk: false,
    reasons: ["콘텐츠 운영 경험이 있어요", "지원 가능한 신입 공고예요", "희망 지역과 일치해요"],
    responsibilities: [
      "브랜드 SNS 채널 콘텐츠 기획 및 제작 보조",
      "주간 콘텐츠 성과 정리 및 리포트 작성",
      "캠페인 아이디어 제안 및 실행 지원"
    ],
    qualifications: ["콘텐츠에 관심이 많은 분", "기본적인 문서 작성 능력", "성실하게 소통하는 분"],
    preferred: ["SNS 운영 경험", "간단한 이미지 편집 가능"],
    conditions: ["주 5일 · 인턴 3개월", "교육비 지원", "정규직 전환 기회"],
    process: ["서류 지원", "실무 인터뷰", "최종 합격"],
    fitReasons: ["카페 콘텐츠 운영 경험을 살릴 수 있어요", "신입도 지원 가능한 인턴 공고예요"],
    prepChecklist: ["콘텐츠 관련 경험 1개 정리", "지원 동기 작성", "간단한 포트폴리오 준비"]
  },
  {
    id: "job-service-planner",
    title: "서비스 기획 신입",
    company: "핀버드",
    location: "서울 강남구",
    employmentType: "newgrad",
    isInternOrNew: true,
    workMode: "onsite",
    deadline: "2026-08-31",
    majorFree: true,
    foreignerOk: true,
    reasons: ["지원 가능한 신입 공고예요", "전공 무관 지원 가능해요"],
    responsibilities: ["서비스 기능 기획 및 정책 정리", "사용자 피드백 분석", "유관 부서 커뮤니케이션"],
    qualifications: ["논리적으로 문제를 정리하는 분", "문서 작성에 익숙한 분"],
    preferred: ["기획 프로젝트 경험", "데이터 도구 사용 경험"],
    conditions: ["주 5일 · 정규직", "수습 3개월"],
    process: ["서류", "직무 과제", "면접", "최종"],
    fitReasons: ["팀 프로젝트 경험을 기획 역량으로 연결할 수 있어요"],
    prepChecklist: ["기획 관련 경험 정리", "지원 직무 맞춤 이력서", "예상 면접 질문 준비"]
  },
  {
    id: "job-ux-intern",
    title: "UX 디자인 인턴",
    company: "노트그리드",
    location: "경기 성남시",
    employmentType: "intern",
    isInternOrNew: true,
    workMode: "hybrid",
    deadline: "2026-09-05",
    majorFree: false,
    foreignerOk: false,
    reasons: ["희망 직무와 가까워요", "포트폴리오를 활용할 수 있어요"]
  },
  {
    id: "job-fe-newgrad",
    title: "프론트엔드 개발 신입",
    company: "레이어스",
    location: "서울 마포구",
    employmentType: "newgrad",
    isInternOrNew: true,
    workMode: "remote",
    deadline: "2026-08-25",
    majorFree: true,
    foreignerOk: true,
    reasons: ["개인 프로젝트 경험을 활용할 수 있어요", "원격 근무 가능해요"]
  },
  {
    id: "job-cx-fulltime",
    title: "고객 경험(CX) 매니저",
    company: "데일리핏",
    location: "서울 서초구",
    employmentType: "fulltime",
    isInternOrNew: false,
    workMode: "onsite",
    deadline: "2026-09-15",
    foreignerOk: true,
    reasons: ["영어 역량을 활용할 수 있어요", "응대 경험이 도움이 돼요"]
  },
  {
    id: "job-global-mkt",
    title: "글로벌 마케팅 어시스턴트",
    company: "브릿지웨이",
    location: "서울 용산구",
    employmentType: "intern",
    isInternOrNew: true,
    workMode: "hybrid",
    deadline: "2026-09-10",
    majorFree: true,
    foreignerOk: true,
    external: true,
    externalUrl: "https://example.com/apply/global-mkt",
    reasons: ["외국인 지원 가능한 공고예요", "언어 역량을 활용할 수 있어요"]
  }
];

export function findMockJob(id: string): Job | null {
  return mockJobs.find((j) => j.id === id) ?? null;
}
