// resume-maker i18n — 옵션성 공유 데이터(온보딩 목적·시작 방법, 체류자격, 디자인
// 레이아웃·타이틀 마커, 직무 카테고리)의 6개 언어 라벨. 정규 value/id 순서는
// resume-maker-types 의 배열을 그대로 따르고, 표시 라벨만 locale 로 바꿔준다.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";
import {
  RESUME_PURPOSES,
  START_METHODS,
  RESUME_VISA_OPTIONS,
  RESUME_LAYOUTS,
  RESUME_TITLE_MARKERS,
  JOB_CATEGORIES,
  type ResumePurpose,
  type ResumeStartMethod,
  type ResumeLayoutId,
  type ResumeTitleMarker
} from "../resume-maker-types";

function useLocale(): PlatformLocale {
  const { locale } = useLanguage();
  return locale;
}

type LD = { label: string; desc: string };

// ── 이력서 목적 ──
const PURPOSE: Record<PlatformLocale, Record<ResumePurpose, LD>> = {
  ko: {
    first_job: { label: "첫 취업", desc: "사회에 첫발을 내딛는 신입 이력서" },
    intern: { label: "인턴 지원", desc: "인턴십·체험형 채용 지원" },
    job_change: { label: "이직", desc: "경력을 살린 이직 이력서" },
    part_time: { label: "아르바이트", desc: "단기·시간제 근무 지원" },
    career_switch: { label: "직무 전환", desc: "새로운 직무로의 전환" },
    specific_posting: { label: "특정 공고 지원", desc: "특정 채용 공고에 맞춘 이력서" },
    improve_existing: { label: "기존 이력서 개선", desc: "이미 있는 이력서를 다듬기" }
  },
  en: {
    first_job: { label: "First job", desc: "Entry-level resume for your first step into work" },
    intern: { label: "Internship", desc: "Apply for internships or trainee roles" },
    job_change: { label: "Job change", desc: "A resume that leverages your experience" },
    part_time: { label: "Part-time", desc: "Apply for short-term or hourly work" },
    career_switch: { label: "Career switch", desc: "Move into a new role or field" },
    specific_posting: { label: "Specific posting", desc: "A resume tailored to a specific job posting" },
    improve_existing: { label: "Improve existing", desc: "Polish a resume you already have" }
  },
  "zh-CN": {
    first_job: { label: "初次就业", desc: "迈出职场第一步的应届简历" },
    intern: { label: "实习申请", desc: "申请实习或体验型岗位" },
    job_change: { label: "跳槽", desc: "发挥经验的跳槽简历" },
    part_time: { label: "兼职", desc: "申请短期或计时工作" },
    career_switch: { label: "职能转换", desc: "转向新的职务方向" },
    specific_posting: { label: "特定招聘", desc: "针对特定招聘启事定制的简历" },
    improve_existing: { label: "改进现有简历", desc: "完善已有的简历" }
  },
  vi: {
    first_job: { label: "Việc làm đầu tiên", desc: "Hồ sơ cho người mới bắt đầu đi làm" },
    intern: { label: "Ứng tuyển thực tập", desc: "Nộp hồ sơ thực tập hoặc vị trí trải nghiệm" },
    job_change: { label: "Chuyển việc", desc: "Hồ sơ tận dụng kinh nghiệm để chuyển việc" },
    part_time: { label: "Bán thời gian", desc: "Ứng tuyển công việc ngắn hạn hoặc theo giờ" },
    career_switch: { label: "Chuyển hướng nghề", desc: "Chuyển sang công việc hoặc lĩnh vực mới" },
    specific_posting: { label: "Tin tuyển cụ thể", desc: "Hồ sơ tùy chỉnh cho một tin tuyển dụng cụ thể" },
    improve_existing: { label: "Cải thiện hồ sơ", desc: "Trau chuốt hồ sơ bạn đã có" }
  },
  ja: {
    first_job: { label: "初めての就職", desc: "社会人デビューの新卒向け履歴書" },
    intern: { label: "インターン応募", desc: "インターンシップ・体験型採用への応募" },
    job_change: { label: "転職", desc: "経験を活かした転職用履歴書" },
    part_time: { label: "アルバイト", desc: "短期・時間制勤務への応募" },
    career_switch: { label: "職種転換", desc: "新しい職種への転換" },
    specific_posting: { label: "特定の求人", desc: "特定の求人に合わせた履歴書" },
    improve_existing: { label: "既存の履歴書を改善", desc: "すでにある履歴書を整える" }
  },
  id: {
    first_job: { label: "Pekerjaan pertama", desc: "Resume tingkat awal untuk langkah pertama bekerja" },
    intern: { label: "Lamaran magang", desc: "Melamar magang atau posisi trainee" },
    job_change: { label: "Pindah kerja", desc: "Resume yang memanfaatkan pengalaman Anda" },
    part_time: { label: "Paruh waktu", desc: "Melamar kerja jangka pendek atau per jam" },
    career_switch: { label: "Ganti bidang", desc: "Beralih ke peran atau bidang baru" },
    specific_posting: { label: "Lowongan tertentu", desc: "Resume yang disesuaikan untuk lowongan tertentu" },
    improve_existing: { label: "Perbaiki yang ada", desc: "Sempurnakan resume yang sudah Anda punya" }
  }
};

