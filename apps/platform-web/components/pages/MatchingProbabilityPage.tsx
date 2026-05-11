"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";
import {
  Briefcase,
  ChatCircleText,
  Check,
  GraduationCap,
  IdentificationBadge,
  Lock,
  PencilSimpleLine,
  Sparkle,
  TrendUp,
  UserCircle
} from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import {
  fetchCareerReadinessReport,
  getMyCandidateProfile,
  type CareerReadinessReport,
  type MyCandidateProfile
} from "../../lib/member-profile-client";

type QuestIcon = ComponentType<SVGProps<SVGSVGElement> & { weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>;

type Quest = {
  id: string;
  Icon: QuestIcon;
  title: string;
  description: string;
  reward: number;
  href: string;
  done: boolean;
};

type Tier = {
  id: string;
  emojiKo: string;
  nameKo: string;
  nameEn: string;
  nameZh: string;
  nameVi: string;
  nameJa: string;
  nameId: string;
  min: number;
  max: number;
  color: string;
};

const TIERS: Tier[] = [
  { id: "sprout", emojiKo: "🌱", nameKo: "새싹", nameEn: "Sprout", nameZh: "萌芽", nameVi: "Mầm", nameJa: "新芽", nameId: "Tunas", min: 0, max: 30, color: "#10B981" },
  { id: "challenger", emojiKo: "⚡", nameKo: "도전자", nameEn: "Challenger", nameZh: "挑战者", nameVi: "Thử thách", nameJa: "チャレンジャー", nameId: "Penantang", min: 31, max: 50, color: "#F59E0B" },
  { id: "ready", emojiKo: "🚀", nameKo: "준비생", nameEn: "Almost Ready", nameZh: "准备生", nameVi: "Sẵn sàng", nameJa: "準備中", nameId: "Hampir Siap", min: 51, max: 70, color: "#3B82F6" },
  { id: "rising", emojiKo: "⭐", nameKo: "유망주", nameEn: "Rising Star", nameZh: "潜力股", nameVi: "Tiềm năng", nameJa: "有望株", nameId: "Bintang Naik Daun", min: 71, max: 85, color: "#8B5CF6" },
  { id: "master", emojiKo: "🏆", nameKo: "마스터", nameEn: "Master", nameZh: "大师", nameVi: "Bậc thầy", nameJa: "マスター", nameId: "Master", min: 86, max: 100, color: "#EC4899" }
];

function getTier(score: number): Tier {
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0];
}

