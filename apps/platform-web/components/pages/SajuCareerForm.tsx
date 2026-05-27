"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import type { PlatformLocale } from "../../lib/auth-messages";
import { JOB_ROLE_TAXONOMY, translateRole } from "../../lib/saju-taxonomy";
import type {
  SajuLeadContactType,
  SajuLeadKoreanLevel,
  SajuLeadRequest,
  SajuLeadWorkType
} from "../../lib/saju-client";

type Copy = {
  heading: string;
  intro: string;
  nationality: string;
  nationalityPh: string;
  school: string;
  schoolPh: string;
  major: string;
  majorPh: string;
  visa: string;
  korean: string;
  english: string;
  jobRole: string;
  workType: string;
  contact: string;
  contactPh: string;
  hasResume: string;
  yes: string;
  no: string;
  select: string;
  optional: string;
  consentCareer: string;
  consentRecommend: string;
  required: string;
  errRequired: string;
  errConsent: string;
  back: string;
  submit: string;
  submitting: string;
  levels: Record<SajuLeadKoreanLevel, string>;
  works: Record<SajuLeadWorkType, string>;
  contacts: Record<SajuLeadContactType, string>;
  visaOther: string;
};

const VISA_VALUES: Array<{ value: string; code: string; desc: string }> = [
  { value: "D10_JOB_SEEKING", code: "D-10", desc: "Job Seeking" },
  { value: "D2_STUDENT", code: "D-2", desc: "Student" },
  { value: "D4_GENERAL_TRAINING", code: "D-4", desc: "General Training" },
  { value: "F2_RESIDENCE", code: "F-2", desc: "Residence" },
  { value: "F4_OVERSEAS_KOREAN", code: "F-4", desc: "Overseas Korean" },
  { value: "F5_PERMANENT_RESIDENCE", code: "F-5", desc: "Permanent Residence" },
  { value: "F6_MARRIAGE_IMMIGRATION", code: "F-6", desc: "Marriage" },
  { value: "E7_SPECIFIC_ACTIVITY", code: "E-7", desc: "Specific Activity" },
  { value: "H1_WORKING_HOLIDAY", code: "H-1", desc: "Working Holiday" }
];

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    heading: "실제 내 이력으로 추천 가능성 확인하기",
    intro: "국적, 전공, 비자, 언어 조건만 입력하면\n한국 기업에 추천 가능한지 바로 확인해드려요.",
    nationality: "국적",
    nationalityPh: "예: 베트남",
    school: "학교",
    schoolPh: "예: 서울대학교",
    major: "전공",
    majorPh: "예: 컴퓨터공학",
    visa: "현재 비자",
    korean: "한국어 수준",
    english: "영어 수준",
    jobRole: "희망 직무",
    workType: "근무 가능 형태",
    contact: "연락처",
    contactPh: "이메일 / 카카오ID / WhatsApp 번호",
    hasResume: "이력서를 가지고 있나요?",
    yes: "있어요",
    no: "아직 없어요",
    select: "선택해 주세요",
    optional: "(선택)",
    consentCareer: "커리어 추천을 위해 입력 정보 수집에 동의합니다. (필수)",
    consentRecommend: "한국 기업 추천 시 내 정보 제공에 동의합니다. (선택)",
    required: "(필수)",
    errRequired: "필수 항목을 모두 입력해 주세요.",
    errConsent: "커리어 추천 정보 수집에 동의해 주세요.",
    back: "이전",
    submit: "추천 가능성 확인하기",
    submitting: "분석하는 중...",
    levels: { BEGINNER: "초급", INTERMEDIATE: "중급", ADVANCED: "고급", NATIVE: "원어민" },
    works: { INTERN: "인턴", PART_TIME: "파트타임", PROJECT: "프로젝트", FULL_TIME: "정규직" },
    contacts: { EMAIL: "이메일", KAKAO: "카카오톡", WHATSAPP: "WhatsApp", PHONE: "전화" },
    visaOther: "기타"
  },
  en: {
    heading: "Check your fit with your real background",
    intro: "Enter your nationality, major, visa and language level,\nand we'll check if you're recommendable to Korean companies.",
    nationality: "Nationality",
    nationalityPh: "e.g. Vietnam",
    school: "School",
    schoolPh: "e.g. Seoul National University",
    major: "Major",
    majorPh: "e.g. Computer Science",
    visa: "Current visa",
    korean: "Korean level",
    english: "English level",
    jobRole: "Preferred role",
    workType: "Work type",
    contact: "Contact",
    contactPh: "Email / Kakao ID / WhatsApp number",
    hasResume: "Do you have a resume?",
    yes: "Yes",
    no: "Not yet",
    select: "Please select",
    optional: "(optional)",
    consentCareer: "I agree to share this info for career recommendations. (required)",
    consentRecommend: "I agree to share my info when recommended to Korean companies. (optional)",
    required: "(required)",
    errRequired: "Please fill in all required fields.",
    errConsent: "Please agree to the career-info collection.",
    back: "Back",
    submit: "Check my fit",
    submitting: "Analyzing...",
    levels: { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", NATIVE: "Native" },
    works: { INTERN: "Internship", PART_TIME: "Part-time", PROJECT: "Project", FULL_TIME: "Full-time" },
    contacts: { EMAIL: "Email", KAKAO: "KakaoTalk", WHATSAPP: "WhatsApp", PHONE: "Phone" },
    visaOther: "Other"
  },
  "zh-CN": {
    heading: "用真实背景查看推荐可能性",
    intro: "只需输入国籍、专业、签证和语言水平，\n立即查看你是否可被推荐给韩国企业。",
    nationality: "国籍",
    nationalityPh: "例如：越南",
    school: "学校",
    schoolPh: "例如：首尔大学",
    major: "专业",
    majorPh: "例如：计算机科学",
    visa: "当前签证",
    korean: "韩语水平",
    english: "英语水平",
    jobRole: "期望职位",
    workType: "工作形式",
    contact: "联系方式",
    contactPh: "邮箱 / Kakao ID / WhatsApp 号码",
    hasResume: "你有简历吗？",
    yes: "有",
    no: "还没有",
    select: "请选择",
    optional: "(可选)",
    consentCareer: "我同意为职业推荐收集此信息。(必填)",
    consentRecommend: "我同意在推荐给韩国企业时提供我的信息。(可选)",
    required: "(必填)",
    errRequired: "请填写所有必填项。",
    errConsent: "请同意收集职业推荐信息。",
    back: "上一步",
    submit: "查看推荐可能性",
    submitting: "分析中...",
    levels: { BEGINNER: "初级", INTERMEDIATE: "中级", ADVANCED: "高级", NATIVE: "母语" },
    works: { INTERN: "实习", PART_TIME: "兼职", PROJECT: "项目制", FULL_TIME: "全职" },
    contacts: { EMAIL: "邮箱", KAKAO: "KakaoTalk", WHATSAPP: "WhatsApp", PHONE: "电话" },
    visaOther: "其他"
  },
  vi: {
    heading: "Kiểm tra mức độ phù hợp với hồ sơ thật của bạn",
    intro: "Chỉ cần nhập quốc tịch, chuyên ngành, visa và trình độ ngôn ngữ,\nchúng tôi sẽ kiểm tra khả năng giới thiệu bạn cho doanh nghiệp Hàn.",
    nationality: "Quốc tịch",
    nationalityPh: "VD: Việt Nam",
    school: "Trường",
    schoolPh: "VD: Đại học Quốc gia Seoul",
    major: "Chuyên ngành",
    majorPh: "VD: Khoa học máy tính",
    visa: "Visa hiện tại",
    korean: "Trình độ tiếng Hàn",
    english: "Trình độ tiếng Anh",
    jobRole: "Vị trí mong muốn",
    workType: "Hình thức làm việc",
    contact: "Liên hệ",
    contactPh: "Email / Kakao ID / Số WhatsApp",
    hasResume: "Bạn đã có CV chưa?",
    yes: "Đã có",
    no: "Chưa có",
    select: "Vui lòng chọn",
    optional: "(tùy chọn)",
    consentCareer: "Tôi đồng ý chia sẻ thông tin này để được gợi ý nghề nghiệp. (bắt buộc)",
    consentRecommend: "Tôi đồng ý cung cấp thông tin khi được giới thiệu cho doanh nghiệp Hàn. (tùy chọn)",
    required: "(bắt buộc)",
    errRequired: "Vui lòng điền tất cả các mục bắt buộc.",
    errConsent: "Vui lòng đồng ý thu thập thông tin nghề nghiệp.",
    back: "Quay lại",
    submit: "Kiểm tra mức độ phù hợp",
    submitting: "Đang phân tích...",
    levels: { BEGINNER: "Cơ bản", INTERMEDIATE: "Trung cấp", ADVANCED: "Nâng cao", NATIVE: "Bản ngữ" },
    works: { INTERN: "Thực tập", PART_TIME: "Bán thời gian", PROJECT: "Dự án", FULL_TIME: "Toàn thời gian" },
    contacts: { EMAIL: "Email", KAKAO: "KakaoTalk", WHATSAPP: "WhatsApp", PHONE: "Điện thoại" },
    visaOther: "Khác"
  },
  ja: {
    heading: "実際の経歴で推薦可能性をチェック",
    intro: "国籍・専攻・ビザ・語学レベルを入力するだけで、\n韓国企業に推薦できるかすぐに確認します。",
    nationality: "国籍",
    nationalityPh: "例：ベトナム",
    school: "学校",
    schoolPh: "例：ソウル大学校",
    major: "専攻",
    majorPh: "例：コンピューター工学",
    visa: "現在のビザ",
    korean: "韓国語レベル",
    english: "英語レベル",
    jobRole: "希望職種",
    workType: "勤務形態",
    contact: "連絡先",
    contactPh: "メール / Kakao ID / WhatsApp番号",
    hasResume: "履歴書をお持ちですか？",
    yes: "あります",
    no: "まだありません",
    select: "選択してください",
    optional: "(任意)",
    consentCareer: "キャリア推薦のため入力情報の収集に同意します。(必須)",
    consentRecommend: "韓国企業への推薦時に情報提供することに同意します。(任意)",
    required: "(必須)",
    errRequired: "必須項目をすべて入力してください。",
    errConsent: "キャリア推薦情報の収集に同意してください。",
    back: "戻る",
    submit: "推薦可能性をチェック",
    submitting: "分析中...",
    levels: { BEGINNER: "初級", INTERMEDIATE: "中級", ADVANCED: "上級", NATIVE: "ネイティブ" },
    works: { INTERN: "インターン", PART_TIME: "パートタイム", PROJECT: "プロジェクト", FULL_TIME: "正社員" },
    contacts: { EMAIL: "メール", KAKAO: "KakaoTalk", WHATSAPP: "WhatsApp", PHONE: "電話" },
    visaOther: "その他"
  },
  id: {
    heading: "Cek kecocokan dengan latar belakang aslimu",
    intro: "Cukup masukkan kewarganegaraan, jurusan, visa, dan level bahasa,\nkami akan cek apakah kamu bisa direkomendasikan ke perusahaan Korea.",
    nationality: "Kewarganegaraan",
    nationalityPh: "mis. Vietnam",
    school: "Sekolah",
    schoolPh: "mis. Seoul National University",
    major: "Jurusan",
    majorPh: "mis. Ilmu Komputer",
    visa: "Visa saat ini",
    korean: "Level bahasa Korea",
    english: "Level bahasa Inggris",
    jobRole: "Peran yang diinginkan",
    workType: "Tipe kerja",
    contact: "Kontak",
    contactPh: "Email / ID Kakao / Nomor WhatsApp",
    hasResume: "Apakah kamu punya CV?",
    yes: "Punya",
    no: "Belum",
    select: "Silakan pilih",
    optional: "(opsional)",
    consentCareer: "Saya setuju berbagi info ini untuk rekomendasi karier. (wajib)",
    consentRecommend: "Saya setuju memberikan info saat direkomendasikan ke perusahaan Korea. (opsional)",
    required: "(wajib)",
    errRequired: "Mohon isi semua kolom wajib.",
    errConsent: "Mohon setujui pengumpulan info karier.",
    back: "Kembali",
    submit: "Cek kecocokan saya",
    submitting: "Menganalisis...",
    levels: { BEGINNER: "Pemula", INTERMEDIATE: "Menengah", ADVANCED: "Mahir", NATIVE: "Penutur asli" },
    works: { INTERN: "Magang", PART_TIME: "Paruh waktu", PROJECT: "Proyek", FULL_TIME: "Penuh waktu" },
    contacts: { EMAIL: "Email", KAKAO: "KakaoTalk", WHATSAPP: "WhatsApp", PHONE: "Telepon" },
    visaOther: "Lainnya"
  }
};