export function usePurposeOptions(): { value: ResumePurpose; label: string; desc: string }[] {
  const m = PURPOSE[useLocale()] ?? PURPOSE.en;
  return RESUME_PURPOSES.map((p) => ({ value: p.value, label: m[p.value].label, desc: m[p.value].desc }));
}

// ── 시작 방법 ──
const START: Record<PlatformLocale, Record<ResumeStartMethod, LD>> = {
  ko: {
    scratch: { label: "처음부터 만들기", desc: "질문에 답하며 새로 만들어요" },
    upload: { label: "기존 이력서 업로드", desc: "PDF·문서를 올려 시작해요" },
    paste: { label: "작성한 내용 붙여넣기", desc: "메모해 둔 내용을 붙여넣어요" }
  },
  en: {
    scratch: { label: "Start from scratch", desc: "Build a new one by answering questions" },
    upload: { label: "Upload existing resume", desc: "Start by uploading a PDF or document" },
    paste: { label: "Paste your content", desc: "Paste in notes you've already written" }
  },
  "zh-CN": {
    scratch: { label: "从头开始", desc: "通过回答问题重新创建" },
    upload: { label: "上传现有简历", desc: "上传 PDF 或文档开始" },
    paste: { label: "粘贴已写内容", desc: "粘贴你记录好的内容" }
  },
  vi: {
    scratch: { label: "Bắt đầu từ đầu", desc: "Tạo mới bằng cách trả lời câu hỏi" },
    upload: { label: "Tải lên hồ sơ có sẵn", desc: "Bắt đầu bằng cách tải lên PDF hoặc tài liệu" },
    paste: { label: "Dán nội dung đã viết", desc: "Dán nội dung bạn đã ghi chú" }
  },
  ja: {
    scratch: { label: "最初から作成", desc: "質問に答えながら新しく作成" },
    upload: { label: "既存の履歴書をアップロード", desc: "PDF・文書をアップして開始" },
    paste: { label: "作成済みの内容を貼り付け", desc: "メモした内容を貼り付け" }
  },
  id: {
    scratch: { label: "Mulai dari awal", desc: "Buat baru dengan menjawab pertanyaan" },
    upload: { label: "Unggah resume yang ada", desc: "Mulai dengan mengunggah PDF atau dokumen" },
    paste: { label: "Tempel konten Anda", desc: "Tempel catatan yang sudah Anda tulis" }
  }
};

export function useStartMethodOptions(): { value: ResumeStartMethod; label: string; desc: string }[] {
  const m = START[useLocale()] ?? START.en;
  return START_METHODS.map((s) => ({ value: s.value, label: m[s.value].label, desc: m[s.value].desc }));
}

