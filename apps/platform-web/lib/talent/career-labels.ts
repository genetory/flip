// 커리어(이력서·자소서) 데이터 라벨의 화면 표기용 로컬라이즈 헬퍼.
// SECTION_META.label / COVER_QUESTIONS 값은 데이터 키로 유지하고, 표시할 때만 이 함수로 번역한다.
import type { PlatformT } from "../i18n";
import type { CareerSection } from "./career-chat";

// 이력서 섹션 라벨.
export function sectionLabelOf(t: PlatformT, section: CareerSection): string {
  switch (section) {
    case "education":
      return t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan");
    case "certificate":
      return t("자격증", "Certificates", "证书", "Chứng chỉ", "資格", "Sertifikat");
    case "experience":
      return t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman");
    case "project":
      return t("프로젝트", "Projects", "项目", "Dự án", "プロジェクト", "Proyek");
    case "language":
      return t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa");
    case "skill":
      return t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian");
    case "award":
      return t("수상", "Awards", "获奖", "Giải thưởng", "受賞", "Penghargaan");
    case "activity":
      return t("대외활동", "Activities", "课外活动", "Hoạt động", "課外活動", "Aktivitas");
    default:
      return section;
  }
}

// 모의 면접 카테고리 라벨(CATEGORY_META 값 → 표시 라벨).
export function mockCategoryLabelOf(t: PlatformT, category: string): string {
  switch (category) {
    case "job":
      return t("이 공고 맞춤", "Tailored to this posting", "针对该职位", "Theo tin tuyển dụng này", "この求人に特化", "Sesuai lowongan ini");
    case "intro":
      return t("자기소개·지원동기", "Intro & motivation", "自我介绍·动机", "Giới thiệu & động lực", "自己紹介・志望動機", "Perkenalan & motivasi");
    case "competency":
      return t("직무 역량", "Job skills", "岗位能力", "Năng lực", "職務能力", "Kompetensi");
    case "experience":
      return t("경험 심층", "Experience deep-dive", "经历深挖", "Kinh nghiệm chuyên sâu", "経験の深掘り", "Pengalaman mendalam");
    case "weakness":
      return t("인성·상황", "Personality & situations", "性格·情境", "Tính cách & tình huống", "人柄・状況", "Kepribadian & situasi");
    case "other":
      return t("기타", "Other", "其他", "Khác", "その他", "Lainnya");
    default:
      return category;
  }
}

// 자기소개서 문항 라벨(COVER_QUESTIONS 값 → 표시 라벨).
export function coverQuestionLabelOf(t: PlatformT, q: string): string {
  switch (q) {
    case "지원 동기":
      return t("지원 동기", "Motivation", "应聘动机", "Động lực ứng tuyển", "志望動機", "Motivasi melamar");
    case "나의 강점과 준비된 경험":
      return t("나의 강점과 준비된 경험", "Strengths & experience", "我的优势与经验", "Điểm mạnh & kinh nghiệm", "強みと準備した経験", "Kekuatan & pengalaman");
    case "성장 과정":
      return t("성장 과정", "Background", "成长经历", "Quá trình trưởng thành", "成長過程", "Latar belakang");
    case "성격의 장단점":
      return t("성격의 장단점", "Strengths & weaknesses", "性格优缺点", "Ưu & nhược điểm", "性格の長所短所", "Kelebihan & kekurangan");
    case "입사 후 포부":
      return t("입사 후 포부", "Goals after joining", "入职后抱负", "Mục tiêu sau khi vào", "入社後の抱負", "Aspirasi setelah bergabung");
    default:
      return q;
  }
}
