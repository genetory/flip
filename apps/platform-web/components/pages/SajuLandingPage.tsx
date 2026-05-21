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
  Sparkle,
  Star
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
  const [name, setName] = useState("문지윤");
  const [gender, setGender] = useState<"male" | "female" | "">("male");
  const [birthDate, setBirthDate] = useState("1987-08-12");
  const [birthTime, setBirthTime] = useState("10:00");
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
        birthTime: birthTime || undefined,
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
              className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 pl-3 pr-2 text-[12px] text-white/80 backdrop-blur-sm transition active:bg-white/10 active:text-white"
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
            className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-sm transition active:bg-white/10 active:text-white"
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
                  <button
                    type="button"
                    onClick={() => setTimeSheetOpen(true)}
                    className="flex h-11 w-full items-center justify-between rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-offset-[#1a1340] transition active:bg-white/15"
                  >
                    <span className={birthTime ? "text-white" : "text-white/40"}>
                      {birthTime || copy.birthTimeLabel}
                    </span>
                  </button>
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