// ── 체류자격(비자) — 코드는 유지, 한국어 설명만 번역 ──
const VISA: Record<PlatformLocale, Record<string, string>> = {
  ko: { D2_STUDENT: "D-2 유학", D4_GENERAL_TRAINING: "D-4 어학연수", D10_JOB_SEEKING: "D-10 구직", E7_SPECIFIC_ACTIVITY: "E-7 특정활동", F2_RESIDENCE: "F-2 거주", F4_OVERSEAS_KOREAN: "F-4 재외동포", F5_PERMANENT_RESIDENCE: "F-5 영주", F6_MARRIAGE_IMMIGRATION: "F-6 결혼이민", H1_WORKING_HOLIDAY: "H-1 워킹홀리데이", OTHER: "기타" },
  en: { D2_STUDENT: "D-2 Study", D4_GENERAL_TRAINING: "D-4 Language training", D10_JOB_SEEKING: "D-10 Job seeking", E7_SPECIFIC_ACTIVITY: "E-7 Specific activity", F2_RESIDENCE: "F-2 Residence", F4_OVERSEAS_KOREAN: "F-4 Overseas Korean", F5_PERMANENT_RESIDENCE: "F-5 Permanent residence", F6_MARRIAGE_IMMIGRATION: "F-6 Marriage immigration", H1_WORKING_HOLIDAY: "H-1 Working holiday", OTHER: "Other" },
  "zh-CN": { D2_STUDENT: "D-2 留学", D4_GENERAL_TRAINING: "D-4 语言研修", D10_JOB_SEEKING: "D-10 求职", E7_SPECIFIC_ACTIVITY: "E-7 特定活动", F2_RESIDENCE: "F-2 居住", F4_OVERSEAS_KOREAN: "F-4 在外同胞", F5_PERMANENT_RESIDENCE: "F-5 永驻", F6_MARRIAGE_IMMIGRATION: "F-6 结婚移民", H1_WORKING_HOLIDAY: "H-1 打工度假", OTHER: "其他" },
  vi: { D2_STUDENT: "D-2 Du học", D4_GENERAL_TRAINING: "D-4 Học tiếng", D10_JOB_SEEKING: "D-10 Tìm việc", E7_SPECIFIC_ACTIVITY: "E-7 Hoạt động đặc định", F2_RESIDENCE: "F-2 Cư trú", F4_OVERSEAS_KOREAN: "F-4 Kiều bào", F5_PERMANENT_RESIDENCE: "F-5 Thường trú", F6_MARRIAGE_IMMIGRATION: "F-6 Kết hôn di trú", H1_WORKING_HOLIDAY: "H-1 Working holiday", OTHER: "Khác" },
  ja: { D2_STUDENT: "D-2 留学", D4_GENERAL_TRAINING: "D-4 語学研修", D10_JOB_SEEKING: "D-10 求職", E7_SPECIFIC_ACTIVITY: "E-7 特定活動", F2_RESIDENCE: "F-2 居住", F4_OVERSEAS_KOREAN: "F-4 在外同胞", F5_PERMANENT_RESIDENCE: "F-5 永住", F6_MARRIAGE_IMMIGRATION: "F-6 結婚移民", H1_WORKING_HOLIDAY: "H-1 ワーキングホリデー", OTHER: "その他" },
  id: { D2_STUDENT: "D-2 Studi", D4_GENERAL_TRAINING: "D-4 Pelatihan bahasa", D10_JOB_SEEKING: "D-10 Mencari kerja", E7_SPECIFIC_ACTIVITY: "E-7 Aktivitas tertentu", F2_RESIDENCE: "F-2 Tinggal", F4_OVERSEAS_KOREAN: "F-4 Diaspora Korea", F5_PERMANENT_RESIDENCE: "F-5 Penduduk tetap", F6_MARRIAGE_IMMIGRATION: "F-6 Imigrasi pernikahan", H1_WORKING_HOLIDAY: "H-1 Working holiday", OTHER: "Lainnya" }
};

export function useVisaOptions(): { value: string; label: string }[] {
  const m = VISA[useLocale()] ?? VISA.en;
  return RESUME_VISA_OPTIONS.map((o) => ({ value: o.value, label: m[o.value] ?? o.label }));
}

export function useVisaLabel(): (value?: string | null) => string {
  const m = VISA[useLocale()] ?? VISA.en;
  return (value) => (value ? m[value] ?? value : "");
}

