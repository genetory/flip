"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  getMyCandidateProfile,
  getPublicPositions,
  type MyCandidateProfile,
  type PublicPositionListItem
} from "../../lib/member-profile-client";

type CompletionSection = {
  id: string;
  title: string;
  description: string;
  done: number;
  total: number;
  href: string;
  tips: string[];
};

type PositionEstimate = {
  id: string;
  title: string;
  company: string;
  score: number;
  confidence: string;
  reasons: string[];
  href: string;
};

type PositionEstimateCache = {
  hasCheckedPositions: boolean;
  drawnPositionEstimates: PositionEstimate[];
};

function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function mapVisaTypeToCode(visaType?: string | null) {
  if (!visaType) return null;
  if (visaType.includes("-")) return visaType;
  if (visaType === "D10_JOB_SEEKING") return "D-10";
  if (visaType === "D2_STUDENT") return "D-2";
  if (visaType === "D4_GENERAL_TRAINING") return "D-4";
  if (visaType === "F2_RESIDENCE") return "F-2";
  if (visaType === "F4_OVERSEAS_KOREAN") return "F-4";
  if (visaType === "F5_PERMANENT_RESIDENCE") return "F-5";
  if (visaType === "F6_MARRIAGE_IMMIGRATION") return "F-6";
  if (visaType === "E7_SPECIFIC_ACTIVITY") return "E-7";
  if (visaType === "H1_WORKING_HOLIDAY") return "H-1";
  return visaType;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MatchingProbabilityPage() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const t = (ko: string, en: string, zh: string = en, vi: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : en;

  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [positions, setPositions] = useState<PublicPositionListItem[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [hasCheckedPositions, setHasCheckedPositions] = useState(false);
  const [drawnPositionEstimates, setDrawnPositionEstimates] = useState<PositionEstimate[]>([]);
  const lottieContainerRef = useRef<HTMLDivElement | null>(null);
  const positionEstimateStorageKey = useMemo(
    () => `matching-probability:position-estimates:${user?.id ?? "anonymous"}`,
    [user?.id]
  );

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated || user?.role !== "STUDENT") {
      setHasCheckedPositions(false);
      setDrawnPositionEstimates([]);
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(positionEstimateStorageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PositionEstimateCache;
      if (!Array.isArray(parsed.drawnPositionEstimates)) return;

      setHasCheckedPositions(Boolean(parsed.hasCheckedPositions));
      setDrawnPositionEstimates(parsed.drawnPositionEstimates);
    } catch {
      // ignore invalid cache data
    }
  }, [isAuthenticated, isReady, positionEstimateStorageKey, user?.role]);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated || user?.role !== "STUDENT") {
      window.sessionStorage.removeItem(positionEstimateStorageKey);
      return;
    }

    if (!hasCheckedPositions) {
      window.sessionStorage.removeItem(positionEstimateStorageKey);
      return;
    }

    const payload: PositionEstimateCache = {
      hasCheckedPositions,
      drawnPositionEstimates
    };
    window.sessionStorage.setItem(positionEstimateStorageKey, JSON.stringify(payload));
  }, [
    drawnPositionEstimates,
    hasCheckedPositions,
    isAuthenticated,
    isReady,
    positionEstimateStorageKey,
    user?.role
  ]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "STUDENT") {
      return;
    }

    let ignore = false;
    void (async () => {
      try {
        const item = await getMyCandidateProfile();
        if (ignore) return;
        setProfile(item ?? null);
      } catch {
        // keep fallback completion state when profile API fails
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!positionsLoading || !lottieContainerRef.current) return;

    let mounted = true;
    let cleanup: (() => void) | null = null;

    void (async () => {
      try {
        const [{ default: lottie }, response] = await Promise.all([
          import("lottie-web"),
          fetch("/scan.json")
        ]);
        const animationData = await response.json();
        if (!mounted || !lottieContainerRef.current) return;

        const animation = lottie.loadAnimation({
          container: lottieContainerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData
        });

        cleanup = () => {
          animation.destroy();
        };
      } catch {
        // no-op: keep text fallback only when animation load fails
      }
    })();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, [positionsLoading]);

  const educationsCount = profile?.educations?.length ?? 0;
  const languageSkillsCount = profile?.languageSkills?.length ?? 0;
  const careersCount = profile?.careers?.length ?? 0;
  const activityExperiencesCount = profile?.activityExperiences?.length ?? 0;
  const skillsCount = profile?.skills?.length ?? 0;
  const selfIntroLength = profile?.selfIntroduction?.trim().length ?? 0;
  const motivationLength = profile?.programMotivation?.trim().length ?? 0;
  const preferenceLength = profile?.preferenceConditionNote?.trim().length ?? 0;
  const additionalLength = profile?.additionalInfoNote?.trim().length ?? 0;

  const sections = useMemo<CompletionSection[]>(() => {
    const basicTips: string[] = [];
    if (!user?.name?.trim()) basicTips.push(t("이름", "Nickname", "昵称", "Biệt danh"));
    if (!user?.phoneNumber?.trim()) basicTips.push(t("전화번호", "Phone", "电话号码", "Số điện thoại"));
    if (!user?.gender?.trim()) basicTips.push(t("성별", "Gender", "性别", "Giới tính"));
    if (!user?.birthDate) basicTips.push(t("생년월일", "Birth date", "出生日期", "Ngày sinh"));
    const basicDone = 4 - basicTips.length;

    const startOptionDone =
      Boolean(profile?.programStartOption)
      && (profile?.programStartOption !== "SPECIFIC_DATE" || Boolean(profile?.programStartDate));
    const workTips: string[] = [];
    if (!profile?.visaType) workTips.push(t("비자 유형", "Visa type", "签证类型", "Loại visa"));
    if (!profile?.residenceProvince?.trim()) workTips.push(t("사는 지역", "Residence region", "居住地区", "Khu vực cư trú"));
    if (!startOptionDone) workTips.push(t("시작 가능 시기", "Available start timing", "可开始时间", "Thời gian có thể bắt đầu"));
    const workDone = 3 - workTips.length;

    const educationDone = Number(educationsCount > 0);
    const languageDone = Number(languageSkillsCount > 0);
    const careerDone = Number(careersCount > 0);
    const activityDone = Number(activityExperiencesCount > 0);

    const textTips: string[] = [];
    if (skillsCount < 3) textTips.push(t("스킬 3개 이상", "At least 3 skills", "至少 3 项技能", "Tối thiểu 3 kỹ năng"));
    if (selfIntroLength < 120) textTips.push(t("자기소개 120자 이상 작성", "Self introduction 120+ chars", "自我介绍至少 120 字", "Giới thiệu bản thân từ 120 ký tự"));
    if (motivationLength < 120) textTips.push(t("지원 이유 120자 이상 작성", "Motivation 120+ chars", "申请动机至少 120 字", "Động lực ứng tuyển từ 120 ký tự"));
    if (preferenceLength < 80) textTips.push(t("선호 조건 80자 이상", "Preferences 80+ chars", "偏好条件至少 80 字", "Điều kiện ưu tiên từ 80 ký tự"));
    if (additionalLength < 80) textTips.push(t("추가 정보 80자 이상", "Additional notes 80+ chars", "其他信息至少 80 字", "Thông tin bổ sung từ 80 ký tự"));
    const textDone = 5 - textTips.length;

    return [
      {
        id: "basic",
        title: t("기본 정보", "Basic information", "基本信息", "Thông tin cơ bản"),
        description: t("이름, 전화번호, 성별, 생년월일", "Legal name, nickname, phone, gender, birth date", "姓名、电话、性别、出生日期", "Họ tên, điện thoại, giới tính, ngày sinh"),
        done: basicDone,
        total: 4,
        href: "/profile/edit",
        tips: basicTips
      },
      {
        id: "work",
        title: t("근무 가능 조건", "Work availability", "工作可行条件", "Điều kiện làm việc"),
        description: t("비자, 사는 곳, 시작 가능 시기", "Visa, residence, available start timing", "签证、居住地、可开始时间", "Visa, nơi ở, thời gian có thể bắt đầu"),
        done: workDone,
        total: 3,
        href: "/profile/resume/edit/work-availability",
        tips: workTips
      },
      {
        id: "education",
        title: t("학력", "Education", "学历", "Học vấn"),
        description: t("학교, 전공, 재학/졸업", "School, major, enrollment/graduation status", "学校、专业、在读/毕业", "Trường, ngành, đang học/đã tốt nghiệp"),
        done: educationDone,
        total: 1,
        href: "/profile/resume/edit/education",
        tips: educationDone ? [] : [t("학력 항목 1개 이상", "Add at least 1 education item", "至少添加 1 项学历", "Thêm tối thiểu 1 mục học vấn")]
      },
      {
        id: "language",
        title: t("언어 능력", "Language skills", "语言能力", "Kỹ năng ngôn ngữ"),
        description: t("사용 가능한 언어와 수준", "Working languages and levels", "可使用的语言及水平", "Ngôn ngữ sử dụng và trình độ"),
        done: languageDone,
        total: 1,
        href: "/profile/resume/edit/language",
        tips: languageDone ? [] : [t("언어 능력 항목 1개 이상", "Add at least 1 language skill item", "至少添加 1 项语言能力", "Thêm tối thiểu 1 mục ngôn ngữ")]
      },
      {
        id: "career",
        title: t("경력", "Experience", "经历", "Kinh nghiệm"),
        description: t("인턴, 아르바이트, 정규직 경험", "Internship/part-time/full-time experience", "实习、兼职、正职经历", "Kinh nghiệm thực tập, bán thời gian, toàn thời gian"),
        done: careerDone,
        total: 1,
        href: "/profile/resume/edit/career",
        tips: careerDone ? [] : [t("경력 항목 1개 이상", "Add at least 1 experience item", "至少添加 1 项经历", "Thêm tối thiểu 1 mục kinh nghiệm")]
      },
      {
        id: "activity",
        title: t("활동 경험", "Activities", "活动经历", "Kinh nghiệm hoạt động"),
        description: t("프로젝트, 대외활동, 수상", "Projects, extracurriculars, awards", "项目、对外活动、获奖", "Dự án, hoạt động ngoại khóa, giải thưởng"),
        done: activityDone,
        total: 1,
        href: "/profile/resume/edit/activity",
        tips: activityDone ? [] : [t("활동 경험 항목 1개 이상", "Add at least 1 activity item", "至少添加 1 项活动经历", "Thêm tối thiểu 1 mục hoạt động")]
      },
      {
        id: "profile-text",
        title: t("소개/지원 이유", "Profile text", "介绍/动机", "Giới thiệu/Động lực"),
        description: t("스킬, 자기소개, 지원 이유, 선호 조건, 추가 정보", "Skills, intro, motivation, preferences, notes", "技能、自我介绍、动机、偏好、备注", "Kỹ năng, giới thiệu, động lực, ưu tiên, ghi chú"),
        done: textDone,
        total: 5,
        href: "/profile/resume/edit/profile-text",
        tips: textTips
      }
    ];
  }, [
    additionalLength,
    activityExperiencesCount,
    careersCount,
    educationsCount,
    isKo,
    isZh,
    isVi,
    languageSkillsCount,
    motivationLength,
    preferenceLength,
    profile?.programStartDate,
    profile?.programStartOption,
    profile?.residenceProvince,
    profile?.visaType,
    selfIntroLength,
    skillsCount,
    user?.birthDate,
    user?.gender,
    user?.name,
    user?.phoneNumber
  ]);

  const totalDone = sections.reduce((acc, section) => acc + section.done, 0);
  const totalItems = sections.reduce((acc, section) => acc + section.total, 0);
  const overallPercent = percent(totalDone, totalItems);

  function buildPositionEstimates(sourcePositions: PublicPositionListItem[]) {
    const myVisa = mapVisaTypeToCode(profile?.visaType ?? null);

    return sourcePositions.slice(0, 8).map((position) => {
      const visaRequired = position.eligibleVisas?.length > 0;
      const visaMatched = !visaRequired || (myVisa ? position.eligibleVisas.includes(myVisa) : false);

      let score = 20 + overallPercent * 0.45;
      if (visaMatched) score += 18;
      else if (visaRequired) score -= 22;

      if (educationsCount > 0) score += 8;
      if (languageSkillsCount > 0) score += 8;
      if (careersCount > 0) score += 8;
      if (activityExperiencesCount > 0) score += 4;
      if (skillsCount >= 3) score += 6;
      if (selfIntroLength >= 120) score += 4;
      if (motivationLength >= 120) score += 4;
      if (preferenceLength >= 80) score += 3;
      if (additionalLength >= 80) score += 3;

      const finalScore = clamp(Math.round(score), 5, 95);
      const confidence = finalScore >= 80
        ? t("높음", "High", "高", "Cao")
        : finalScore >= 60
          ? t("보통", "Medium", "中", "Trung bình")
          : t("낮음", "Low", "低", "Thấp");

      const reasons: string[] = [];
      if (visaRequired && !visaMatched) reasons.push(t("비자 조건을 확인해 주세요.", "Visa requirement needs attention.", "请确认签证条件。", "Vui lòng kiểm tra điều kiện visa."));
      if (educationsCount <= 0) reasons.push(t("학력 정보를 추가해 주세요.", "Add education details.", "请补充学历信息。", "Vui lòng bổ sung thông tin học vấn."));
      if (languageSkillsCount <= 0) reasons.push(t("언어 능력 정보를 추가해 주세요.", "Add language skills.", "请补充语言能力信息。", "Vui lòng bổ sung thông tin ngôn ngữ."));
      if (skillsCount < 3) reasons.push(t("핵심 스킬을 더 추가해 주세요.", "Add more core skills.", "请补充更多核心技能。", "Vui lòng bổ sung thêm kỹ năng cốt lõi."));
      if (selfIntroLength < 120) reasons.push(t("자기소개를 조금 더 자세히 작성해 주세요.", "Make self-introduction more specific.", "请把自我介绍写得更具体一些。", "Hãy viết phần giới thiệu chi tiết hơn."));
      if (reasons.length === 0) reasons.push(t("필수 정보를 잘 입력했습니다.", "Core profile information is well completed.", "核心资料已基本完善。", "Thông tin hồ sơ cốt lõi đã được hoàn thiện."));

      return {
        id: position.id,
        title: position.title,
        company: position.partnerOrganization?.name ?? t("회사 정보 없음", "Unknown company", "公司信息缺失", "Không có thông tin công ty"),
        score: finalScore,
        confidence,
        reasons: reasons.slice(0, 2),
        href: `/positions/${position.id}`
      };
    });
  }

  const positionEstimates = useMemo<PositionEstimate[]>(() => buildPositionEstimates(positions), [
    activityExperiencesCount,
    additionalLength,
    careersCount,
    educationsCount,
    isKo,
    isZh,
    isVi,
    languageSkillsCount,
    motivationLength,
    overallPercent,
    positions,
    preferenceLength,
    profile?.visaType,
    selfIntroLength,
    skillsCount
  ]);

  async function handleCheckPositionMatches() {
    if (positionsLoading) return;
    setPositionsLoading(true);
    setPositionsError(null);
    setHasCheckedPositions(false);

    try {
      const [items] = await Promise.all([
        getPublicPositions(),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);
      const published = items
        .filter((item) => item.status === "OPEN")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPositions(
        published
      );
      const picked = [...buildPositionEstimates(published)]
        .sort((a, b) => (b.score + Math.random() * 22) - (a.score + Math.random() * 22))
        .slice(0, 6);
      setDrawnPositionEstimates(picked);
      setHasCheckedPositions(true);
    } catch (error) {
      setPositionsError(
        error instanceof Error
          ? error.message
          : t("포지션을 불러오지 못했습니다.", "Failed to load positions.", "无法加载职位信息。", "Không thể tải danh sách vị trí.")
      );
    } finally {
      setPositionsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="bg-[#F8FAFC] pb-20">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-4xl space-y-10">
            <section className="space-y-6 md:space-y-7">
              <h1 className="font-display text-3xl font-bold tracking-tight text-black">
                {t("내 매칭 가능성은 얼마나 될까?", "How is my current match potential?", "我的匹配可能性有多高？", "Khả năng phù hợp của tôi là bao nhiêu?")}
              </h1>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                {isReady && isAuthenticated && user?.role !== "STUDENT" ? (
                  <p className="text-sm text-muted-foreground">
                    {t("이 계정은 학생 계정이 아니어서 이 기능을 사용할 수 없습니다.", "This account is not a student account, so profile support is unavailable.", "此账号不是学生账号，无法使用该功能。", "Tài khoản này không phải tài khoản sinh viên nên không thể sử dụng tính năng này.")}
                  </p>
                ) : (
                  <>
                    <div>
                      {!isReady ? (
                        <p className="mt-2 text-sm text-muted-foreground">{t("로그인 정보를 확인하는 중입니다...", "Checking your session...", "正在确认登录信息...", "Đang kiểm tra phiên đăng nhập...")}</p>
                      ) : !isAuthenticated ? (
                        <p className="mt-2 text-sm text-muted-foreground">{t("로그인하면 매칭 가능성을 볼 수 있습니다.", "Sign in to view your match potential.", "登录后即可查看匹配可能性。", "Đăng nhập để xem khả năng phù hợp.")}</p>
                      ) : (
                        <>
                          <div className="mb-5 grid items-center gap-5 md:grid-cols-[130px_1fr]">
                            <div className="relative mx-auto w-full max-w-[130px]">
                              <Image
                                src="/img_gatcha.webp"
                                alt={t("매칭 가챠 이미지", "Matching gacha image", "匹配抽卡图像", "Hình ảnh gacha matching")}
                                width={1280}
                                height={1280}
                                className="h-auto w-full object-contain"
                                priority
                              />
                            </div>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                {t("버튼을 누르면 현재 열린 포지션 기준으로 합격 가능성을 계산해 보여줍니다.", "Press the button to calculate your acceptance chance from current positions.", "点击按钮，将基于当前开放的职位计算合格可能性。", "Nhấn nút để tính khả năng đậu dựa trên các vị trí đang mở.")}
                              </p>
                              <Button
                                variant="dark"
                                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                onClick={() => void handleCheckPositionMatches()}
                              >
                                {t("매칭 가능성 보기", "Check matching chance", "查看匹配可能性", "Xem khả năng phù hợp")}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                            {t("현재 매칭 가능성 점수", "Current match potential", "当前匹配可能性分数", "Điểm phù hợp hiện tại")}
                          </p>
                          <div className="mt-3 flex items-end gap-2">
                            <p className="font-display text-3xl font-bold leading-none text-primary">{overallPercent}%</p>
                            <p className="text-xs text-muted-foreground">{totalDone}/{totalItems}</p>
                          </div>
                          <div className="mt-3 h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${overallPercent}%` }}
                            />
                          </div>
                          <Accordion type="single" collapsible className="mt-4 w-full">
                            <AccordionItem value="improve-match" className="border-b-0">
                              <AccordionTrigger className="py-0 text-sm font-semibold text-foreground hover:no-underline">
                                <div className="flex w-full items-center justify-between pr-2">
                                  <span>{t("아래 항목을 채우면 매칭 가능성이 올라갑니다", "How to increase your match potential", "完善以下项目可提高匹配可能性", "Hoàn thiện các mục bên dưới để tăng khả năng phù hợp")}</span>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {t("화살표를 눌러 자세히 보기", "Tap the arrow to check details!", "点击箭头查看详情", "Nhấn mũi tên để xem chi tiết")}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {sections.map((section) => {
                                    const sectionPercent = percent(section.done, section.total);
                                    return (
                                      <div key={section.id} className="rounded-lg border border-border/60 bg-muted/40 px-3 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-semibold text-foreground">{section.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                                          </div>
                                          <Button variant="outline" size="sm" asChild>
                                            <Link href={section.href}>{t("수정", "Edit", "修改", "Chỉnh sửa")}</Link>
                                          </Button>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                          <div className="h-1.5 w-full rounded-full bg-muted">
                                            <div
                                              className="h-full rounded-full bg-primary transition-all"
                                              style={{ width: `${sectionPercent}%` }}
                                            />
                                          </div>
                                          <span className="text-[11px] font-medium text-muted-foreground">
                                            {section.done}/{section.total}
                                          </span>
                                        </div>
                                        {section.tips.length > 0 ? (
                                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                            {section.tips.slice(0, 2).map((tip) => (
                                              <li key={tip}>• {tip}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="mt-2 text-xs text-muted-foreground">
                                            {t("필수 항목을 모두 입력했습니다.", "Required items are complete.", "必填项目已全部填写。", "Đã hoàn tất các mục bắt buộc.")}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </>
                      )}
                    </div>

                  </>
                )}
              </div>
            </section>

            <section className="space-y-6 md:space-y-7">
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("현재 포지션 기준 합격 가능성은?", "How likely are you to pass for current positions?", "基于当前职位的合格可能性？", "Khả năng đậu các vị trí đang mở?")}
              </h2>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                {!isReady ? (
                  <p className="text-sm text-muted-foreground">{t("로그인 정보를 확인하는 중입니다...", "Checking your session...", "正在确认登录信息...", "Đang kiểm tra phiên đăng nhập...")}</p>
                ) : !isAuthenticated ? (
                  <p className="text-sm text-muted-foreground">{t("로그인하면 포지션별 합격 가능성을 볼 수 있습니다.", "Sign in to view position-by-position acceptance chances.", "登录后即可查看每个职位的合格可能性。", "Đăng nhập để xem khả năng đậu từng vị trí.")}</p>
                ) : user?.role !== "STUDENT" ? (
                  <p className="text-sm text-muted-foreground">{t("학생 계정만 포지션별 합격 가능성을 확인할 수 있습니다.", "Only student accounts can view position acceptance chances.", "只有学生账号可查看每个职位的合格可能性。", "Chỉ tài khoản sinh viên mới xem được khả năng đậu từng vị trí.")}</p>
                ) : positionsLoading ? (
                  <div className="space-y-3">
                    <div className="mx-auto h-32 w-32" ref={lottieContainerRef} />
                    <p className="text-center text-sm text-muted-foreground">
                      {t("나와 맞는 포지션을 찾는 중입니다..", "Matching positions that fit me..", "正在寻找适合我的职位..", "Đang tìm vị trí phù hợp với tôi..")}
                    </p>
                  </div>
                ) : positionsError ? (
                  <div className="space-y-3">
                    <p className="text-sm text-destructive">{positionsError}</p>
                    <Button variant="dark" size="sm" onClick={() => void handleCheckPositionMatches()}>
                      {t("다시 확인하기", "Try again", "再次查看", "Thử lại")}
                    </Button>
                  </div>
                ) : !hasCheckedPositions ? (
                  <p className="text-sm text-muted-foreground">
                    {t("위 카드의 매칭 가능성 보기 버튼을 눌러주세요.", "Please use the check button in the upper card.", "请点击上方卡片中的“查看匹配可能性”按钮。", "Vui lòng dùng nút trong thẻ phía trên để kiểm tra.")}
                  </p>
                ) : drawnPositionEstimates.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t("지금 확인할 수 있는 포지션이 없습니다.", "No available positions to evaluate right now.", "目前没有可评估的职位。", "Hiện không có vị trí nào để đánh giá.")}</p>
                    <Button variant="outline" size="sm" onClick={() => void handleCheckPositionMatches()}>
                      {t("다시 불러오기", "Refresh", "重新加载", "Tải lại")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      {t("합격 가능성은 프로필 작성 상태와 공고 기본 조건을 기준으로 계산한 참고 점수입니다.", "Acceptance chance is a reference estimate based on profile completeness and basic position requirements.", "合格可能性是基于资料完整度和职位基本条件计算的参考分数。", "Khả năng đậu là điểm tham khảo dựa trên độ hoàn thiện hồ sơ và điều kiện cơ bản của vị trí.")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {drawnPositionEstimates.map((item) => (
                        <div key={item.id} className="rounded-lg border border-border/60 bg-muted/40 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{item.company}</p>
                            </div>
                            <span className="text-xs font-semibold text-primary">{item.confidence}</span>
                          </div>
                          <div className="mt-3 flex items-end gap-2">
                            <p className="font-display text-2xl font-bold leading-none text-primary">{item.score}%</p>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                          </div>
                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {item.reasons.map((reason) => (
                              <li key={`${item.id}-${reason}`}>• {reason}</li>
                            ))}
                          </ul>
                          <div className="mt-3 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={item.href}>{t("포지션 보기", "View position", "查看职位", "Xem vị trí")}</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => void handleCheckPositionMatches()}>
                        {t("다시 돌려보기", "Roll again", "再抽一次", "Quay lại lần nữa")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
