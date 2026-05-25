"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CaretDown,
  Export as ShareIcon,
  Globe,
  MoonStars,
  QuestionMarkIcon,
  Sparkle,
  Star,
  XIcon
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";
import { predictSaju } from "../../lib/saju-client";
import { SajuWheelPicker } from "./SajuWheelPicker";

type Copy = {
  pill: string;
  titleA: string;
  titleHighlight: string;
  titleB: string;
  intro: string;
  nameLabel: string;
  namePlaceholder: string;
  genderLabel: string;
  male: string;
  female: string;
  birthDateLabel: string;
  solar: string;
  lunar: string;
  birthTimeLabel: string;
  optional: string;
  birthTimeUnknown: string;
  errName: string;
  errGender: string;
  errBirthDate: string;
  errRetry: string;
  submitting: string;
  submit: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  share: string;
  shareTitle: string;
  shareText: string;
  linkCopied: string;
  linkCopyFailed: string;
  whatIsSaju: string;
  sajuModalTitle: string;
  sajuModalBody: string;
  sajuModalDisclaimer: string;
  close: string;
  terms: string;
  privacy: string;
  ceo: string;
  bizNo: string;
  address: string;
  email: string;
  langLabel: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pill: "오행 사주 기반 직업 적성",
    titleA: "나의 사주가 말하는",
    titleHighlight: "미래 직업",
    titleB: "은?",
    intro: "이름, 성별, 생년월일만 입력하면 Aply에서 오행을 풀어\n어울리는 직무와 실제 채용 공고를 한 번에 알려드려요.",
    nameLabel: "이름",
    namePlaceholder: "홍길동",
    genderLabel: "성별",
    male: "남자",
    female: "여자",
    birthDateLabel: "생년월일",
    solar: "양력",
    lunar: "음력",
    birthTimeLabel: "태어난 시간",
    optional: "(선택)",
    birthTimeUnknown: "모름",
    errName: "이름을 입력해 주세요.",
    errGender: "성별을 선택해 주세요.",
    errBirthDate: "생년월일을 입력해 주세요.",
    errRetry: "잠시 후 다시 시도해 주세요.",
    submitting: "오행을 풀어보는 중...",
    submit: "Aply 후보 등록하고 결과보기",
    feature1Title: "오행 분석",
    feature1Desc: "Aply에서 목·화·토·금·수 균형을 풀어요",
    feature2Title: "직무 추천",
    feature2Desc: "사주 결과에 맞는 직무 카테고리 추천",
    feature3Title: "실제 공고",
    feature3Desc: "지금 지원 가능한 채용공고로 연결",
    share: "공유하기",
    shareTitle: "나의 사주가 말하는 미래 직업은?",
    shareText: "Aply의 오행 사주로 나에게 맞는 직업을 추천받아보세요.",
    linkCopied: "링크가 복사되었어요",
    linkCopyFailed: "링크 복사에 실패했어요",
    whatIsSaju: "사주란 무엇인가요?",
    sajuModalTitle: "사주(四柱)란?",
    sajuModalBody:
      "사주는 태어난 연·월·일·시 네 기둥(四柱)을 천간과 지지로 풀어, 그 사람의 타고난 기운과 오행(목·화·토·금·수)의 균형을 살피는 동양의 명리학이에요.\n\nAply는 이 오행 균형을 분석해 당신에게 잘 맞는 직무 성향과 강점을 읽어내고, 실제 채용 공고까지 연결해 드려요.",
    sajuModalDisclaimer: "* 재미로 즐기는 콘텐츠이며, 과학적 예측이나 채용 보장이 아니에요.",
    close: "닫기",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    ceo: "주식회사 플리퍼스 · 대표: 김남구",
    bizNo: "사업자등록번호: 657-81-02986",
    address: "서울특별시 중구 다동 140 10층",
    email: "이메일: info@flip-ers.com",
    langLabel: "한국어"
  },
  en: {
    pill: "Five-Element Saju career fit",
    titleA: "What does my Saju say",
    titleHighlight: "my future job",
    titleB: " is?",
    intro: "Just enter your name, gender, and birth date.\nAply reads your Five-Element Saju and matches real job openings.",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    genderLabel: "Gender",
    male: "Male",
    female: "Female",
    birthDateLabel: "Birth date",
    solar: "Solar",
    lunar: "Lunar",
    birthTimeLabel: "Birth time",
    optional: "(optional)",
    birthTimeUnknown: "Unknown",
    errName: "Please enter your name.",
    errGender: "Please select your gender.",
    errBirthDate: "Please enter your birth date.",
    errRetry: "Please try again in a moment.",
    submitting: "Reading your Saju...",
    submit: "Sign up to Aply & see my result",
    feature1Title: "Saju analysis",
    feature1Desc: "Aply reads your Wood·Fire·Earth·Metal·Water balance",
    feature2Title: "Role recommendation",
    feature2Desc: "Job categories that match your Saju",
    feature3Title: "Real openings",
    feature3Desc: "Linked to jobs you can apply to right now",
    share: "Share",
    shareTitle: "What does my Saju say my future job is?",
    shareText: "Get an Aply Five-Element Saju career reading.",
    linkCopied: "Link copied",
    linkCopyFailed: "Couldn't copy the link",
    whatIsSaju: "What is Saju?",
    sajuModalTitle: "What is Saju (四柱)?",
    sajuModalBody:
      "Saju is a form of East Asian astrology that reads the \"Four Pillars\" of your birth — year, month, day, and hour — through heavenly stems and earthly branches to reveal your innate energy and the balance of the Five Elements (Wood, Fire, Earth, Metal, Water).\n\nAply analyzes this Five-Element balance to read the work styles and strengths that suit you, and connects you to real job openings.",
    sajuModalDisclaimer: "* This is for fun — not a scientific prediction or a job guarantee.",
    close: "Close",
    terms: "Terms",
    privacy: "Privacy Policy",
    ceo: "FLIPERS Co., Ltd. · CEO: Namgu Kim",
    bizNo: "Business Reg. No.: 657-81-02986",
    address: "10F, 140 Dadong, Jung-gu, Seoul, Korea",
    email: "Email: info@flip-ers.com",
    langLabel: "English"
  },
  "zh-CN": {
    pill: "基于五行八字的职业匹配",
    titleA: "我的八字诉说",
    titleHighlight: "未来职业",
    titleB: "是?",
    intro: "只需输入姓名、性别和出生日期，\nAply 解读五行八字，匹配真实招聘岗位。",
    nameLabel: "姓名",
    namePlaceholder: "您的姓名",
    genderLabel: "性别",
    male: "男",
    female: "女",
    birthDateLabel: "出生日期",
    solar: "公历",
    lunar: "农历",
    birthTimeLabel: "出生时间",
    optional: "(可选)",
    birthTimeUnknown: "未知",
    errName: "请输入姓名。",
    errGender: "请选择性别。",
    errBirthDate: "请输入出生日期。",
    errRetry: "请稍后再试。",
    submitting: "正在解读五行...",
    submit: "注册 Aply 查看结果",
    feature1Title: "五行分析",
    feature1Desc: "Aply 解读木·火·土·金·水的平衡",
    feature2Title: "职业推荐",
    feature2Desc: "依据八字推荐合适的职业类别",
    feature3Title: "真实招聘",
    feature3Desc: "对接现在可申请的真实岗位",
    share: "分享",
    shareTitle: "我的八字诉说未来职业是?",
    shareText: "Aply 五行八字职业匹配，立即查看。",
    linkCopied: "链接已复制",
    linkCopyFailed: "链接复制失败",
    whatIsSaju: "什么是八字?",
    sajuModalTitle: "什么是八字(四柱)?",
    sajuModalBody:
      "八字是一种东方命理学，通过天干地支解读出生的年·月·日·时这「四柱」，从而了解一个人与生俱来的气场以及五行(木·火·土·金·水)的平衡。\n\nAply 分析这种五行平衡，解读出适合你的职业倾向与优势，并为你对接真实的招聘岗位。",
    sajuModalDisclaimer: "* 本内容仅供娱乐，并非科学预测或录用保证。",
    close: "关闭",
    terms: "用户协议",
    privacy: "隐私政策",
    ceo: "FLIPERS 株式会社 · 代表: 金南求",
    bizNo: "营业执照号: 657-81-02986",
    address: "韩国首尔市中区茶洞 140 号 10 层",
    email: "邮箱: info@flip-ers.com",
    langLabel: "中文"
  },
  vi: {
    pill: "Hợp nghề nghiệp theo Ngũ Hành Tử Vi",
    titleA: "Tử vi nói rằng",
    titleHighlight: "công việc tương lai",
    titleB: " của tôi là?",
    intro: "Chỉ cần nhập họ tên, giới tính và ngày sinh.\nAply sẽ phân tích Ngũ Hành và gợi ý công việc phù hợp.",
    nameLabel: "Họ tên",
    namePlaceholder: "Họ tên của bạn",
    genderLabel: "Giới tính",
    male: "Nam",
    female: "Nữ",
    birthDateLabel: "Ngày sinh",
    solar: "Dương",
    lunar: "Âm",
    birthTimeLabel: "Giờ sinh",
    optional: "(tùy chọn)",
    birthTimeUnknown: "Không rõ",
    errName: "Vui lòng nhập họ tên.",
    errGender: "Vui lòng chọn giới tính.",
    errBirthDate: "Vui lòng nhập ngày sinh.",
    errRetry: "Vui lòng thử lại sau giây lát.",
    submitting: "Đang phân tích...",
    submit: "Đăng ký Aply & xem kết quả",
    feature1Title: "Phân tích Ngũ Hành",
    feature1Desc: "Aply đọc cân bằng Mộc·Hỏa·Thổ·Kim·Thủy",
    feature2Title: "Gợi ý nghề",
    feature2Desc: "Nhóm nghề phù hợp với tử vi của bạn",
    feature3Title: "Việc làm thật",
    feature3Desc: "Liên kết tới công việc đang tuyển",
    share: "Chia sẻ",
    shareTitle: "Tử vi nói công việc tương lai của tôi là?",
    shareText: "Khám phá công việc qua Aply Ngũ Hành Tử Vi.",
    linkCopied: "Đã sao chép liên kết",
    linkCopyFailed: "Không thể sao chép liên kết",
    whatIsSaju: "Tử Vi là gì?",
    sajuModalTitle: "Tử Vi (Tứ Trụ) là gì?",
    sajuModalBody:
      "Tử Vi là một môn mệnh lý học phương Đông, giải mã \"Tứ Trụ\" của ngày sinh — năm, tháng, ngày, giờ — qua thiên can và địa chi để thấy được khí chất bẩm sinh và sự cân bằng của Ngũ Hành (Mộc, Hỏa, Thổ, Kim, Thủy).\n\nAply phân tích sự cân bằng Ngũ Hành này để đọc ra phong cách làm việc và thế mạnh phù hợp với bạn, đồng thời kết nối bạn với các công việc đang tuyển thật.",
    sajuModalDisclaimer: "* Đây chỉ là nội dung giải trí, không phải dự đoán khoa học hay đảm bảo việc làm.",
    close: "Đóng",
    terms: "Điều khoản",
    privacy: "Chính sách bảo mật",
    ceo: "Công ty FLIPERS · CEO: Namgu Kim",
    bizNo: "Mã ĐKKD: 657-81-02986",
    address: "Tầng 10, 140 Dadong, Jung-gu, Seoul, Hàn Quốc",
    email: "Email: info@flip-ers.com",
    langLabel: "Tiếng Việt"
  },
  ja: {
    pill: "五行四柱推命で適職診断",
    titleA: "私の四柱推命が告げる",
    titleHighlight: "未来の仕事",
    titleB: "は?",
    intro: "名前・性別・生年月日を入力するだけで、\nAply が五行を読み解いて適職と実際の求人を提案します。",
    nameLabel: "名前",
    namePlaceholder: "お名前",
    genderLabel: "性別",
    male: "男性",
    female: "女性",
    birthDateLabel: "生年月日",
    solar: "新暦",
    lunar: "旧暦",
    birthTimeLabel: "生まれた時刻",
    optional: "(任意)",
    birthTimeUnknown: "不明",
    errName: "名前を入力してください。",
    errGender: "性別を選択してください。",
    errBirthDate: "生年月日を入力してください。",
    errRetry: "しばらくしてからもう一度お試しください。",
    submitting: "五行を読み解いています...",
    submit: "Aply に登録して結果を見る",
    feature1Title: "五行分析",
    feature1Desc: "Aply が木・火・土・金・水のバランスを解読",
    feature2Title: "職種のおすすめ",
    feature2Desc: "四柱推命に合った職種カテゴリーを提案",
    feature3Title: "実際の求人",
    feature3Desc: "今すぐ応募できる求人につながります",
    share: "シェア",
    shareTitle: "私の四柱推命が告げる未来の仕事は?",
    shareText: "Aply の五行四柱推命であなたに合う仕事を診断。",
    linkCopied: "リンクをコピーしました",
    linkCopyFailed: "リンクをコピーできませんでした",
    whatIsSaju: "四柱推命とは?",
    sajuModalTitle: "四柱推命(四柱)とは?",
    sajuModalBody:
      "四柱推命は、生まれた年・月・日・時の「四つの柱(四柱)」を天干と地支で読み解き、その人が生まれ持った気質と五行(木・火・土・金・水)のバランスを見る東洋の命理学です。\n\nAply はこの五行バランスを分析して、あなたに合った仕事の傾向や強みを読み解き、実際の求人へとつなげます。",
    sajuModalDisclaimer: "* 娯楽としてお楽しみいただくコンテンツであり、科学的予測や採用の保証ではありません。",
    close: "閉じる",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    ceo: "FLIPERS株式会社 · 代表: キム・ナムグ",
    bizNo: "事業者登録番号: 657-81-02986",
    address: "大韓民国 ソウル特別市 中区 茶洞140 10階",
    email: "メール: info@flip-ers.com",
    langLabel: "日本語"
  },
  id: {
    pill: "Karier berdasarkan Saju Lima Unsur",
    titleA: "Saju saya berkata",
    titleHighlight: "pekerjaan masa depan",
    titleB: " saya?",
    intro: "Cukup masukkan nama, gender, dan tanggal lahir.\nAply membaca Saju Lima Unsur Anda dan mencocokkan lowongan nyata.",
    nameLabel: "Nama",
    namePlaceholder: "Nama Anda",
    genderLabel: "Gender",
    male: "Pria",
    female: "Wanita",
    birthDateLabel: "Tanggal lahir",
    solar: "Masehi",
    lunar: "Imlek",
    birthTimeLabel: "Waktu lahir",
    optional: "(opsional)",
    birthTimeUnknown: "Tidak tahu",
    errName: "Silakan masukkan nama Anda.",
    errGender: "Silakan pilih gender.",
    errBirthDate: "Silakan masukkan tanggal lahir.",
    errRetry: "Silakan coba lagi sebentar.",
    submitting: "Membaca Saju Anda...",
    submit: "Daftar Aply & lihat hasilnya",
    feature1Title: "Analisis Lima Unsur",
    feature1Desc: "Aply membaca keseimbangan Kayu·Api·Tanah·Logam·Air",
    feature2Title: "Rekomendasi peran",
    feature2Desc: "Kategori pekerjaan yang cocok dengan Saju Anda",
    feature3Title: "Lowongan nyata",
    feature3Desc: "Terhubung dengan lowongan yang dapat dilamar sekarang",
    share: "Bagikan",
    shareTitle: "Saju saya berkata pekerjaan masa depan saya?",
    shareText: "Dapatkan pembacaan karier Saju Lima Unsur dari Aply.",
    linkCopied: "Tautan disalin",
    linkCopyFailed: "Tidak dapat menyalin tautan",
    whatIsSaju: "Apa itu Saju?",
    sajuModalTitle: "Apa itu Saju (Empat Pilar)?",
    sajuModalBody:
      "Saju adalah ilmu astrologi Asia Timur yang membaca \"Empat Pilar\" kelahiran Anda — tahun, bulan, hari, dan jam — melalui batang langit dan cabang bumi untuk mengungkap energi bawaan serta keseimbangan Lima Unsur (Kayu, Api, Tanah, Logam, Air).\n\nAply menganalisis keseimbangan Lima Unsur ini untuk membaca gaya kerja dan kekuatan yang cocok untuk Anda, lalu menghubungkan Anda dengan lowongan kerja nyata.",
    sajuModalDisclaimer: "* Konten ini hanya untuk hiburan, bukan prediksi ilmiah atau jaminan pekerjaan.",
    close: "Tutup",
    terms: "Syarat & Ketentuan",
    privacy: "Kebijakan Privasi",
    ceo: "FLIPERS Co., Ltd. · CEO: Namgu Kim",
    bizNo: "Nomor Registrasi: 657-81-02986",
    address: "Lantai 10, 140 Dadong, Jung-gu, Seoul, Republik Korea",
    email: "Email: info@flip-ers.com",
    langLabel: "Bahasa Indonesia"
  }
};