// ── 디자인 레이아웃 ──
const LAYOUT: Record<PlatformLocale, Record<ResumeLayoutId, LD>> = {
  ko: {
    modern: { label: "모던 단단형", desc: "한 단 구성에 포인트 타이틀로 깔끔하게" },
    sidebar: { label: "2단 사이드바형", desc: "좌측 사이드바(스킬·어학·자격) + 우측 본문" },
    "sidebar-right": { label: "2단 사이드바(우측)", desc: "사이드바를 오른쪽에 두는 2단 구성" },
    centered: { label: "센터 헤더형", desc: "이름·연락처를 가운데 정렬한 단정한 구성" },
    band: { label: "헤더 밴드형", desc: "이름·연락처를 컬러 밴드로 강조" }
  },
  en: {
    modern: { label: "Modern single-column", desc: "Clean single column with accent titles" },
    sidebar: { label: "Two-column sidebar", desc: "Left sidebar (skills, languages, certs) + main on right" },
    "sidebar-right": { label: "Two-column sidebar (right)", desc: "Two columns with the sidebar on the right" },
    centered: { label: "Centered header", desc: "Tidy layout with name and contact centered" },
    band: { label: "Header band", desc: "Highlight name and contact with a color band" }
  },
  "zh-CN": {
    modern: { label: "现代单栏", desc: "单栏布局配重点标题，简洁清爽" },
    sidebar: { label: "双栏侧边栏", desc: "左侧栏（技能·语言·资格）+ 右侧正文" },
    "sidebar-right": { label: "双栏侧边栏（右）", desc: "侧边栏置于右侧的双栏布局" },
    centered: { label: "居中页眉", desc: "姓名·联系方式居中的整洁布局" },
    band: { label: "页眉色带", desc: "用彩色色带突出姓名·联系方式" }
  },
  vi: {
    modern: { label: "Hiện đại một cột", desc: "Một cột gọn gàng với tiêu đề nhấn" },
    sidebar: { label: "Hai cột có sidebar", desc: "Sidebar trái (kỹ năng, ngoại ngữ, chứng chỉ) + nội dung phải" },
    "sidebar-right": { label: "Hai cột sidebar (phải)", desc: "Bố cục hai cột với sidebar bên phải" },
    centered: { label: "Tiêu đề căn giữa", desc: "Bố cục gọn với tên và liên hệ căn giữa" },
    band: { label: "Dải tiêu đề", desc: "Làm nổi tên và liên hệ bằng dải màu" }
  },
  ja: {
    modern: { label: "モダン一段組", desc: "一段組にポイントタイトルですっきり" },
    sidebar: { label: "2段サイドバー", desc: "左サイドバー（スキル・語学・資格）＋右本文" },
    "sidebar-right": { label: "2段サイドバー（右）", desc: "サイドバーを右に置く2段構成" },
    centered: { label: "センターヘッダー", desc: "氏名・連絡先を中央揃えにした端正な構成" },
    band: { label: "ヘッダーバンド", desc: "氏名・連絡先をカラーバンドで強調" }
  },
  id: {
    modern: { label: "Modern satu kolom", desc: "Satu kolom rapi dengan judul aksen" },
    sidebar: { label: "Dua kolom sidebar", desc: "Sidebar kiri (keterampilan, bahasa, sertifikat) + isi kanan" },
    "sidebar-right": { label: "Dua kolom sidebar (kanan)", desc: "Dua kolom dengan sidebar di kanan" },
    centered: { label: "Header tengah", desc: "Tata letak rapi dengan nama dan kontak di tengah" },
    band: { label: "Pita header", desc: "Tonjolkan nama dan kontak dengan pita warna" }
  }
};

export function useLayoutOptions(): { id: ResumeLayoutId; label: string; desc: string }[] {
  const m = LAYOUT[useLocale()] ?? LAYOUT.en;
  return RESUME_LAYOUTS.map((l) => ({ id: l.id, label: m[l.id].label, desc: m[l.id].desc }));
}

