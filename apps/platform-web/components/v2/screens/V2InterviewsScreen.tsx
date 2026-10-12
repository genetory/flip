"use client";

// v2 모의 면접 — 맨 위에 '지금 연습할 것' 하나(면접 잡힌 공고 우선), 아래로 연습 시작·강점과 약점·기록.
// 점수는 숫자 대신 단계(잘해요·괜찮아요·더 연습)로 — 몇 점이 좋은지 알 수 없어서. 기록은 누르면 지난 답을 다시 본다.
// 실제 연습은 v2 시작 시트(StartSheet) → 모의 면접 세션(InterviewSession), '전날 볼 한 장'은 기존 것을 쓴다.
import { useEffect, useMemo, useRef, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Sheet } from "../sheets";
import { LevelChip, PracticeSheet, type PracticeQuestion } from "../practice";
import { ImportJobSheet, InterviewSetSheet, QuizSheet, SelfIntroSheet, StartSheet } from "../interview-content";
import { importedToPosition, useImportedJobs } from "../../../lib/talent/imported-jobs";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { Button, Empty, Masthead, MastheadSkeleton, Page, Row, RowsSkeleton, Section, SectionSkeleton } from "../ui";
import { companyOf, daysUntil, jobPhotoOf } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import {
  getMyApplications,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getInterviewQuestions,
  getMyMockInterviewAnswers,
  getReportedApplicationIds,
  reportInterviewQuestions,
  type InterviewReportItem,
  getMyMockInterviewUsage,
  getMyMockInterviews,
  getPublicPositionById,
  type MockInterviewAnswer,
  type MockInterviewRecord,
  type MyApplication,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { useSelfMock, practiceStreak } from "../../../lib/talent/self-mock";
import { pickDailyQuestion, questionText, pickDailyExpression, expressionMeaning, kstDay, ALL_QUESTIONS } from "../../../lib/talent/interview-daily";
import { isForeignNationality } from "../../../lib/nationality";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { InterviewSession } from "../interview-session";
import { PrepSheetV2 } from "../prep-sheet";
import { JobSearch, RegisterInterviewSheet } from "../register-interview";
import { useMyInterviews, type MyInterview } from "../../../lib/talent/my-interviews";
import { trackInterviewHubViewed, trackInterviewPrepSheetOpened, trackInterviewStart, type InterviewStartMode } from "../../../lib/analytics";

export function V2InterviewsScreen() {
  return (
    <V2Shell requireAuth>
      <Interviews />
    </V2Shell>
  );
}

function Interviews() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const selfMock = useSelfMock();
  const [records, setRecords] = useState<MockInterviewRecord[] | null>(null);
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [positions, setPositions] = useState<PublicPositionListItem[] | null>(null);
  const [gate, setGate] = useState<{ item: PublicPositionListItem | null } | null>(null);
  const [practice, setPractice] = useState<{ item: PublicPositionListItem | null } | null>(null);
  const [sheetApp, setSheetApp] = useState<Upcoming | null>(null);
  const [register, setRegister] = useState<{ initial: MyInterview | null } | null>(null);
  const [limit, setLimit] = useState({ reached: false, limit: 3 });
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<MockInterviewRecord | "self" | null>(null);
  const [practiceQ, setPracticeQ] = useState<PracticeQuestion | null>(null);
  const [importing, setImporting] = useState(false);
  const [picker, setPicker] = useState<"mine" | "imported" | "search" | null>(null);
  const [tool, setTool] = useState<"set" | "intro" | "quiz" | null>(null);
  const imported = useImportedJobs();
  const mine = useMyInterviews();
  const interests = useJobInterests();
  // 연습 기록 = 서버 기록(Aply·원티드 공고) + 가져온 공고 기록(계정) — 최근 연습순.
  const history: MockInterviewRecord[] | null =
    records === null
      ? null
      : [
          ...records,
          ...imported
            .filter((j) => j.answers?.length)
            .map((j) => ({ positionId: j.id, positionTitle: j.title, companyName: j.company || null, answeredCount: j.answers!.length, bestScore: j.bestScore ?? null, lastPracticedAt: new Date(j.lastPracticedAt ?? j.createdAt).toISOString() }))
        ].sort((a, b) => new Date(b.lastPracticedAt).getTime() - new Date(a.lastPracticedAt).getTime());
  const [now] = useState(() => Date.now()); // 화면을 연 시각 — 오늘의 질문·연속 기록의 기준
  const { user } = useAuthSession();

  const loadRecords = () => getMyMockInterviews().then(setRecords).catch(() => setRecords([]));
  useEffect(() => {
    loadRecords();
    getMyApplications().then(setApps).catch(() => setApps([]));
    Promise.all([getMyAppliedPositions().catch(() => []), getMyFavoritePositions().catch(() => [])]).then(([a, b]) => {
      const seen = new Set<string>();
      setAppliedIds(new Set(a.map((p) => p.id)));
      setPositions([...a, ...b].filter((p) => p.status === "OPEN" && !seen.has(p.id) && seen.add(p.id)));
    });
  }, []);

  // 다가오는 면접 = Aply 지원의 면접 일정 + 내가 직접 등록한 면접(날짜 미정 포함, 지난 건 숨김). 날짜순, 미정은 뒤로.
  const upcoming = useMemo(() => {
    const fromApps: Upcoming[] = (apps ?? [])
      .filter((a) => a.status === "INTERVIEW" && a.interviewSelectedAt && daysUntil(a.interviewSelectedAt) !== null)
      .map((a) => ({ key: a.id, positionId: a.positionId, title: a.positionTitle, company: a.partnerOrganizationName ?? null, at: a.interviewSelectedAt! }));
    const taken = new Set(fromApps.map((u) => u.positionId));
    const fromMine: Upcoming[] = mine
      .filter((m) => !taken.has(m.positionId) && (!m.interviewAt || daysUntil(m.interviewAt) !== null))
      .map((m) => ({ key: m.id, positionId: m.positionId, title: m.title, company: m.company || null, at: m.interviewAt, mine: m }));
    const time = (u: Upcoming) => (u.at ? new Date(u.at).getTime() : Number.MAX_SAFE_INTEGER);
    return [...fromApps, ...fromMine].sort((a, b) => time(a) - time(b));
  }, [apps, mine]);
  const candidates = useMemo(() => {
    const top = new Set(upcoming.map((a) => a.positionId));
    return (positions ?? []).filter((p) => !top.has(p.id)).slice(0, 4);
  }, [positions, upcoming]);
  const selfAnswers = (selfMock?.answers ?? []).filter((a) => typeof a.score === "number");
  const selfBest = selfAnswers.length ? Math.max(...selfAnswers.map((a) => a.score as number)) : null;
  const areas = analyzeMockWeakness(selfMock);
  const tried = areas.filter((r) => r.average !== null);
  const untried = areas.filter((r) => r.average === null && r.category !== "other");
  // 오늘의 질문 · 연속 기록 · 다시 볼 답(‘더 연습’ 받고 3일 지난 답 2개).
  const daily = pickDailyQuestion(user?.id, kstDay(now), jobCategoriesForInterests(interests));
  const { streak, doneToday } = practiceStreak(selfMock, now);
  const prevDaily = (selfMock?.answers ?? []).find((a) => a.question === daily.ko && a.answer.trim()); // 언제든 이 질문에 답한 적이 있으면
  const todayAnswer = prevDaily && kstDay(prevDaily.updatedAt) === kstDay(now) ? prevDaily : undefined;
  const revisit = (selfMock?.answers ?? [])
    .filter((a) => typeof a.score === "number" && (a.score as number) < WEAK_BELOW && now - a.updatedAt >= 3 * 86_400_000)
    .sort((a, b) => a.updatedAt - b.updatedAt)
    .slice(0, 2);
  const openQuestion = (ko: string, category: string) => {
    const q = ALL_QUESTIONS.find((x) => x.ko === ko);
    setPracticeQ({ ko, shown: q ? questionText(t, q) : ko, category });
  };


  const sent = useRef(false);
  useEffect(() => {
    if (records === null || sent.current) return;
    sent.current = true;
    trackInterviewHubViewed({ upcoming: upcoming.length, candidates: candidates.length, records: records.length + (selfAnswers.length ? 1 : 0) });
  }, [records, upcoming.length, candidates.length, selfAnswers.length]);

  // 회사 모의 면접 하루 제한 — 공고 게이트를 열 때(공고 상세와 같은 규칙).
  useEffect(() => {
    const item = gate?.item;
    if (!item) return;
    // 가져온 공고(ext-…)는 회사 하루 제한에 세지 않는다(서버에 연습 기록을 남기지 않음) — 아래 게이트에서 무시.
    if (item.id.startsWith("ext-")) return;
    let alive = true;
    getMyMockInterviewUsage()
      .then((u) => alive && setLimit({ reached: u.companiesUsedToday >= u.dailyCompanyLimit && !u.practicedTodayPositionIds.includes(item.id), limit: u.dailyCompanyLimit }))
      .catch(() => alive && setLimit({ reached: false, limit: 3 }));
    return () => {
      alive = false;
    };
  }, [gate]);

  const startJob = (item: PublicPositionListItem, mode: InterviewStartMode) => {
    trackInterviewStart(mode);
    setGate({ item });
  };
  const startById = async (positionId: string, mode: InterviewStartMode) => {
    const ext = imported.find((j) => j.id === positionId);
    if (ext) return startJob(importedToPosition(ext), mode);
    const item = (positions ?? []).find((p) => p.id === positionId) ?? (await getPublicPositionById(positionId, { locale }).catch(() => null));
    if (item) startJob(item, mode);
  };
  const startSelf = () => {
    trackInterviewStart("self");
    setGate({ item: null }); // 모든 시작은 같은 시작 시트로(팝업 크기를 맞춘다)
  };

  const aplyUpcoming = upcoming.filter((u) => !u.mine);
  const mineUpcoming = upcoming.filter((u) => u.mine);
  const interviewCard = (a: Upcoming, list: Upcoming[]) => {
    const dd = a.at ? daysUntil(a.at) ?? 0 : null;
    const ext = a.positionId.startsWith("ext-") ? imported.find((j) => j.id === a.positionId) : undefined;
    const done = ext ? ext.answers?.length ?? 0 : (records ?? []).find((m) => m.positionId === a.positionId)?.answeredCount ?? 0;
    return (
                <div key={a.key} className={`shrink-0 snap-start rounded-2xl bg-[color:var(--v2-band)] px-5 py-4 ${list.length > 1 ? "w-[290px] md:w-[340px]" : "w-full"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[12px] font-bold ${dd === null ? "bg-white text-[color:var(--v2-muted)]" : dd <= 3 ? "bg-[color:var(--v2-attention)] text-white" : "bg-[color:var(--v2-accent)] text-white"}`}>
                      {dd === null ? t("일정 미정", "No date", "日期未定", "Chưa có ngày", "日程未定", "Belum ada") : dd === 0 ? t("오늘", "Today", "今天", "Hôm nay", "今日", "Hari ini") : `D-${dd}`}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[color:var(--v2-ink-3)]">{a.at ? whenText(t, a.at) : ""}</span>
                    {a.mine ? (
                      <button type="button" onClick={() => setRegister({ initial: a.mine! })} className="shrink-0 text-[13px] font-semibold text-[color:var(--v2-faint)] hover:text-[color:var(--v2-ink-3)]">
                        {t("수정", "Edit", "编辑", "Sửa", "編集", "Ubah")}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-[17px] font-bold text-[color:var(--v2-ink)]">{a.title}</p>
                  <p className="mt-0.5 truncate text-[14px] text-[color:var(--v2-muted)]">
                    {[a.company, done ? t(`${done}문항 연습함`, `${done} practiced`, `已练 ${done} 题`, `Đã luyện ${done}`, `${done}問練習済み`, `${done} dilatih`) : t("아직 연습 전", "Not practiced yet", "尚未练习", "Chưa luyện", "まだ練習していません", "Belum latihan")].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => void startById(a.positionId, "upcoming")}>
                      {t("이 공고로 연습", "Practice for it", "用此职位练习", "Luyện cho tin này", "この求人で練習", "Latihan")}
                    </Button>
                    <Button
                      size="sm"
                      variant="white"
                      onClick={() => {
                        trackInterviewPrepSheetOpened();
                        setSheetApp(a);
                      }}
                    >
                      {t("전날 볼 한 장", "Night-before sheet", "考前速览", "Bản ôn tập", "前日の1枚", "Lembar ringkas")}
                    </Button>
                  </div>
                </div>
    );
  };

  // 맨 위 한 가지는 지원(면접 일정)을 읽어야 정해진다 — 그 전엔 화면 모양만.
  if (apps === null)
    return (
      <Page>
        <MastheadSkeleton />
        <SectionSkeleton />
        <SectionSkeleton thumb={false} />
      </Page>
    );

  return (
    <Page>
      <Masthead
        eyebrow={t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}
        title={streak > 1 ? t(`${streak}일째 연습 중이에요 🔥`, `${streak}-day practice streak 🔥`, `已连续练习 ${streak} 天 🔥`, `Đã luyện ${streak} ngày liên tiếp 🔥`, `${streak}日連続で練習中 🔥`, `${streak} hari berturut-turut 🔥`) : t("면접, 미리 연습해 두세요", "Practice before the real thing", "提前练习面试吧", "Hãy luyện phỏng vấn trước", "面接を先に練習しておきましょう", "Latih wawancara lebih dulu")}
        lede={t("질문 하나만 답해도 AI가 잘한 점과 고칠 점을 알려 줘요.", "Answer even one question and AI tells you what worked and what to fix.", "只回答一道题，AI 就会指出优点和改进点。", "Chỉ cần trả lời một câu, AI sẽ chỉ ra điểm tốt và cần sửa.", "1問答えるだけで、AIが良い点と直す点を教えます。", "Jawab satu pertanyaan saja, AI beri tahu yang bagus dan yang perlu diperbaiki.")}
      />

      {/* 다가오는 면접 — Aply에서 지원해 잡힌 면접만(있을 때만). 가로로 넘기는 캐러셀, 하나면 꽉 차게 */}
      {aplyUpcoming.length ? (
        <Section title={t("다가오는 면접", "Upcoming interview", "即将到来的面试", "Phỏng vấn sắp tới", "近づく面接", "Wawancara mendatang")}>
          <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {aplyUpcoming.map((a) => interviewCard(a, aplyUpcoming))}
          </div>
        </Section>
      ) : null}

      {/* 내가 등록한 면접 — Aply 밖에서 지원한 곳도 링크·본문·공고 검색으로 등록. 없으면 등록 안내 한 줄 */}
      <Section
        title={t("내가 등록한 면접", "Interviews I added", "我登记的面试", "Phỏng vấn tôi thêm", "登録した面接", "Wawancara yang kutambah")}
        aside={
          mineUpcoming.length ? (
            <button type="button" onClick={() => setRegister({ initial: null })} className="text-[14px] font-semibold text-[color:var(--v2-accent)]">
              {t("+ 등록", "+ Add", "+ 登记", "+ Thêm", "+ 登録", "+ Tambah")}
            </button>
          ) : undefined
        }
      >
        {mineUpcoming.length ? (
          <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {mineUpcoming.map((a) => interviewCard(a, mineUpcoming))}
          </div>
        ) : (
          <button type="button" onClick={() => setRegister({ initial: null })} className="flex w-full items-center gap-3 rounded-2xl bg-[color:var(--v2-band)] px-5 py-4 text-left transition hover:-translate-y-0.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[18px]" aria-hidden>
              🗓️
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-[color:var(--v2-ink)]">{t("면접이 잡혔나요? 등록해 두세요", "Got an interview? Add it", "有面试了吗？登记一下", "Có lịch phỏng vấn? Thêm vào", "面接が決まりましたか？登録を", "Ada wawancara? Tambahkan")}</span>
              <span className="mt-0.5 block text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">{t("Aply 밖에서 지원한 곳도 링크·본문으로 등록하고 맞춤 연습해요", "Even outside Aply — add by link or text and practice", "Aply 以外的也可用链接或内容登记并练习", "Cả ngoài Aply — thêm bằng link/nội dung", "Aply以外もリンク・本文で登録して練習", "Di luar Aply juga — lewat tautan/teks")}</span>
            </span>
            <span className="shrink-0 text-[20px] text-[color:var(--v2-faint)]" aria-hidden>
              ›
            </span>
          </button>
        )}
      </Section>

      {/* 오늘의 질문 */}
        <Section
          title={t("오늘의 질문", "Today's question", "今日问题", "Câu hỏi hôm nay", "今日の質問", "Pertanyaan hari ini")}
          aside={streak > 0 ? <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[13px] font-bold text-[#e8590c]">🔥 {t(`${streak}일째`, `${streak}-day streak`, `连续 ${streak} 天`, `${streak} ngày liên tiếp`, `${streak}日連続`, `${streak} hari beruntun`)}</span> : undefined}
        >
          <div className="flex flex-col gap-3">
        <div className="rounded-3xl bg-[#edf1fd] p-5">
          <span className="text-[13px] font-bold text-[color:var(--v2-accent)]">{mockCategoryLabelOf(t, daily.category)}</span>
          <p className="mt-1.5 text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, daily)}</p>
          {locale !== "ko" ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {daily.ko}</p> : null}
          {/* 예전에 이 질문에 답했다면 — 내 답과 평가를 함께 */}
          {prevDaily ? (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[color:var(--v2-ink-2)]">
                  {t("내 답", "My answer", "我的回答", "Câu trả lời", "自分の回答", "Jawabanku")} <span className="font-medium text-[color:var(--v2-faint)]">· {formatRelativeTime(prevDaily.updatedAt, undefined, t)}</span>
                </span>
                <LevelChip t={t} score={prevDaily.score} />
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{prevDaily.answer}</p>
              {prevDaily.feedback?.improvements?.[0] || prevDaily.feedback?.strengths?.[0] ? (
                <p className={`mt-2 text-[13px] leading-[1.55] ${(prevDaily.score ?? 0) >= 80 ? "text-[color:var(--v2-good)]" : "text-[color:var(--v2-attention)]"}`}>
                  <b>{(prevDaily.score ?? 0) >= 80 ? t("잘한 점", "Good", "优点", "Tốt", "良い点", "Bagus") : t("고칠 점", "Fix", "改进", "Cần sửa", "直す点", "Perbaiki")}</b> · {(prevDaily.score ?? 0) >= 80 ? prevDaily.feedback?.strengths?.[0] : prevDaily.feedback?.improvements?.[0] ?? prevDaily.feedback?.strengths?.[0]}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[14px] text-[color:var(--v2-ink-3)]">
              {todayAnswer
                ? t("오늘 연습 완료 — 고쳐서 한 번 더 해도 좋아요", "Done today — try again to improve", "今日已完成——可以改进后再答", "Hôm nay xong — có thể trả lời lại", "今日は完了 — 直してもう一度も◎", "Selesai — boleh coba lagi")
                : prevDaily
                  ? t("지난 평가를 보고 더 낫게 다시 답해 보세요", "Use the last feedback to answer better", "参考上次评价再答得更好", "Dựa vào nhận xét trước để trả lời tốt hơn", "前回の評価を見てより良く答えよう", "Gunakan umpan balik terakhir")
                  : doneToday
                    ? t("오늘 연습했어요. 이 질문도 해 볼까요?", "You practiced today — try this one too?", "今天已练习，再试试这题？", "Hôm nay đã luyện — thử câu này nhé?", "今日は練習済み。この質問も？", "Sudah latihan hari ini — coba ini juga?")
                    : t("2분이면 돼요. 매일 하나씩 답해 보세요.", "Takes 2 minutes. One a day.", "只需 2 分钟，每天一题。", "Chỉ 2 phút. Mỗi ngày một câu.", "2分でOK。毎日1問。", "Hanya 2 menit. Satu per hari.")}
            </span>
            <Button size="sm" onClick={() => openQuestion(daily.ko, daily.category)}>
              {prevDaily ? t("다시 답하기", "Answer again", "再答一次", "Trả lời lại", "もう一度", "Jawab lagi") : t("답하기", "Answer", "作答", "Trả lời", "答える", "Jawab")}
            </Button>
          </div>
        </div>
          </div>
        </Section>
      {isForeignNationality(user?.nationality) || locale !== "ko" ? (
        <div className="px-5 pt-2">
          <ExpressionCard t={t} />
        </div>
      ) : null}

      <InterviewReportPrompt t={t} apps={apps} />

      {/* ② 연습하기 — 고를 수 있게 카테고리 카드 그리드 */}
      <Section title={t("연습하기", "Practice", "练习", "Luyện tập", "練習する", "Latihan")}>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          <PracticeCard tone="blue" icon="📌" title={t("내 공고로", "My jobs", "我的职位", "Tin của tôi", "自分の求人で", "Lowonganku")} meta={positions === null ? "…" : t(`지원·저장한 공고 ${candidates.length}개`, `${candidates.length} applied/saved`, `投递/收藏 ${candidates.length} 个`, `${candidates.length} tin đã lưu/ứng tuyển`, `応募・保存 ${candidates.length}件`, `${candidates.length} dilamar/disimpan`)} onClick={() => setPicker("mine")} />
          <PracticeCard tone="violet" icon="🔗" title={t("가고 싶은 회사 공고", "Job you want", "想去的公司职位", "Tin công ty mơ ước", "行きたい会社の求人", "Lowongan incaran")} meta={imported.length ? t(`가져온 공고 ${imported.length}개`, `${imported.length} imported`, `已导入 ${imported.length} 个`, `${imported.length} tin đã nhập`, `取り込み ${imported.length}件`, `${imported.length} diimpor`) : t("링크로 가져오기", "Import by link", "通过链接导入", "Nhập bằng link", "リンクで取り込む", "Impor lewat tautan")} onClick={() => (imported.length ? setPicker("imported") : setImporting(true))} />
          <PracticeCard tone="gray" icon="🔍" title={t("Aply 공고 찾기", "Find on Aply", "在 Aply 找职位", "Tìm trên Aply", "Aplyで探す", "Cari di Aply")} meta={t("직무·회사 이름으로", "By role or company", "按职位或公司", "Theo vị trí/công ty", "職種・会社名で", "Peran/perusahaan")} onClick={() => setPicker("search")} />
          <PracticeCard tone="green" icon="📄" title={t("내 서류로", "My documents", "用我的材料", "Từ hồ sơ", "自分の書類で", "Dokumenku")} meta={t("이력서·자소서에서 나올 질문", "From resume & cover letter", "来自简历和自我介绍", "Từ CV & thư", "履歴書・自己PRから", "Dari CV & surat")} onClick={startSelf} />
          <PracticeCard tone="navy" icon="⏱️" title={t("10분 모의 면접", "10-min mock", "10分钟模拟面试", "Phỏng vấn 10 phút", "10分模擬面接", "Simulasi 10 menit")} meta={t("5문항 실전 · 결과 카드", "5 questions · report", "5题实战 · 结果卡", "5 câu · thẻ kết quả", "5問・結果カード", "5 soal · laporan")} onClick={() => setTool("set")} />
          <PracticeCard tone="orange" icon="🎤" title={t("1분 자기소개", "1-min intro", "1分钟自我介绍", "Giới thiệu 1 phút", "1分自己紹介", "Perkenalan 1 menit")} meta={t("초안·시간 재며 연습", "Draft & rehearse", "初稿·计时练习", "Nháp & tập nói", "下書き・時間計測", "Draf & latihan")} onClick={() => setTool("intro")} />
          {isForeignNationality(user?.nationality) === true || locale !== "ko" ? (
            <PracticeCard tone="mint" icon="🙇" title={t("면접 매너 퀴즈", "Etiquette quiz", "面试礼仪测验", "Quiz phép lịch sự", "面接マナークイズ", "Kuis etiket")} meta={t("오늘의 3문제", "3 a day", "今日3题", "3 câu/ngày", "今日の3問", "3 soal/hari")} onClick={() => setTool("quiz")} />
          ) : null}
        </div>
      </Section>

      {/* ③ 내 실력 — 다시 볼 답 + 강점과 약점 */}
      {revisit.length || tried.length ? (
        <Section title={t("내 실력", "My progress", "我的水平", "Năng lực của tôi", "自分の実力", "Kemampuanku")}>
          {revisit.length ? (
            <>
              <p className="pb-1 pt-2 text-[13px] font-bold text-[color:var(--v2-muted)]">{t("다시 볼 답 — 며칠 전 '더 연습'이 나온 답", "Revisit — marked 'practice more' days ago", "再看——几天前被标为'多练习'", "Xem lại — 'luyện thêm' vài ngày trước", "見直し — 数日前『要練習』", "Tinjau — 'latih lagi' beberapa hari lalu")}</p>
          {revisit.map((a) => (
            <Row key={a.question} onClick={() => openQuestion(a.question, a.category)} lead="🔁" title={a.question} meta={formatRelativeTime(a.updatedAt, undefined, t)} right={<LevelChip t={t} score={a.score} />} />
          ))}
            </>
          ) : null}
          {tried.length ? (
            <div className={revisit.length ? "pt-4" : ""}>
              <p className="pb-1 pt-2 text-[13px] font-bold text-[color:var(--v2-muted)]">{t("강점과 약점", "Strengths & gaps", "优势与不足", "Điểm mạnh & yếu", "強みと弱み", "Kekuatan & kekurangan")}</p>
          {tried.map((r) => (
            <Row
              key={r.category}
              onClick={startSelf}
              lead={r.emoji}
              title={mockCategoryLabelOf(t, r.category)}
              meta={(r.average ?? 0) < WEAK_BELOW ? r.worst?.improvement || undefined : t(`${r.answered}개 답했어요`, `${r.answered} answered`, `已回答 ${r.answered} 题`, `Đã trả lời ${r.answered}`, `${r.answered}問回答`, `${r.answered} dijawab`)}
              right={<LevelChip t={t} score={r.average} />}
            />
          ))}
          {untried.length ? (
            <p className="pb-1 pt-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
              {t("아직 안 해 본 질문", "Not tried yet", "尚未练习", "Chưa thử", "まだの質問", "Belum dicoba")} · {untried.map((r) => mockCategoryLabelOf(t, r.category)).join(" · ")}
            </p>
          ) : null}
            </div>
          ) : null}
        </Section>
      ) : null}

      <ReportedQuestions t={t} onPick={(q) => openQuestion(q, "job")} />

      <Section title={t("연습 기록", "History", "练习记录", "Lịch sử", "練習記録", "Riwayat")}>
        {history === null ? <RowsSkeleton count={3} thumb={false} /> : !selfAnswers.length && !history.length ? (
          <Empty>{t("아직 연습 기록이 없어요.", "No practice yet.", "还没有练习记录。", "Chưa có lịch sử.", "まだ練習記録がありません。", "Belum ada riwayat.")}</Empty>
        ) : (
          <>
            {selfAnswers.length ? (
              <Row
                onClick={() => setReview("self")}
                title={t("내 서류로 연습", "With my documents", "用我的材料", "Từ hồ sơ của tôi", "自分の書類で", "Dari dokumenku")}
                meta={`${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${selfAnswers.length}${selfMock?.updatedAt ? ` · ${formatRelativeTime(selfMock.updatedAt, undefined, t)}` : ""}`}
                right={selfBest != null ? <LevelChip t={t} score={selfBest} /> : undefined}
              />
            ) : null}
            {history.map((m) => (
              <Row
                key={m.positionId}
                onClick={() => setReview(m)}
                lead={m.positionId.startsWith("ext-") ? "🔗" : undefined}
                title={m.positionTitle}
                meta={[m.companyName, `${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${m.answeredCount}`, formatRelativeTime(new Date(m.lastPracticedAt).getTime(), undefined, t)].filter(Boolean).join(" · ")}
                right={m.bestScore != null ? <LevelChip t={t} score={m.bestScore} /> : undefined}
              />
            ))}
          </>
        )}
      </Section>

      {gate ? (
        <StartSheet
          title={gate.item ? [companyOf(gate.item), gate.item.title].filter(Boolean).join(" · ") : t("내 서류로 연습", "With my documents", "用我的材料", "Từ hồ sơ của tôi", "自分の書類で", "Dari dokumenku")}
          allowWithoutDocs={!!gate.item}
          dailyLimitReached={!!gate.item && !gate.item.id.startsWith("ext-") && limit.reached}
          dailyLimit={limit.limit}
          onClose={() => setGate(null)}
          onConfirm={() => {
            setPractice({ item: gate.item });
            setGate(null);
          }}
        />
      ) : null}
      {practice ? (
        <InterviewSession
          item={practice.item ?? undefined}
          onClose={() => {
            setPractice(null);
            loadRecords();
          }}
        />
      ) : null}
      {practiceQ ? <PracticeSheet question={practiceQ} onClose={() => setPracticeQ(null)} /> : null}
      {picker ? (
        <Sheet
          tall
          title={picker === "mine" ? t("내 공고로 연습", "Practice for my jobs", "用我的职位练习", "Luyện theo tin của tôi", "自分の求人で練習", "Latihan lowonganku") : picker === "imported" ? t("가고 싶은 회사 공고", "Jobs you want", "想去的公司职位", "Tin công ty mơ ước", "行きたい会社の求人", "Lowongan incaran") : t("Aply 공고 찾기", "Find on Aply", "在 Aply 找职位", "Tìm trên Aply", "Aplyで探す", "Cari di Aply")}
          onClose={() => setPicker(null)}
        >
          {picker === "mine" ? (
            candidates.length ? (
              <div>
        {candidates.map((p) => {
          // 왜 이 공고인지 — 지원한 공고 / 저장한 공고(마감이 가까우면 D-n).
          const dd = p.sourceDeadlineDate && !p.sourceDeadlineRolling ? daysUntil(p.sourceDeadlineDate) : null;
          const why = appliedIds.has(p.id)
            ? t("지원한 공고", "Applied", "已投递", "Đã ứng tuyển", "応募済み", "Dilamar")
            : dd !== null && dd >= 0 && dd <= 7
              ? t(`저장한 공고 · ${dd === 0 ? "오늘" : `D-${dd}`} 마감`, `Saved · closes ${dd === 0 ? "today" : `D-${dd}`}`, `已收藏 · ${dd === 0 ? "今天" : `D-${dd}`}截止`, `Đã lưu · hết hạn ${dd === 0 ? "hôm nay" : `D-${dd}`}`, `保存済み · ${dd === 0 ? "今日" : `D-${dd}`}締切`, `Disimpan · tutup ${dd === 0 ? "hari ini" : `D-${dd}`}`)
              : t("저장한 공고", "Saved", "已收藏", "Đã lưu", "保存済み", "Disimpan");
          return <Row key={p.id} onClick={() => { setPicker(null); startJob(p, "job"); }} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={[companyOf(p), why].filter(Boolean).join(" · ") || undefined} />;
        })}
              </div>
            ) : (
              <Empty>{t("지원하거나 저장한 공고가 없어요. 포지션 탐색에서 저장해 보세요.", "No applied or saved jobs yet.", "还没有投递或收藏的职位。", "Chưa có tin đã lưu/ứng tuyển.", "応募・保存した求人がありません。", "Belum ada lowongan.")}</Empty>
            )
          ) : picker === "imported" ? (
            <div>
              <Row onClick={() => { setPicker(null); setImporting(true); }} lead="➕" title={t("공고 가져오기", "Import a job", "导入职位", "Nhập tin", "求人を取り込む", "Impor lowongan")} meta={t("링크나 공고 내용으로", "By link or pasted text", "通过链接或内容", "Bằng link hoặc nội dung", "リンクか本文で", "Lewat tautan atau teks")} />
              {imported.map((j) => (
                <Row key={j.id} onClick={() => { setPicker(null); startJob(importedToPosition(j), "job"); }} lead="🔗" title={j.title} meta={[j.company, j.answers?.length ? t(`${j.answers.length}문항 연습함`, `${j.answers.length} practiced`, `已练 ${j.answers.length} 题`, `Đã luyện ${j.answers.length}`, `${j.answers.length}問練習済み`, `${j.answers.length} dilatih`) : t("아직 연습 전", "Not practiced", "尚未练习", "Chưa luyện", "未練習", "Belum")].filter(Boolean).join(" · ")} right={j.bestScore != null && j.answers?.length ? <LevelChip t={t} score={j.bestScore} /> : undefined} />
              ))}
            </div>
          ) : (
            <JobSearch onPick={(p) => { setPicker(null); startJob(p, "job"); }} />
          )}
        </Sheet>
      ) : null}
      {tool === "set" ? <InterviewSetSheet onClose={() => setTool(null)} /> : null}
      {tool === "intro" ? <SelfIntroSheet onClose={() => setTool(null)} /> : null}
      {tool === "quiz" ? <QuizSheet onClose={() => setTool(null)} /> : null}
      {importing ? (
        <ImportJobSheet
          onClose={() => setImporting(false)}
          onStart={(item) => {
            setImporting(false);
            startJob(item, "job");
          }}
        />
      ) : null}
      {review ? (
        <ReviewSheet
          t={t}
          record={review}
          selfAnswers={selfMock?.answers ?? []}
          extAnswers={review !== "self" ? imported.find((j) => j.id === review.positionId)?.answers : undefined}
          onClose={() => setReview(null)}
          onRetry={() => {
            const r = review;
            setReview(null);
            if (r === "self") startSelf();
            else void startById(r.positionId, "job");
          }}
        />
      ) : null}
      {register ? (
        <RegisterInterviewSheet
          initial={register.initial}
          positions={positions}
          onClose={() => setRegister(null)}
          onSaved={() => setRegister(null)}
        />
      ) : null}
      {sheetApp ? (
        <PrepSheetV2
          positionId={sheetApp.positionId}
          title={sheetApp.title}
          company={sheetApp.company}
          interviewAt={sheetApp.at}
          onPractice={() => {
            const a = sheetApp;
            setSheetApp(null);
            void startById(a.positionId, "upcoming");
          }}
          onClose={() => setSheetApp(null)}
        />
      ) : null}
    </Page>
  );
}

type Upcoming = { key: string; positionId: string; title: string; company: string | null; at: string | null; mine?: MyInterview };

type SelfAnswer = { question: string; category: string; answer: string; score: number | null; feedback?: { strengths: string[]; improvements: string[] } | null };

/** 기록 다시 보기 — 지난 답과 단계(내 서류 연습은 AI 피드백까지). [다시 연습]은 여기서. */
function ReviewSheet({ t, record, selfAnswers, extAnswers, onClose, onRetry }: { t: PlatformT; record: MockInterviewRecord | "self"; selfAnswers: SelfAnswer[]; extAnswers?: MockInterviewAnswer[]; onClose: () => void; onRetry: () => void }) {
  const isSelf = record === "self";
  const [fetched, setAnswers] = useState<MockInterviewAnswer[] | null>(null);
  const answers = extAnswers ?? fetched; // 가져온 공고는 계정에 저장된 기록을 그대로
  const [error, setError] = useState(false);
  useEffect(() => {
    if (isSelf || extAnswers) return;
    let alive = true;
    getMyMockInterviewAnswers(record.positionId)
      .then((a) => alive && setAnswers(a))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [isSelf, record, extAnswers]);
  const list: SelfAnswer[] = isSelf ? selfAnswers.filter((a) => a.answer.trim()) : (answers ?? []).map((a) => ({ ...a, category: "" }));

  return (
    <Sheet
      tall
      title={isSelf ? t("내 서류로 연습", "With my documents", "用我的材料", "Từ hồ sơ của tôi", "自分の書類で", "Dari dokumenku") : record.positionTitle}
      subtitle={isSelf ? t("지난 답과 AI 피드백", "Past answers & AI feedback", "过往回答与 AI 反馈", "Câu trả lời & phản hồi AI", "過去の回答とAIフィードバック", "Jawaban & umpan balik AI") : [record.companyName, t("지난 답", "Past answers", "过往回答", "Câu trả lời trước", "過去の回答", "Jawaban sebelumnya")].filter(Boolean).join(" · ")}
      onClose={onClose}
      footer={
        <Button full onClick={onRetry}>
          {t("다시 연습하기", "Practice again", "再练习", "Luyện lại", "もう一度練習", "Latihan lagi")}
        </Button>
      }
    >
      {!isSelf && answers === null && !error ? (
        <RowsSkeleton count={3} thumb={false} />
      ) : error ? (
        <p className="py-10 text-center text-[15px] text-[color:var(--v2-attention)]">{t("기록을 불러오지 못했어요.", "Couldn't load.", "无法加载。", "Không tải được.", "読み込めませんでした。", "Gagal memuat.")}</p>
      ) : !list.length ? (
        <p className="py-10 text-center text-[15px] text-[color:var(--v2-muted)]">{t("저장된 답이 없어요.", "No saved answers.", "没有保存的回答。", "Không có câu trả lời.", "保存された回答がありません。", "Tidak ada jawaban.")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {list.map((a, i) => (
            <li key={i} className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">
                  Q{i + 1}. {a.question}
                </p>
                <LevelChip t={t} score={a.score} />
              </div>
              <p className="mt-2 whitespace-pre-wrap border-l-2 border-[color:var(--v2-line)] pl-3 text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">{a.answer}</p>
              {a.feedback?.strengths?.length ? (
                <p className="mt-2.5 text-[13px] leading-[1.6] text-[color:var(--v2-good)]">
                  <b>{t("잘한 점", "Good", "优点", "Tốt", "良い点", "Bagus")}</b> · {a.feedback.strengths.filter(Boolean).slice(0, 2).join(" / ")}
                </p>
              ) : null}
              {a.feedback?.improvements?.length ? (
                <p className="mt-1 text-[13px] leading-[1.6] text-[color:var(--v2-attention)]">
                  <b>{t("고칠 점", "Fix", "改进", "Cần sửa", "直す点", "Perbaiki")}</b> · {a.feedback.improvements.filter(Boolean).slice(0, 2).join(" / ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}

/** 오늘의 한국어 면접 표현 — 외국인 지원자(국적 외국 또는 한국어가 아닌 화면)에게만. */
function ExpressionCard({ t }: { t: PlatformT }) {
  const e = pickDailyExpression();
  return (
    <div className="mt-3 rounded-2xl bg-[color:var(--v2-band)] p-5">
      <p className="text-[13px] font-bold text-[color:var(--v2-muted)]">{t("오늘의 한국어 면접 표현", "Korean interview phrase", "今日韩语面试表达", "Câu tiếng Hàn phỏng vấn", "今日の韓国語面接表現", "Frasa wawancara Korea")}</p>
      <p className="mt-1.5 text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{e.ko}</p>
      {expressionMeaning(t, e) !== e.ko ? <p className="mt-0.5 text-[14px] text-[color:var(--v2-ink-3)]">{expressionMeaning(t, e)}</p> : null}
      <p className="mt-3 border-l-2 border-[color:var(--v2-line)] pl-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{e.example}</p>
    </div>
  );
}

/** 면접 후기 묻기 — 면접 날이 지난(14일 안) 지원 건 중 아직 후기를 안 남긴 것 하나. 나온 질문을 한 줄에 하나씩. */
function InterviewReportPrompt({ t, apps }: { t: PlatformT; apps: MyApplication[] }) {
  const [reported, setReported] = useState<string[] | null>(null);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  useEffect(() => {
    let alive = true;
    getReportedApplicationIds()
      .then((ids) => alive && setReported(ids))
      .catch(() => alive && setReported([]));
    return () => {
      alive = false;
    };
  }, []);
  if (reported === null) return null;
  const target = apps.find((a) => {
    if (!a.interviewSelectedAt || reported.includes(a.id)) return false;
    const d = daysUntil(a.interviewSelectedAt);
    return d !== null && d < 0 && d >= -14;
  });
  if (!target && state !== "done") return null;
  const submit = () => {
    if (!target) return;
    const questions = text.split("\n").map((x) => x.trim()).filter((x) => x.length >= 4).slice(0, 5);
    if (!questions.length) return;
    setState("saving");
    reportInterviewQuestions(target.id, questions)
      .then(() => setState("done"))
      .catch(() => setState("error"));
  };
  return (
    <Section title={t("면접 어땠어요?", "How was your interview?", "面试怎么样？", "Phỏng vấn thế nào?", "面接はどうでしたか？", "Bagaimana wawancaranya?")}>
      {state === "done" ? (
        <p className="pb-2 text-[15px] font-semibold text-[color:var(--v2-good)]">{t("고마워요! 남긴 질문은 같은 회사에 지원하는 사람들의 연습 질문이 돼요.", "Thanks! Your questions help others applying to this company.", "谢谢！你的问题将帮助申请同一公司的人练习。", "Cảm ơn! Câu hỏi sẽ giúp người ứng tuyển cùng công ty.", "ありがとう！同じ会社を受ける人の練習質問になります。", "Terima kasih! Ini membantu pelamar lain.")}</p>
      ) : (
        <div className="pb-2">
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {t(`${target!.partnerOrganizationName ?? ""} ${target!.positionTitle} 면접에서 나온 질문을 한 줄에 하나씩 남겨 주세요. 이름 없이 같은 회사 지원자들의 연습 질문이 돼요.`, `Share the questions from your ${target!.positionTitle} interview at ${target!.partnerOrganizationName ?? ""}, one per line. They're shared anonymously as practice questions.`, `请逐行写下 ${target!.partnerOrganizationName ?? ""} ${target!.positionTitle} 面试中的问题，将匿名作为练习题。`, `Ghi các câu hỏi trong buổi phỏng vấn ${target!.positionTitle} tại ${target!.partnerOrganizationName ?? ""}, mỗi dòng một câu.`, `${target!.partnerOrganizationName ?? ""} ${target!.positionTitle}の面接で出た質問を1行に1つずつ。匿名で練習質問になります。`, `Tulis pertanyaan wawancara ${target!.positionTitle} di ${target!.partnerOrganizationName ?? ""}, satu per baris.`)}
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={t("예) 우리 회사 서비스를 써 본 적 있나요?", "e.g. Have you used our service?", "例）用过我们的服务吗？", "VD: Bạn đã dùng dịch vụ của chúng tôi chưa?", "例）当社のサービスを使ったことは？", "mis. Pernah pakai layanan kami?")} className="mt-3 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[15px] leading-[1.6] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2" />
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" onClick={submit} disabled={state === "saving" || !text.trim()}>
              {t("남기기", "Share", "提交", "Gửi", "送る", "Kirim")}
            </Button>
            {state === "error" ? <span className="text-[13px] text-[color:var(--v2-attention)]">{t("저장하지 못했어요.", "Couldn't save.", "保存失败。", "Không lưu được.", "保存できませんでした。", "Gagal menyimpan.")}</span> : null}
          </div>
        </div>
      )}
    </Section>
  );
}

/** 실제 면접에서 나온 질문 — 최근에 올라온 것 + 많이 나온 것. 누르면 그 질문으로 연습. */
function ReportedQuestions({ t, onPick }: { t: PlatformT; onPick: (question: string) => void }) {
  const [data, setData] = useState<{ items: InterviewReportItem[]; popular: { question: string; count: number }[] } | null>(null);
  useEffect(() => {
    let alive = true;
    getInterviewQuestions({ limit: 5 })
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ items: [], popular: [] }));
    return () => {
      alive = false;
    };
  }, []);
  if (!data || (!data.items.length && !data.popular.length)) return null;
  return (
    <Section title={t("실제 면접에서 나온 질문", "Real interview questions", "真实面试题", "Câu hỏi phỏng vấn thật", "実際の面接質問", "Pertanyaan wawancara nyata")}>
      <p className="pb-1 text-[14px] text-[color:var(--v2-muted)]">{t("면접을 본 사람들이 남긴 질문이에요. 눌러서 바로 연습해 보세요.", "Shared by people who interviewed. Tap to practice.", "来自面试过的人。点击练习。", "Do người đã phỏng vấn chia sẻ. Chạm để luyện.", "面接を受けた人の共有です。押して練習。", "Dibagikan peserta wawancara. Ketuk untuk latihan.")}</p>
      {data.popular.map((p) => (
        <Row key={`p-${p.question}`} onClick={() => onPick(p.question)} lead="🔥" title={p.question} meta={t(`${p.count}명이 받은 질문`, `Asked ${p.count} times`, `${p.count} 人被问到`, `${p.count} người được hỏi`, `${p.count}人が受けた質問`, `Ditanyakan ${p.count} kali`)} />
      ))}
      {data.items.map((q) => (
        <Row key={q.id} onClick={() => onPick(q.question)} lead="💬" title={q.question} meta={`${q.organizationName} · ${q.positionTitle}`} />
      ))}
    </Section>
  );
}

/** 면접 일시 — "10월 14일(화) 14:00". */
function whenText(t: PlatformT, iso: string): string {
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return t(`${d.getMonth() + 1}월 ${d.getDate()}일(${wd}) ${hm}`, `${d.toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" })} ${hm}`, `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1} ${hm}`, `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1} ${hm}`);
}

const TONES = {
  blue: "bg-[#edf1fd] text-[color:var(--v2-ink)]",
  violet: "bg-[#f3eeff] text-[color:var(--v2-ink)]",
  gray: "bg-[color:var(--v2-band)] text-[color:var(--v2-ink)]",
  green: "bg-[#e8f8f1] text-[color:var(--v2-ink)]",
  navy: "bg-[#fff0f3] text-[color:var(--v2-ink)]",
  orange: "bg-[#fff4e8] text-[color:var(--v2-ink)]",
  mint: "bg-[#e6f7f4] text-[color:var(--v2-ink)]"
} as const;

/** 연습하기 카드 — 카테고리마다 색이 다른 정사각형에 가까운 카드. */
function PracticeCard({ tone, icon, title, meta, onClick }: { tone: keyof typeof TONES; icon: string; title: string; meta: string; onClick: () => void }) {
  const dark = false; // 모든 카드는 같은 결(연한 색 바탕)
  return (
    <button type="button" onClick={onClick} className={`group flex min-h-[128px] flex-col justify-between rounded-3xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:min-h-[140px] md:p-5 ${TONES[tone]}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-[20px] ${dark ? "bg-white/15" : "bg-white"}`} aria-hidden>
        {icon}
      </span>
      <span className="mt-3 block">
        <span className="block text-[16px] font-bold leading-[1.35]">{title}</span>
        <span className={`mt-0.5 block text-[13px] leading-[1.45] ${dark ? "text-white/75" : "text-[color:var(--v2-muted)]"}`}>{meta}</span>
      </span>
    </button>
  );
}
