"use client";

// 모의 면접 — 연습 허브. GNB 탭에서 바로 오는 화면이라, 여기서 연습을 시작할 수 있어야 한다
// (예전엔 기록 목록뿐이라 기록이 없으면 '공고 상세에서 시작하세요'로 다른 화면을 보냈다).
//
// 위에서부터: ① 면접이 잡힌 공고(가장 절실한 순간) ② 연습 시작 — 내 서류로 / 공고로(지원·저장한 공고)
//   ③ 내 면접 약점 ④ 연습 기록(내 서류 연습 + 공고별 기록을 한 목록으로).
// 실제 연습은 기존 팝업(MockGateModal → MockInterviewModal)을 그대로 쓴다 — 공고 상세·내 커리어와 같은 흐름.
// 이 화면 안에서 끝낸다: 공고 찾기도 여기서(검색), 기록을 눌러도 공고 상세로 보내지 않고 그 공고로 다시 연습한다.
import { useEffect, useMemo, useRef, useState } from "react";
import { CaretRight, FileText, Briefcase, MagnifyingGlass } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TLoading, TError, TPageHeader } from "../ui/primitives";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import {
  getMyMockInterviews,
  getMyApplications,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getMyMockInterviewUsage,
  getPublicPositionById,
  getPublicPositionsPage,
  type MockInterviewRecord,
  type MyApplication,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { analyzeMockWeakness, hasWeakArea, WEAK_BELOW, type WeaknessRow } from "../../../lib/talent/mock-weakness";
import { MockInterviewModal } from "../jobs/MockInterviewModal";
import { MockGateModal } from "../jobs/MockGateModal";
import { SelfMockResultModal } from "../jobs/SelfMockResultModal";
import { InterviewPrepSheet } from "../jobs/InterviewPrepSheet";
import { useLanguage } from "../../i18n/LanguageProvider";
import { trackInterviewHubViewed, trackInterviewPrepSheetOpened, trackInterviewStart, type InterviewStartMode } from "../../../lib/analytics";
import { usePlatformT } from "../../../lib/i18n";

type T = ReturnType<typeof usePlatformT>;

const companyOf = (p: PublicPositionListItem) => p.partnerOrganization?.name?.trim() || p.sourceCompanyName?.trim() || "";

/** 면접 날까지 남은 날(오늘 0). 지난 면접은 null. */
function daysUntil(iso: string): number | null {
  const at = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(at);
  day.setHours(0, 0, 0, 0);
  const d = Math.round((day.getTime() - today.getTime()) / 86400000);
  return d >= 0 ? d : null;
}

export function InterviewsScreen() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [records, setRecords] = useState<MockInterviewRecord[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // 시작 후보 — 실패해도 화면은 그대로 둔다(기록·약점은 따로 보인다).
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [positions, setPositions] = useState<PublicPositionListItem[]>([]);

  const selfMock = useSelfMock();
  const weakness = analyzeMockWeakness(selfMock);
  const selfAnswers = (selfMock?.answers ?? []).filter((a) => typeof a.score === "number");
  const selfBest = selfAnswers.length ? Math.max(...selfAnswers.map((a) => a.score as number)) : null;
  const resume = useResumeDoc();
  const cover = useCoverDoc();

  // 연습 팝업 — 공고(item) 또는 내 서류(self).
  const [gate, setGate] = useState<{ item: PublicPositionListItem | null } | null>(null);
  const [practice, setPractice] = useState<{ item: PublicPositionListItem | null } | null>(null);
  const [selfResultOpen, setSelfResultOpen] = useState(false);
  // 면접 전날 볼 한 장 — 면접 잡힌 지원에서 연다.
  const [sheetApp, setSheetApp] = useState<MyApplication | null>(null);
  const [mockLimit, setMockLimit] = useState<{ reached: boolean; limit: number }>({ reached: false, limit: 3 });

  function fetchRecords() {
    getMyMockInterviews()
      .then((list) => {
        setRecords(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  // 다시 시도 — 처음 불러올 때는 이미 'loading' 이라 상태를 다시 바꾸지 않는다.
  function load() {
    setStatus("loading");
    fetchRecords();
  }
  useEffect(() => {
    fetchRecords();
    getMyApplications().then(setApps).catch(() => setApps([]));
    Promise.all([getMyAppliedPositions().catch(() => []), getMyFavoritePositions().catch(() => [])]).then(([applied, saved]) => {
      const seen = new Set<string>();
      setPositions([...applied, ...saved].filter((p) => p.status === "OPEN" && !seen.has(p.id) && seen.add(p.id)));
    });
  }, []);

  // 면접이 잡힌(오늘 이후) 지원 — 날짜 가까운 순.
  const upcoming = useMemo(
    () =>
      apps
        .filter((a) => a.status === "INTERVIEW" && a.interviewSelectedAt && daysUntil(a.interviewSelectedAt) !== null)
        .sort((a, b) => new Date(a.interviewSelectedAt!).getTime() - new Date(b.interviewSelectedAt!).getTime()),
    [apps]
  );
  // 공고로 연습 후보 — 면접 잡힌 공고는 위에서 이미 보여 주므로 뺀다.
  const candidates = useMemo(() => {
    const top = new Set(upcoming.map((a) => a.positionId));
    return positions.filter((p) => !top.has(p.id)).slice(0, 5);
  }, [positions, upcoming]);

  const viewedSent = useRef(false);
  useEffect(() => {
    if (status !== "ready" || viewedSent.current) return;
    viewedSent.current = true;
    trackInterviewHubViewed({ upcoming: upcoming.length, candidates: candidates.length, records: (records?.length ?? 0) + (selfAnswers.length ? 1 : 0) });
  }, [status, upcoming.length, candidates.length, records, selfAnswers.length]);

  // 회사 모의 면접 하루 제한 — 공고 게이트를 열 때 확인(공고 상세와 같은 규칙).
  useEffect(() => {
    const item = gate?.item;
    if (!item) return;
    let alive = true;
    getMyMockInterviewUsage()
      .then((u) => {
        if (alive) setMockLimit({ reached: u.companiesUsedToday >= u.dailyCompanyLimit && !u.practicedTodayPositionIds.includes(item.id), limit: u.dailyCompanyLimit });
      })
      .catch(() => {
        if (alive) setMockLimit({ reached: false, limit: 3 });
      });
    return () => {
      alive = false;
    };
  }, [gate]);

  const startJob = (item: PublicPositionListItem, mode: InterviewStartMode) => {
    trackInterviewStart(mode);
    setGate({ item });
  };
  const startUpcoming = async (a: MyApplication) => {
    const known = positions.find((p) => p.id === a.positionId);
    const item = known ?? (await getPublicPositionById(a.positionId, { locale }).catch(() => null));
    if (item) startJob(item, "upcoming");
  };
  // 기록을 누르면 그 공고로 다시 연습 — 공고 상세로 넘어가지 않는다.
  const startRecord = async (positionId: string) => {
    const known = positions.find((p) => p.id === positionId);
    const item = known ?? (await getPublicPositionById(positionId, { locale }).catch(() => null));
    if (item) startJob(item, "job");
  };
  const startSelf = () => {
    trackInterviewStart("self");
    // 이력서·자기소개서가 다 준비됐으면 안내 없이 바로(내 커리어와 같은 규칙).
    if (resumeCompleteness(resume) >= 100 && coverCompleteness(cover) >= 100) setPractice({ item: null });
    else setGate({ item: null });
  };

  return (
    <CareerLayout>
      <div className="flex flex-col gap-8">
        <TPageHeader
          title={t("모의 면접", "Mock interviews", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}
          description={t("면접 볼 공고나 내 서류로 연습하고 AI 피드백을 받아요.", "Practice with a job you're interviewing for or with your own documents, and get AI feedback.", "用要面试的职位或自己的材料练习，并获得 AI 反馈。", "Luyện với tin tuyển dụng sắp phỏng vấn hoặc hồ sơ của bạn, nhận phản hồi AI.", "面接を受ける求人や自分の書類で練習し、AIフィードバックを受けましょう。", "Latihan dengan lowongan yang akan diwawancara atau dokumenmu, dapat masukan AI.")}
        />

        {/* 면접 잡힌 공고 — 가장 가까운 하나만 크게, 나머지는 한 줄씩. */}
        {upcoming.length ? (
          <UpcomingCard
            t={t}
            apps={upcoming.slice(0, 3)}
            onStart={(a) => void startUpcoming(a)}
            onSheet={(a) => {
              trackInterviewPrepSheetOpened();
              setSheetApp(a);
            }}
          />
        ) : null}

        {/* 연습하기 — 고를 것들을 카드 하나의 목록으로(블록마다 색·아이콘이 달라 정신없던 것을 정리). */}
        <section className="flex flex-col gap-3">
          <SectionHead t={t} title={t("연습하기", "Practice", "练习", "Luyện tập", "練習する", "Latihan")} />
          <div className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
            <ListRow
              icon={<FileText className="h-[18px] w-[18px]" weight="fill" />}
              title={t("내 서류로 연습", "Practice with my documents", "用我的材料练习", "Luyện từ hồ sơ của tôi", "自分の書類で練習", "Latihan dari dokumenku")}
              sub={t("이력서·자기소개서에서 나올 질문", "Questions from your resume & cover letter", "来自简历和自我介绍的问题", "Câu hỏi từ CV và thư giới thiệu", "履歴書・自己PRから出る質問", "Pertanyaan dari CV & surat lamaran")}
              onClick={startSelf}
            />
            {candidates.length ? (
              <p className="border-t border-[#F2F4F6] px-4 pb-1 pt-3 text-[12px] font-bold text-[#8B95A1]">{t("지원·저장한 공고", "Applied & saved jobs", "已申请·收藏的职位", "Tin đã ứng tuyển & đã lưu", "応募・保存した求人", "Lowongan dilamar & disimpan")}</p>
            ) : null}
            {candidates.map((p, i) => (
              <ListRow
                key={p.id}
                divider={i > 0}
                icon={<Briefcase className="h-[18px] w-[18px]" weight="fill" />}
                title={p.title}
                sub={companyOf(p)}
                onClick={() => startJob(p, "job")}
              />
            ))}
            <JobSearch t={t} locale={locale} openByDefault={false} onPick={(p) => startJob(p, "job")} />
          </div>
        </section>

        {hasWeakArea(weakness) ? <WeaknessCard t={t} rows={weakness} /> : null}

        <section className="flex flex-col gap-3">
          <SectionHead t={t} title={t("연습 기록", "Practice history", "练习记录", "Lịch sử luyện", "練習記録", "Riwayat latihan")} />
          {status === "loading" ? <TLoading /> : null}
          {status === "error" ? <TError onRetry={load} /> : null}
          {status === "ready" ? (
            !selfAnswers.length && !(records?.length ?? 0) ? (
              <p className="rounded-2xl border border-dashed border-[#DCE3F0] px-5 py-6 text-center text-[13px] text-[#8B95A1]">
                {t("아직 연습 기록이 없어요. 위에서 한 문항만 풀어 봐도 여기 쌓여요.", "No practice yet. Answer just one question above and it'll show up here.", "还没有练习记录。在上方回答一道题就会记录在这里。", "Chưa có lịch sử. Trả lời một câu ở trên là sẽ hiện ở đây.", "まだ練習記録がありません。上で1問答えるだけでここに残ります。", "Belum ada riwayat. Jawab satu pertanyaan di atas, akan muncul di sini.")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {selfAnswers.length ? (
                  <ListRow
                    title={t("내 서류로 연습", "Practice with my documents", "用我的材料练习", "Luyện từ hồ sơ của tôi", "自分の書類で練習", "Latihan dari dokumenku")}
                    sub={`${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${selfAnswers.length}${selfMock?.updatedAt ? ` · ${formatRelativeTime(selfMock.updatedAt, undefined, t)}` : ""}`}
                    right={selfBest != null ? <Score t={t} score={selfBest} /> : null}
                    onClick={() => setSelfResultOpen(true)}
                  />
                ) : null}
                {(records ?? []).map((m, i) => (
                  <ListRow
                    key={m.positionId}
                    divider={i > 0 || selfAnswers.length > 0}
                    title={m.positionTitle}
                    sub={`${m.companyName ? `${m.companyName} · ` : ""}${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${m.answeredCount} · ${formatRelativeTime(new Date(m.lastPracticedAt).getTime(), undefined, t)}`}
                    right={m.bestScore != null ? <Score t={t} score={m.bestScore} /> : null}
                    onClick={() => void startRecord(m.positionId)}
                  />
                ))}
              </div>
            )
          ) : null}
        </section>
      </div>

      {gate ? (
        <MockGateModal
          allowWithoutDocs={!!gate.item}
          dailyLimitReached={!!gate.item && mockLimit.reached}
          dailyLimit={mockLimit.limit}
          onClose={() => setGate(null)}
          onConfirm={() => {
            setPractice({ item: gate.item });
            setGate(null);
          }}
        />
      ) : null}
      {practice ? <MockInterviewModal item={practice.item ?? undefined} onClose={() => { setPractice(null); fetchRecords(); }} /> : null}
      {selfResultOpen ? <SelfMockResultModal onClose={() => setSelfResultOpen(false)} /> : null}
      {sheetApp ? (
        <InterviewPrepSheet
          positionId={sheetApp.positionId}
          title={sheetApp.positionTitle}
          company={sheetApp.partnerOrganizationName}
          interviewAt={sheetApp.interviewSelectedAt}
          onPractice={() => {
            const a = sheetApp;
            setSheetApp(null);
            void startUpcoming(a);
          }}
          onClose={() => setSheetApp(null)}
        />
      ) : null}
    </CareerLayout>
  );
}

/** 이 화면 안에서 공고를 찾아 바로 연습 — 포지션 탐색으로 넘어가지 않는다.
 *  검색어가 없으면 최신 공고를, 있으면 검색 결과를 보여 준다(입력 멈춘 뒤 0.3초). */
function JobSearch({ t, locale, openByDefault, onPick }: { t: T; locale: string; openByDefault: boolean; onPick: (p: PublicPositionListItem) => void }) {
  // 사용자가 연/닫은 적이 없으면 openByDefault 를 따른다 — 후보 공고를 불러오기 전엔 '없음'으로 보여
  // 처음 값을 그대로 쥐면 후보가 있어도 검색이 열린 채 남는다.
  const [touched, setTouched] = useState<boolean | null>(null);
  const open = touched ?? openByDefault;
  const setOpen = (v: boolean) => setTouched(v);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicPositionListItem[] | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const timer = setTimeout(() => {
      // 검색어가 없을 땐 몇 개만(최신) — 길게 늘어놓으면 위의 후보가 묻힌다.
      getPublicPositionsPage({ search: query.trim() || undefined, limit: query.trim() ? 8 : 4, locale })
        .then((page) => {
          if (alive) setResults(page.items);
        })
        .catch(() => {
          if (alive) setResults([]);
        });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, query, locale]);

  if (!open) {
    return (
      <ListRow
        icon={<MagnifyingGlass className="h-[18px] w-[18px]" weight="bold" />}
        title={t("다른 공고 찾기", "Find another job", "查找其他职位", "Tìm tin khác", "他の求人を探す", "Cari lowongan lain")}
        onClick={() => setOpen(true)}
      />
    );
  }
  return (
    <div className="border-t border-[#F2F4F6]">
      <div className="px-4 pb-2 pt-3">
        <label className="flex h-11 items-center gap-2 rounded-xl bg-[#F6F8FB] px-3.5 ring-1 ring-transparent focus-within:ring-[#0B46E8]">
          <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#8B95A1]" weight="bold" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("직무나 회사 이름으로 찾기", "Search by role or company", "按职位或公司搜索", "Tìm theo vị trí hoặc công ty", "職種や会社名で探す", "Cari peran atau perusahaan")}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#191F28] outline-none placeholder:text-[14px] placeholder:text-[#B0B8C1] md:text-[14px]"
          />
        </label>
      </div>
      {results === null ? (
        <TLoading />
      ) : results.length === 0 ? (
        <p className="px-4 pb-4 pt-2 text-center text-[12.5px] text-[#8B95A1]">{t("맞는 공고가 없어요. 다른 말로 찾아보세요.", "No matching jobs. Try other words.", "没有匹配的职位，换个词试试。", "Không có tin phù hợp. Thử từ khác.", "該当する求人がありません。別の言葉で探してみてください。", "Tidak ada yang cocok. Coba kata lain.")}</p>
      ) : (
        results.map((p, i) => <ListRow key={p.id} divider={i > 0} title={p.title} sub={companyOf(p)} onClick={() => onPick(p)} />)
      )}
    </div>
  );
}

function SectionHead({ t, title }: { t: T; title: string }) {
  void t;
  return <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>;
}

function Score({ t, score }: { t: T; score: number }) {
  // 색은 낮을 때만 — 나머지는 회색 숫자. 점수마다 색 칩을 달면 목록이 알록달록해진다.
  return (
    <span className={`shrink-0 text-[13px] font-bold tabular-nums ${score < WEAK_BELOW ? "text-[#C77700]" : "text-[#4E5968]"}`}>
      {t(`최고 ${score}점`, `Best ${score}`, `最高 ${score}分`, `Cao nhất ${score}`, `最高 ${score}点`, `Terbaik ${score}`)}
    </span>
  );
}

/** 카드 안 목록 한 줄 — 연습 시작·기록이 같은 모양을 쓴다. */
function ListRow({ icon, title, sub, right, divider = true, onClick }: { icon?: React.ReactNode; title: string; sub?: string; right?: React.ReactNode; divider?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#F8FAFB] ${divider ? "border-t border-[#F2F4F6] first:border-t-0" : ""}`}>
      {icon ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F4F6] text-[#4E5968]">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-[#191F28]">{title}</p>
        {sub ? <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{sub}</p> : null}
      </div>
      {right}
      <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
    </button>
  );
}

/** 면접이 잡힌 지원 — 가장 가까운 것 하나를 크게, 나머지는 한 줄씩. 주황은 D-day 표시에만. */
function UpcomingCard({ t, apps, onStart, onSheet }: { t: T; apps: MyApplication[]; onStart: (a: MyApplication) => void; onSheet: (a: MyApplication) => void }) {
  const dday = (a: MyApplication) => {
    const d = daysUntil(a.interviewSelectedAt!) ?? 0;
    return d === 0 ? t("오늘", "Today", "今天", "Hôm nay", "今日", "Hari ini") : `D-${d}`;
  };
  const [first, ...rest] = apps;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
      <div className="flex items-center gap-3.5 p-4">
        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#FFF3E6] text-[13px] font-black text-[#E8890C]">{dday(first)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("면접 예정", "Upcoming interview", "即将面试", "Sắp phỏng vấn", "面接予定", "Wawancara mendatang")}</p>
          <p className="truncate text-[15px] font-bold text-[#191F28]">{first.positionTitle}</p>
          {first.partnerOrganizationName ? <p className="truncate text-[12.5px] text-[#8B95A1]">{first.partnerOrganizationName}</p> : null}
        </div>
        <button type="button" onClick={() => onStart(first)} className="shrink-0 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
          {t("연습하기", "Practice", "去练习", "Luyện", "練習する", "Latihan")}
        </button>
      </div>
      <button type="button" onClick={() => onSheet(first)} className="flex w-full items-center justify-between border-t border-[#F2F4F6] px-4 py-3 text-left text-[13px] font-semibold text-[#4E5968] transition hover:bg-[#F8FAFB]">
        {t("면접 전날 볼 한 장", "Your night-before sheet", "面试前一晚速览", "Bản ôn trước buổi phỏng vấn", "面接前日に見る1枚", "Lembar malam sebelum wawancara")}
        <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
      </button>
      {rest.map((a) => (
        <button key={a.id} type="button" onClick={() => onStart(a)} className="flex w-full items-center gap-2.5 border-t border-[#F2F4F6] px-4 py-3 text-left transition hover:bg-[#F8FAFB]">
          <span className="shrink-0 text-[12px] font-black text-[#E8890C]">{dday(a)}</span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#333D4B]">{a.positionTitle}</span>
          <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
        </button>
      ))}
    </section>
  );
}

/**
 * 내 면접 약점 — 영역별 평균과 가장 낮았던 질문.
 *
 * 저장된 '약점 레코드'가 아니라 답변 기록에서 그때그때 계산한 값이다. 그래서 다시 연습해
 * 점수가 오르면 저절로 내려간다 — 따로 '해결됨' 표시를 할 필요가 없다.
 */
function WeaknessCard({ t, rows }: { t: ReturnType<typeof usePlatformT>; rows: WeaknessRow[] }) {
  // 처음엔 영역·점수만. 가장 낮았던 질문·고칠 점·안 해 본 영역은 '자세히'에서 — 한 화면에 글이 너무 많았다.
  const [open, setOpen] = useState(false);
  const weak = rows.filter((r) => r.average !== null && r.average < WEAK_BELOW);
  const untouched = rows.filter((r) => r.average === null);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{t("내 면접 약점", "Where you're weakest", "我的面试弱点", "Điểm yếu phỏng vấn", "面接の弱点", "Kelemahan wawancaramu")}</h2>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-[12.5px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]">
          {open ? t("접기", "Hide", "收起", "Thu gọn", "閉じる", "Tutup") : t("자세히", "Details", "详情", "Chi tiết", "詳しく", "Detail")}
        </button>
      </div>
      <div className="rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3.5">
        <ul className="flex flex-col gap-3">
          {weak.map((r) => (
            <li key={r.category}>
              <div className="flex items-center gap-3">
                <span className="w-[88px] shrink-0 truncate text-[13px] font-semibold text-[#333D4B]">{r.label}</span>
                {/* 막대는 보조 표시라 숫자를 읽는 사람에게 중복이 되지 않게 aria-hidden */}
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]" aria-hidden>
                  <div className="h-full rounded-full bg-[#F5B04C]" style={{ width: `${Math.max(4, Math.min(100, r.average ?? 0))}%` }} />
                </div>
                <span className="w-7 shrink-0 text-right text-[13px] font-bold tabular-nums text-[#C77700]">{r.average}</span>
              </div>
              {open && r.worst?.question ? (
                <p className="mt-1.5 break-anywhere text-[12px] leading-[1.6] text-[#6B7684]">
                  <span className="text-[#8B95A1]">{t("가장 낮았던 질문", "Lowest-scoring question", "得分最低的问题", "Câu điểm thấp nhất", "いちばん低かった質問", "Pertanyaan skor terendah")}</span>{" "}
                  「{r.worst.question.slice(0, 40)}」 {r.worst.score}
                  {r.worst.improvement ? <span className="mt-0.5 block text-[#8B95A1]">{r.worst.improvement}</span> : null}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {open ? (
          <p className="mt-3 border-t border-[#F2F4F6] pt-3 text-[12px] leading-relaxed text-[#8B95A1]">
            {t(
              "지금까지 연습한 답변을 영역별로 모은 거예요. 다시 연습해서 점수가 오르면 저절로 내려가요.",
              "Grouped from the answers you've practiced. Practice again and a weak area drops off on its own.",
              "按领域汇总你练习过的回答。再次练习提高分数后会自动消失。",
              "Tổng hợp theo lĩnh vực từ các câu đã luyện. Luyện lại và điểm tăng thì sẽ tự mất.",
              "これまで練習した回答を領域ごとにまとめたものです。練習して点が上がれば自然に消えます。",
              "Dikelompokkan dari jawaban yang sudah kamu latih. Berlatih lagi dan skornya naik, otomatis hilang."
            )}
            {untouched.length ? (
              <span className="mt-1 block text-[#B0B8C1]">
                {t("아직 안 해 본 영역", "Not practiced yet", "尚未练习的领域", "Lĩnh vực chưa luyện", "まだ練習していない領域", "Belum dilatih")}: {untouched.map((r) => r.label).join(" · ")}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
