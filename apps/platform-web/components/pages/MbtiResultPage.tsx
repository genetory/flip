"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { JOB_ROLE_TAXONOMY } from "../../lib/saju-taxonomy";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

// Same visa enum + labels as the Saju lead form so MBTI captures the same
// shape of profile info.
function getVisaValues(t: PlatformT): Array<{ value: string; code: string; desc: string }> {
  return [
    { value: "D10_JOB_SEEKING", code: "D-10", desc: t("구직", "Job Seeking", "求职", "Tìm việc", "求職", "Cari kerja") },
    { value: "D2_STUDENT", code: "D-2", desc: t("유학", "Study", "留学", "Du học", "留学", "Studi") },
    { value: "D4_GENERAL_TRAINING", code: "D-4", desc: t("일반연수", "Training", "一般研修", "Đào tạo", "一般研修", "Pelatihan") },
    { value: "F2_RESIDENCE", code: "F-2", desc: t("거주", "Residence", "居住", "Cư trú", "居住", "Domisili") },
    { value: "F4_OVERSEAS_KOREAN", code: "F-4", desc: t("재외동포", "Overseas Korean", "海外同胞", "Kiều bào", "在外同胞", "Diaspora") },
    { value: "F5_PERMANENT_RESIDENCE", code: "F-5", desc: t("영주", "Permanent", "永住", "Thường trú", "永住", "Permanen") },
    { value: "F6_MARRIAGE_IMMIGRATION", code: "F-6", desc: t("결혼이민", "Marriage", "结婚移民", "Kết hôn", "結婚移民", "Kawin") },
    { value: "E7_SPECIFIC_ACTIVITY", code: "E-7", desc: t("특정활동", "Specific Activity", "特定活动", "HĐ cụ thể", "特定活動", "Aktivitas khusus") },
    { value: "H1_WORKING_HOLIDAY", code: "H-1", desc: t("워킹홀리데이", "Working Holiday", "打工度假", "Working Holiday", "ワーホリ", "Working Holiday") }
  ];
}

type LangLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
type ContactType = "EMAIL" | "KAKAO" | "WHATSAPP" | "PHONE";

function getLangLevels(t: PlatformT): Array<{ value: LangLevel; label: string }> {
  return [
    { value: "BEGINNER", label: t("초급", "Beginner", "初级", "Cơ bản", "初級", "Pemula") },
    { value: "INTERMEDIATE", label: t("중급", "Interm.", "中级", "Trung cấp", "中級", "Menengah") },
    { value: "ADVANCED", label: t("고급", "Advanced", "高级", "Nâng cao", "上級", "Mahir") },
    { value: "NATIVE", label: t("원어민", "Native", "母语", "Bản ngữ", "ネイティブ", "Asli") }
  ];
}

function getContactTypes(t: PlatformT): Array<{ value: ContactType; label: string }> {
  return [
    { value: "EMAIL", label: t("이메일", "Email", "邮箱", "Email", "メール", "Email") },
    { value: "KAKAO", label: t("카카오톡", "KakaoTalk", "KakaoTalk", "KakaoTalk", "KakaoTalk", "KakaoTalk") },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PHONE", label: t("전화", "Phone", "电话", "Điện thoại", "電話", "Telepon") }
  ];
}

// ---------------------------------------------------------------------------
// MBTI result page — three-tier reveal, matching the Saju lead-capture flow:
//
//   Tier 1 (anonymous, immediate):
//     - Hero (MBTI type + culture summary)
//     - 한 줄 해석
//     - 어울리는 직무 chips
//
//   Tier 2 (after the visitor fills a short profile form):
//     - 강점, 한국 직장 주의점, 회사 규모/팀 분위기, 면접 팁
//     - K-pop 유명인, 시너지 좋은 MBTI
//
//   Tier 3 (after signup/login):
//     - 잘 맞는 / 피하면 좋은 회사 시그널
//     - 매칭 채용 공고 + 사유
//
// Tier 2 gating is purely client-side for now — we set `revealMore` after
// the profile form is submitted, no backend persistence. (A future server
// endpoint can attach the profile to the MbtiPrediction row if we want to
// reuse it for matching.)
// ---------------------------------------------------------------------------

type Prediction = {
  id: string;
  mbtiType: string;
  name: string | null;
  nationality: string | null;
  recommendedRoleNames: string[];
  cultureSummary: string;
  interpretation: string;
  strengths: string[];
  koreanWorkplaceChallenges: string[];
  companySizeFit: string;
  teamVibe: string;
  interviewTips: string[];
  famousKoreans: string[];
  goodMatchMbtis: { type: string; reason: string }[];
  greenFlags: string[];
  redFlags: string[];
  shareSlug: string;
  locale: string;
  createdAt: string;
};

type Position = {
  id: string;
  title: string;
  preferredJobRole: string | null;
  partnerOrganization: { id: string; name: string } | null;
  sourceCompanyName: string | null;
  matchReason: string | null;
};

