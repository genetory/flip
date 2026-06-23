// resume-maker i18n — 여러 컴포넌트가 공유하는 데이터 라벨(경험 유형·상태·다듬기
// 스타일·이력서 섹션)을 6개 언어로 번역. 컴포넌트는 EXPERIENCE_TYPES.label 처럼
// 박혀 있던 한국어 라벨 대신 여기의 훅(현재 locale 기준 라벨 함수)을 쓴다.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";
import type { ExperienceType, ExperienceStatus } from "../resume-maker-types";
import type { ResumeSectionKey } from "../resume-maker-types";
import type { PolishStyle } from "../resume-maker-client";

function useLocale(): PlatformLocale {
  const { locale } = useLanguage();
  return locale;
}

// ── 경험 유형 ──
const EXPERIENCE_TYPE_LABELS: Record<PlatformLocale, Record<ExperienceType, string>> = {
  ko: {
    career: "경력", intern: "인턴", part_time: "아르바이트", school_project: "학교 프로젝트",
    personal_project: "개인 프로젝트", club: "동아리", external_activity: "대외활동",
    competition: "공모전", volunteer: "봉사활동", education: "교육 수료", side_project: "사이드 프로젝트", etc: "기타"
  },
  en: {
    career: "Work experience", intern: "Internship", part_time: "Part-time", school_project: "School project",
    personal_project: "Personal project", club: "Club", external_activity: "Extracurricular",
    competition: "Competition", volunteer: "Volunteering", education: "Course / Training", side_project: "Side project", etc: "Other"
  },
  "zh-CN": {
    career: "工作经历", intern: "实习", part_time: "兼职", school_project: "学校项目",
    personal_project: "个人项目", club: "社团", external_activity: "校外活动",
    competition: "竞赛", volunteer: "志愿服务", education: "培训结业", side_project: "副业项目", etc: "其他"
  },
  vi: {
    career: "Kinh nghiệm làm việc", intern: "Thực tập", part_time: "Bán thời gian", school_project: "Dự án ở trường",
    personal_project: "Dự án cá nhân", club: "Câu lạc bộ", external_activity: "Hoạt động ngoại khóa",
    competition: "Cuộc thi", volunteer: "Tình nguyện", education: "Khóa đào tạo", side_project: "Dự án phụ", etc: "Khác"
  },
  ja: {
    career: "職務経歴", intern: "インターン", part_time: "アルバイト", school_project: "学校プロジェクト",
    personal_project: "個人プロジェクト", club: "サークル", external_activity: "課外活動",
    competition: "コンテスト", volunteer: "ボランティア", education: "研修修了", side_project: "サイドプロジェクト", etc: "その他"
  },
  id: {
    career: "Pengalaman kerja", intern: "Magang", part_time: "Paruh waktu", school_project: "Proyek sekolah",
    personal_project: "Proyek pribadi", club: "Klub", external_activity: "Kegiatan ekstrakurikuler",
    competition: "Kompetisi", volunteer: "Sukarelawan", education: "Pelatihan", side_project: "Proyek sampingan", etc: "Lainnya"
  }
};

export function useExperienceTypeLabel(): (type: ExperienceType) => string {
  const locale = useLocale();
  const map = EXPERIENCE_TYPE_LABELS[locale] ?? EXPERIENCE_TYPE_LABELS.en;
  return (type) => map[type] ?? EXPERIENCE_TYPE_LABELS.en[type] ?? map.etc;
}

// ── 경험 상태 ──
const STATUS_LABELS: Record<PlatformLocale, Record<ExperienceStatus, string>> = {
  ko: { collecting: "내용 수집 중", needs_questions: "추가 질문 필요", generated: "문장 생성 완료", ready: "이력서 사용 가능" },
  en: { collecting: "Collecting", needs_questions: "Needs questions", generated: "Draft ready", ready: "Ready to use" },
  "zh-CN": { collecting: "收集中", needs_questions: "需补充提问", generated: "已生成草稿", ready: "可用于简历" },
  vi: { collecting: "Đang thu thập", needs_questions: "Cần thêm câu hỏi", generated: "Đã tạo nháp", ready: "Sẵn sàng dùng" },
  ja: { collecting: "収集中", needs_questions: "追加質問が必要", generated: "文章生成済み", ready: "履歴書に使用可" },
  id: { collecting: "Mengumpulkan", needs_questions: "Perlu pertanyaan", generated: "Draf siap", ready: "Siap dipakai" }
};

export function useResumeStatusLabel(): (status: ExperienceStatus) => string {
  const locale = useLocale();
  const map = STATUS_LABELS[locale] ?? STATUS_LABELS.en;
  return (status) => map[status] ?? STATUS_LABELS.en[status] ?? "";
}

