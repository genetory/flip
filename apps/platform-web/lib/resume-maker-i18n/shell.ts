import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  home: string;
  toolResumeMaker: string;
  toolTailor: string;
  toolInterview: string;
  wipBadge: string;
  loading: string;
  redirectingToLogin: string;
  studentOnlyTitle: string;
  studentOnlyDesc: string;
  goHome: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    home: "홈",
    toolResumeMaker: "나의 이력서",
    toolTailor: "공고 맞춤",
    toolInterview: "모의 면접",
    wipBadge: "준비중",
    loading: "불러오는 중...",
    redirectingToLogin: "로그인 페이지로 이동 중...",
    studentOnlyTitle: "구직 회원 전용 기능이에요",
    studentOnlyDesc:
      "AI 이력서 만들기는 구직 회원(학생) 계정에서 사용할 수 있어요. 구직 회원으로 로그인한 뒤 다시 시도해 주세요.",
    goHome: "홈으로"
  },
  en: {
    home: "Home",
    toolResumeMaker: "My Resume",
    toolTailor: "Job Match",
    toolInterview: "Mock Interview",
    wipBadge: "Soon",
    loading: "Loading...",
    redirectingToLogin: "Redirecting to login...",
    studentOnlyTitle: "This feature is for job seekers only",
    studentOnlyDesc:
      "The AI Resume Builder is available on job seeker (student) accounts. Please sign in as a job seeker and try again.",
    goHome: "Go home"
  },
  "zh-CN": {
    home: "首页",
    toolResumeMaker: "我的简历",
    toolTailor: "岗位匹配",
    toolInterview: "模拟面试",
    wipBadge: "即将",
    loading: "加载中...",
    redirectingToLogin: "正在跳转到登录页面...",
    studentOnlyTitle: "此功能仅限求职会员使用",
    studentOnlyDesc:
      "AI 简历制作功能仅可在求职会员（学生）账号上使用。请以求职会员身份登录后重试。",
    goHome: "返回首页"
  },
  vi: {
    home: "Trang chủ",
    toolResumeMaker: "Hồ sơ của tôi",
    toolTailor: "Khớp tin tuyển",
    toolInterview: "Phỏng vấn thử",
    wipBadge: "Sắp",
    loading: "Đang tải...",
    redirectingToLogin: "Đang chuyển đến trang đăng nhập...",
    studentOnlyTitle: "Tính năng này chỉ dành cho người tìm việc",
    studentOnlyDesc:
      "Trình tạo hồ sơ AI chỉ khả dụng với tài khoản người tìm việc (sinh viên). Vui lòng đăng nhập bằng tài khoản người tìm việc rồi thử lại.",
    goHome: "Về trang chủ"
  },
  ja: {
    home: "ホーム",
    toolResumeMaker: "マイ履歴書",
    toolTailor: "求人マッチ",
    toolInterview: "模擬面接",
    wipBadge: "準備中",
    loading: "読み込み中...",
    redirectingToLogin: "ログインページに移動中...",
    studentOnlyTitle: "求職会員専用の機能です",
    studentOnlyDesc:
      "AI履歴書作成は求職会員（学生）アカウントでご利用いただけます。求職会員としてログインしてから、もう一度お試しください。",
    goHome: "ホームへ"
  },
  id: {
    home: "Beranda",
    toolResumeMaker: "Resume Saya",
    toolTailor: "Cocokkan Lowongan",
    toolInterview: "Wawancara Simulasi",
    wipBadge: "Segera",
    loading: "Memuat...",
    redirectingToLogin: "Mengalihkan ke halaman masuk...",
    studentOnlyTitle: "Fitur ini hanya untuk pencari kerja",
    studentOnlyDesc:
      "Pembuat Resume AI tersedia untuk akun pencari kerja (pelajar). Silakan masuk sebagai pencari kerja lalu coba lagi.",
    goHome: "Ke beranda"
  }
};

export function useShellCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