function roleLabel(code: string, t: PlatformT): string {
  const map: Record<string, string> = {
    SOFTWARE_DEVELOPMENT: t("소프트웨어 개발", "Software Dev", "软件开发", "Phần mềm", "ソフト開発", "Software"),
    FRONTEND_DEVELOPMENT: t("프런트엔드 개발", "Frontend", "前端开发", "Frontend", "フロント開発", "Frontend"),
    BACKEND_DEVELOPMENT: t("백엔드 개발", "Backend", "后端开发", "Backend", "バック開発", "Backend"),
    DATA_ANALYSIS_SCIENCE: t("데이터 분석·사이언스", "Data", "数据分析", "Dữ liệu", "データ分析", "Data"),
    UI_UX_DESIGN: t("UI/UX 디자인", "UI/UX Design", "UI/UX设计", "Thiết kế UI/UX", "UI/UXデザイン", "Desain UI/UX"),
    PRODUCT_MANAGER: t("PM·기획", "PM", "PM·企划", "PM", "PM·企画", "PM"),
    MARKETING: t("마케팅", "Marketing", "市场营销", "Marketing", "マーケ", "Marketing"),
    SALES: t("영업·BD", "Sales·BD", "销售·BD", "Sales·BD", "営業·BD", "Sales·BD"),
    HR: "HR·People Ops",
    FINANCE_ACCOUNTING: t("재무·회계", "Finance", "财务·会计", "Tài chính", "財務·会計", "Keuangan"),
    OPERATIONS_PLANNING: t("운영·기획", "Operations", "运营·企划", "Vận hành", "運営·企画", "Operasional"),
    OTHER: t("기타", "Other", "其他", "Khác", "その他", "Lainnya")
  };
  return map[code] ?? code;
}


