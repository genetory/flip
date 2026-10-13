"use client";

// v2 홈 — 맨 위에 '지금 가장 중요한 한 가지'를 크게, 아래로 다른 화면에서 만든 것들을 한 장씩 꺼내 쌓는다:
// 이력서·자기소개서·모의 면접 · 나에게 관심 준 회사 · 가장 가까운 면접(D-day) · 다음 단계 · 오늘의 질문 · 이번 주 기록 · 앞으로 채울 것들 · 지원 ·
// 팔로우한 회사 새 공고 · 마감 임박 · 맞춤 공고(스킬 일치) · 회사 · 가이드. 배너(사주·MBTI)는 맨 위. 처음 온 사람에겐 시작 3단계.
// 구획마다 모양을 달리한다(색 카드·캐러셀·숫자 칸·목록) — 같은 목록이 줄줄이 이어지면 심심하다. 데이터는 전부 기존 것(새 API 없음).
// 비어 있는 구획은 아예 그리지 않는다 — 빈 칸 안내가 줄줄이 늘어서면 오히려 허전해 보인다.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { V2Shell, V2_ROUTES } from "../V2Shell";
import { FeaturedBanners } from "../../talent/screens/HomeScreen";
import { Attention, Button, Masthead, MastheadSkeleton, Page, Row, Section, SectionSkeleton, TextLink } from "../ui";
import { LevelChip, PracticeSheet, type PracticeQuestion } from "../practice";
import { PrepSheetV2 } from "../prep-sheet";
import { jobPhotoOf } from "../lib";
import { categoryLabel, coverWritten, docChecklist, readChecklists, splitList, termIn } from "./V2CareerScreen";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useResumeDoc, useRenewalDocsStatus, type ResumeDoc } from "../../../lib/talent/resume-doc";
import { useCoverDoc, type CoverDoc } from "../../../lib/talent/cover-doc";
import {
  getMyApplications,
  getMyFavoritePositions,
  getMyMockInterviews,
  getInterestedCompanies,
  getPublicPositionsPage,
  type InterestedCompany,
  getRecommendedPositions,
  type MockInterviewRecord,
  type MyApplication,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { useSelfMock, practiceStreak } from "../../../lib/talent/self-mock";
import { useMyInterviews } from "../../../lib/talent/my-interviews";
import { useFollowedCompanies } from "../../../lib/talent/company-follow";
import { pickDailyQuestion, kstDay, questionText } from "../../../lib/talent/interview-daily";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { careerGuides } from "../../../lib/talent/home-content";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";

const EDITOR = { resume: "/talent/career/resume/editor", cover: "/talent/career/cover/editor" };
const PREVIEW = { resume: "/talent/career/resume/preview", cover: "/talent/career/cover/preview" };

function daysUntil(iso: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(iso);
  day.setHours(0, 0, 0, 0);
  const d = Math.round((day.getTime() - today.getTime()) / 86400000);
  return d >= 0 ? d : null;
}

function statusText(t: PlatformT, a: MyApplication): string {
  if (a.status === "INTERVIEW") return a.interviewSelectedAt ? t("면접 확정", "Interview set", "面试已定", "Đã hẹn PV", "面接確定", "Terjadwal") : t("면접 일정 선택", "Pick a time", "选择时间", "Chọn lịch", "日程を選択", "Pilih jadwal");
  if (a.status === "ACCEPTED") return t("합격", "Accepted", "已录取", "Trúng tuyển", "合格", "Diterima");
  if (a.status === "REJECTED") return t("불합격", "Not selected", "未录取", "Không đạt", "不合格", "Tidak lolos");
  if (a.status === "WITHDRAWN") return t("철회", "Withdrawn", "已撤回", "Đã rút", "取り消し", "Ditarik");
  return t("검토 중", "In review", "审核中", "Đang xét", "選考中", "Ditinjau");
}

export function V2HomeScreen() {
  return (
    <V2Shell requireAuth>
      <Home />
    </V2Shell>
  );
}

function Home() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const name = user?.realName || user?.name || "";
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  // 서류 준비 — 내 커리어 서류 카드와 같은 체크 기준(완성도 %는 기준이 모호해 쓰지 않는다).
  const resumeLeft = docChecklist(t, "resume", resume, cover).filter((c) => !c.done);
  const resumeReady = !!resume && !resumeLeft.length;
  const coverReady = !!cover && docChecklist(t, "cover", resume, cover).every((c) => c.done);
  const interests = useJobInterests();
  const selfMock = useSelfMock();
  const docsStatus = useRenewalDocsStatus();
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [jobs, setJobs] = useState<PublicPositionListItem[] | null>(null);
  const [personalized, setPersonalized] = useState(false);
  const [saved, setSaved] = useState<PublicPositionListItem[]>([]);
  const [mocks, setMocks] = useState<MockInterviewRecord[] | null>(null);
  const [companies, setCompanies] = useState<{ name: string; industry?: string; count: number; photo: string | null }[] | null>(null);
  const [interestedCos, setInterestedCos] = useState<InterestedCompany[]>([]);
  const [followJobs, setFollowJobs] = useState<PublicPositionListItem[]>([]);
  const [practiceQ, setPracticeQ] = useState<PracticeQuestion | null>(null);
  const [prepFor, setPrepFor] = useState<Upcoming | null>(null);
  const [now] = useState(() => Date.now()); // 화면을 연 시각 — 오늘의 질문·이번 주 기록의 기준
  const [checklists] = useState(() => (typeof window === "undefined" ? {} : readChecklists()));
  const mine = useMyInterviews();
  const followed = useFollowedCompanies();
  const router = useRouter();

  useEffect(() => {
    getMyApplications().then(setApps).catch(() => setApps([]));
    getMyFavoritePositions().then(setSaved).catch(() => setSaved([]));
    getMyMockInterviews().then(setMocks).catch(() => setMocks([]));
    getInterestedCompanies()
      .then((l) => setInterestedCos(l))
      .catch(() => setInterestedCos([]));
    // 맞춤 공고 — 관심 직무·이력 기반 추천, 안 되면 최신 공고.
    getRecommendedPositions({ limit: 4, locale })
      .then((r) => {
        if (r.items.length) {
          setJobs(r.items);
          setPersonalized(r.personalized);
        } else throw new Error("empty");
      })
      .catch(() =>
        getPublicPositionsPage({ limit: 4, locale })
          .then((p) => setJobs(p.items))
          .catch(() => setJobs([]))
      );
    // 이런 회사 — 직접 채용 중인 회사 중 셋(공고 수 많은 순). 전체는 [더 보기] → 회사 목록(/v2/companies).
    getPublicPositionsPage({ limit: 60, sourceProviders: ["INTERNAL"], locale })
      .then((p) => {
        const map = new Map<string, { name: string; industry?: string; count: number; photo: string | null }>();
        for (const j of p.items) {
          const org = j.partnerOrganization;
          if (!org?.name) continue;
          // 대표 사진 — 사무실 사진이 있으면 그걸, 없으면 로고.
          const e = map.get(org.name) ?? { name: org.name, industry: org.industry ? partnerIndustryLabel(org.industry) : undefined, count: 0, photo: org.officePhotoImageData || org.companyLogoImageData || null };
          e.count += 1;
          map.set(org.name, e);
        }
        setCompanies([...map.values()].sort((a, b) => b.count - a.count).slice(0, 3));
      })
      .catch(() => setCompanies([]));
  }, [locale, interests.length]);

  // 팔로우한 회사의 새 공고(14일 안) — 회사마다 최신 둘씩.
  const followKey = followed.slice(0, 6).join("|");
  useEffect(() => {
    if (!followKey) return;
    let alive = true;
    const since = Date.now() - 14 * 86_400_000;
    Promise.all(followKey.split("|").map((c) => getPublicPositionsPage({ company: c, limit: 2, sort: "latest", locale }).then((p) => p.items).catch(() => [] as PublicPositionListItem[]))).then((lists) => {
      if (!alive) return;
      setFollowJobs(lists.flat().filter((j) => new Date(j.createdAt).getTime() >= since).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6));
    });
    return () => {
      alive = false;
    };
  }, [followKey, locale]);

  const appList = useMemo(() => apps ?? [], [apps]);
  // 맞춤 공고 '왜 맞는지' — 공고에 그대로 나오는 내 스킬.
  const skills = useMemo(() => [...new Set((resume?.items ?? []).filter((i) => i.section === "skill").flatMap((i) => splitList(i.text)))], [resume]);

  // 저장한 공고 중 7일 안에 마감.
  const closing = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return saved
      .map((p) => {
        if (p.sourceDeadlineRolling || !p.sourceDeadlineDate) return null;
        const d = Math.ceil((new Date(p.sourceDeadlineDate.slice(0, 10)).getTime() - today.getTime()) / 86400000);
        return d >= 0 && d <= 7 ? { p, d } : null;
      })
      .filter((x): x is { p: PublicPositionListItem; d: number } => x !== null)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
  }, [saved]);

  // 모의 면접 요약 — 가장 최근 기록과 가장 약한 영역 하나.
  const weakest = useMemo(() => analyzeMockWeakness(selfMock).filter((r) => r.average !== null && r.average < WEAK_BELOW).sort((a, b) => (a.average ?? 0) - (b.average ?? 0))[0] ?? null, [selfMock]);
  const lastMock = mocks?.[0] ?? null;

  // 가장 가까운 면접 — Aply 지원 면접 + 내가 등록한 모의 면접(일정이 있는 것). 홈엔 하나만, D-day 카드로.
  const nextInterview = useMemo<Upcoming | null>(() => {
    const list: Upcoming[] = [
      ...appList.filter((a) => a.status === "INTERVIEW" && a.interviewSelectedAt && daysUntil(a.interviewSelectedAt) !== null).map((a) => ({ positionId: a.positionId, title: a.positionTitle, company: a.partnerOrganizationName ?? null, at: a.interviewSelectedAt!, mine: false })),
      ...mine.filter((m) => m.interviewAt && daysUntil(m.interviewAt) !== null).map((m) => ({ positionId: m.positionId, title: m.title, company: m.company || null, at: m.interviewAt!, mine: true }))
    ];
    return list.sort((x, y) => new Date(x.at).getTime() - new Date(y.at).getTime())[0] ?? null;
  }, [appList, mine]);
  const active = appList.filter((a) => a.status !== "WITHDRAWN" && a.status !== "REJECTED");

  // 맨 위 한 가지 — 가장 급한 것부터.
  const lead = (() => {
    if (!resumeReady)
      return {
        title: !resume ? t("이력서부터 시작해 볼까요", "Let's start with your resume", "先从简历开始吧", "Bắt đầu từ CV nhé", "まず履歴書から始めましょう", "Mulai dari CV yuk") : t("이력서를 마무리해 볼까요", "Let's finish your resume", "把简历完成吧", "Hoàn thiện CV nhé", "履歴書を仕上げましょう", "Selesaikan CV yuk"),
        lede: !resume
          ? t("이력서가 있어야 공고에 지원하고 맞춤 면접 연습도 할 수 있어요.", "You need a resume to apply and to get tailored interview practice.", "有了简历才能投递并进行定制面试练习。", "Cần có CV để ứng tuyển và luyện phỏng vấn theo bạn.", "履歴書があると応募も、自分に合った面接練習もできます。", "Butuh CV untuk melamar dan latihan wawancara yang pas.")
          : t(`남은 항목: ${resumeLeft.map((c) => c.label).join(", ")}`, `Still to add: ${resumeLeft.map((c) => c.label).join(", ")}`, `还需填写：${resumeLeft.map((c) => c.label).join("、")}`, `Còn thiếu: ${resumeLeft.map((c) => c.label).join(", ")}`, `残り：${resumeLeft.map((c) => c.label).join("、")}`, `Belum: ${resumeLeft.map((c) => c.label).join(", ")}`),
        cta: { label: !resume ? t("이력서 쓰기", "Write resume", "写简历", "Viết CV", "履歴書を書く", "Tulis CV") : t("이어서 쓰기", "Continue", "继续写", "Viết tiếp", "続きを書く", "Lanjutkan"), href: EDITOR.resume }
      };
    if (!coverReady)
      return {
        title: t("자기소개서만 남았어요", "Just your cover letter left", "只剩自我介绍了", "Chỉ còn thư giới thiệu", "残りは自己紹介書だけ", "Tinggal surat lamaran"),
        lede: t("이력서는 준비됐어요. 지원할 회사 문항부터 하나 써 보세요.", "Your resume is ready. Start with one question for a company you like.", "简历已就绪。先写一个想投公司的问题吧。", "CV đã sẵn sàng. Viết một câu cho công ty bạn muốn.", "履歴書は準備OK。応募先の設問から1つ書きましょう。", "CV siap. Tulis satu jawaban untuk perusahaan incaran.")
        ,
        cta: { label: t("자기소개서 쓰기", "Write cover letter", "写自我介绍", "Viết thư", "自己紹介書を書く", "Tulis surat"), href: EDITOR.cover }
      };
    return {
      title: t("지원할 준비가 됐어요", "You're ready to apply", "可以开始投递了", "Bạn đã sẵn sàng ứng tuyển", "応募の準備ができました", "Siap melamar"),
      lede: t("서류가 모두 준비됐어요. 나에게 맞는 공고를 찾아 지원해 보세요.", "Your documents are ready. Find a job that fits and apply.", "材料都准备好了，去找适合的职位投递吧。", "Hồ sơ đã sẵn sàng. Tìm việc phù hợp và ứng tuyển.", "書類はすべて揃いました。合う求人を探して応募しましょう。", "Dokumen siap. Cari lowongan yang cocok dan lamar."),
      cta: { label: t("공고 보기", "Browse jobs", "浏览职位", "Xem việc làm", "求人を見る", "Lihat lowongan"), href: V2_ROUTES.jobs }
    };
  })();

  // 오늘의 질문 · 연속 기록 — 모의 면접 페이지와 같은 질문.
  const daily = pickDailyQuestion(user?.id, kstDay(now), jobCategoriesForInterests(interests));
  const { streak, doneToday } = practiceStreak(selfMock, now);
  const answers = selfMock?.answers ?? [];
  const dailyAnswer = answers.find((a) => a.question === daily.ko && a.answer.trim());
  const answeredToday = !!dailyAnswer && kstDay(dailyAnswer.updatedAt) === kstDay(now);

  // 이번 주 기록 — 최근 7일 vs 그 전 7일.
  const weekAgo = now - 7 * 86_400_000;
  const twoWeeksAgo = now - 14 * 86_400_000;
  const answeredWeek = answers.filter((a) => a.updatedAt >= weekAgo).length;
  const answeredPrev = answers.filter((a) => a.updatedAt >= twoWeeksAgo && a.updatedAt < weekAgo).length;
  const appliedWeek = appList.filter((a) => new Date(a.submittedAt).getTime() >= weekAgo).length;
  const appliedPrev = appList.filter((a) => {
    const at = new Date(a.submittedAt).getTime();
    return at >= twoWeeksAgo && at < weekAgo;
  }).length;

  // 최근 30일 안에 관심 준 회사.
  const freshInterest = interestedCos.filter((c) => now - new Date(c.interestedAt).getTime() <= 30 * 86_400_000);

  // 앞으로 채울 것들 — 내 커리어 '이 직무에 필요한 것'에서 이미 비교해 둔 결과(이 브라우저)만 읽는다. AI 를 새로 부르지 않는다.
  const gapRole = interests.find((r) => checklists[r]);
  const gapResult = gapRole ? checklists[gapRole] : null;
  const gaps = (gapResult?.items ?? []).filter((i) => !i.have).sort((x, y) => Number(!!x.common) - Number(!!y.common) || y.count - x.count).slice(0, 4);

  // 처음 온 사람 — 지원이 없고 시작 3단계가 다 끝나지 않았으면 3단계 카드를 크게, 기록류 구획은 접는다.
  const steps = [
    { key: "interest", done: interests.length > 0, title: t("관심 직무 고르기", "Pick job interests", "选择感兴趣的职位", "Chọn ngành quan tâm", "関心職種を選ぶ", "Pilih minat"), meta: t("맞춤 공고·면접 질문의 기준이에요", "Powers your recommendations", "推荐的基础", "Cơ sở để gợi ý", "おすすめの基準", "Dasar rekomendasi"), href: "/v2/profile" },
    { key: "resume", done: (resume?.items.length ?? 0) > 0, title: t("이력서 시작하기", "Start your resume", "开始写简历", "Bắt đầu CV", "履歴書を始める", "Mulai CV"), meta: t("한 줄씩 써도 AI가 정리해 줘요", "AI tidies it as you go", "AI 帮你整理", "AI sắp xếp giúp", "AIが整えます", "AI merapikan"), href: EDITOR.resume },
    { key: "mock", done: answers.length > 0 || (mocks?.length ?? 0) > 0, title: t("면접 질문 하나 답해 보기", "Answer one interview question", "回答一道面试题", "Trả lời một câu", "面接の質問に1つ答える", "Jawab satu pertanyaan"), meta: t("2분이면 AI 피드백까지", "AI feedback in 2 minutes", "2 分钟获得 AI 反馈", "Phản hồi AI trong 2 phút", "2分でAIフィードバック", "Masukan AI 2 menit") }
  ];
  const stepsDone = steps.filter((x) => x.done).length;
  const newcomer = appList.length === 0 && stepsDone < 3;
  const openDaily = () => setPracticeQ({ ko: daily.ko, shown: questionText(t, daily), category: daily.category });

  const today = new Date();
  const eyebrow = [
    t(`${today.getMonth() + 1}월 ${today.getDate()}일`, today.toLocaleDateString("en", { month: "long", day: "numeric" }), `${today.getMonth() + 1}月${today.getDate()}日`, `${today.getDate()}/${today.getMonth() + 1}`, `${today.getMonth() + 1}月${today.getDate()}日`, `${today.getDate()}/${today.getMonth() + 1}`),
    name ? t(`${name}님`, name, name, name, `${name}さん`, name) : null
  ]
    .filter(Boolean)
    .join(" · ");

  // 맨 위 배너(사주·MBTI) — 기존 홈과 같은 것. 읽을 데이터가 없어 불러오는 중에도 먼저 보인다.
  // 배너 슬라이드가 안쪽에 6·8px 여백을 갖고 있어 그만큼 덜어 본문 왼쪽 선(20px)에 맞춘다.
  const banners = (
    <div className="px-3.5 pt-5 md:px-3 md:pt-8">
      <FeaturedBanners />
    </div>
  );

  // 맨 위 한 가지는 서류·지원을 다 읽어야 정해진다 — 그 전엔 화면 모양만.

  if (docsStatus !== "loaded" || apps === null)
    return (
      <Page>
        {banners}
        <MastheadSkeleton />
        <SectionSkeleton thumb={false} rows={2} />
        <SectionSkeleton thumb={false} rows={2} />
        <SectionSkeleton />
      </Page>
    );

  return (
    <Page>
      {banners}
      <Masthead
        eyebrow={eyebrow}
        title={name ? t(`${name}님, 오늘도 한 걸음 나아가요`, `One step further today, ${name}`, `${name}，今天也前进一步吧`, `${name}, hôm nay tiến thêm một bước`, `${name}さん、今日も一歩前へ`, `${name}, selangkah lagi hari ini`) : t("오늘도 한 걸음 나아가요", "One step further today", "今天也前进一步吧", "Hôm nay tiến thêm một bước", "今日も一歩前へ", "Selangkah lagi hari ini")}
      />

      {/* 가장 중요한 셋 — 이력서·자기소개서(두 칸) + 모의 면접(한 줄). 늘 맨 위에. */}
      <div className="-mt-2 px-5 pb-8">
        <div className="grid grid-cols-2 gap-2.5">
          <DocTile t={t} kind="resume" resume={resume} cover={cover} />
          <DocTile t={t} kind="cover" resume={resume} cover={cover} />
        </div>
        <MockTile t={t} streak={streak} week={answeredWeek} best={lastMock?.bestScore ?? null} weakest={weakest?.label ?? null} />
      </div>

      {/* 처음 온 사람 — 시작 3단계(회색 카드 + 막대) */}
      {newcomer ? (
        <div className="px-5 pb-8">
          <StartSteps t={t} steps={steps} done={stepsDone} onMock={openDaily} />
        </div>
      ) : null}

      {/* 나에게 관심 준 회사 — 보라 띠(로고 겹쳐 보이기) */}
      {freshInterest.length ? (
        <div className="px-5 pb-6">
          <Link href="/talent/feed" className="flex items-center gap-3 rounded-3xl bg-[#f3eeff] px-5 py-4 transition hover:-translate-y-0.5">
            <span className="flex shrink-0 -space-x-2">
              {freshInterest.slice(0, 3).map((c) => (
                <span key={c.organizationId} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#f3eeff] bg-white text-[13px] font-bold text-[color:var(--v2-ink-3)]">
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 회사 로고는 data URL·외부 주소가 섞여 next/image 로 못 받는다.
                    <img src={c.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    c.name.charAt(0)
                  )}
                </span>
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">
                {freshInterest.length > 1
                  ? t(`${freshInterest[0].name} 외 ${freshInterest.length - 1}곳이 관심을 보였어요`, `${freshInterest[0].name} and ${freshInterest.length - 1} more are interested`, `${freshInterest[0].name} 等 ${freshInterest.length} 家公司对你感兴趣`, `${freshInterest[0].name} và ${freshInterest.length - 1} nơi khác quan tâm`, `${freshInterest[0].name}ほか${freshInterest.length - 1}社が関心`, `${freshInterest[0].name} +${freshInterest.length - 1} tertarik`)
                  : t(`${freshInterest[0].name}가 관심을 보였어요`, `${freshInterest[0].name} is interested in you`, `${freshInterest[0].name} 对你感兴趣`, `${freshInterest[0].name} quan tâm bạn`, `${freshInterest[0].name}が関心を示しました`, `${freshInterest[0].name} tertarik padamu`)}
              </span>
              <span className="mt-0.5 block text-[13px] text-[color:var(--v2-muted)]">{t("내 프로필을 보고 관심 표시를 했어요", "They saw your profile", "看了你的资料并表示感兴趣", "Họ đã xem hồ sơ của bạn", "プロフィールを見て関心を示しました", "Mereka melihat profilmu")}</span>
            </span>
            <span className="shrink-0 text-[20px] text-[color:var(--v2-faint)]" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      ) : null}

      {/* 가장 가까운 면접 — 파란 D-day 카드 */}
      {nextInterview ? (
        <div className="px-5 pb-6">
          <DdayCard t={t} item={nextInterview} onPrep={() => setPrepFor(nextInterview)} />
        </div>
      ) : null}

      {/* 다음 단계 — 지금 가장 중요한 한 가지(서류 → 지원). 처음 온 사람은 시작 3단계가 대신한다. */}
      {!newcomer ? (
        <Section title={t("다음 단계", "Next step", "下一步", "Bước tiếp theo", "次のステップ", "Langkah berikutnya")}>
          <div className="flex items-center gap-4 rounded-3xl bg-[color:var(--v2-band)] p-5">
            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{lead.title}</span>
              <span className="mt-1 block text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{lead.lede}</span>
            </span>
          </div>
          <div className="mt-3">
            <Button full href={lead.cta.href}>
              {lead.cta.label}
            </Button>
          </div>
        </Section>
      ) : null}

      {/* 오늘의 질문 — 주황 카드, 홈에서 바로 답하기 */}
      {!newcomer ? (
        <Section
          title={t("오늘의 질문", "Today's question", "今日问题", "Câu hỏi hôm nay", "今日の質問", "Pertanyaan hari ini")}
          aside={streak > 0 ? <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[13px] font-bold text-[#e8590c]">🔥 {t(`${streak}일째`, `${streak}-day streak`, `连续 ${streak} 天`, `${streak} ngày`, `${streak}日連続`, `${streak} hari`)}</span> : undefined}
        >
          <div className="rounded-3xl bg-[#fff4e8] p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-[#c2410c]">{mockCategoryLabelOf(t, daily.category)}</span>
              {answeredToday ? <LevelChip t={t} score={dailyAnswer!.score} /> : null}
            </div>
            <p className="mt-1.5 text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, daily)}</p>
            {locale !== "ko" ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {daily.ko}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[14px] text-[color:var(--v2-ink-3)]">
                {answeredToday
                  ? t("오늘 연습 완료! 내일 새 질문이 와요", "Done today! New one tomorrow", "今日已完成！明天有新题", "Xong hôm nay! Mai có câu mới", "今日は完了！明日また新しい質問", "Selesai! Besok ada yang baru")
                  : doneToday
                    ? t("오늘 연습했어요. 이것도 해 볼까요?", "Practiced today — this one too?", "今天已练习，再试这题？", "Đã luyện — thử câu này?", "今日は練習済み。これも？", "Sudah latihan — coba ini?")
                    : t("2분이면 돼요. 연속 기록을 이어 가세요", "2 minutes — keep your streak", "只需 2 分钟，保持连续记录", "2 phút — giữ chuỗi ngày", "2分で連続記録をキープ", "2 menit — jaga beruntun")}
              </span>
              <Button size="sm" variant={answeredToday ? "white" : "primary"} onClick={openDaily}>
                {dailyAnswer ? t("다시 답하기", "Again", "再答", "Lại", "もう一度", "Lagi") : t("답하기", "Answer", "作答", "Trả lời", "答える", "Jawab")}
              </Button>
            </div>
          </div>
        </Section>
      ) : null}

      {/* 이번 주 기록 — 숫자 세 칸 */}
      {!newcomer ? (
        <Section title={t("이번 주 나", "My week", "本周的我", "Tuần này", "今週の私", "Mingguku")}>
          <div className="grid grid-cols-3 gap-2">
            <WeekStat t={t} label={t("답한 질문", "Answered", "回答的题", "Đã trả lời", "回答した質問", "Dijawab")} value={answeredWeek} prev={answeredPrev} />
            <WeekStat t={t} label={t("지원", "Applied", "投递", "Ứng tuyển", "応募", "Melamar")} value={appliedWeek} prev={appliedPrev} />
            <WeekStat t={t} label={t("연속 연습", "Streak", "连续练习", "Chuỗi ngày", "連続練習", "Beruntun")} value={streak} unit={t("일", "d", "天", "ng", "日", "h")} />
          </div>
        </Section>
      ) : null}

      {/* 앞으로 채울 것들 — 내 커리어에서 비교해 둔 결과 중 아직 없는 것(민트 카드 목록). 결과가 없으면 확인하러 가는 한 줄. */}
      {interests.length && !newcomer ? (
        <Section
          title={t("앞으로 채울 것들", "What to add next", "接下来要补充的", "Cần bổ sung tiếp", "これから足すもの", "Yang perlu ditambah")}
          aside={gaps.length && gapRole ? <span className="text-[14px] text-[color:var(--v2-muted)]">{jobTaxonomyLabelOf(t, gapRole)}</span> : undefined}
        >
          {gaps.length ? (
            <div className="rounded-3xl bg-[#e6f7f4] p-2">
              <ul>
                {gaps.map((g) => (
                  <li key={g.name}>
                    <Link href={V2_ROUTES.career} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/60">
                      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-white px-2 text-[12px] font-bold text-[#0f766e]">{categoryLabel(t, g.category)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-bold text-[color:var(--v2-ink)]">{g.name}</span>
                        <span className="block truncate text-[13px] text-[color:var(--v2-ink-3)]">
                          {g.common || !gapResult?.total
                            ? t("이 직무 신입이 흔히 준비해요", "Common for new hires", "新人常准备", "Người mới thường chuẩn bị", "新人がよく準備", "Umum disiapkan")
                            : t(`공고 ${gapResult.total}곳 중 ${g.count}곳이 원해요`, `${g.count} of ${gapResult.total} jobs want it`, `${gapResult.total} 个职位中 ${g.count} 个要求`, `${g.count}/${gapResult.total} tin yêu cầu`, `求人${gapResult.total}件中${g.count}件`, `${g.count}/${gapResult.total} lowongan`)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[18px] text-[#0f766e]/60" aria-hidden>
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Row href={V2_ROUTES.career} lead="🧩" title={t("내 직무에 필요한 것 확인하기", "See what your role needs", "看看职位需要什么", "Xem ngành cần gì", "職種に必要なものを確認", "Lihat kebutuhan peran")} meta={t("실제 공고와 내 서류를 비교해요", "Compares real jobs with your documents", "对比真实职位与你的材料", "So sánh tin thật với hồ sơ", "実際の求人と書類を比較", "Bandingkan lowongan & dokumen")} />
          )}
        </Section>
      ) : null}

      {!newcomer ? (
        <Section
          title={t("지원", "Applications", "申请", "Ứng tuyển", "応募", "Lamaran")}
          aside={active.length ? <span className="text-[14px] text-[color:var(--v2-muted)]">{t(`${active.length}곳 진행 중`, `${active.length} active`, `${active.length} 个进行中`, `${active.length} đang xử lý`, `${active.length}件進行中`, `${active.length} aktif`)}</span> : null}
        >
          {active.length ? (
            <div>
              {active.slice(0, 3).map((a) => {
                const d = a.interviewSelectedAt ? daysUntil(a.interviewSelectedAt) : null;
                return (
                  <Row
                    key={a.id}
                    href={V2_ROUTES.applications}
                    title={a.positionTitle}
                    meta={a.partnerOrganizationName ?? undefined}
                    right={d !== null && a.status === "INTERVIEW" ? <Attention>{d === 0 ? t("오늘 면접", "Today", "今天面试", "Hôm nay", "今日面接", "Hari ini") : `D-${d}`}</Attention> : statusText(t, a)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[15px] leading-[1.75] text-[color:var(--v2-muted)]">
              {t("아직 지원한 곳이 없어요. 서류가 준비되면 공고에서 바로 지원할 수 있어요.", "No applications yet. Once your documents are ready, you can apply right from a job.", "还没有投递。材料准备好后可直接在职位页投递。", "Chưa ứng tuyển nơi nào. Khi hồ sơ sẵn sàng, bạn có thể ứng tuyển ngay.", "まだ応募はありません。書類が揃えば求人からすぐ応募できます。", "Belum ada lamaran. Setelah dokumen siap, langsung lamar dari lowongan.")}
            </p>
          )}
        </Section>
      ) : null}

      {/* 팔로우한 회사 새 공고 — 사진 카드 캐러셀 */}
      {followJobs.length ? (
        <Section title={t("팔로우한 회사 새 공고", "New from companies you follow", "关注公司的新职位", "Tin mới từ công ty theo dõi", "フォロー企業の新着", "Baru dari yang diikuti")}>
          <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {followJobs.map((j) => (
              <Link key={j.id} href={`/v2/jobs/${j.id}`} className="w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[color:var(--v2-band)] transition hover:-translate-y-0.5">
                <span className="relative block h-28 w-full bg-[color:var(--v2-line)]">
                  {jobPhotoOf(j) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 공고 사진은 data URL·외부 주소가 섞여 next/image 로 못 받는다.
                    <img src={jobPhotoOf(j)!} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2 py-0.5 text-[12px] font-bold text-[color:var(--v2-accent)]">NEW</span>
                </span>
                <span className="block p-3.5">
                  <span className="line-clamp-2 block text-[15px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{j.title}</span>
                  <span className="mt-1 block truncate text-[13px] text-[color:var(--v2-muted)]">{j.partnerOrganization?.name || j.sourceCompanyName}</span>
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {closing.length ? (
        <Section title={t("곧 마감되는 저장 공고", "Saved jobs closing soon", "即将截止的收藏职位", "Tin đã lưu sắp đóng", "まもなく締切の保存求人", "Lowongan tersimpan segera tutup")}>
          {closing.map(({ p, d }) => (
            <Row
              key={p.id}
              href={`/v2/jobs/${p.id}`}
              title={p.title}
              meta={p.partnerOrganization?.name || p.sourceCompanyName || undefined}
              right={<Attention>{d === 0 ? t("오늘 마감", "Today", "今天截止", "Hôm nay", "今日締切", "Hari ini") : `D-${d}`}</Attention>}
            />
          ))}
        </Section>
      ) : null}

      {/* 맞춤 공고 — 공고에 나오는 내 스킬을 초록으로 */}
      {jobs === null ? (
        <SectionSkeleton />
      ) : jobs.length ? (
        <Section
          title={personalized ? t("나에게 맞는 공고", "Jobs for you", "适合你的职位", "Việc làm cho bạn", "あなたに合う求人", "Lowongan untukmu") : t("새로 올라온 공고", "New jobs", "最新职位", "Việc làm mới", "新着求人", "Lowongan baru")}
        >
          {jobs.map((j) => {
            const text = `${j.title}\n${j.requiredQualifications ?? ""}\n${j.preferredQualifications ?? ""}`;
            const hits = skills.filter((k) => termIn(text, k)).slice(0, 2);
            const company = j.partnerOrganization?.name || j.sourceCompanyName;
            return (
              <Row
                key={j.id}
                href={`/v2/jobs/${j.id}`}
                thumb={{ src: j.thumbnailImages?.[0] || j.partnerOrganization?.officePhotoImageData || j.partnerOrganization?.companyLogoImageData, fallback: company || j.title }}
                title={j.title}
                meta={
                  hits.length ? (
                    <>
                      {company ? `${company} · ` : ""}
                      <span className="font-semibold text-[color:var(--v2-good)]">✓ {hits.join(", ")}</span>
                    </>
                  ) : (
                    [company, (j.workLocation || "").split(" ").slice(0, 2).join(" ")].filter(Boolean).join(" · ") || undefined
                  )
                }
              />
            );
          })}
          <div className="mt-3">
            <Button variant="neutral" full href={personalized && interests.length ? "/v2/jobs?tab=interest" : V2_ROUTES.jobs}>
              {t("더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat lagi")}
            </Button>
          </div>
        </Section>
      ) : null}

      {/* 이런 회사 — 목록 셋 + [더 보기](회사 목록 화면) */}
      {companies === null ? (
        <SectionSkeleton />
      ) : companies.length ? (
        <Section title={t("이런 회사는 어때요", "Companies to check out", "这些公司怎么样", "Công ty đáng xem", "こんな会社はいかが", "Perusahaan untuk dilihat")}>
          {companies.map((c) => (
            <Row
              key={c.name}
              href={`/talent/company/${encodeURIComponent(c.name)}`}
              thumb={{ src: c.photo, fallback: c.name }}
              title={c.name}
              meta={[c.industry, t(`채용 중 ${c.count}`, `${c.count} open`, `在招 ${c.count}`, `${c.count} vị trí`, `募集中 ${c.count}`, `${c.count} lowongan`)].filter(Boolean).join(" · ")}
            />
          ))}
          <div className="mt-3">
            <Button variant="neutral" full href="/v2/companies">
              {t("더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat lagi")}
            </Button>
          </div>
        </Section>
      ) : null}

      <Section
        title={t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}
        aside={<TextLink href={V2_ROUTES.guide}>{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</TextLink>}
      >
        {careerGuides(t)
          .slice(0, 3)
          .map((g) => (
            <Row key={g.title} href={V2_ROUTES.guide} lead={g.emoji} title={g.title.replace(/\n/g, " ")} meta={g.desc} />
          ))}
      </Section>

      {practiceQ ? <PracticeSheet question={practiceQ} onClose={() => setPracticeQ(null)} /> : null}
      {prepFor ? (
        <PrepSheetV2
          positionId={prepFor.positionId}
          title={prepFor.title}
          company={prepFor.company}
          interviewAt={prepFor.at}
          onPractice={() => {
            setPrepFor(null);
            router.push(V2_ROUTES.interviews);
          }}
          onClose={() => setPrepFor(null)}
        />
      ) : null}
    </Page>
  );
}

type Upcoming = { positionId: string; title: string; company: string | null; at: string; mine: boolean };

function whenText(t: PlatformT, iso: string): string {
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return t(`${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`, `${d.toLocaleDateString("en", { month: "short", day: "numeric" })} ${hm}`, `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1} ${hm}`, `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1} ${hm}`);
}

/** 가장 가까운 면접 — 한 줄짜리 작은 카드: D-day · 공고 · 일정, 오른쪽 [전날 볼 한 장]. 줄을 누르면 모의 면접으로. */
function DdayCard({ t, item, onPrep }: { t: PlatformT; item: Upcoming; onPrep: () => void }) {
  const d = daysUntil(item.at) ?? 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#edf1fd] py-3 pl-3 pr-2">
      <Link href={V2_ROUTES.interviews} className="flex min-w-0 flex-1 items-center gap-3">
        <span className={`inline-flex h-8 shrink-0 items-center rounded-lg px-2 text-[14px] font-bold text-white ${d <= 1 ? "bg-[color:var(--v2-attention)]" : "bg-[color:var(--v2-accent)]"}`}>{d === 0 ? t("오늘", "Today", "今天", "Hôm nay", "今日", "Hari ini") : `D-${d}`}</span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-[color:var(--v2-ink)]">{item.title}</span>
          <span className="block truncate text-[12px] text-[color:var(--v2-muted)]">{[item.company, whenText(t, item.at)].filter(Boolean).join(" · ")}</span>
        </span>
      </Link>
      <button type="button" onClick={onPrep} className="h-8 shrink-0 whitespace-nowrap rounded-lg bg-white px-2.5 text-[13px] font-semibold text-[color:var(--v2-accent)] transition hover:opacity-90">
        {t("전날 볼 한 장", "Prep sheet", "考前速览", "Ôn tập", "前日の1枚", "Ringkas")}
      </button>
    </div>
  );
}

/** 이번 주 숫자 한 칸 — 저번 주보다 늘면 초록 ▲. */
function WeekStat({ t, label, value, prev, unit }: { t: PlatformT; label: string; value: number; prev?: number; unit?: string }) {
  const diff = prev === undefined ? null : value - prev;
  return (
    <div className="flex min-h-[96px] flex-col justify-between rounded-2xl bg-[color:var(--v2-fill)] p-3.5">
      <span className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{label}</span>
      <span>
        <span className="text-[26px] font-bold tabular-nums leading-none text-[color:var(--v2-ink)]">{value}</span>
        {unit ? <span className="ml-0.5 text-[14px] font-semibold text-[color:var(--v2-muted)]">{unit}</span> : null}
        <span className={`mt-1 block text-[12px] ${diff !== null && diff > 0 ? "font-bold text-[color:var(--v2-good)]" : "text-[color:var(--v2-faint)]"}`}>
          {prev === undefined ? t("이어 가는 중", "and counting", "持续中", "đang tiếp", "継続中", "berlanjut") : diff !== null && diff > 0 ? t(`▲ 지난주보다 ${diff}`, `▲ ${diff} vs last wk`, `▲ 比上周多 ${diff}`, `▲ hơn tuần trước ${diff}`, `▲ 先週より${diff}`, `▲ ${diff} dari lalu`) : t(`지난주 ${prev}`, `Last wk ${prev}`, `上周 ${prev}`, `Tuần trước ${prev}`, `先週 ${prev}`, `Lalu ${prev}`)}
        </span>
      </span>
    </div>
  );
}

/** 처음 온 사람 — 시작 3단계. 단계마다 칸 하나씩 채워지는 막대. */
function StartSteps({ t, steps, done, onMock }: { t: PlatformT; steps: { key: string; done: boolean; title: string; meta: string; href?: string }[]; done: number; onMock: () => void }) {
  return (
    <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t("Aply 시작하기", "Getting started", "开始使用 Aply", "Bắt đầu với Aply", "Aplyをはじめる", "Mulai Aply")}</p>
        <span className="text-[14px] font-bold tabular-nums text-[color:var(--v2-accent)]">{done}/3</span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {steps.map((s) => (
          <span key={s.key} className={`h-1.5 flex-1 rounded-full ${s.done ? "bg-[color:var(--v2-accent)]" : "bg-white"}`} />
        ))}
      </div>
      <ol className="mt-4 flex flex-col gap-2">
        {steps.map((s, i) => {
          const body = (
            <>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${s.done ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>{s.done ? "✓" : i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] font-bold ${s.done ? "text-[color:var(--v2-faint)] line-through" : "text-[color:var(--v2-ink)]"}`}>{s.title}</span>
                {!s.done ? <span className="mt-0.5 block text-[13px] text-[color:var(--v2-muted)]">{s.meta}</span> : null}
              </span>
              {!s.done ? (
                <span className="shrink-0 text-[18px] text-[color:var(--v2-faint)]" aria-hidden>
                  ›
                </span>
              ) : null}
            </>
          );
          const cls = "flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left transition hover:-translate-y-0.5";
          return (
            <li key={s.key}>
              {s.done ? (
                <div className={cls.replace(" transition hover:-translate-y-0.5", "")}>{body}</div>
              ) : s.href ? (
                <Link href={s.href} className={cls}>
                  {body}
                </Link>
              ) : (
                <button type="button" onClick={onMock} className={cls}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** 맨 위 서류 칸 — 이력서·자기소개서. 상태 · 그림 · 이름 · 한 줄, 아래에 [미리보기] [수정하기 ›]. 위쪽은 에디터로. */
function DocTile({ t, kind, resume, cover }: { t: PlatformT; kind: "resume" | "cover"; resume: ResumeDoc | null; cover: CoverDoc | null }) {
  const doc = kind === "resume" ? resume : cover;
  const checks = docChecklist(t, kind, resume, cover);
  const done = checks.filter((c) => c.done).length;
  const ready = !!doc && done === checks.length;
  const written = coverWritten(cover);
  const label = kind === "resume" ? t("이력서", "Resume", "简历", "CV", "履歴書", "CV") : t("자기소개서", "Cover letter", "自我介绍", "Thư GT", "自己紹介書", "Surat");
  const badge = !doc ? t("시작 전", "Not started", "未开始", "Chưa", "未着手", "Belum") : ready ? t("준비됐어요", "Ready", "已就绪", "Sẵn sàng", "準備OK", "Siap") : t("채우는 중", "In progress", "填写中", "Đang điền", "作成中", "Diisi");
  const line = !doc
    ? t("지금 시작해 보세요", "Start now", "现在开始", "Bắt đầu ngay", "始めましょう", "Mulai sekarang")
    : kind === "resume"
      ? ready
        ? t(`항목 ${resume?.items.length ?? 0}개`, `${resume?.items.length ?? 0} items`, `${resume?.items.length ?? 0} 项`, `${resume?.items.length ?? 0} mục`, `${resume?.items.length ?? 0}項目`, `${resume?.items.length ?? 0} item`)
        : t(`필수 ${checks.length}개 중 ${done}개`, `${done}/${checks.length} essentials`, `必填 ${done}/${checks.length}`, `${done}/${checks.length} mục`, `必須 ${done}/${checks.length}`, `${done}/${checks.length} inti`)
      : written.count
        ? t(`문항 ${written.count}개 · ${written.chars.toLocaleString()}자`, `${written.count} answers`, `${written.count} 题 · ${written.chars.toLocaleString()} 字`, `${written.count} câu`, `${written.count}問 · ${written.chars.toLocaleString()}字`, `${written.count} jawaban`)
        : t("아직 쓴 문항이 없어요", "No answers yet", "还没写", "Chưa viết", "まだ未記入", "Belum ada");
  const href = kind === "resume" ? EDITOR.resume : EDITOR.cover;
  return (
    <div className="flex flex-col rounded-3xl bg-[color:var(--v2-band)] p-4 min-[360px]:p-5">
      {/* 왼쪽 배지·이름·한 줄, 오른쪽 일러스트(흰 바탕 그림 → 곱하기 합성으로 카드 색에 녹인다).
          두 칸이라 폭이 좁아 그림은 화면이 넓을수록 키우고, 360px 아래에선 그림을 위로 올린다. */}
      <Link href={href} className="flex flex-1 flex-col-reverse gap-2 min-[360px]:flex-row min-[360px]:items-start">
        <span className="min-w-0 flex-1">
          <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold leading-none ${ready ? "bg-[#e5f6ee] text-[color:var(--v2-good)]" : "bg-white text-[color:var(--v2-muted)]"}`}>{badge}</span>
          <span className="mt-1.5 block truncate whitespace-nowrap text-[16px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[17px]">{label}</span>
          <span className="mt-0.5 block truncate text-[13px] text-[color:var(--v2-ink-3)]">{line}</span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림 */}
        <img src={kind === "resume" ? "/img_resume.webp" : "/img_coverletter.webp"} alt="" aria-hidden className="h-[80px] w-full shrink-0 object-contain mix-blend-multiply min-[360px]:-mr-1 min-[360px]:h-[60px] min-[360px]:w-[48px] min-[400px]:h-[68px] min-[400px]:w-[72px] md:h-[84px] md:w-[112px]" />
      </Link>
      {/* 내 커리어 서류 카드와 같은 버튼(두 칸) — 칸이 좁아 글자 크기·여백만 줄였다. 아주 좁은 폰에선 짧은 이름. */}
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {doc ? (
          <Link href={kind === "resume" ? PREVIEW.resume : PREVIEW.cover} className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-white text-[13px] font-semibold text-[color:var(--v2-ink-2)] transition hover:opacity-90">
            <span className="min-[360px]:hidden">{t("보기", "View", "预览", "Xem", "表示", "Lihat")}</span>
            <span className="hidden min-[360px]:inline">{t("미리보기", "Preview", "预览", "Xem", "プレビュー", "Lihat")}</span>
          </Link>
        ) : (
          <span className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-white text-[13px] font-semibold text-[color:var(--v2-faint)] opacity-60">{t("보기", "View", "预览", "Xem", "表示", "Lihat")}</span>
        )}
        <Link href={href} className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-[color:var(--v2-accent)] text-[13px] font-semibold text-white transition hover:opacity-90">
          <span className="min-[360px]:hidden">{doc ? t("수정", "Edit", "修改", "Sửa", "編集", "Ubah") : t("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")}</span>
          <span className="hidden min-[360px]:inline">{doc ? t("수정하기", "Edit", "修改", "Sửa", "編集", "Ubah") : t("시작하기", "Start", "开始", "Bắt đầu", "始める", "Mulai")}</span>
        </Link>
      </div>
    </div>
  );
}

/** 맨 위 모의 면접 줄 — 연속 기록 · 이번 주 문항 · 최근 단계 · 약한 곳, 오른쪽 [연습하기]. */
function MockTile({ t, streak, week, best, weakest }: { t: PlatformT; streak: number; week: number; best: number | null; weakest: string | null }) {
  return (
    <Link href={V2_ROUTES.interviews} className="mt-2.5 flex min-h-[104px] items-center gap-3 rounded-3xl bg-[color:var(--v2-band)] px-5 py-6 transition hover:-translate-y-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림(흰 바탕 → 곱하기 합성) */}
      <img src="/img_fake_interview.webp" alt="" aria-hidden className="-my-2 -ml-1 h-[48px] w-[60px] shrink-0 object-contain mix-blend-multiply min-[360px]:h-[76px] min-[360px]:w-[100px]" />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate whitespace-nowrap text-[17px] font-bold text-[color:var(--v2-ink)]">{t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi")}</span>
          {best != null ? (
            <span className="hidden min-[440px]:inline-flex">
              <LevelChip t={t} score={best} />
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-[color:var(--v2-ink-3)]">
          {[
            streak > 0 ? t(`🔥 ${streak}일째`, `🔥 ${streak}-day`, `🔥 连续 ${streak} 天`, `🔥 ${streak} ngày`, `🔥 ${streak}日連続`, `🔥 ${streak} hari`) : null,
            t(`이번 주 ${week}문항`, `${week} this week`, `本周 ${week} 题`, `${week} tuần này`, `今週${week}問`, `${week} minggu ini`),
            weakest ? t(`약한 곳 ${weakest}`, `Weak: ${weakest}`, `薄弱：${weakest}`, `Yếu: ${weakest}`, `弱点 ${weakest}`, `Lemah: ${weakest}`) : null
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <span className="inline-flex h-9 shrink-0 items-center rounded-lg bg-[color:var(--v2-good)] px-3.5 text-[14px] font-semibold text-white">{t("연습하기", "Practice", "练习", "Luyện", "練習", "Latihan")}</span>
    </Link>
  );
}
