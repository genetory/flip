// resume-maker i18n — 도구별 이력서 선택 화면(ResumeToolPicker) 네임스페이스.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  titleTailor: string;
  titleInterview: string;
  desc: string;
  lastEdited: string;
  untitled: string;
  change: string;
  switchResume: string;
  completion: string;
  emptyTitle: string;
  emptyDesc: string;
  createBtn: string;
  loadFailed: string;
  otherResume: string;
  back: string;
  expand: string;
  preview: string;
  previewPdf: string;
  resumeList: string;
  newResume: string;
  wipTitle: string;
  wipDesc: string;
  badgeTailor: string;
  badgeInterview: string;
  listTitle: string;
  startTailor: string;
  startInterview: string;
  selectResume: string;
  selectCoverLetter: string;
  noCoverLetter: string;
  editItem: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    titleTailor: "지원하려는 공고에 딱 맞게\n내 이력서를 분석하고 다듬어 드려요",
    titleInterview: "나올 법한 질문을 미리 뽑아\n실전처럼 면접을 연습해 보세요",
    desc: "진행할 이력서를 선택하세요.",
    lastEdited: "마지막 수정",
    untitled: "제목 없는 이력서",
    change: "변경",
    switchResume: "이력서 변경",
    completion: "완성도",
    emptyTitle: "아직 이력서가 없어요",
    emptyDesc: "먼저 이력서를 만들어 주세요.",
    createBtn: "이력서 만들기",
    loadFailed: "이력서 목록을 불러오지 못했어요.",
    otherResume: "다른 이력서",
    back: "뒤로",
    expand: "크게 보기",
    preview: "이력서 미리보기",
    previewPdf: "미리보기·PDF",
    resumeList: "이력서 목록",
    newResume: "새 이력서",
    wipTitle: "준비 중이에요",
    wipDesc: "이 기능은 곧 공개됩니다.",
    badgeTailor: "AI 공고 맞춤",
    badgeInterview: "AI 모의 면접",
    listTitle: "내 이력서",
    startTailor: "맞춤 시작",
    startInterview: "면접 시작",
    selectResume: "이력서 선택",
    selectCoverLetter: "자기소개서 (선택)",
    noCoverLetter: "선택 안 함",
    editItem: "수정하기"
  },
  en: {
    titleTailor: "We analyze and refine your resume\nto fit the job you are applying to",
    titleInterview: "Practice like the real thing\nwith the questions you are likely to get",
    desc: "Pick the resume you want to work with.",
    lastEdited: "Last edited",
    untitled: "Untitled resume",
    change: "Change",
    switchResume: "Switch resume",
    completion: "Complete",
    emptyTitle: "No resume yet",
    emptyDesc: "Create a resume first.",
    createBtn: "Create a resume",
    loadFailed: "Couldn't load your resumes.",
    otherResume: "Other resume",
    back: "Back",
    expand: "View large",
    preview: "Resume preview",
    previewPdf: "Preview · PDF",
    resumeList: "Resume list",
    newResume: "New resume",
    wipTitle: "Coming soon",
    wipDesc: "This feature will be available soon.",
    badgeTailor: "AI Job Match",
    badgeInterview: "AI Mock Interview",
    listTitle: "My resumes",
    startTailor: "Tailor",
    startInterview: "Start",
    selectResume: "Choose a resume",
    selectCoverLetter: "Cover letter (optional)",
    noCoverLetter: "None",
    editItem: "Edit"
  },
  "zh-CN": {
    titleTailor: "针对你要应聘的岗位\n分析并优化你的简历",
    titleInterview: "提前准备可能出现的问题\n像实战一样练习面试",
    desc: "请选择要使用的简历。",
    lastEdited: "最后编辑",
    untitled: "未命名简历",
    change: "更换",
    switchResume: "更换简历",
    completion: "完成度",
    emptyTitle: "还没有简历",
    emptyDesc: "请先创建一份简历。",
    createBtn: "制作简历",
    loadFailed: "无法加载简历列表。",
    otherResume: "其他简历",
    back: "返回",
    expand: "放大查看",
    preview: "简历预览",
    previewPdf: "预览 · PDF",
    resumeList: "简历列表",
    newResume: "新建简历",
    wipTitle: "即将上线",
    wipDesc: "此功能即将开放。",
    badgeTailor: "AI 岗位匹配",
    badgeInterview: "AI 模拟面试",
    listTitle: "我的简历",
    startTailor: "开始优化",
    startInterview: "开始面试",
    selectResume: "选择简历",
    selectCoverLetter: "自荐信（可选）",
    noCoverLetter: "不选择",
    editItem: "编辑"
  },
  vi: {
    titleTailor: "Phân tích và tinh chỉnh hồ sơ\ncho khớp với tin tuyển bạn ứng tuyển",
    titleInterview: "Luyện tập như thật\nvới những câu hỏi có thể gặp phải",
    desc: "Chọn hồ sơ bạn muốn dùng.",
    lastEdited: "Sửa lần cuối",
    untitled: "Hồ sơ chưa đặt tên",
    change: "Đổi",
    switchResume: "Đổi hồ sơ",
    completion: "Hoàn thành",
    emptyTitle: "Chưa có hồ sơ",
    emptyDesc: "Hãy tạo hồ sơ trước.",
    createBtn: "Tạo hồ sơ",
    loadFailed: "Không tải được danh sách hồ sơ.",
    otherResume: "Hồ sơ khác",
    back: "Quay lại",
    expand: "Xem lớn",
    preview: "Xem trước hồ sơ",
    previewPdf: "Xem trước · PDF",
    resumeList: "Danh sách hồ sơ",
    newResume: "Hồ sơ mới",
    wipTitle: "Sắp ra mắt",
    wipDesc: "Tính năng này sẽ sớm ra mắt.",
    badgeTailor: "AI Khớp tin tuyển",
    badgeInterview: "AI Phỏng vấn thử",
    listTitle: "Hồ sơ của tôi",
    startTailor: "Tối ưu",
    startInterview: "Bắt đầu",
    selectResume: "Chọn hồ sơ",
    selectCoverLetter: "Thư giới thiệu (tùy chọn)",
    noCoverLetter: "Không chọn",
    editItem: "Sửa"
  },
  ja: {
    titleTailor: "応募する求人にぴったり合うよう\n履歴書を分析して整えます",
    titleInterview: "出そうな質問を事前に用意して\n本番のように面接を練習しましょう",
    desc: "使用する履歴書を選んでください。",
    lastEdited: "最終編集",
    untitled: "無題の履歴書",
    change: "変更",
    switchResume: "履歴書を変更",
    completion: "完成度",
    emptyTitle: "まだ履歴書がありません",
    emptyDesc: "まず履歴書を作成してください。",
    createBtn: "履歴書を作成",
    loadFailed: "履歴書一覧を読み込めませんでした。",
    otherResume: "別の履歴書",
    back: "戻る",
    expand: "拡大表示",
    preview: "履歴書プレビュー",
    previewPdf: "プレビュー · PDF",
    resumeList: "履歴書一覧",
    newResume: "新しい履歴書",
    wipTitle: "準備中です",
    wipDesc: "この機能は近日公開予定です。",
    badgeTailor: "AI求人マッチ",
    badgeInterview: "AI模擬面接",
    listTitle: "マイ履歴書",
    startTailor: "最適化",
    startInterview: "開始",
    selectResume: "履歴書を選択",
    selectCoverLetter: "自己PR書（任意）",
    noCoverLetter: "選択しない",
    editItem: "編集"
  },
  id: {
    titleTailor: "Menganalisis & menyempurnakan resume\nagar cocok dengan lowongan incaran",
    titleInterview: "Berlatih seperti aslinya\ndengan pertanyaan yang mungkin muncul",
    desc: "Pilih resume yang ingin Anda gunakan.",
    lastEdited: "Terakhir diubah",
    untitled: "Resume tanpa judul",
    change: "Ganti",
    switchResume: "Ganti resume",
    completion: "Kelengkapan",
    emptyTitle: "Belum ada resume",
    emptyDesc: "Buat resume terlebih dahulu.",
    createBtn: "Buat resume",
    loadFailed: "Tidak dapat memuat daftar resume.",
    otherResume: "Resume lain",
    back: "Kembali",
    expand: "Lihat besar",
    preview: "Pratinjau resume",
    previewPdf: "Pratinjau · PDF",
    resumeList: "Daftar resume",
    newResume: "Resume baru",
    wipTitle: "Segera hadir",
    wipDesc: "Fitur ini akan segera tersedia.",
    badgeTailor: "AI Cocokkan Lowongan",
    badgeInterview: "AI Wawancara Simulasi",
    listTitle: "Resume saya",
    startTailor: "Sesuaikan",
    startInterview: "Mulai",
    selectResume: "Pilih resume",
    selectCoverLetter: "Surat lamaran (opsional)",
    noCoverLetter: "Tidak ada",
    editItem: "Edit"
  }
};

export function useToolPickerCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
