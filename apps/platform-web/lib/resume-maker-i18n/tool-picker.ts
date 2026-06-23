// resume-maker i18n — 도구별 이력서 선택 화면(ResumeToolPicker) 네임스페이스.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  titleTailor: string;
  titleInterview: string;
  desc: string;
  lastEdited: string;
  untitled: string;
  emptyTitle: string;
  emptyDesc: string;
  createBtn: string;
  loadFailed: string;
  otherResume: string;
  back: string;
  expand: string;
  preview: string;
  resumeList: string;
  newResume: string;
  wipTitle: string;
  wipDesc: string;
  badgeTailor: string;
  badgeInterview: string;
  listTitle: string;
  startTailor: string;
  startInterview: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    titleTailor: "지원할 공고에 맞춰\n이력서를 다듬어요.",
    titleInterview: "예상 질문으로\n면접을 미리 연습해요.",
    desc: "진행할 이력서를 선택하세요.",
    lastEdited: "마지막 수정",
    untitled: "제목 없는 이력서",
    emptyTitle: "아직 이력서가 없어요",
    emptyDesc: "먼저 이력서를 만들어 주세요.",
    createBtn: "이력서 만들기",
    loadFailed: "이력서 목록을 불러오지 못했어요.",
    otherResume: "다른 이력서",
    back: "뒤로",
    expand: "크게 보기",
    preview: "이력서 미리보기",
    resumeList: "이력서 목록",
    newResume: "새 이력서",
    wipTitle: "준비 중이에요",
    wipDesc: "이 기능은 곧 공개됩니다.",
    badgeTailor: "AI 공고 맞춤",
    badgeInterview: "AI 모의 면접",
    listTitle: "내 이력서",
    startTailor: "맞춤 시작",
    startInterview: "면접 시작"
  },
  en: {
    titleTailor: "Tailor your resume\nto the job you want.",
    titleInterview: "Practice your interview\nwith likely questions.",
    desc: "Pick the resume you want to work with.",
    lastEdited: "Last edited",
    untitled: "Untitled resume",
    emptyTitle: "No resume yet",
    emptyDesc: "Create a resume first.",
    createBtn: "Create a resume",
    loadFailed: "Couldn't load your resumes.",
    otherResume: "Other resume",
    back: "Back",
    expand: "View large",
    preview: "Resume preview",
    resumeList: "Resume list",
    newResume: "New resume",
    wipTitle: "Coming soon",
    wipDesc: "This feature will be available soon.",
    badgeTailor: "AI Job Match",
    badgeInterview: "AI Mock Interview",
    listTitle: "My resumes",
    startTailor: "Tailor",
    startInterview: "Start"
  },
  "zh-CN": {
    titleTailor: "针对目标岗位\n优化你的简历。",
    titleInterview: "用可能的问题\n提前练习面试。",
    desc: "请选择要使用的简历。",
    lastEdited: "最后编辑",
    untitled: "未命名简历",
    emptyTitle: "还没有简历",
    emptyDesc: "请先创建一份简历。",
    createBtn: "制作简历",
    loadFailed: "无法加载简历列表。",
    otherResume: "其他简历",
    back: "返回",
    expand: "放大查看",
    preview: "简历预览",
    resumeList: "简历列表",
    newResume: "新建简历",
    wipTitle: "即将上线",
    wipDesc: "此功能即将开放。",
    badgeTailor: "AI 岗位匹配",
    badgeInterview: "AI 模拟面试",
    listTitle: "我的简历",
    startTailor: "开始优化",
    startInterview: "开始面试"
  },
  vi: {
    titleTailor: "Tinh chỉnh hồ sơ\ntheo tin tuyển dụng.",
    titleInterview: "Luyện phỏng vấn\nvới câu hỏi có thể gặp.",
    desc: "Chọn hồ sơ bạn muốn dùng.",
    lastEdited: "Sửa lần cuối",
    untitled: "Hồ sơ chưa đặt tên",
    emptyTitle: "Chưa có hồ sơ",
    emptyDesc: "Hãy tạo hồ sơ trước.",
    createBtn: "Tạo hồ sơ",
    loadFailed: "Không tải được danh sách hồ sơ.",
    otherResume: "Hồ sơ khác",
    back: "Quay lại",
    expand: "Xem lớn",
    preview: "Xem trước hồ sơ",
    resumeList: "Danh sách hồ sơ",
    newResume: "Hồ sơ mới",
    wipTitle: "Sắp ra mắt",
    wipDesc: "Tính năng này sẽ sớm ra mắt.",
    badgeTailor: "AI Khớp tin tuyển",
    badgeInterview: "AI Phỏng vấn thử",
    listTitle: "Hồ sơ của tôi",
    startTailor: "Tối ưu",
    startInterview: "Bắt đầu"
  },
  ja: {
    titleTailor: "応募する求人に合わせて\n履歴書を整えましょう。",
    titleInterview: "想定質問で\n面接を事前に練習。",
    desc: "使用する履歴書を選んでください。",
    lastEdited: "最終編集",
    untitled: "無題の履歴書",
    emptyTitle: "まだ履歴書がありません",
    emptyDesc: "まず履歴書を作成してください。",
    createBtn: "履歴書を作成",
    loadFailed: "履歴書一覧を読み込めませんでした。",
    otherResume: "別の履歴書",
    back: "戻る",
    expand: "拡大表示",
    preview: "履歴書プレビュー",
    resumeList: "履歴書一覧",
    newResume: "新しい履歴書",
    wipTitle: "準備中です",
    wipDesc: "この機能は近日公開予定です。",
    badgeTailor: "AI求人マッチ",
    badgeInterview: "AI模擬面接",
    listTitle: "マイ履歴書",
    startTailor: "最適化",
    startInterview: "開始"
  },
  id: {
    titleTailor: "Sesuaikan resume Anda\ndengan lowongan incaran.",
    titleInterview: "Latih wawancara Anda\ndengan pertanyaan yang mungkin.",
    desc: "Pilih resume yang ingin Anda gunakan.",
    lastEdited: "Terakhir diubah",
    untitled: "Resume tanpa judul",
    emptyTitle: "Belum ada resume",
    emptyDesc: "Buat resume terlebih dahulu.",
    createBtn: "Buat resume",
    loadFailed: "Tidak dapat memuat daftar resume.",
    otherResume: "Resume lain",
    back: "Kembali",
    expand: "Lihat besar",
    preview: "Pratinjau resume",
    resumeList: "Daftar resume",
    newResume: "Resume baru",
    wipTitle: "Segera hadir",
    wipDesc: "Fitur ini akan segera tersedia.",
    badgeTailor: "AI Cocokkan Lowongan",
    badgeInterview: "AI Wawancara Simulasi",
    listTitle: "Resume saya",
    startTailor: "Sesuaikan",
    startInterview: "Mulai"
  }
};

export function useToolPickerCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