// ── 타이틀 마커 ──
const MARKER: Record<PlatformLocale, Record<ResumeTitleMarker, string>> = {
  ko: { diamond: "마름모", bar: "세로 바", dot: "점", underline: "밑줄", none: "없음" },
  en: { diamond: "Diamond", bar: "Bar", dot: "Dot", underline: "Underline", none: "None" },
  "zh-CN": { diamond: "菱形", bar: "竖条", dot: "圆点", underline: "下划线", none: "无" },
  vi: { diamond: "Hình thoi", bar: "Thanh dọc", dot: "Chấm", underline: "Gạch chân", none: "Không" },
  ja: { diamond: "ひし形", bar: "縦バー", dot: "ドット", underline: "下線", none: "なし" },
  id: { diamond: "Wajik", bar: "Batang", dot: "Titik", underline: "Garis bawah", none: "Tidak ada" }
};

export function useTitleMarkerOptions(): { id: ResumeTitleMarker; label: string }[] {
  const m = MARKER[useLocale()] ?? MARKER.en;
  return RESUME_TITLE_MARKERS.map((mk) => ({ id: mk.id, label: m[mk.id] }));
}

// ── 직무 카테고리 ──
const JOB: Record<PlatformLocale, Record<string, string>> = {
  ko: { service_planning: "서비스 기획", marketing: "마케팅", development: "개발", design: "디자인", sales: "영업", operations: "운영", hr: "인사", finance: "재무", customer_support: "고객 지원", undecided: "아직 모르겠어요" },
  en: { service_planning: "Service Planning", marketing: "Marketing", development: "Development", design: "Design", sales: "Sales", operations: "Operations", hr: "HR", finance: "Finance", customer_support: "Customer Support", undecided: "Not sure yet" },
  "zh-CN": { service_planning: "服务规划", marketing: "市场营销", development: "开发", design: "设计", sales: "销售", operations: "运营", hr: "人事", finance: "财务", customer_support: "客户支持", undecided: "还不确定" },
  vi: { service_planning: "Lập kế hoạch dịch vụ", marketing: "Marketing", development: "Phát triển", design: "Thiết kế", sales: "Kinh doanh", operations: "Vận hành", hr: "Nhân sự", finance: "Tài chính", customer_support: "Hỗ trợ khách hàng", undecided: "Chưa chắc chắn" },
  ja: { service_planning: "サービス企画", marketing: "マーケティング", development: "開発", design: "デザイン", sales: "営業", operations: "運営", hr: "人事", finance: "財務", customer_support: "カスタマーサポート", undecided: "まだ決めていない" },
  id: { service_planning: "Perencanaan Layanan", marketing: "Pemasaran", development: "Pengembangan", design: "Desain", sales: "Penjualan", operations: "Operasional", hr: "SDM", finance: "Keuangan", customer_support: "Dukungan Pelanggan", undecided: "Belum yakin" }
};

export function useJobCategoryLabel(): (value?: string | null) => string {
  const m = JOB[useLocale()] ?? JOB.en;
  return (value) => {
    if (!value) return "";
    if (m[value]) return m[value];
    return JOB_CATEGORIES.find((j) => j.value === value)?.label ?? value;
  };
}

export function useJobCategoryOptions(): { value: string; label: string }[] {
  const m = JOB[useLocale()] ?? JOB.en;
  return JOB_CATEGORIES.map((j) => ({ value: j.value, label: m[j.value] ?? j.label }));
}