export function MbtiResultPage({ slug }: { slug: string }) {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const { user } = useAuthSession();
  const t = usePlatformT();
  const isAuthenticated = Boolean(user);

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tier 2 gate — profile form (same fields as Saju lead capture)
  const [formOpen, setFormOpen] = useState(false);
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [nationality, setNationality] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [visaType, setVisaType] = useState("");
  const [koreanLevel, setKoreanLevel] = useState<LangLevel | "">("");
  const [englishLevel, setEnglishLevel] = useState<LangLevel | "">("");
  const [preferredJobRole, setPreferredJobRole] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<ContactType>("EMAIL");
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [consentCareer, setConsentCareer] = useState(false);
  const [consentRecommend, setConsentRecommend] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tier 2 unlocks via either: (a) form just submitted, or (b) authenticated.
  // Tier 3 unlocks via (b) only.
  const revealMore = profileSubmitted || isAuthenticated;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${apiBase}/mbti/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
        const notFound = t("결과를 찾을 수 없습니다.", "Result not found.", "找不到结果。", "Không tìm thấy kết quả.", "結果が見つかりません。", "Hasil tidak ditemukan.");
        if (!response.ok) throw new Error(notFound);
        const payload = (await response.json()) as { ok?: boolean; prediction?: Prediction; positions?: Position[] };
        if (cancelled) return;
        if (!payload.ok || !payload.prediction) throw new Error(notFound);
        setPrediction(payload.prediction);
        setPositions(payload.positions ?? []);
        // If the original quiz had a nationality stored, pre-fill so the
        // form is one less field for the visitor.
        if (payload.prediction.nationality) setNationality(payload.prediction.nationality);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("결과를 불러오지 못했습니다.", "Couldn't load the result.", "无法载入结果。", "Không thể tải kết quả.", "結果を読み込めませんでした。", "Tidak dapat memuat hasil."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, slug]);

  function copyShareLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/mbti/result/${slug}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleProfileSubmit() {
    setFormError(null);
    // Match Saju's required fields: nationality, preferredJobRole, contact
    // and consentCareer must be present.
    if (!nationality.trim() || !preferredJobRole || !contact.trim()) {
      setFormError(t("필수 항목을 모두 입력해 주세요.", "Please fill in all required fields.", "请填写所有必填项。", "Vui lòng điền tất cả mục bắt buộc.", "必須項目をすべて入力してください。", "Mohon isi semua kolom wajib."));
      return;
    }
    if (!consentCareer) {
      setFormError(t("커리어 추천 정보 수집에 동의해 주세요.", "Please agree to the career-info collection.", "请同意收集职业推荐信息。", "Vui lòng đồng ý thu thập thông tin nghề nghiệp.", "キャリア推薦情報の収集に同意してください。", "Mohon setujui pengumpulan info karier."));
      return;
    }
    // Client-side gate only for now. (Future: POST to /mbti/profile to
    // attach this lead to the MbtiPrediction row for matching.)
    setProfileSubmitted(true);
    setFormOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const nextParam = typeof window !== "undefined"
    ? encodeURIComponent(`/events/mbti/result/${slug}`)
    : encodeURIComponent(`/events/mbti/result/${slug}`);

  return (
    <div className="min-h-screen bg-[#1c0f05] font-sans text-white antialiased">
      <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col overflow-hidden bg-gradient-to-b from-[#1c0f05] via-[#3a230c] to-[#1c0f05]">
        {/* 별·글로우 장식 — 랜딩과 동일 톤 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute left-[26%] top-14 h-2 w-2 rounded-full bg-yellow-200/70 blur-[1px]" />
          <span className="absolute right-[18%] top-24 h-1.5 w-1.5 rounded-full bg-white/80" />
          <span className="absolute left-8 top-52 h-1 w-1 rounded-full bg-yellow-100/60" />
          <span className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl" />
        </div>
        <main className="relative z-10 flex-1 px-4 py-5">
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-sm text-white/50">{t("결과를 불러오는 중...", "Loading your result...", "正在载入结果...", "Đang tải kết quả...", "結果を読み込み中...", "Memuat hasil...")}</p>
            ) : error ? (
              <p className="text-center text-sm text-red-300">{error}</p>
            ) : prediction ? (
              <>
                {/* ========================================================
                    Tier 1 — anonymous, immediate
                    ====================================================== */}

                {/* Hero card */}
                <section className="rounded-3xl bg-gradient-to-br from-amber-400/15 via-[#2a1608] to-[#1c0f05] p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Aply × MBTI</p>
                  {prediction.name ? (
                    <p className="mt-2 text-sm text-white/50">{prediction.name}{t("의 결과", "'s result", "的结果", " — kết quả", "さんの結果", " — hasil")}</p>
                  ) : null}
                  <p className="mt-3 text-5xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent">{prediction.mbtiType}</span>
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {prediction.cultureSummary}
                  </p>
                </section>

                {/* Interpretation */}
                <section className="rounded-2xl bg-white/[0.05] p-5">
                  <h2 className="text-sm font-semibold text-white/50">{t("한 줄 해석", "One-line reading", "一句话解读", "Tóm tắt một dòng", "ひとこと診断", "Ringkasan singkat")}</h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-white whitespace-pre-wrap">
                    {prediction.interpretation}
                  </p>
                </section>

                {/* Recommended role categories (chips) */}
                <section className="rounded-2xl bg-white/[0.05] p-5">
                  <h2 className="text-sm font-semibold text-white/50">{t("어울리는 직무", "Roles that fit", "适合的职务", "Nghề phù hợp", "合う職種", "Peran yang cocok")}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {prediction.recommendedRoleNames.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200"
                      >
                        {roleLabel(code, t)}
                      </span>
                    ))}
                  </div>
                </section>

                {/* ========================================================
                    Gate #1 — profile form
                    ====================================================== */}

                {!revealMore && !formOpen ? (
                  <LockedTeaser
                    title={t("🔒 프로필 입력하면 더 자세한 결과가 열려요", "🔒 Fill in your profile to unlock more", "🔒 填写资料解锁更多结果", "🔒 Nhập hồ sơ để mở khóa thêm", "🔒 プロフィール入力で詳細が開きます", "🔒 Isi profil untuk buka lebih banyak")}
                    items={[
                      `💪 ${prediction.mbtiType} ${t("강점", "strengths", "的优势", "điểm mạnh", "の強み", "kekuatan")}`,
                      t("🏢 어울리는 회사 규모 & 팀 분위기", "🏢 Company size & team vibe that fit", "🏢 合适的公司规模与团队氛围", "🏢 Quy mô & không khí nhóm phù hợp", "🏢 合う会社規模＆チームの雰囲気", "🏢 Skala perusahaan & suasana tim"),
                      t("🎯 한국 면접 팁", "🎯 Korean interview tips", "🎯 韩国面试技巧", "🎯 Mẹo phỏng vấn Hàn", "🎯 韓国面接のコツ", "🎯 Tips wawancara Korea"),
                      `🎤 ${t("같은", "Same", "同款", "Cùng", "同じ", "Sama")} ${prediction.mbtiType} K-pop`,
                      t("🤝 시너지 좋은 동료 MBTI", "🤝 MBTIs you sync with", "🤝 合拍的同事 MBTI", "🤝 MBTI đồng nghiệp hợp", "🤝 相性のいい同僚MBTI", "🤝 MBTI rekan yang cocok")
                    ]}
                    ctaLabel={t("프로필 입력하고 결과 더 보기", "Fill in profile & see more", "填写资料查看更多", "Nhập hồ sơ & xem thêm", "入力して結果を見る", "Isi profil & lihat lagi")}
                    onCta={() => setFormOpen(true)}
                  />
                ) : null}

                {!revealMore && formOpen ? (
                  <ProfileForm
                    nationality={nationality}
                    school={school}
                    major={major}
                    visaType={visaType}
                    koreanLevel={koreanLevel}
                    englishLevel={englishLevel}
                    preferredJobRole={preferredJobRole}
                    contact={contact}
                    contactType={contactType}
                    hasResume={hasResume}
                    consentCareer={consentCareer}
                    consentRecommend={consentRecommend}
                    consentContact={consentContact}
                    error={formError}
                    onChangeNationality={setNationality}
                    onChangeSchool={setSchool}
                    onChangeMajor={setMajor}
                    onChangeVisa={setVisaType}
                    onChangeKorean={setKoreanLevel}
                    onChangeEnglish={setEnglishLevel}
                    onChangeJobRole={setPreferredJobRole}
                    onChangeContact={setContact}
                    onChangeContactType={setContactType}
                    onChangeHasResume={setHasResume}
                    onChangeConsentCareer={setConsentCareer}
                    onChangeConsentRecommend={setConsentRecommend}
                    onChangeConsentContact={setConsentContact}
                    onSubmit={handleProfileSubmit}
                    onBack={() => setFormOpen(false)}
                  />
                ) : null}

                {/* ========================================================
                    Tier 2 — after profile (or if logged in)
                    ====================================================== */}

                {revealMore && prediction.strengths.length > 0 ? (
                  <section className="rounded-2xl bg-white/[0.05] p-5">
                    <h2 className="text-sm font-semibold text-white/50">
                      💪 {prediction.mbtiType} {t("강점", "strengths", "的优势", "điểm mạnh", "の強み", "kekuatan")}
                    </h2>
                    <ul className="mt-3 space-y-2 text-[14px] text-white">
                      {prediction.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-200 mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {revealMore && prediction.koreanWorkplaceChallenges.length > 0 ? (
                  <section className="rounded-2xl bg-white/[0.05] p-5">
                    <h2 className="text-sm font-semibold text-white/50">
                      {t("⚠️ 한국 직장에서 주의할 점", "⚠️ Watch-outs at Korean workplaces", "⚠️ 韩国职场需注意的点", "⚠️ Lưu ý tại nơi làm việc Hàn", "⚠️ 韓国の職場での注意点", "⚠️ Hal yang perlu diwaspadai di kerja Korea")}
                    </h2>
                    <ul className="mt-3 space-y-2 text-[14px] text-white">
                      {prediction.koreanWorkplaceChallenges.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {revealMore && (prediction.companySizeFit || prediction.teamVibe) ? (
                  <section className="grid grid-cols-1 gap-3">
                    {prediction.companySizeFit ? (
                      <div className="rounded-2xl bg-white/[0.05] p-5">
                        <h2 className="text-xs font-semibold text-white/50">{t("🏢 어울리는 회사 규모", "🏢 Company size that fits", "🏢 合适的公司规模", "🏢 Quy mô công ty phù hợp", "🏢 合う会社規模", "🏢 Skala perusahaan yang cocok")}</h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-white">{prediction.companySizeFit}</p>
                      </div>
                    ) : null}
                    {prediction.teamVibe ? (
                      <div className="rounded-2xl bg-white/[0.05] p-5">
                        <h2 className="text-xs font-semibold text-white/50">{t("🌱 어울리는 팀 분위기", "🌱 Team vibe that fits", "🌱 合适的团队氛围", "🌱 Không khí nhóm phù hợp", "🌱 合うチームの雰囲気", "🌱 Suasana tim yang cocok")}</h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-white">{prediction.teamVibe}</p>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {revealMore && prediction.interviewTips.length > 0 ? (
                  <section className="rounded-2xl bg-white/[0.05] p-5">
                    <h2 className="text-sm font-semibold text-white/50">
                      🎯 {t("한국 면접 팁", "Korean interview tips", "韩国面试技巧", "Mẹo phỏng vấn Hàn", "韓国面接のコツ", "Tips wawancara Korea")} · {prediction.mbtiType}
                    </h2>
                    <ul className="mt-3 space-y-2 text-[14px] text-white">
                      {prediction.interviewTips.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-200 mt-1 font-semibold">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {revealMore && prediction.famousKoreans.length > 0 ? (
                  <section className="rounded-2xl bg-white/[0.05] p-5">
                    <h2 className="text-sm font-semibold text-white/50">
                      🎤 {t("같은", "Same", "同款", "Cùng", "同じ", "Sama")} {prediction.mbtiType} K-pop {t("아이돌", "idols", "偶像", "idol", "アイドル", "idol")}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {prediction.famousKoreans.map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05]/[0.04] px-3 py-1 text-xs font-semibold text-white"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-white/50">
                      {t("※ 인터넷·공개 인터뷰에서 회자되는 정보 기준이며, 실제 검사 결과는 아닙니다.", "※ Based on info circulating online / public interviews, not actual test results.", "※ 基于网络及公开采访流传的信息，并非实际测试结果。", "※ Dựa trên thông tin lan truyền trên mạng / phỏng vấn công khai, không phải kết quả kiểm tra thực tế.", "※ ネットや公開インタビューで語られる情報に基づくもので、実際の検査結果ではありません。", "※ Berdasarkan info yang beredar online / wawancara publik, bukan hasil tes sebenarnya.")}
                    </p>
                  </section>
                ) : null}

                {revealMore && prediction.goodMatchMbtis.length > 0 ? (
                  <section className="rounded-2xl bg-white/[0.05] p-5">
                    <h2 className="text-sm font-semibold text-white/50">
                      {t("🤝 함께 일하면 시너지가 좋은 MBTI", "🤝 MBTIs you work great with", "🤝 合作有默契的 MBTI", "🤝 MBTI hợp tác ăn ý", "🤝 一緒に働くと相性のいいMBTI", "🤝 MBTI yang cocok diajak kerja")}
                    </h2>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {prediction.goodMatchMbtis.map((m) => (
                        <div
                          key={m.type}
                          className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-3"
                        >
                          <p className="text-base font-black tracking-tight text-amber-200">
                            {m.type}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-white">
                            {m.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* ========================================================
                    Gate #2 — signup CTA
                    ====================================================== */}

                {revealMore && !isAuthenticated ? (
                  <SignupGate apiBase={apiBase} nextParam={nextParam} />
                ) : null}

                {/* ========================================================
                    Tier 3 — authenticated only
                    ====================================================== */}

                {isAuthenticated && (prediction.greenFlags.length > 0 || prediction.redFlags.length > 0) ? (
                  <section className="grid grid-cols-1 gap-3">
                    {prediction.greenFlags.length > 0 ? (
                      <div className="rounded-2xl bg-white/[0.05] p-5">
                        <h2 className="text-sm font-semibold text-white/50">
                          {t("✅ 잘 맞는 회사 시그널", "✅ Good-fit company signals", "✅ 合适公司的信号", "✅ Dấu hiệu công ty hợp", "✅ 相性のいい会社のサイン", "✅ Sinyal perusahaan yang cocok")}
                        </h2>
                        <ul className="mt-3 space-y-2 text-[14px] text-white">
                          {prediction.greenFlags.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-emerald-600 mt-1">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {prediction.redFlags.length > 0 ? (
                      <div className="rounded-2xl bg-white/[0.05] p-5">
                        <h2 className="text-sm font-semibold text-white/50">
                          {t("🚩 피하면 좋은 회사 시그널", "🚩 Company signals to avoid", "🚩 应避开公司的信号", "🚩 Dấu hiệu công ty nên tránh", "🚩 避けたい会社のサイン", "🚩 Sinyal perusahaan yang dihindari")}
                        </h2>
                        <ul className="mt-3 space-y-2 text-[14px] text-white">
                          {prediction.redFlags.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-rose-500 mt-1">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {isAuthenticated ? (
                  <section className="rounded-2xl bg-white/[0.05] p-5">
                    <h2 className="text-sm font-semibold text-white/50">
                      {t("추천 채용 공고", "Recommended job openings", "推荐招聘公告", "Tin tuyển dụng gợi ý", "おすすめ求人", "Lowongan rekomendasi")} · {prediction.mbtiType}
                    </h2>
                    {positions.length === 0 ? (
                      <p className="mt-3 text-sm text-white/50">
                        {t("현재 매칭되는 채용 공고가 없어요. 새 공고가 올라오면 자동으로 알려드립니다.", "No matching openings right now. We'll notify you automatically when new ones are posted.", "目前没有匹配的招聘公告。有新公告时我们会自动通知你。", "Hiện chưa có tin phù hợp. Chúng tôi sẽ tự động báo khi có tin mới.", "現在マッチする求人はありません。新しい求人が出たら自動でお知らせします。", "Belum ada lowongan yang cocok. Kami akan memberi tahu otomatis saat ada yang baru.")}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {positions.map((p) => (
                          <Link
                            key={p.id}
                            href={`/talent/jobs/${p.id}`}
                            className="block rounded-xl border border-white/10 bg-white/[0.05]/[0.03] px-4 py-3 transition hover:border-amber-300/40 hover:bg-amber-300/10"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                              {p.partnerOrganization?.name ?? p.sourceCompanyName ?? t("기업", "Company", "企业", "Công ty", "企業", "Perusahaan")}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-white">{p.title}</p>
                            {p.preferredJobRole ? (
                              <p className="mt-0.5 text-[11px] text-white/50">
                                {roleLabel(p.preferredJobRole, t)}
                              </p>
                            ) : null}
                            {p.matchReason ? (
                              <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-300/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                                ✨ {p.matchReason}
                              </p>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {/* ========================================================
                    Bottom controls — always visible
                    ====================================================== */}

                <section className="rounded-2xl bg-white/[0.05] p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="h-11 rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold"
                    >
                      {copied ? t("복사됨!", "Copied!", "已复制！", "Đã sao chép!", "コピー完了！", "Tersalin!") : t("결과 링크 복사", "Copy link", "复制链接", "Sao chép link", "リンクをコピー", "Salin tautan")}
                    </button>
                    <Link
                      href="/events/mbti"
                      className="h-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold"
                    >
                      {t("다시 하기", "Try again", "再试一次", "Làm lại", "もう一度", "Coba lagi")}
                    </Link>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LockedTeaser({
  title,
  items,
  ctaLabel,
  onCta
}: {
  title: string;
  items: string[];
  ctaLabel: string;
  onCta: () => void;
}) {
  const t = usePlatformT();
  return (
    <section className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-amber-400/10 to-[#1c0f05] p-6">
      <p className="text-center text-[15px] font-bold text-white">{title}</p>
      <ul className="mt-4 space-y-2">
        {items.map((label) => (
          <li
            key={label}
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.05]/[0.04] px-3.5 py-2.5 text-[13px] text-white/50"
          >
            <span className="text-base">🔒</span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-[15px] font-semibold text-[#2a1608] transition hover:bg-amber-400"
      >
        {ctaLabel} →
      </button>
      <p className="mt-2 text-center text-[11px] text-white/50">
        {t("가입 없이 1분이면 가능해요", "Takes a minute, no signup", "无需注册，1分钟即可", "Chỉ 1 phút, không cần đăng ký", "登録不要、1分でOK", "1 menit, tanpa daftar")}
      </p>
    </section>
  );
}

// Light-themed parity copy of SajuCareerForm fields. Same shape, same
// required set (nationality / preferredJobRole / contact / consentCareer),
// same optional enrichers (school, major, visa, langs, hasResume, extra
// consents) — only the visual theme matches the MBTI page.
function ProfileForm(props: {
  nationality: string;
  school: string;
  major: string;
  visaType: string;
  koreanLevel: LangLevel | "";
  englishLevel: LangLevel | "";
  preferredJobRole: string;
  contact: string;
  contactType: ContactType;
  hasResume: boolean | null;
  consentCareer: boolean;
  consentRecommend: boolean;
  consentContact: boolean;
  error: string | null;
  onChangeNationality: (v: string) => void;
  onChangeSchool: (v: string) => void;
  onChangeMajor: (v: string) => void;
  onChangeVisa: (v: string) => void;
  onChangeKorean: (v: LangLevel | "") => void;
  onChangeEnglish: (v: LangLevel | "") => void;
  onChangeJobRole: (v: string) => void;
  onChangeContact: (v: string) => void;
  onChangeContactType: (v: ContactType) => void;
  onChangeHasResume: (v: boolean | null) => void;
  onChangeConsentCareer: (v: boolean) => void;
  onChangeConsentRecommend: (v: boolean) => void;
  onChangeConsentContact: (v: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const t = usePlatformT();
  const visaValues = getVisaValues(t);
  const langLevels = getLangLevels(t);
  const contactTypes = getContactTypes(t);
  const inputCls =
    "h-11 w-full rounded-xl border-0 bg-white/[0.05]/[0.06] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50";
  const selectCls =
    "h-11 w-full appearance-none rounded-xl border-0 bg-white/[0.05]/[0.06] px-3 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50";

  return (
    <section className="rounded-3xl border border-amber-300/25 bg-white/[0.05] p-5">
      <p className="text-[15px] font-bold text-white">{t("실제 내 이력으로 추천 가능성 확인하기", "Check your fit with your real background", "用真实背景查看推荐可能性", "Kiểm tra độ phù hợp với hồ sơ thật", "実際の経歴で推薦可能性をチェック", "Cek kecocokan dengan latar belakang aslimu")}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-white/50">
        {t("국적·전공·비자·언어 조건만 입력하면 한국 기업 매칭 가능성을 바로 확인해드려요.", "Just your nationality, major, visa & language — we'll check your match with Korean companies right away.", "只需输入国籍·专业·签证·语言，立即查看与韩国企业的匹配可能性。", "Chỉ cần quốc tịch, chuyên ngành, visa & ngôn ngữ — kiểm tra ngay khả năng phù hợp với doanh nghiệp Hàn.", "国籍・専攻・ビザ・言語だけで、韓国企業とのマッチング可能性をすぐに確認します。", "Cukup kewarganegaraan, jurusan, visa & bahasa — langsung cek kecocokan dengan perusahaan Korea.")}
      </p>

      <div className="mt-5 space-y-4">
        {/* Nationality (required) */}
        <div className="space-y-1.5">
          <FieldLabel required>{t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")}</FieldLabel>
          <input
            value={props.nationality}
            onChange={(e) => props.onChangeNationality(e.target.value)}
            placeholder={t("예: 베트남", "e.g. Vietnam", "例：越南", "VD: Việt Nam", "例：ベトナム", "mis. Vietnam")}
            maxLength={80}
            className={inputCls}
          />
        </div>

        {/* Preferred job role (required) */}
        <div className="space-y-1.5">
          <FieldLabel required>{t("희망 직무", "Preferred role", "期望职位", "Vị trí mong muốn", "希望職種", "Peran yang diinginkan")}</FieldLabel>
          <div className="relative">
            <select
              value={props.preferredJobRole}
              onChange={(e) => props.onChangeJobRole(e.target.value)}
              className={selectCls}
            >
              <option value="" disabled>{t("선택해 주세요", "Please select", "请选择", "Vui lòng chọn", "選択してください", "Silakan pilih")}</option>
              {JOB_ROLE_TAXONOMY.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">▾</span>
          </div>
        </div>

        {/* School (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>{t("학교", "School", "学校", "Trường", "学校", "Sekolah")} <OptionalTag /></FieldLabel>
          <input
            value={props.school}
            onChange={(e) => props.onChangeSchool(e.target.value)}
            placeholder={t("예: 서울대학교", "e.g. Seoul National Univ.", "例：首尔大学", "VD: ĐH Quốc gia Seoul", "例：ソウル大学校", "mis. Seoul National Univ.")}
            maxLength={120}
            className={inputCls}
          />
        </div>

        {/* Major (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>{t("전공", "Major", "专业", "Chuyên ngành", "専攻", "Jurusan")} <OptionalTag /></FieldLabel>
          <input
            value={props.major}
            onChange={(e) => props.onChangeMajor(e.target.value)}
            placeholder={t("예: 컴퓨터공학", "e.g. Computer Science", "例：计算机科学", "VD: Khoa học máy tính", "例：コンピューター工学", "mis. Ilmu Komputer")}
            maxLength={120}
            className={inputCls}
          />
        </div>

        {/* Visa (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>{t("현재 비자", "Current visa", "当前签证", "Visa hiện tại", "現在のビザ", "Visa saat ini")} <OptionalTag /></FieldLabel>
          <div className="relative">
            <select
              value={props.visaType}
              onChange={(e) => props.onChangeVisa(e.target.value)}
              className={selectCls}
            >
              <option value="">{t("선택해 주세요", "Please select", "请选择", "Vui lòng chọn", "選択してください", "Silakan pilih")}</option>
              {visaValues.map((v) => (
                <option key={v.value} value={v.value}>{v.code} ({v.desc})</option>
              ))}
              <option value="OTHER">{t("기타", "Other", "其他", "Khác", "その他", "Lainnya")}</option>
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">▾</span>
          </div>
        </div>

        {/* Korean level (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>{t("한국어 수준", "Korean level", "韩语水平", "Trình độ tiếng Hàn", "韓国語レベル", "Level bahasa Korea")} <OptionalTag /></FieldLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {langLevels.map((opt) => {
              const active = props.koreanLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => props.onChangeKorean(active ? "" : opt.value)}
                  className={`h-10 rounded-xl border text-[12px] font-semibold ${
                    active ? "border-amber-400 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/[0.05]/[0.04]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* English level (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>{t("영어 수준", "English level", "英语水平", "Trình độ tiếng Anh", "英語レベル", "Level bahasa Inggris")} <OptionalTag /></FieldLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {langLevels.map((opt) => {
              const active = props.englishLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => props.onChangeEnglish(active ? "" : opt.value)}
                  className={`h-10 rounded-xl border text-[12px] font-semibold ${
                    active ? "border-amber-400 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/[0.05]/[0.04]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Has resume (optional) */}
        <div className="space-y-1.5">
          <FieldLabel>{t("이력서를 가지고 있나요?", "Do you have a resume?", "你有简历吗？", "Bạn đã có CV chưa?", "履歴書をお持ちですか？", "Apakah kamu punya CV?")} <OptionalTag /></FieldLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => props.onChangeHasResume(props.hasResume === true ? null : true)}
              className={`h-10 rounded-xl border text-[12px] font-semibold ${
                props.hasResume === true ? "border-amber-400 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/[0.05]/[0.04]"
              }`}
            >
              {t("있어요", "Yes", "有", "Đã có", "あります", "Punya")}
            </button>
            <button
              type="button"
              onClick={() => props.onChangeHasResume(props.hasResume === false ? null : false)}
              className={`h-10 rounded-xl border text-[12px] font-semibold ${
                props.hasResume === false ? "border-amber-400 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/[0.05]/[0.04]"
              }`}
            >
              {t("아직 없어요", "Not yet", "还没有", "Chưa có", "まだです", "Belum")}
            </button>
          </div>
        </div>

        {/* Contact (required) */}
        <div className="space-y-1.5">
          <FieldLabel required>{t("연락처", "Contact", "联系方式", "Liên hệ", "連絡先", "Kontak")}</FieldLabel>
          <div className="flex gap-2">
            <div className="relative w-[120px] shrink-0">
              <select
                value={props.contactType}
                onChange={(e) => props.onChangeContactType(e.target.value as ContactType)}
                className={selectCls}
              >
                {contactTypes.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">▾</span>
            </div>
            <input
              value={props.contact}
              onChange={(e) => props.onChangeContact(e.target.value)}
              placeholder={t("이메일 / 카카오ID / WhatsApp 번호", "Email / Kakao ID / WhatsApp number", "邮箱 / Kakao ID / WhatsApp 号码", "Email / Kakao ID / Số WhatsApp", "メール / Kakao ID / WhatsApp番号", "Email / ID Kakao / Nomor WhatsApp")}
              maxLength={120}
              className={`${inputCls} flex-1`}
            />
          </div>
        </div>
      </div>

      {/* Consents */}
      <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
        <ConsentRow
          checked={props.consentCareer}
          onChange={props.onChangeConsentCareer}
          label={t("커리어 추천을 위해 입력 정보 수집에 동의합니다.", "I agree to share this info for career recommendations.", "我同意为职业推荐收集此信息。", "Tôi đồng ý chia sẻ thông tin này để được gợi ý nghề nghiệp.", "キャリア推薦のため入力情報の収集に同意します。", "Saya setuju berbagi info ini untuk rekomendasi karier.")}
          required
        />
        <ConsentRow
          checked={props.consentRecommend}
          onChange={props.onChangeConsentRecommend}
          label={t("한국 기업 추천 시 내 정보 제공에 동의합니다.", "I agree to share my info when recommended to Korean companies.", "我同意在推荐给韩国企业时提供我的信息。", "Tôi đồng ý cung cấp thông tin khi được giới thiệu cho doanh nghiệp Hàn.", "韓国企業への推薦時に情報提供することに同意します。", "Saya setuju memberikan info saat direkomendasikan ke perusahaan Korea.")}
        />
        <ConsentRow
          checked={props.consentContact}
          onChange={props.onChangeConsentContact}
          label={t("결과 안내 및 채용 기회 관련 이메일·메시지 수신에 동의합니다.", "I agree to receive emails/messages about my result and job opportunities.", "我同意接收有关结果及招聘机会的邮件·消息。", "Tôi đồng ý nhận email/tin nhắn về kết quả và cơ hội việc làm.", "結果のご案内や採用機会に関するメール・メッセージの受信に同意します。", "Saya setuju menerima email/pesan tentang hasil dan peluang kerja.")}
        />
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-white/50">
        {t("수집 항목: 국적·학교·전공·비자·언어·희망 직무·연락처 / 이용 목적: 커리어 추천 및 한국 기업 매칭 / 보유 기간: 회원 미가입 시 수집일로부터 1년 후 파기.", "Collected: nationality, school, major, visa, language, preferred role, contact. Purpose: career recommendations & matching with Korean companies. Retention: deleted 1 year after collection if you don't sign up.", "收集项目：国籍·学校·专业·签证·语言·期望职位·联系方式 / 使用目的：职业推荐及韩国企业匹配 / 保存期限：未注册则自收集之日起 1 年后销毁。", "Thu thập: quốc tịch, trường, chuyên ngành, visa, ngôn ngữ, vị trí mong muốn, liên hệ. Mục đích: gợi ý nghề nghiệp & kết nối với doanh nghiệp Hàn. Lưu trữ: xóa sau 1 năm nếu không đăng ký.", "収集項目：国籍・学校・専攻・ビザ・言語・希望職種・連絡先 / 利用目的：キャリア推薦および韓国企業とのマッチング / 保有期間：未登録の場合は収集日から1年後に破棄。", "Dikumpulkan: kewarganegaraan, sekolah, jurusan, visa, bahasa, peran yang diinginkan, kontak. Tujuan: rekomendasi karier & pencocokan dengan perusahaan Korea. Penyimpanan: dihapus 1 tahun setelah pengumpulan jika tidak mendaftar.")}
      </p>

      {props.error ? (
        <p className="mt-3 text-[12.5px] text-red-300">{props.error}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={props.onBack}
          className="h-12 rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/50"
        >
          {t("이전", "Back", "上一步", "Quay lại", "戻る", "Kembali")}
        </button>
        <button
          type="button"
          onClick={props.onSubmit}
          className="col-span-2 h-12 rounded-xl bg-amber-400 text-sm font-semibold text-[#2a1608]"
        >
          {t("결과 더 보기", "See more results", "查看更多结果", "Xem thêm kết quả", "結果をもっと見る", "Lihat hasil lainnya")} →
        </button>
      </div>
    </section>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-1 text-[12px] font-semibold text-white">
      {children}
      {required ? <span className="text-rose-500">*</span> : null}
    </label>
  );
}

function OptionalTag() {
  const t = usePlatformT();
  return <span className="text-[11px] font-normal text-white/50">{t("(선택)", "(optional)", "(可选)", "(tùy chọn)", "(任意)", "(opsional)")}</span>;
}

function ConsentRow({
  checked,
  onChange,
  label,
  required
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
}) {
  const t = usePlatformT();
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/10 text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/50"
      />
      <span>
        {label}{" "}
        <span className={required ? "text-rose-500" : "text-white/50"}>
          ({required ? t("필수", "required", "必填", "bắt buộc", "必須", "wajib") : t("선택", "optional", "可选", "tùy chọn", "任意", "opsional")})
        </span>
      </span>
    </label>
  );
}

function SignupGate({ apiBase, nextParam }: { apiBase: string; nextParam: string }) {
  const t = usePlatformT();
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-center">
      <p className="text-[15px] font-bold text-white">
        {t("🔒 회원가입하면 더 자세한 결과가 열려요", "🔒 Sign up to unlock the full result", "🔒 注册解锁更详细的结果", "🔒 Đăng ký để mở khóa kết quả đầy đủ", "🔒 会員登録で詳しい結果が開きます", "🔒 Daftar untuk buka hasil lengkap")}
      </p>
      <ul className="mt-3 space-y-1.5 text-[13px] text-white/50">
        <li>{t("✅ 잘 맞는 / 🚩 피해야 할 회사 시그널", "✅ Good-fit / 🚩 avoid company signals", "✅ 合适 / 🚩 应避开的公司信号", "✅ Hợp / 🚩 nên tránh — dấu hiệu công ty", "✅ 相性◎ / 🚩 避けたい会社のサイン", "✅ Cocok / 🚩 dihindari — sinyal perusahaan")}</li>
        <li>{t("🎯 MBTI 매칭 채용 공고 + 사유", "🎯 MBTI-matched jobs + why", "🎯 MBTI 匹配招聘 + 理由", "🎯 Việc làm hợp MBTI + lý do", "🎯 MBTIに合う求人＋理由", "🎯 Lowongan cocok MBTI + alasan")}</li>
      </ul>
      <p className="mt-3 text-[12px] leading-relaxed text-white/50">
        {t("Aply 가입하면 결과를 저장하고, 새 공고가 올라올 때 자동으로 매칭 알림을 보내드려요.", "Sign up for Aply to save your result and get automatic match alerts when new jobs are posted.", "注册 Aply 即可保存结果，有新公告时自动发送匹配提醒。", "Đăng ký Aply để lưu kết quả và nhận thông báo phù hợp tự động khi có tin mới.", "Aplyに登録すると結果を保存し、新しい求人が出たら自動でマッチ通知をお送りします。", "Daftar Aply untuk menyimpan hasil dan menerima notifikasi kecocokan otomatis saat ada lowongan baru.")}
      </p>
      <div className="mt-5 flex w-full flex-col gap-2">
        <a
          href={`${apiBase}/auth/naver/start?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[14px] font-semibold text-white transition active:bg-[#02b551]"
        >
          <span aria-hidden className="text-base font-black">N</span>
          {t("네이버로 시작", "Continue with Naver", "使用 Naver 继续", "Tiếp tục với Naver", "Naverで始める", "Lanjutkan dengan Naver")}
        </a>
        <a
          href={`${apiBase}/auth/kakao/start?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[14px] font-semibold text-[#191919] transition active:bg-[#f5dd00]"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
          </svg>
          {t("카카오로 시작", "Continue with Kakao", "使用 Kakao 继续", "Tiếp tục với Kakao", "Kakaoで始める", "Lanjutkan dengan Kakao")}
        </a>
        <a
          href={`${apiBase}/auth/google/start?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] text-[14px] font-semibold text-white transition active:bg-white/[0.05]/[0.04]"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          {t("구글로 시작", "Continue with Google", "使用 Google 继续", "Tiếp tục với Google", "Googleで始める", "Lanjutkan dengan Google")}
        </a>
        <Link
          href={`/signup?next=${nextParam}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05]/[0.04] text-[14px] font-semibold text-white transition active:bg-white/[0.05]/[0.06]"
        >
          {t("이메일로 가입", "Sign up with email", "使用邮箱注册", "Đăng ký bằng email", "メールで登録", "Daftar dengan email")}
        </Link>
      </div>
    </section>
  );
}