function getNextTier(score: number): Tier | null {
  const current = getTier(score);
  const idx = TIERS.indexOf(current);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

const WORKABLE_VISAS = new Set(["F2_RESIDENCE", "F4_OVERSEAS_KOREAN", "F5_PERMANENT_RESIDENCE", "F6_MARRIAGE_IMMIGRATION", "E7_SPECIFIC_ACTIVITY", "H1_WORKING_HOLIDAY", "D10_JOB_SEEKING"]);
const LIMITED_VISAS = new Set(["D2_STUDENT", "D4_GENERAL_TRAINING"]);

type ScoreInput = {
  user: {
    name?: string | null;
    phoneNumber?: string | null;
    gender?: string | null;
    birthDate?: string | null;
  };
  profile: MyCandidateProfile | null;
};

function computeRuleBasedScore({ user, profile }: ScoreInput): number {
  let score = 0;

  let completeness = 0;
  if (user.name?.trim()) completeness += 4;
  if (user.birthDate) completeness += 3;
  if (user.gender?.trim()) completeness += 3;
  if (profile?.residenceProvince?.trim()) completeness += 2;
  if ((profile?.educations?.length ?? 0) > 0) completeness += 4;
  if ((profile?.careers?.length ?? 0) > 0) completeness += 4;
  if ((profile?.activityExperiences?.length ?? 0) > 0) completeness += 3;
  if ((profile?.skills?.length ?? 0) >= 3) completeness += 3;
  if ((profile?.selfIntroduction?.trim().length ?? 0) >= 120) completeness += 2;
  if ((profile?.programMotivation?.trim().length ?? 0) >= 120) completeness += 2;
  score += Math.min(completeness, 30);

  if (profile?.visaType) {
    if (WORKABLE_VISAS.has(profile.visaType)) score += 25;
    else if (LIMITED_VISAS.has(profile.visaType)) score += 12;
    else score += 6;
  }

  let langScore = 0;
  for (const skill of profile?.languageSkills ?? []) {
    const lang = String(skill.language ?? "").toLowerCase();
    const level = String(skill.level ?? "").toUpperCase();
    const isKorean = lang.includes("korean") || lang.includes("한국") || lang === "ko";
    const isEnglish = lang.includes("english") || lang.includes("영어") || lang === "en";
    let lp = 2;
    if (level.includes("NATIVE") || level === "C2" || level.includes("ADVANCED")) lp = 15;
    else if (level === "C1" || level.includes("UPPER") || level.includes("FLUENT")) lp = 12;
    else if (level === "B2" || level.includes("INTERMEDIATE")) lp = 8;
    else if (level === "B1" || level.includes("BASIC")) lp = 4;
    if (isKorean) langScore += lp;
    else if (isEnglish) langScore += Math.round(lp * 0.7);
    else langScore += Math.round(lp * 0.4);
  }
  score += Math.min(langScore, 25);

  let exp = 0;
  if ((profile?.careers?.length ?? 0) >= 1) exp += 8;
  if ((profile?.careers?.length ?? 0) >= 2) exp += 2;
  if ((profile?.activityExperiences?.length ?? 0) >= 1) exp += 4;
  if ((profile?.skills?.length ?? 0) >= 5) exp += 3;
  if ((profile?.selfIntroduction?.trim().length ?? 0) >= 200) exp += 2;
  if ((profile?.programMotivation?.trim().length ?? 0) >= 200) exp += 1;
  score += Math.min(exp, 20);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function useAnimatedNumber(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

export function MatchingProbabilityPage() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : isJa ? ja : isId ? id : en;
  const tierName = (tier: Tier) =>
    isKo ? tier.nameKo : isZh ? tier.nameZh : isVi ? tier.nameVi : isJa ? tier.nameJa : isId ? tier.nameId : tier.nameEn;

  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [report, setReport] = useState<CareerReadinessReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [gainBadge, setGainBadge] = useState<number | null>(null);
  const prevScoreRef = useRef<number | null>(null);

  const reportStorageKey = useMemo(
    () => `career-readiness-report:${user?.id ?? "anonymous"}:${locale}`,
    [user?.id, locale]
  );

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== "STUDENT") {
      setReport(null);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(reportStorageKey);
      if (!raw) {
        setReport(null);
        return;
      }
      const parsed = JSON.parse(raw) as CareerReadinessReport;
      if (typeof parsed?.score === "number") setReport(parsed);
      else setReport(null);
    } catch {
      setReport(null);
    }
  }, [isAuthenticated, isReady, reportStorageKey, user?.role]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== "STUDENT") {
      window.sessionStorage.removeItem(reportStorageKey);
      return;
    }
    if (report) {
      window.sessionStorage.setItem(reportStorageKey, JSON.stringify(report));
    } else {
      window.sessionStorage.removeItem(reportStorageKey);
    }
  }, [isAuthenticated, isReady, report, reportStorageKey, user?.role]);

  async function refreshProfile() {
    try {
      const item = await getMyCandidateProfile();
      setProfile(item ?? null);
    } catch {
      // keep last good state
    }
  }

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "STUDENT") return;
    let ignore = false;
    void (async () => {
      const item = await getMyCandidateProfile().catch(() => null);
      if (!ignore) setProfile(item ?? null);
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.role]);

  // Re-fetch profile when window regains focus / becomes visible (after editing on another tab/page)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "STUDENT") return;
    function onVisible() {
      if (document.visibilityState === "visible") void refreshProfile();
    }
    function onFocus() {
      void refreshProfile();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, user?.role]);

  const score = useMemo(
    () =>
      computeRuleBasedScore({
        user: {
          name: user?.name,
          phoneNumber: user?.phoneNumber,
          gender: user?.gender,
          birthDate: user?.birthDate ?? null
        },
        profile
      }),
    [user?.name, user?.phoneNumber, user?.gender, user?.birthDate, profile]
  );
  const animatedScore = useAnimatedNumber(score, 900);

  // Show "+N점" badge when score increases
  useEffect(() => {
    if (prevScoreRef.current === null) {
      prevScoreRef.current = score;
      return;
    }
    if (score > prevScoreRef.current) {
      const gain = score - prevScoreRef.current;
      setGainBadge(gain);
      const id = setTimeout(() => setGainBadge(null), 2200);
      prevScoreRef.current = score;
      return () => clearTimeout(id);
    }
    prevScoreRef.current = score;
  }, [score]);

  const tier = getTier(score);
  const nextTier = getNextTier(score);
  const tierProgress = nextTier
    ? Math.min(100, Math.max(0, ((animatedScore - tier.min) / (nextTier.min - tier.min)) * 100))
    : Math.min(100, Math.max(0, animatedScore));

  const quests = useMemo<Quest[]>(() => {
    const q: Quest[] = [];
    const visaDone = Boolean(profile?.visaType);
    q.push({
      id: "visa",
      Icon: IdentificationBadge,
      title: t("비자 정보 등록", "Register visa", "登记签证", "Đăng ký visa", "ビザ情報の登録", "Daftarkan visa"),
      description: t("한국에서 일할 수 있는 비자 상태를 알려주세요.", "Tell us your work-eligible visa.", "告诉我们您可工作的签证。", "Cho chúng tôi biết visa làm việc của bạn.", "韓国で就労可能なビザの状態を教えてください。", "Beri tahu kami status visa kerja Anda di Korea."),
      reward: 25,
      href: "/profile/resume/edit/work-availability",
      done: visaDone
    });
    const langs = profile?.languageSkills ?? [];
    const hasKorean = langs.some((l) => String(l.language ?? "").toLowerCase().includes("korean") || String(l.language ?? "").toLowerCase().includes("ko"));
    q.push({
      id: "korean",
      Icon: ChatCircleText,
      title: t("한국어 능력 등록", "Add Korean proficiency", "登记韩语能力", "Đăng ký năng lực tiếng Hàn", "韓国語能力の登録", "Daftarkan kemampuan bahasa Korea"),
      description: t("한국어 수준을 입력하면 점수가 크게 올라요.", "Korean proficiency boosts your score significantly.", "韩语水平会大幅提升分数。", "Trình độ tiếng Hàn tăng điểm đáng kể.", "韓国語のレベルを入力するとスコアが大きく上がります。", "Mencantumkan tingkat bahasa Korea akan meningkatkan skor Anda secara signifikan."),
      reward: 15,
      href: "/profile/resume/edit/language",
      done: hasKorean
    });
    q.push({
      id: "education",
      Icon: GraduationCap,
      title: t("학력 추가", "Add education", "添加学历", "Thêm học vấn", "学歴を追加", "Tambahkan pendidikan"),
      description: t("학교, 전공, 졸업 상태를 한 줄로!", "School, major, graduation in one go.", "学校、专业、毕业状态一次填好！", "Trường, ngành, tình trạng tốt nghiệp một dòng.", "学校・専攻・卒業状況を一行で！", "Sekolah, jurusan, status kelulusan dalam satu baris!"),
      reward: 8,
      href: "/profile/resume/edit/education",
      done: (profile?.educations?.length ?? 0) > 0
    });
    q.push({
      id: "career",
      Icon: Briefcase,
      title: t("경력 한 줄 추가", "Add a work experience", "添加一段经历", "Thêm 1 kinh nghiệm làm việc", "職務経歴を1件追加", "Tambahkan satu pengalaman kerja"),
      description: t("인턴/아르바이트도 환영. 짧아도 가산점이 큽니다.", "Internships and part-time count too — even short ones help a lot.", "实习、兼职也欢迎，短暂经历也加分。", "Thực tập, bán thời gian đều tính, dù ngắn cũng được điểm.", "インターン・アルバイトも歓迎。短くても加点が大きいです。", "Magang dan paruh waktu juga diterima — meski singkat tetap menambah poin."),
      reward: 10,
      href: "/profile/resume/edit/career",
      done: (profile?.careers?.length ?? 0) > 0
    });
    q.push({
      id: "activity",
      Icon: Sparkle,
      title: t("활동 경험 추가", "Add activity", "添加活动经历", "Thêm hoạt động", "活動経験を追加", "Tambahkan aktivitas"),
      description: t("프로젝트·대외활동·수상 등 보여줄 거리를 추가.", "Projects, clubs, awards — anything showcase-worthy.", "项目、社团、获奖等都可以。", "Dự án, hoạt động ngoại khóa, giải thưởng.", "プロジェクト・対外活動・受賞などアピールできるものを追加。", "Proyek, kegiatan organisasi, penghargaan — apa pun yang layak ditampilkan."),
      reward: 4,
      href: "/profile/resume/edit/activity",
      done: (profile?.activityExperiences?.length ?? 0) > 0
    });
    const skillsDone = (profile?.skills?.length ?? 0) >= 3;
    const introDone = (profile?.selfIntroduction?.trim().length ?? 0) >= 120;
    q.push({
      id: "profile-text",
      Icon: PencilSimpleLine,
      title: t("나를 한 단락으로 소개", "Pitch yourself in a paragraph", "用一段话介绍自己", "Giới thiệu bản thân trong một đoạn", "自分を一段落で紹介", "Perkenalkan diri Anda dalam satu paragraf"),
      description: t("스킬 3개 + 자기소개 120자 + 지원 동기.", "3 skills + 120-char intro + motivation.", "3 项技能 + 120 字自我介绍 + 动机。", "3 kỹ năng + giới thiệu 120 ký tự + động lực.", "スキル3つ + 自己紹介120文字 + 志望動機。", "3 keahlian + perkenalan 120 karakter + motivasi."),
      reward: 8,
      href: "/profile/resume/edit/profile-text",
      done: skillsDone && introDone
    });
    const basicDone = Boolean(user?.name?.trim()) && Boolean(user?.birthDate) && Boolean(user?.gender?.trim());
    q.push({
      id: "basic",
      Icon: UserCircle,
      title: t("기본 정보 채우기", "Fill basic info", "填写基本信息", "Điền thông tin cơ bản", "基本情報を入力", "Lengkapi informasi dasar"),
      description: t("이름·생년월일·성별·전화번호.", "Name, birth, gender, phone.", "姓名、出生日期、性别、电话。", "Tên, ngày sinh, giới tính, điện thoại.", "氏名・生年月日・性別・電話番号。", "Nama, tanggal lahir, jenis kelamin, nomor telepon."),
      reward: 10,
      href: "/profile/edit",
      done: basicDone
    });
    return q;
  }, [
    isKo, isZh, isVi,
    profile?.activityExperiences?.length, profile?.careers?.length, profile?.educations?.length,
    profile?.languageSkills, profile?.selfIntroduction, profile?.skills?.length, profile?.visaType,
    user?.birthDate, user?.gender, user?.name, user?.phoneNumber
  ]);

  const openQuests = quests.filter((q) => !q.done);
  const completedQuests = quests.filter((q) => q.done);

  const ESSENTIAL_QUEST_IDS = ["basic", "education", "korean", "visa"] as const;
  const essentialQuests = ESSENTIAL_QUEST_IDS
    .map((id) => quests.find((q) => q.id === id))
    .filter((q): q is Quest => Boolean(q));
  const essentialDoneCount = essentialQuests.filter((q) => q.done).length;
  const aiUnlockThreshold = 3;
  const aiUnlocked = essentialDoneCount >= aiUnlockThreshold;

  const QUEST_ORDER = ["basic", "education", "korean", "career", "activity", "profile-text", "visa"] as const;
  const orderedQuests = QUEST_ORDER
    .map((id) => quests.find((q) => q.id === id))
    .filter((q): q is Quest => Boolean(q));
  let foundActive = false;
  const orderedQuestStates = orderedQuests.map((q) => {
    if (q.done) return { quest: q, state: "done" as const };
    if (!foundActive) {
      foundActive = true;
      return { quest: q, state: "active" as const };
    }
    return { quest: q, state: "locked" as const };
  });
  const activeQuestStates = orderedQuestStates.filter((s) => s.state !== "done");

  async function handleAnalyze() {
    if (reportLoading) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const item = await fetchCareerReadinessReport(
        locale === "ko" || locale === "en" || locale === "zh-CN" || locale === "vi" || locale === "ja" || locale === "id" ? locale : "ko"
      );
      setReport(item);
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : t("리포트를 불러오지 못했습니다.", "Failed to load report.", "无法加载报告。", "Không thể tải báo cáo.", "レポートを読み込めませんでした。", "Gagal memuat laporan.")
      );
    } finally {
      setReportLoading(false);
    }
  }

  const radius = 56;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="bg-[#F8FAFC] pb-20">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-4xl space-y-10">

            <section className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("학생 전용 모험", "Students-only quest", "仅限学生", "Dành cho sinh viên", "学生限定の冒険", "Petualangan khusus pelajar")}
              </p>
              <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>
                {t("내 한국 취업 모험", "My Korea job-hunt quest", "我的韩国求职冒险", "Hành trình tìm việc Hàn Quốc", "私の韓国就職冒険", "Petualangan mencari kerja di Korea")}
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                {t(
                  "프로필을 채워가며 점수를 올리고, 등급을 한 단계씩 깨보세요.",
                  "Fill your profile, watch your score climb, and level up tier by tier.",
                  "完善资料、提高分数，一步步晋级。",
                  "Hoàn thiện hồ sơ, tăng điểm và lên cấp từng bậc.",
                  "プロフィールを埋めながらスコアを上げ、ティアを一段ずつクリアしましょう。",
                  "Lengkapi profil Anda, naikkan skor, dan tingkatkan tingkat satu per satu."
                )}
              </p>
            </section>

            {!isReady ? (
              <p className="text-sm text-muted-foreground">{t("로그인 정보를 확인하는 중입니다...", "Checking your session...", "正在确认登录信息...", "Đang kiểm tra phiên đăng nhập...", "ログイン情報を確認中です...", "Memeriksa sesi Anda...")}</p>
            ) : !isAuthenticated ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">{t("로그인하면 모험을 시작할 수 있어요.", "Sign in to begin the quest.", "登录即可开始冒险。", "Đăng nhập để bắt đầu hành trình.", "ログインすると冒険を始められます。", "Masuk untuk memulai petualangan.")}</p>
                <Button variant="dark" className="mt-4" asChild>
                  <Link href="/login">{t("로그인하러 가기", "Go to login", "前往登录", "Đi đến đăng nhập", "ログインへ", "Buka halaman masuk")}</Link>
                </Button>
              </div>
            ) : user?.role !== "STUDENT" ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">{t("이 모험은 학생 계정만 즐길 수 있어요.", "Only student accounts can join this quest.", "此冒险仅限学生账号。", "Hành trình này chỉ dành cho tài khoản sinh viên.", "この冒険は学生アカウントのみご利用いただけます。", "Petualangan ini hanya untuk akun pelajar.")}</p>
              </div>
            ) : (
              <>
                <section className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-6">
                  <div className="grid items-center gap-4 md:grid-cols-[160px_1fr]">
                    <div className="relative mx-auto">
                      <svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2} viewBox={`0 0 ${(radius + stroke) * 2} ${(radius + stroke) * 2}`}>
                        <circle
                          cx={radius + stroke}
                          cy={radius + stroke}
                          r={radius}
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth={stroke}
                        />
                        <circle
                          cx={radius + stroke}
                          cy={radius + stroke}
                          r={radius}
                          fill="none"
                          stroke={tier.color}
                          strokeWidth={stroke}
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
                          style={{ transition: "stroke 0.4s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="font-display text-3xl font-black leading-none md:text-4xl" style={{ color: tier.color }}>{animatedScore}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">/ 100</p>
                      </div>
                      {gainBadge !== null ? (
                        <div className="pointer-events-none absolute -right-1 top-0 animate-bounce rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg">
                          +{gainBadge}점
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <Sparkle className="h-2.5 w-2.5" weight="fill" aria-hidden style={{ color: tier.color }} />
                          LEVEL {TIERS.indexOf(tier) + 1} / {TIERS.length}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-2xl" aria-hidden>{tier.emojiKo}</span>
                          <p className="font-display text-lg font-black md:text-xl" style={{ color: tier.color }}>
                            {tierName(tier)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-foreground md:text-sm">
                        {nextTier
                          ? t(
                              `'${tierName(nextTier)}' 까지 ${nextTier.min - score}점! 💪`,
                              `${nextTier.min - score} pts to '${tierName(nextTier)}'! 💪`,
                              `还差 ${nextTier.min - score} 分到 '${tierName(nextTier)}'！💪`,
                              `Còn ${nextTier.min - score} điểm đến '${tierName(nextTier)}'! 💪`,
                              `'${tierName(nextTier)}' まであと${nextTier.min - score}ポイント！💪`,
                              `${nextTier.min - score} poin lagi menuju '${tierName(nextTier)}'! 💪`
                            )
                          : t("최고 등급 달성! 한국 취업 마스터입니다 🎉", "Top tier reached! You are a Korea Job Master 🎉", "已达最高等级！您是韩国就业大师 🎉", "Đạt cấp cao nhất! Bậc thầy việc làm Hàn Quốc 🎉", "最高ティア達成！韓国就職マスターです 🎉", "Tingkat tertinggi tercapai! Anda adalah Master Kerja Korea 🎉")}
                      </p>
                      <div className="relative h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${tierProgress}%`, backgroundColor: tier.color }}
                        />
                        {nextTier ? (
                          <span className="absolute -top-1 right-0 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full bg-card text-[10px] shadow-sm ring-2" style={{ borderColor: tier.color, color: tier.color }} aria-hidden>
                            {nextTier.emojiKo}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t("등급 여정", "Tier journey", "等级之旅", "Hành trình cấp bậc", "ティアの旅", "Perjalanan tingkat")}
                    </p>
                    <div className="grid grid-cols-5 gap-1 md:gap-2">
                      {TIERS.map((tt) => {
                        const cleared = score >= tt.min;
                        const current = tt.id === tier.id;
                        return (
                          <div key={tt.id} className="flex flex-col items-center gap-1">
                            <div
                              className={`relative grid h-10 w-10 place-items-center rounded-full text-xl transition md:h-11 md:w-11 ${
                                cleared ? "" : "opacity-40 grayscale"
                              } ${current ? "scale-110" : ""}`}
                              style={{
                                backgroundColor: cleared ? `${tt.color}1A` : "#F1F5F9",
                                boxShadow: current ? `0 0 0 3px ${tt.color}33, 0 4px 16px -6px ${tt.color}` : undefined
                              }}
                            >
                              <span aria-hidden>{tt.emojiKo}</span>
                              {cleared && !current ? (
                                <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
                                  <Check className="h-2 w-2" weight="bold" aria-hidden />
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                cleared ? "" : "text-muted-foreground"
                              }`}
                              style={cleared ? { color: tt.color } : undefined}
                            >
                              {tierName(tt)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-6">
                  {orderedQuestStates.length > 0 ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {aiUnlocked ? (
                            <Sparkle className="h-4 w-4 text-primary" weight="fill" aria-hidden />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden />
                          )}
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground md:text-xs">
                            {aiUnlocked
                              ? t("AI 분석 잠금 해제됨 · 보너스 퀘스트", "AI unlocked · Bonus quests", "AI 已解锁 · 奖励任务", "AI đã mở khóa · Nhiệm vụ thưởng", "AI分析がアンロック · ボーナスクエスト", "AI terbuka · Misi bonus")
                              : t("AI 분석 잠금 해제 미션", "Unlock the AI Coach", "解锁 AI 分析任务", "Mở khóa AI Coach", "AIコーチをアンロック", "Buka AI Coach")}
                          </p>
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {aiUnlocked
                            ? t(`${activeQuestStates.length}개 남음`, `${activeQuestStates.length} left`, `剩 ${activeQuestStates.length}`, `Còn ${activeQuestStates.length}`, `残り${activeQuestStates.length}個`, `Sisa ${activeQuestStates.length}`)
                            : `${essentialDoneCount} / ${aiUnlockThreshold}`}
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {orderedQuestStates.map(({ quest: q, state }) => {
                          if (state === "done") {
                            return (
                              <Link
                                key={q.id}
                                href={q.href}
                                className="group relative flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card"
                              >
                                <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                                  <Check className="h-2.5 w-2.5" weight="bold" aria-hidden />
                                  {t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")}
                                </span>
                                <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-emerald-500 text-white">
                                  <q.Icon className="h-6 w-6" weight="duotone" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-emerald-900">{q.title}</p>
                                  <p className="mt-1 text-xs text-emerald-800/70">{q.description}</p>
                                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                                    {t("수정하기 →", "Edit →", "修改 →", "Chỉnh sửa →", "編集する →", "Edit →")}
                                  </p>
                                </div>
                              </Link>
                            );
                          }
                          if (state === "active") {
                            return (
                              <Link
                                key={q.id}
                                href={q.href}
                                className="group relative flex items-start gap-3 rounded-2xl border-2 border-primary bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
                              >
                                <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                                  {t("진행 중", "Active", "进行中", "Đang mở", "進行中", "Berlangsung")}
                                </span>
                                <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-primary/10 text-primary">
                                  <q.Icon className="h-6 w-6" weight="duotone" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold text-foreground">{q.title}</p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                      <TrendUp className="h-3 w-3" weight="bold" aria-hidden />
                                      {t("점수 UP", "Score up", "分数提升", "Tăng điểm", "スコアUP", "Skor naik")}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">{q.description}</p>
                                  <p className="mt-2 text-xs font-semibold text-primary">
                                    {t("도전하기 →", "Take quest →", "挑战 →", "Bắt đầu →", "挑戦する →", "Mulai →")}
                                  </p>
                                </div>
                              </Link>
                            );
                          }
                          return (
                            <div
                              key={q.id}
                              className="flex cursor-not-allowed items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 opacity-70"
                              aria-disabled="true"
                            >
                              <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-muted text-muted-foreground">
                                <Lock className="h-5 w-5" weight="duotone" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-muted-foreground">{q.title}</p>
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    STEP {orderedQuests.findIndex((oq) => oq.id === q.id) + 1}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {t("이전 퀘스트를 먼저 완료해주세요.", "Complete the previous quest first.", "请先完成前一个任务。", "Hoàn thành nhiệm vụ trước đó.", "前のクエストを先に完了してください。", "Selesaikan misi sebelumnya terlebih dahulu.")}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {!aiUnlocked ? (
                          <div
                            className="relative flex cursor-not-allowed items-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 px-4 py-1.5 shadow-[0_0_28px_-6px_hsl(var(--primary)/0.45)] ring-4 ring-primary/10 md:col-span-2 md:py-2"
                            aria-disabled="true"
                          >
                            <span className="absolute -top-2 left-4 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-background">
                              {t("최종 보상", "Final reward", "最终奖励", "Phần thưởng cuối", "最終報酬", "Hadiah akhir")}
                            </span>
                            <div className="relative flex-none">
                              <Image
                                src="/img_ai_analyze.webp"
                                alt=""
                                width={400}
                                height={400}
                                className="h-32 w-32 object-contain grayscale md:h-40 md:w-40"
                              />
                              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                                <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground/85 text-background shadow-lg">
                                  <Lock className="h-4 w-4 animate-pulse" weight="bold" aria-hidden />
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-foreground">
                                  {t("AI 코치 분석", "AI Coach analysis", "AI 教练分析", "Phân tích AI Coach", "AIコーチ分析", "Analisis AI Coach")}
                                </p>
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                                  <Sparkle className="h-3 w-3" weight="fill" aria-hidden />
                                  {essentialDoneCount} / {aiUnlockThreshold}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t(
                                  "핵심 퀘스트 3개를 클리어하면 잠금이 풀려요. 강점·보완점·추천 직무를 한 번에 받아볼 수 있어요.",
                                  "Clear 3 key quests to unlock. Get personalized strengths, gaps, and role suggestions.",
                                  "完成 3 个核心任务即可解锁。获得专属优点、待补充与推荐职位。",
                                  "Hoàn thành 3 nhiệm vụ chính để mở khóa. Nhận điểm mạnh, điểm cần bổ sung, vị trí gợi ý.",
                                  "主要クエストを3つクリアするとアンロックされます。強み・改善点・おすすめの職務をまとめて受け取れます。",
                                  "Selesaikan 3 misi utama untuk membuka. Dapatkan kekuatan, kekurangan, dan rekomendasi peran yang dipersonalisasi."
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleAnalyze()}
                            disabled={reportLoading}
                            className="group relative flex w-full items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-4 py-1.5 text-left shadow-[0_0_28px_-6px_hsl(var(--primary)/0.45)] transition hover:-translate-y-0.5 hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2 md:py-2"
                          >
                            <span className="absolute -top-2 left-4 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-background">
                              {report
                                ? t("분석 완료", "Analyzed", "已分析", "Đã phân tích", "分析完了", "Sudah dianalisis")
                                : t("최종 보상 · 잠금 해제", "Final reward · Unlocked", "最终奖励 · 已解锁", "Phần thưởng · Mở khóa", "最終報酬 · アンロック", "Hadiah akhir · Terbuka")}
                            </span>
                            <Image
                              src="/img_ai_analyze.webp"
                              alt=""
                              width={400}
                              height={400}
                              className="h-32 w-32 flex-none object-contain md:h-40 md:w-40"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-foreground">
                                  {t("AI 코치 분석", "AI Coach analysis", "AI 教练分析", "Phân tích AI Coach", "AIコーチ分析", "Analisis AI Coach")}
                                </p>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${report ? "bg-emerald-100 text-emerald-700" : "bg-emerald-100 text-emerald-700"}`}>
                                  {report
                                    ? t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")
                                    : t("준비 완료", "Ready", "已就绪", "Sẵn sàng", "準備完了", "Siap")}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("강점·보완점·추천 직무를 한 번에 코칭받아보세요.", "Get personalized strengths, gaps, and role suggestions.", "获得专属优点、待补充与推荐职位。", "Nhận điểm mạnh, điểm cần bổ sung, vị trí gợi ý.", "強み・改善点・おすすめの職務を一度にコーチングしてもらいましょう。", "Dapatkan saran kekuatan, kekurangan, dan peran sekaligus.")}
                              </p>
                              <p className="mt-2 text-xs font-semibold text-primary">
                                {reportLoading
                                  ? t("분석 중...", "Analyzing...", "分析中...", "Đang phân tích...", "分析中...", "Menganalisis...")
                                  : report
                                    ? t("다시 분석하기 →", "Re-analyze →", "重新分析 →", "Phân tích lại →", "再分析する →", "Analisis ulang →")
                                    : t("내 분석 받기 →", "Get my analysis →", "获取我的分析 →", "Nhận phân tích →", "私の分析を受ける →", "Dapatkan analisis →")}
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                      {reportError ? <p className="mt-3 text-xs font-medium text-destructive">{reportError}</p> : null}
                    </div>
                  ) : null}
                </section>




                {report ? (
                  <section className="space-y-4">
                    <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                      {t("AI 코치 분석 결과", "AI Coach analysis", "AI 教练分析结果", "Kết quả phân tích AI Coach", "AIコーチ分析結果", "Hasil analisis AI Coach")}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <article className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-muted text-2xl">
                            🏆
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-foreground">
                                {t("획득 스킬", "Strengths unlocked", "已获优势", "Điểm mạnh đã có", "獲得スキル", "Kekuatan terbuka")}
                              </p>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                {t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kekuatan")}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("프로필에서 빛나는 부분이에요.", "What's already shining in your profile.", "您资料中的闪光点。", "Điểm đã nổi bật trong hồ sơ.", "プロフィールで輝いている部分です。", "Hal yang sudah menonjol di profil Anda.")}
                            </p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                          {report.strengths.map((item, idx) => (
                            <li key={`s-${idx}`} className="flex gap-2">
                              <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </article>

                      <article className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-muted text-2xl">
                            🚀
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-foreground">
                                {t("다음 도전", "Next challenges", "下一个挑战", "Thử thách tiếp theo", "次のチャレンジ", "Tantangan berikutnya")}
                              </p>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                {t("보완", "Improve", "待补充", "Bổ sung", "改善", "Perbaiki")}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("점수를 더 올리려면 여기를 채워보세요.", "Fill these to push your score further.", "填好这些可继续提分。", "Bổ sung để tăng thêm điểm.", "スコアをさらに上げるためにここを埋めましょう。", "Lengkapi ini untuk meningkatkan skor lebih jauh.")}
                            </p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                          {report.improvements.map((item, idx) => (
                            <li key={`i-${idx}`} className="flex gap-2">
                              <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-amber-500" aria-hidden />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    </div>

                    <article className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-muted text-2xl">
                          🎁
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-foreground">
                              {t("추천 직업 카드", "Recommended role cards", "推荐职位卡", "Thẻ vị trí gợi ý", "おすすめ職務カード", "Kartu peran rekomendasi")}
                            </p>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              {t("매칭", "Matched", "匹配", "Phù hợp", "マッチング", "Cocok")}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("프로필 기반으로 잘 맞을 직무 유형이에요.", "Roles most likely to match your profile.", "根据您资料最匹配的职位类型。", "Loại công việc có khả năng phù hợp nhất.", "プロフィールに基づき相性の良い職務タイプです。", "Tipe peran yang paling cocok dengan profil Anda.")}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {report.recommendedRoles.map((role, idx) => (
                          <li
                            key={`r-${idx}`}
                            className="rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
                          >
                            {role}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/positions">{t("열린 포지션 둘러보기", "Browse open positions", "浏览开放职位", "Xem các vị trí đang mở", "募集中のポジションを見る", "Lihat posisi yang tersedia")}</Link>
                        </Button>
                      </div>
                    </article>
                  </section>
                ) : null}
              </>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
