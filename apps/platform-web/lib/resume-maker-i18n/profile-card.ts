import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  anonymousCandidate: string;
  statusSubmittable: string;
  statusNeedsPolish: string;
  statusNotSubmittable: string;
  completenessLabel: string;
  labelNationality: string;
  labelVisa: string;
  labelKorean: string;
  labelEnglish: string;
  labelMajor: string;
  labelDesiredLocation: string;
  labelAvailableFrom: string;
  sectionExperiences: string;
  sectionSkills: string;
  sectionRecommendedRoles: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    anonymousCandidate: "익명 후보",
    statusSubmittable: "기업 추천 가능",
    statusNeedsPolish: "보완 후 추천 가능",
    statusNotSubmittable: "작성 보완 필요",
    completenessLabel: "완성도",
    labelNationality: "국적",
    labelVisa: "비자",
    labelKorean: "한국어",
    labelEnglish: "영어",
    labelMajor: "전공",
    labelDesiredLocation: "희망 근무지",
    labelAvailableFrom: "근무 가능 시점",
    sectionExperiences: "주요 경험",
    sectionSkills: "핵심 역량",
    sectionRecommendedRoles: "추천 직무"
  },
  en: {
    anonymousCandidate: "Anonymous candidate",
    statusSubmittable: "Ready to recommend",
    statusNeedsPolish: "Recommend after polishing",
    statusNotSubmittable: "Needs more details",
    completenessLabel: "Completeness",
    labelNationality: "Nationality",
    labelVisa: "Visa",
    labelKorean: "Korean",
    labelEnglish: "English",
    labelMajor: "Major",
    labelDesiredLocation: "Preferred location",
    labelAvailableFrom: "Available from",
    sectionExperiences: "Key experience",
    sectionSkills: "Core skills",
    sectionRecommendedRoles: "Recommended roles"
  },
  "zh-CN": {
    anonymousCandidate: "匿名候选人",
    statusSubmittable: "可推荐给企业",
    statusNeedsPolish: "完善后可推荐",
    statusNotSubmittable: "需补充内容",
    completenessLabel: "完整度",
    labelNationality: "国籍",
    labelVisa: "签证",
    labelKorean: "韩语",
    labelEnglish: "英语",
    labelMajor: "专业",
    labelDesiredLocation: "期望工作地点",
    labelAvailableFrom: "可入职时间",
    sectionExperiences: "主要经历",
    sectionSkills: "核心能力",
    sectionRecommendedRoles: "推荐职位"
  },
  vi: {
    anonymousCandidate: "Ứng viên ẩn danh",
    statusSubmittable: "Sẵn sàng giới thiệu",
    statusNeedsPolish: "Giới thiệu sau khi hoàn thiện",
    statusNotSubmittable: "Cần bổ sung thông tin",
    completenessLabel: "Mức độ hoàn thiện",
    labelNationality: "Quốc tịch",
    labelVisa: "Thị thực",
    labelKorean: "Tiếng Hàn",
    labelEnglish: "Tiếng Anh",
    labelMajor: "Chuyên ngành",
    labelDesiredLocation: "Nơi làm việc mong muốn",
    labelAvailableFrom: "Có thể bắt đầu từ",
    sectionExperiences: "Kinh nghiệm chính",
    sectionSkills: "Năng lực cốt lõi",
    sectionRecommendedRoles: "Vị trí đề xuất"
  },
  ja: {
    anonymousCandidate: "匿名候補者",
    statusSubmittable: "企業に推薦可能",
    statusNeedsPolish: "補完後に推薦可能",
    statusNotSubmittable: "内容の補完が必要",
    completenessLabel: "完成度",
    labelNationality: "国籍",
    labelVisa: "ビザ",
    labelKorean: "韓国語",
    labelEnglish: "英語",
    labelMajor: "専攻",
    labelDesiredLocation: "希望勤務地",
    labelAvailableFrom: "勤務可能時期",
    sectionExperiences: "主な経験",
    sectionSkills: "コアスキル",
    sectionRecommendedRoles: "おすすめ職種"
  },
  id: {
    anonymousCandidate: "Kandidat anonim",
    statusSubmittable: "Siap direkomendasikan",
    statusNeedsPolish: "Rekomendasi setelah dilengkapi",
    statusNotSubmittable: "Perlu dilengkapi",
    completenessLabel: "Kelengkapan",
    labelNationality: "Kewarganegaraan",
    labelVisa: "Visa",
    labelKorean: "Bahasa Korea",
    labelEnglish: "Bahasa Inggris",
    labelMajor: "Jurusan",
    labelDesiredLocation: "Lokasi yang diinginkan",
    labelAvailableFrom: "Tersedia mulai",
    sectionExperiences: "Pengalaman utama",
    sectionSkills: "Kompetensi inti",
    sectionRecommendedRoles: "Posisi yang direkomendasikan"
  }
};

export function useProfileCardCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