// ── 채팅 빠른답변(외국인 여부·학력 구분·학력 상태) ──
// value 는 채팅 로직(EDU_TYPE_MAP·EDU_STATUS_MAP 키, 외국인 판별 정규식)이 기대하는
// 정규(한국어) 값으로 고정하고, label 만 locale 로 바꾼다.
type Reply = { value: string; label: string };
const QUICK_REPLIES_I18N: Record<PlatformLocale, Record<string, Reply[]>> = {
  ko: {
    b_foreigner: [{ value: "네, 외국인이에요", label: "네, 외국인이에요" }, { value: "아니요", label: "아니요" }],
    ed_type: [
      { value: "고등학교", label: "고등학교" }, { value: "대학교(학사)", label: "대학교(학사)" }, { value: "전문학사", label: "전문학사" },
      { value: "대학원(석사)", label: "대학원(석사)" }, { value: "대학원(박사)", label: "대학원(박사)" }, { value: "기타", label: "기타" }
    ],
    ed_status: [{ value: "재학 중", label: "재학 중" }, { value: "졸업", label: "졸업" }, { value: "휴학", label: "휴학" }, { value: "중퇴", label: "중퇴" }]
  },
  en: {
    b_foreigner: [{ value: "네, 외국인이에요", label: "Yes, I'm a foreigner" }, { value: "아니요", label: "No" }],
    ed_type: [
      { value: "고등학교", label: "High school" }, { value: "대학교(학사)", label: "University (Bachelor's)" }, { value: "전문학사", label: "Associate degree" },
      { value: "대학원(석사)", label: "Graduate (Master's)" }, { value: "대학원(박사)", label: "Graduate (Doctorate)" }, { value: "기타", label: "Other" }
    ],
    ed_status: [{ value: "재학 중", label: "Enrolled" }, { value: "졸업", label: "Graduated" }, { value: "휴학", label: "On leave" }, { value: "중퇴", label: "Withdrawn" }]
  },
  "zh-CN": {
    b_foreigner: [{ value: "네, 외국인이에요", label: "是的，我是外国人" }, { value: "아니요", label: "不是" }],
    ed_type: [
      { value: "고등학교", label: "高中" }, { value: "대학교(학사)", label: "大学（学士）" }, { value: "전문학사", label: "专科" },
      { value: "대학원(석사)", label: "研究生（硕士）" }, { value: "대학원(박사)", label: "研究生（博士）" }, { value: "기타", label: "其他" }
    ],
    ed_status: [{ value: "재학 중", label: "在读" }, { value: "졸업", label: "毕业" }, { value: "휴학", label: "休学" }, { value: "중퇴", label: "退学" }]
  },
  vi: {
    b_foreigner: [{ value: "네, 외국인이에요", label: "Vâng, tôi là người nước ngoài" }, { value: "아니요", label: "Không" }],
    ed_type: [
      { value: "고등학교", label: "Trung học" }, { value: "대학교(학사)", label: "Đại học (Cử nhân)" }, { value: "전문학사", label: "Cao đẳng" },
      { value: "대학원(석사)", label: "Sau đại học (Thạc sĩ)" }, { value: "대학원(박사)", label: "Sau đại học (Tiến sĩ)" }, { value: "기타", label: "Khác" }
    ],
    ed_status: [{ value: "재학 중", label: "Đang học" }, { value: "졸업", label: "Đã tốt nghiệp" }, { value: "휴학", label: "Tạm nghỉ" }, { value: "중퇴", label: "Bỏ học" }]
  },
  ja: {
    b_foreigner: [{ value: "네, 외국인이에요", label: "はい、外国人です" }, { value: "아니요", label: "いいえ" }],
    ed_type: [
      { value: "고등학교", label: "高校" }, { value: "대학교(학사)", label: "大学（学士）" }, { value: "전문학사", label: "短期大学" },
      { value: "대학원(석사)", label: "大学院（修士）" }, { value: "대학원(박사)", label: "大学院（博士）" }, { value: "기타", label: "その他" }
    ],
    ed_status: [{ value: "재학 중", label: "在学中" }, { value: "졸업", label: "卒業" }, { value: "휴학", label: "休学" }, { value: "중퇴", label: "中退" }]
  },
  id: {
    b_foreigner: [{ value: "네, 외국인이에요", label: "Ya, saya orang asing" }, { value: "아니요", label: "Tidak" }],
    ed_type: [
      { value: "고등학교", label: "SMA" }, { value: "대학교(학사)", label: "Universitas (Sarjana)" }, { value: "전문학사", label: "Diploma" },
      { value: "대학원(석사)", label: "Pascasarjana (Magister)" }, { value: "대학원(박사)", label: "Pascasarjana (Doktor)" }, { value: "기타", label: "Lainnya" }
    ],
    ed_status: [{ value: "재학 중", label: "Sedang kuliah" }, { value: "졸업", label: "Lulus" }, { value: "휴학", label: "Cuti" }, { value: "중퇴", label: "Keluar" }]
  }
};

export function useQuickReplies(): Record<string, Reply[]> {
  return QUICK_REPLIES_I18N[useLocale()] ?? QUICK_REPLIES_I18N.en;
}