const LEVELS: SajuLeadKoreanLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"];
const WORKS: SajuLeadWorkType[] = ["INTERN", "PART_TIME", "PROJECT", "FULL_TIME"];
const CONTACTS: SajuLeadContactType[] = ["EMAIL", "KAKAO", "WHATSAPP", "PHONE"];

const fieldClass =
  "h-11 w-full rounded-xl border-0 bg-white/10 px-3 text-sm text-white placeholder-white/40 outline-none transition focus-visible:ring-2 focus-visible:ring-yellow-300/60";
const selectClass = `${fieldClass} appearance-none pr-9`;

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-white/90">
      {children}
      {hint ? <span className="ml-1 text-[11px] text-white/40">{hint}</span> : null}
    </label>
  );
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <CaretDown
        weight="bold"
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40"
      />
    </div>
  );
}

export function SajuCareerForm({
  locale,
  shareSlug,
  submitting,
  onSubmit,
  onBack
}: {
  locale: PlatformLocale;
  shareSlug: string;
  submitting: boolean;
  onSubmit: (data: SajuLeadRequest) => void;
  onBack: () => void;
}) {
  const copy = COPY[locale];
  const [nationality, setNationality] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [visaType, setVisaType] = useState("");
  const [koreanLevel, setKoreanLevel] = useState<SajuLeadKoreanLevel | "">("");
  const [englishLevel, setEnglishLevel] = useState<SajuLeadKoreanLevel | "">("");
  const [preferredJobRole, setPreferredJobRole] = useState("");
  const [workType, setWorkType] = useState<SajuLeadWorkType | "">("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<SajuLeadContactType>("EMAIL");
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [consentCareer, setConsentCareer] = useState(false);
  const [consentRecommend, setConsentRecommend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (
      !nationality.trim() ||
      !school.trim() ||
      !major.trim() ||
      !visaType ||
      !koreanLevel ||
      !preferredJobRole ||
      !workType ||
      !contact.trim()
    ) {
      return setError(copy.errRequired);
    }
    if (!consentCareer) return setError(copy.errConsent);
    onSubmit({
      shareSlug,
      nationality: nationality.trim(),
      school: school.trim(),
      major: major.trim(),
      visaType,
      koreanLevel,
      englishLevel: englishLevel || undefined,
      preferredJobRole,
      workType,
      contact: contact.trim(),
      contactType,
      hasResume: hasResume ?? undefined,
      consentCareer,
      consentRecommend,
      locale
    });
  }

  return (
    <section className="px-5 pb-12">
      <div className="mb-5 text-center">
        <h2 className="text-[19px] font-bold text-white">{copy.heading}</h2>
        <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-white/60">{copy.intro}</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white/[0.04] p-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label hint={copy.required}>{copy.nationality}</Label>
            <input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder={copy.nationalityPh}
              maxLength={80}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label hint={copy.required}>{copy.school}</Label>
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder={copy.schoolPh}
                maxLength={120}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label hint={copy.required}>{copy.major}</Label>
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder={copy.majorPh}
                maxLength={120}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label hint={copy.required}>{copy.visa}</Label>
            <SelectWrap>
              <select value={visaType} onChange={(e) => setVisaType(e.target.value)} className={selectClass}>
                <option value="" disabled>
                  {copy.select}
                </option>
                {VISA_VALUES.map((v) => (
                  <option key={v.value} value={v.value} className="bg-[#1a1340]">
                    {v.code} · {v.desc}
                  </option>
                ))}
                <option value="OTHER" className="bg-[#1a1340]">
                  {copy.visaOther}
                </option>
              </select>
            </SelectWrap>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label hint={copy.required}>{copy.korean}</Label>
              <SelectWrap>
                <select
                  value={koreanLevel}
                  onChange={(e) => setKoreanLevel(e.target.value as SajuLeadKoreanLevel)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    {copy.select}
                  </option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l} className="bg-[#1a1340]">
                      {copy.levels[l]}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </div>
            <div className="space-y-2">
              <Label hint={copy.optional}>{copy.english}</Label>
              <SelectWrap>
                <select
                  value={englishLevel}
                  onChange={(e) => setEnglishLevel(e.target.value as SajuLeadKoreanLevel)}
                  className={selectClass}
                >
                  <option value="" className="bg-[#1a1340]">
                    {copy.select}
                  </option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l} className="bg-[#1a1340]">
                      {copy.levels[l]}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </div>
          </div>

          <div className="space-y-2">
            <Label hint={copy.required}>{copy.jobRole}</Label>
            <SelectWrap>
              <select
                value={preferredJobRole}
                onChange={(e) => setPreferredJobRole(e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>
                  {copy.select}
                </option>
                {JOB_ROLE_TAXONOMY.map((role) => (
                  <option key={role} value={role} className="bg-[#1a1340]">
                    {translateRole(role, locale)}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </div>

          <div className="space-y-2">
            <Label hint={copy.required}>{copy.workType}</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {WORKS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWorkType(w)}
                  className={`h-10 rounded-xl text-[12px] font-medium transition ${
                    workType === w ? "bg-yellow-300/20 text-yellow-100" : "bg-white/10 text-white/70 active:bg-white/15"
                  }`}
                >
                  {copy.works[w]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label hint={copy.required}>{copy.contact}</Label>
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <SelectWrap>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as SajuLeadContactType)}
                  className={selectClass}
                >
                  {CONTACTS.map((c) => (
                    <option key={c} value={c} className="bg-[#1a1340]">
                      {copy.contacts[c]}
                    </option>
                  ))}
                </select>
              </SelectWrap>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={copy.contactPh}
                maxLength={120}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label hint={copy.optional}>{copy.hasResume}</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: copy.yes },
                { v: false, label: copy.no }
              ].map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setHasResume(opt.v)}
                  className={`h-11 rounded-xl text-sm font-medium transition ${
                    hasResume === opt.v
                      ? "bg-yellow-300/20 text-yellow-100"
                      : "bg-white/10 text-white/70 active:bg-white/15"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/10 pt-4">
            <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-white/70">
              <input
                type="checkbox"
                checked={consentCareer}
                onChange={(e) => setConsentCareer(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-yellow-300"
              />
              <span>{copy.consentCareer}</span>
            </label>
            <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-white/70">
              <input
                type="checkbox"
                checked={consentRecommend}
                onChange={(e) => setConsentRecommend(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-yellow-300"
              />
              <span>{copy.consentRecommend}</span>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onBack}
              className="h-12 flex-shrink-0 rounded-xl bg-white/10 px-5 text-[14px] font-medium text-white/80 transition active:bg-white/15"
            >
              {copy.back}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 text-[14px] font-semibold text-[#1a1340] shadow-[0_8px_24px_-12px_rgba(250,204,21,0.6)] transition active:from-yellow-200 active:to-amber-300 disabled:opacity-60"
            >
              {submitting ? copy.submitting : copy.submit}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
