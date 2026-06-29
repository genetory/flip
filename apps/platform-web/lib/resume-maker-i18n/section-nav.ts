import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  basic: string;
  intro: string;
  coverLetter: string;
  experiences: string;
  education: string;
  awards: string;
  skills: string;
  languages: string;
  links: string;
  diagnosis: string;
  tailor: string;
  interview: string;
  design: string;
  completion: string;
  resumeCompletion: string;
  done: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    basic: "기본 정보",
    intro: "자기소개",
    coverLetter: "자소서",
    experiences: "경험",
    education: "학력",
    awards: "자격·수상",
    skills: "스킬",
    languages: "어학",
    links: "링크",
    diagnosis: "진단",
    tailor: "공고 맞춤",
    interview: "모의 면접",
    design: "디자인",
    completion: "완성도",
    resumeCompletion: "이력서 완성도",
    done: "작성됨"
  },
  en: {
    basic: "Basic info",
    intro: "About me",
    coverLetter: "Cover letter",
    experiences: "Experience",
    education: "Education",
    awards: "Certifications & awards",
    skills: "Skills",
    languages: "Languages",
    links: "Links",
    diagnosis: "Review",
    tailor: "Job match",
    interview: "Mock interview",
    design: "Design",
    completion: "Completion",
    resumeCompletion: "Resume completion",
    done: "Completed"
  },
  "zh-CN": {
    basic: "基本信息",
    intro: "自我介绍",
    coverLetter: "自荐信",
    experiences: "经历",
    education: "教育背景",
    awards: "资格·获奖",
    skills: "技能",
    languages: "语言",
    links: "链接",
    diagnosis: "诊断",
    tailor: "岗位匹配",
    interview: "模拟面试",
    design: "设计",
    completion: "完成度",
    resumeCompletion: "简历完成度",
    done: "已填写"
  },
  vi: {
    basic: "Thông tin cơ bản",
    intro: "Giới thiệu bản thân",
    coverLetter: "Thư giới thiệu",
    experiences: "Kinh nghiệm",
    education: "Học vấn",
    awards: "Chứng chỉ · Giải thưởng",
    skills: "Kỹ năng",
    languages: "Ngoại ngữ",
    links: "Liên kết",
    diagnosis: "Đánh giá",
    tailor: "Khớp tin tuyển",
    interview: "Phỏng vấn thử",
    design: "Thiết kế",
    completion: "Mức hoàn thiện",
    resumeCompletion: "Mức hoàn thiện hồ sơ",
    done: "Đã nhập"
  },
  ja: {
    basic: "基本情報",
    intro: "自己紹介",
    coverLetter: "自己PR書",
    experiences: "経験",
    education: "学歴",
    awards: "資格・受賞",
    skills: "スキル",
    languages: "語学",
    links: "リンク",
    diagnosis: "診断",
    tailor: "求人マッチ",
    interview: "模擬面接",
    design: "デザイン",
    completion: "完成度",
    resumeCompletion: "履歴書の完成度",
    done: "入力済み"
  },
  id: {
    basic: "Info dasar",
    intro: "Tentang saya",
    coverLetter: "Surat lamaran",
    experiences: "Pengalaman",
    education: "Pendidikan",
    awards: "Sertifikat & penghargaan",
    skills: "Keahlian",
    languages: "Bahasa",
    links: "Tautan",
    diagnosis: "Diagnosis",
    tailor: "Cocokkan lowongan",
    interview: "Wawancara simulasi",
    design: "Desain",
    completion: "Kelengkapan",
    resumeCompletion: "Kelengkapan resume",
    done: "Sudah diisi"
  }
};

export function useSectionNavCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