// ── 다듬기 스타일 ──
const POLISH_STYLE_LABELS: Record<PlatformLocale, Record<PolishStyle, string>> = {
  ko: { natural: "자연스럽게", expand: "자세히 풀어쓰기", concise: "간결하게", achievement: "성과 강조", professional: "전문적으로", impact: "강점 강조" },
  en: { natural: "Natural", expand: "Expand in detail", concise: "Concise", achievement: "Emphasize results", professional: "Professional", impact: "Emphasize strengths" },
  "zh-CN": { natural: "自然", expand: "详细展开", concise: "简洁", achievement: "强调成果", professional: "专业", impact: "强调优势" },
  vi: { natural: "Tự nhiên", expand: "Diễn giải chi tiết", concise: "Súc tích", achievement: "Nhấn mạnh thành quả", professional: "Chuyên nghiệp", impact: "Nhấn mạnh điểm mạnh" },
  ja: { natural: "自然に", expand: "詳しく展開", concise: "簡潔に", achievement: "成果を強調", professional: "プロフェッショナルに", impact: "強みを強調" },
  id: { natural: "Natural", expand: "Uraikan detail", concise: "Ringkas", achievement: "Tekankan hasil", professional: "Profesional", impact: "Tekankan kelebihan" }
};

export function usePolishStyleLabel(): (style: PolishStyle) => string {
  const locale = useLocale();
  const map = POLISH_STYLE_LABELS[locale] ?? POLISH_STYLE_LABELS.en;
  return (style) => map[style] ?? POLISH_STYLE_LABELS.en[style] ?? "";
}

// ── 이력서 섹션 라벨 ──
const SECTION_LABELS: Record<PlatformLocale, Record<ResumeSectionKey, string>> = {
  ko: { summary: "요약", selfIntro: "자기소개", careers: "경력", activities: "활동 · 프로젝트", education: "학력", certifications: "자격 · 수상", skills: "스킬", languages: "어학", links: "링크" },
  en: { summary: "Summary", selfIntro: "Introduction", careers: "Experience", activities: "Activities & Projects", education: "Education", certifications: "Certifications & Awards", skills: "Skills", languages: "Languages", links: "Links" },
  "zh-CN": { summary: "摘要", selfIntro: "自我介绍", careers: "工作经历", activities: "活动与项目", education: "学历", certifications: "资格与获奖", skills: "技能", languages: "语言", links: "链接" },
  vi: { summary: "Tóm tắt", selfIntro: "Giới thiệu", careers: "Kinh nghiệm", activities: "Hoạt động & Dự án", education: "Học vấn", certifications: "Chứng chỉ & Giải thưởng", skills: "Kỹ năng", languages: "Ngoại ngữ", links: "Liên kết" },
  ja: { summary: "要約", selfIntro: "自己紹介", careers: "職務経歴", activities: "活動・プロジェクト", education: "学歴", certifications: "資格・受賞", skills: "スキル", languages: "語学", links: "リンク" },
  id: { summary: "Ringkasan", selfIntro: "Perkenalan", careers: "Pengalaman", activities: "Aktivitas & Proyek", education: "Pendidikan", certifications: "Sertifikat & Penghargaan", skills: "Keterampilan", languages: "Bahasa", links: "Tautan" }
};

export function useResumeSectionLabel(): (key: ResumeSectionKey) => string {
  const locale = useLocale();
  const map = SECTION_LABELS[locale] ?? SECTION_LABELS.en;
  return (key) => map[key] ?? SECTION_LABELS.en[key] ?? "";
}

// ── 완성도 레벨 라벨(시작 단계·성장 중·거의 다 됐어요·완성) ──
type ResumeLevelKey = "seed" | "growing" | "strong" | "done";
const LEVEL_LABELS: Record<PlatformLocale, Record<ResumeLevelKey, string>> = {
  ko: { seed: "시작 단계", growing: "성장 중", strong: "거의 다 됐어요", done: "완성" },
  en: { seed: "Getting started", growing: "Growing", strong: "Almost there", done: "Complete" },
  "zh-CN": { seed: "起步阶段", growing: "成长中", strong: "就快完成", done: "完成" },
  vi: { seed: "Mới bắt đầu", growing: "Đang phát triển", strong: "Sắp xong", done: "Hoàn thành" },
  ja: { seed: "スタート", growing: "成長中", strong: "もう少し", done: "完成" },
  id: { seed: "Tahap awal", growing: "Berkembang", strong: "Hampir selesai", done: "Selesai" }
};

export function useProgressLevelLabel(): (key: ResumeLevelKey) => string {
  const locale = useLocale();
  const map = LEVEL_LABELS[locale] ?? LEVEL_LABELS.en;
  return (key) => map[key] ?? LEVEL_LABELS.en[key] ?? "";
}