const LOCALE_LABELS: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

export function SajuLandingPage() {
  const router = useRouter();
  const toast = useToast();
  const { locale, setLocale } = useLanguage();
  const copy = COPY[locale];
  const [langOpen, setLangOpen] = useState(false);
  const [sajuInfoOpen, setSajuInfoOpen] = useState(false);
  const [name, setName] = useState("문지윤");
  const [gender, setGender] = useState<"male" | "female" | "">("male");
  const [birthDate, setBirthDate] = useState("1987-08-12");
  const [birthTime, setBirthTime] = useState("10:00");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareData = { title: copy.shareTitle, text: copy.shareText, url };
    // Use the native share sheet on mobile when available — handles
    // KakaoTalk / SMS / etc. without us having to wire each one up.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User canceled or share blocked — fall through to clipboard fallback.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(copy.linkCopied);
    } catch {
      toast.error(copy.linkCopyFailed);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) return setErrorMessage(copy.errName);
    if (!gender) return setErrorMessage(copy.errGender);
    if (!birthDate) return setErrorMessage(copy.errBirthDate);

    setIsSubmitting(true);
    try {
      const result = await predictSaju({
        name: name.trim(),
        gender,
        birthDate,
        birthTime: birthTimeUnknown ? undefined : birthTime || undefined,
        calendarType,
        locale
      });
      router.push(`/events/saju/result/${encodeURIComponent(result.shareSlug)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.errRetry);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b2a] text-white">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-gradient-to-b from-[#0b0b2a] via-[#1a1340] to-[#0b0b2a]">
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {/* Language picker — top left */}
          <div className="absolute left-4 top-4 z-20">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-white/5 pl-3 pr-2 text-[12px] text-white/80 backdrop-blur-sm transition active:bg-white/10 active:text-white"
            >
              <Globe weight="bold" className="h-3.5 w-3.5" />
              <span>{copy.langLabel}</span>
              <CaretDown weight="bold" className={`h-3 w-3 transition ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen ? (
              <ul
                role="listbox"
                className="absolute left-0 top-11 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1340]/95 py-1 text-[12px] shadow-lg backdrop-blur"
              >
                {PLATFORM_LOCALES.map((code) => (
                  <li key={code}>
                    <button
                      type="button"
                      onClick={() => {
                        setLocale(code);
                        setLangOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left transition ${
                        code === locale
                          ? "bg-yellow-300/10 text-yellow-100"
                          : "text-white/75 active:bg-white/10"
                      }`}
                    >
                      {LOCALE_LABELS[code]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Share button — top right */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={copy.share}
            className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 backdrop-blur-sm transition active:bg-white/10 active:text-white"
          >
            <ShareIcon weight="bold" className="h-4 w-4" />
          </button>

          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[28%] top-12 h-2 w-2 rounded-full bg-yellow-200/70 blur-[1px]" />
            <div className="absolute right-[20%] top-28 h-1.5 w-1.5 rounded-full bg-white/80" />
            <div className="absolute left-8 top-64 h-1 w-1 rounded-full bg-yellow-100/60" />
            <div className="absolute right-10 top-80 h-1.5 w-1.5 rounded-full bg-white/70" />
            <div className="absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/15 blur-3xl" />
          </div>

          <section className="relative z-10 px-5 pt-16 pb-4 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-[11px] font-medium text-yellow-100">
              <MoonStars weight="fill" className="h-3 w-3" />
              {copy.pill}
            </div>
            <h1 className="text-[26px] font-bold leading-tight">
              {copy.titleA}
              <br />
              <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {copy.titleHighlight}
              </span>
              {copy.titleB}
            </h1>
            <p className="mt-3 whitespace-pre-line px-2 text-[13px] leading-relaxed text-white/70">
              {copy.intro}
            </p>
            <button
              type="button"
              onClick={() => setSajuInfoOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/5 py-1.5 pl-2 pr-3 text-[12px] text-white/70 backdrop-blur-sm transition active:bg-white/10 active:text-white"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300/20 text-yellow-100">
                <QuestionMarkIcon weight="bold" className="h-3 w-3" />
              </span>
              {copy.whatIsSaju}
            </button>
          </section>

          <div className="relative z-0 mx-auto mt-2 aspect-[3/2] w-[78%] max-w-[360px]">
            <Image
              src="/img_saju_event_characters.webp?v=2"
              alt="Saju characters"
              fill
              priority
              sizes="(max-width: 480px) 78vw, 360px"
              className="object-contain"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-b from-transparent to-[#1a1340]"
            />
          </div>

          <section className="relative mt-6 flex-1 px-5 pb-8">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-white/[0.04] p-5 backdrop-blur-sm"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="saju-name" className="block text-sm font-medium text-white/90">
                    {copy.nameLabel}
                  </label>
                  <input
                    id="saju-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={copy.namePlaceholder}
                    maxLength={40}
                    className="h-11 w-full rounded-xl border-0 bg-white/10 px-3 text-sm text-white placeholder-white/40 outline-none ring-offset-[#1a1340] transition focus-visible:ring-2 focus-visible:ring-yellow-300/60"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-sm font-medium text-white/90">{copy.genderLabel}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`h-11 rounded-xl text-sm font-medium transition ${
                          gender === g
                            ? "bg-yellow-300/20 text-yellow-100"
                            : "bg-white/10 text-white/70 active:bg-white/15"
                        }`}
                      >
                        {g === "male" ? copy.male : copy.female}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    {copy.birthDateLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setDateSheetOpen(true)}
                    className="flex h-11 w-full items-center justify-between rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-offset-[#1a1340] transition active:bg-white/15"
                  >
                    <span className={birthDate ? "text-white" : "text-white/40"}>
                      {birthDate || copy.birthDateLabel}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {(["solar", "lunar"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCalendarType(t)}
                        className={`rounded-full px-3 py-1 transition ${
                          calendarType === t
                            ? "bg-yellow-300/20 text-yellow-100"
                            : "text-white/50 active:text-white/80"
                        }`}
                      >
                        {t === "solar" ? copy.solar : copy.lunar}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    {copy.birthTimeLabel}
                    <span className="ml-1 text-[11px] text-white/40">{copy.optional}</span>
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeSheetOpen(true)}
                      disabled={birthTimeUnknown}
                      className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm outline-none ring-offset-[#1a1340] transition ${
                        birthTimeUnknown ? "bg-white/5 text-white/30" : "bg-white/10 text-white active:bg-white/15"
                      }`}
                    >
                      <span className={birthTime && !birthTimeUnknown ? "text-white" : "text-white/40"}>
                        {birthTimeUnknown ? copy.birthTimeUnknown : birthTime || copy.birthTimeLabel}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !birthTimeUnknown;
                        setBirthTimeUnknown(next);
                        if (next) setBirthTime("");
                      }}
                      className={`h-11 rounded-xl px-4 text-[12px] font-medium transition ${
                        birthTimeUnknown
                          ? "bg-yellow-300/20 text-yellow-100"
                          : "bg-white/10 text-white/60 active:bg-white/15"
                      }`}
                    >
                      {copy.birthTimeUnknown}
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-13 w-full rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 py-3.5 text-[15px] font-semibold text-[#1a1340] shadow-[0_8px_24px_-12px_rgba(250,204,21,0.6)] transition active:from-yellow-200 active:to-amber-300 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Sparkle className="h-4 w-4 animate-pulse" />
                      {copy.submitting}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Star weight="fill" className="h-4 w-4" />
                      {copy.submit}
                    </span>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 space-y-2.5">
              {[
                { title: copy.feature1Title, desc: copy.feature1Desc },
                { title: copy.feature2Title, desc: copy.feature2Desc },
                { title: copy.feature3Title, desc: copy.feature3Desc }
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <Star weight="fill" className="h-4 w-4 flex-shrink-0 text-yellow-200" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-yellow-100">{feature.title}</div>
                    <div className="text-[11px] text-white/55">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-white/5 px-5 py-6 text-[11px] leading-relaxed text-white/40">
          <a
            href="https://aply.global"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block"
            aria-label="Aply"
          >
            <Image
              src="/img_logo.webp"
              alt="Aply"
              width={160}
              height={42}
              className="h-7 w-auto opacity-90 [filter:brightness(0)_invert(1)]"
            />
          </a>
          <div className="space-y-0.5">
            <p>{copy.ceo}</p>
            <p>{copy.bizNo}</p>
            <p>{copy.address}</p>
            <p>{copy.email}</p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span>© {new Date().getUTCFullYear()} Aply.</span>
            <div className="flex items-center gap-3">
              <a href="/legal/terms" className="active:text-white/70">{copy.terms}</a>
              <a href="/legal/privacy" className="text-white/55 active:text-white/80">{copy.privacy}</a>
            </div>
          </div>
        </footer>
      </div>

      {isSubmitting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0b2a]/80 backdrop-blur-md"
          aria-live="polite"
          role="status"
        >
          <div className="relative flex flex-col items-center gap-5 px-8 text-center">
            <div aria-hidden className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 animate-spin-slow">
                <Sparkle weight="fill" className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 text-yellow-200" />
                <Sparkle weight="fill" className="absolute top-1/2 -right-1 h-2.5 w-2.5 -translate-y-1/2 text-yellow-100/80" />
                <Sparkle weight="fill" className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 text-yellow-200/70" />
                <Sparkle weight="fill" className="absolute top-1/2 -left-1 h-2.5 w-2.5 -translate-y-1/2 text-yellow-100/60" />
              </div>
              <div className="absolute inset-3 flex items-center justify-center">
                <MoonStars weight="fill" className="h-12 w-12 text-yellow-200 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[15px] font-medium text-white">{copy.submitting}</p>
              <p className="text-[11px] text-white/50">{copy.pill}</p>
            </div>
          </div>
          <style jsx global>{`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 4s linear infinite;
            }
          `}</style>
        </div>
      ) : null}

      {sajuInfoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saju-info-title"
          onClick={() => setSajuInfoOpen(false)}
        >
          <div
            className="relative w-full max-w-[480px] rounded-t-3xl border border-white/10 bg-gradient-to-b from-[#1a1340] to-[#0b0b2a] p-6 pb-8 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSajuInfoOpen(false)}
              aria-label={copy.close}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition active:bg-white/10 active:text-white"
            >
              <XIcon weight="bold" className="h-4 w-4" />
            </button>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300/15">
              <MoonStars weight="fill" className="h-6 w-6 text-yellow-200" />
            </div>
            <h2 id="saju-info-title" className="text-[18px] font-bold text-white">
              {copy.sajuModalTitle}
            </h2>
            <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-white/75">
              {copy.sajuModalBody}
            </p>
            <p className="mt-4 text-[11px] leading-relaxed text-white/40">
              {copy.sajuModalDisclaimer}
            </p>
            <Button
              type="button"
              onClick={() => setSajuInfoOpen(false)}
              className="mt-6 h-12 w-full rounded-xl bg-white/10 text-[14px] font-medium text-white transition active:bg-white/15"
            >
              {copy.close}
            </Button>
          </div>
        </div>
      ) : null}

      <SajuWheelPicker
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title={copy.birthDateLabel}
        locale={locale}
        mode="date"
        value={birthDate}
        onConfirm={setBirthDate}
        minYear={1920}
        maxYear={new Date().getFullYear()}
      />
      <SajuWheelPicker
        open={timeSheetOpen}
        onClose={() => setTimeSheetOpen(false)}
        title={copy.birthTimeLabel}
        locale={locale}
        mode="time"
        value={birthTime || "00:00"}
        onConfirm={setBirthTime}
      />
    </div>
  );
}
