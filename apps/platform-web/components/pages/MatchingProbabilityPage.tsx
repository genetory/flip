"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { getMyCandidateProfile, type MyCandidateProfile } from "../../lib/member-profile-client";

type CompletionSection = {
  id: string;
  title: string;
  description: string;
  done: number;
  total: number;
};

function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function MatchingProbabilityPage() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);

  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "STUDENT") {
      setLoadingProfile(false);
      return;
    }

    let ignore = false;
    void (async () => {
      try {
        const item = await getMyCandidateProfile();
        if (ignore) return;
        setProfile(item ?? null);
        setErrorMessage(null);
      } catch (error) {
        if (ignore) return;
        setErrorMessage(error instanceof Error ? error.message : t("프로필을 불러오지 못했습니다.", "Failed to load your profile."));
      } finally {
        if (!ignore) setLoadingProfile(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, t, user?.role]);

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
    const basicDone =
      Number(Boolean(user?.name?.trim()))
      + Number(Boolean(user?.phoneNumber?.trim()))
      + Number(Boolean(user?.birthDate))
      + Number(Boolean(user?.gender));

    const startOptionDone =
      Boolean(profile?.programStartOption)
      && (profile?.programStartOption !== "SPECIFIC_DATE" || Boolean(profile?.programStartDate));

    const visaResidenceDone =
      Number(Boolean(profile?.visaType))
      + Number(Boolean(profile?.residenceProvince?.trim()))
      + Number(startOptionDone);

    const experienceDone =
      Number(educationsCount > 0)
      + Number(languageSkillsCount > 0)
      + Number(careersCount > 0)
      + Number(activityExperiencesCount > 0);

    const profileTextDone =
      Number(skillsCount >= 3)
      + Number(selfIntroLength >= 120)
      + Number(motivationLength >= 120)
      + Number(preferenceLength >= 80)
      + Number(additionalLength >= 80);

    return [
      {
        id: "basic",
        title: t("프로필 기초 다지기", "Profile basics"),
        description: t("이름, 연락처, 생년월일, 성별", "Name, phone, birth date, gender"),
        done: basicDone,
        total: 4
      },
      {
        id: "visa-residence",
        title: t("근무 가능 조건 정리", "Work availability setup"),
        description: t("비자 유형, 거주 지역, 시작 가능 시점", "Visa type, residence, start option"),
        done: visaResidenceDone,
        total: 3
      },
      {
        id: "experience",
        title: t("경험치 채우기", "Experience stack"),
        description: t("각 탭 최소 1개 이상", "At least one item in each tab"),
        done: experienceDone,
        total: 4
      },
      {
        id: "profile-text",
        title: t("나를 보여주는 소개", "Personal pitch"),
        description: t("스킬/자기소개/동기/선호/추가정보", "Skills/intro/motivation/preferences/notes"),
        done: profileTextDone,
        total: 5
      }
    ];
  }, [
    additionalLength,
    activityExperiencesCount,
    careersCount,
    educationsCount,
    isKo,
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
  const sectionsWithPercent = sections.map((section) => ({ ...section, sectionPercent: percent(section.done, section.total) }));
  const nextFocusSection = sectionsWithPercent
    .filter((section) => section.done < section.total)
    .sort((a, b) => a.sectionPercent - b.sectionPercent)[0] ?? null;
  const momentumLabel =
    overallPercent >= 80
      ? t("거의 다 왔어요. 마지막 몇 가지만 채우면 됩니다.", "You're almost there. Just a few fields left.")
      : overallPercent >= 50
        ? t("좋아요. 절반을 넘겼어요. 이제 디테일만 보강해요.", "Nice progress. You're past halfway. Add a bit more detail.")
        : t("시작이 반이에요. 핵심 정보부터 차근차근 채워봐요.", "Great start. Fill in key info step by step.");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="bg-muted/40 pb-20">
        <div className="container">
          <div className="mx-auto max-w-4xl space-y-10">
            <section className="py-12 md:py-16">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <h1 className="font-display text-3xl font-bold tracking-tight text-black">
                    {t("매칭 확률 확인하기", "Check matching probability")}
                  </h1>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-card">
                  <Image
                    src="/img_profile_complete.webp"
                    alt={t("프로필 완성도와 매칭 확률 진단 이미지", "Profile completion and matching probability visual")}
                    width={1920}
                    height={821}
                    priority
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("나의 현재 매칭률은 어떤가요?", "How is my current matching rate?")}
              </h2>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-5 border-b border-border pb-5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                  {t("현재 매칭률", "Current matching rate")}
                </p>
                {!isReady ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t("세션 정보를 확인하는 중...", "Checking your session...")}</p>
                ) : !isAuthenticated ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t("로그인 후 매칭률을 확인할 수 있습니다.", "Sign in to view your matching rate.")}</p>
                ) : user?.role !== "STUDENT" ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("현재 role에서는 매칭률 보기를 지원하지 않습니다.", "Matching rate is not available for this role.")}
                  </p>
                ) : (
                  <>
                    <div className="mt-2 flex items-end gap-2">
                      <p className="font-display text-3xl font-bold leading-none text-primary">{overallPercent}%</p>
                      <p className="text-xs text-muted-foreground">{totalDone}/{totalItems}</p>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${overallPercent}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t("내 프로필 기본 정보", "My basic profile info")}
              </h2>

              {!isReady ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("세션 정보를 확인하는 중...", "Checking your session...")}</p>
              ) : !isAuthenticated ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("로그인 후 기본 정보를 확인할 수 있습니다.", "Sign in to view your basic profile info.")}</p>
              ) : user?.role !== "STUDENT" ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("현재 role에서는 학생 프로필 기본 정보를 지원하지 않습니다.", "Basic student profile info is not available for this role.")}
                </p>
              ) : (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t("실명", "Legal name")}</p>
                    <p className="mt-1 font-medium">{user.realName?.trim() || "-"}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t("닉네임", "Nickname")}</p>
                    <p className="mt-1 font-medium">{user.name?.trim() || "-"}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t("연락처", "Phone")}</p>
                    <p className="mt-1 font-medium">{user.phoneNumber?.trim() || t("예: 010-0000-0000", "e.g., +82-10-0000-0000")}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t("성별", "Gender")}</p>
                    <p className="mt-1 font-medium">{user.gender?.trim() || t("선택 안 함", "Prefer not to say")}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t("생년월일", "Date of birth")}</p>
                    <p className="mt-1 font-medium">{user.birthDate ? user.birthDate.slice(0, 10) : "-"}</p>
                  </div>
                </div>
              )}
              </div>
            </section>

            <section className="py-2">
              <p className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {t("프로필 완성도", "Profile completion")}
              </p>

              {!isReady ? (
                <p className="mt-6 text-sm text-muted-foreground">{t("세션 정보를 확인하는 중...", "Checking your session...")}</p>
              ) : !isAuthenticated ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-muted-foreground">{t("로그인 후 섹션별 완성도를 확인할 수 있습니다.", "Sign in to view your section completion.")}</p>
                  <Button variant="dark" asChild>
                    <Link href="/login">{t("로그인하러 가기", "Go to login")}</Link>
                  </Button>
                </div>
              ) : user?.role !== "STUDENT" ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  {t("현재 role에서는 프로필 완성도 보기를 지원하지 않습니다. (학생 role 전용)", "Section completion is not supported for this role. (Student role only)")}
                </p>
              ) : (
                <div className="mt-6 space-y-6">
                  {loadingProfile ? <p className="text-sm text-muted-foreground">{t("프로필 불러오는 중...", "Loading profile...")}</p> : null}
                  {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("어디부터 채우면 좋을까요?", "What should I fill in next?")}</h2>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">
                      {t(
                        "완성도는 점수가 아니라 기회예요. 비어 있는 섹션부터 채우면 매칭 정확도가 올라갑니다.",
                        "Completion is opportunity. Fill missing sections first to improve match quality."
                      )}
                    </p>
                  </div>

                  <section className="border-l-2 border-accent pl-3">
                    <p className="text-sm font-semibold">{t("지금 추천하는 다음 단계", "Recommended next step")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {nextFocusSection
                        ? t(`"${nextFocusSection.title}" 섹션부터 채워보세요.`, `Start with "${nextFocusSection.title}".`)
                        : t("모든 섹션이 채워졌어요. 이제 내용을 다듬어 완성도를 높여보세요.", "All sections are filled. Polish details to improve quality.")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{momentumLabel}</p>
                  </section>

                  <section>
                    <ul className="divide-y divide-border border-y border-border">
                    {sectionsWithPercent.map((section) => {
                      return (
                        <li key={section.id} className="py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{section.title}</p>
                              <p className="text-xs text-muted-foreground">{section.description}</p>
                            </div>
                            <span className="text-sm font-semibold">{section.sectionPercent}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-gradient-accent transition-all duration-300" style={{ width: `${section.sectionPercent}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{section.done}/{section.total} {t("완료", "done")}</p>
                        </li>
                      );
                    })}
                    </ul>
                  </section>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
