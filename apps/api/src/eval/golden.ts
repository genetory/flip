// 골든 케이스 — 전부 합성(가상 인물). 공개 레포 규칙상 실제 사용자 데이터·PII 금지.
// 실제 사용 분포를 대표하도록: 경험 충분/부족, draft/polish, 키워드 보강, 분량 목표 등을 섞는다.
import type { GoldenCase } from "./types";

export const GOLDEN: GoldenCase[] = [
  {
    id: "cover_motive_basic",
    feature: "cover_letter",
    note: "경험 풍부 + 지원동기 문항 + 분량 목표",
    input: {
      mode: "draft",
      prompt: "우리 회사에 지원한 동기와 입사 후 목표를 알려주세요.",
      companyName: "테크브릿지",
      desiredJobRole: "백엔드 개발",
      targetChars: 700,
      skills: ["Python", "Django", "PostgreSQL", "Git"],
      education: [{ school: "가상대학교", major: "컴퓨터공학", status: "재학" }],
      experiences: [
        {
          title: "교내 학사관리 웹서비스 개선 프로젝트",
          type: "팀 프로젝트",
          org: "컴퓨터공학과",
          period: "3개월",
          summary: "동아리 회원 관리 웹앱을 팀 4명으로 개발",
          bullets: ["회원 가입·출석 기능 백엔드 담당", "Django REST API 설계", "PostgreSQL 스키마 구성"]
        }
      ]
    }
  },
  {
    id: "cover_growth_thin",
    feature: "cover_letter",
    note: "경험 부족(학력·스킬 위주) — 담백하게, 지어내면 안 됨",
    input: {
      mode: "draft",
      prompt: "성장 과정과 가치관을 소개해 주세요.",
      companyName: "그린리테일",
      desiredJobRole: "MD 어시스턴트",
      targetChars: 600,
      education: [{ school: "가상여자대학교", major: "의류학", status: "졸업예정" }],
      skills: ["Excel", "포토샵"]
    }
  },
  {
    id: "cover_polish_keywords",
    feature: "cover_letter",
    note: "polish + 반드시 반영할 소재(키워드) 녹여넣기",
    input: {
      mode: "polish",
      style: "expand",
      prompt: "지원 동기를 알려주세요.",
      current: "저는 마케팅에 관심이 많아 지원하게 되었습니다.",
      keywords: ["교내 홍보 동아리 2년 활동", "SNS 콘텐츠 조회수 개선 경험"],
      companyName: "브랜드하우스",
      desiredJobRole: "마케팅"
    }
  },
  {
    id: "cover_jd_grounded",
    feature: "cover_letter",
    note: "JD 그라운딩 — 공고 요구역량에 지원자 경험을 연결",
    input: {
      mode: "draft",
      prompt: "지원 동기와 직무 역량을 알려주세요.",
      companyName: "데이터윙",
      desiredJobRole: "데이터 분석",
      targetChars: 700,
      jobText:
        "[데이터 분석가 채용] 주요 업무: SQL로 사내 데이터를 추출·분석하고 대시보드를 제작하며 A/B 테스트를 설계합니다. 자격요건: SQL 능숙, 통계 기초 지식, 원활한 커뮤니케이션. 우대사항: Python 활용, Tableau, 마케팅 데이터 분석 경험.",
      skills: ["SQL", "Python", "Excel"],
      education: [{ school: "가상대학교", major: "통계학", status: "졸업예정" }],
      experiences: [
        {
          title: "교내 설문 데이터 분석 프로젝트",
          type: "팀 프로젝트",
          summary: "설문 응답을 SQL과 Python으로 분석해 리포트를 작성",
          bullets: ["SQL로 데이터 추출·집계", "Python으로 시각화 및 리포트화"]
        }
      ]
    }
  },
  {
    id: "intro_polish_basic",
    feature: "polish_intro",
    note: "자기소개 다듬기 — 설득력 있게, 없는 사실 금지",
    input: {
      style: "professional",
      desiredJobRole: "백엔드 개발",
      text: "저는 컴퓨터공학을 전공했고 팀 프로젝트를 여러 번 해봤습니다. 백엔드 개발에 관심이 많고 꾸준히 공부하고 있습니다."
    }
  },
  {
    id: "intro_polish_keywords",
    feature: "polish_intro",
    note: "자기소개 + 반드시 반영할 소재",
    input: {
      style: "expand",
      desiredJobRole: "데이터 분석",
      text: "데이터로 문제를 푸는 일을 좋아합니다.",
      keywords: ["학과 데이터 분석 스터디 1년 운영", "SQL·Python 자격증 취득"]
    }
  },
  {
    id: "draft_intro_improve",
    feature: "draft_resume_text",
    note: "자기소개 개선(improve) — 없는 사실 금지",
    input: {
      fieldType: "selfIntroduction",
      mode: "improve",
      currentText: "안녕하세요 저는 성실하고 책임감 있는 사람입니다 팀에서 잘 협력합니다"
    }
  },
  {
    id: "draft_career_generate",
    feature: "draft_resume_text",
    note: "경력 설명 생성(generate) — hints·맥락만으로, 수치 날조 금지",
    input: {
      fieldType: "career",
      mode: "generate",
      currentText: "",
      context: { companyName: "가상카페", position: "바리스타" },
      hints: "주문 응대, 음료 제조, 재고 관리, 신입 교육 보조"
    }
  },
  {
    id: "polish_exp_messy",
    feature: "polish_experience",
    note: "여러 일을 줄바꿈으로 나열한 거친 입력 → 한 단락 정리",
    input: {
      style: "natural",
      type: "인턴",
      text: "카페에서 일함\n주문받고 음료 만들고\n재고 정리도 했고 신입 교육도 좀 도와줌\n손님 응대"
    }
  },
  {
    id: "polish_exp_achievement",
    feature: "polish_experience",
    note: "성과 중심 재구성 — 없는 수치 지어내면 안 됨",
    input: {
      style: "achievement",
      type: "대외활동",
      text: "학교 축제 부스를 기획하고 운영했다. 팀원들과 역할을 나눠 홍보물을 만들고 현장 운영을 맡았다."
    }
  }
];
