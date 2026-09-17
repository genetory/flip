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
