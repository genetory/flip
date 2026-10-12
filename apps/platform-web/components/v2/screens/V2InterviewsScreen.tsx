"use client";

// v2 모의 면접 — 맨 위에 '지금 연습할 것' 하나(면접 잡힌 공고 우선), 아래로 연습 시작·강점과 약점·기록.
// 점수는 숫자 대신 단계(잘해요·괜찮아요·더 연습)로 — 몇 점이 좋은지 알 수 없어서. 기록은 누르면 지난 답을 다시 본다.
// 실제 연습은 기존 팝업(MockGateModal → MockInterviewModal)과 '전날 볼 한 장'을 그대로 쓴다.
import { useEffect, useMemo, useRef, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Sheet } from "../sheets";
import { Actions, Attention, Button, Empty, Masthead, MastheadSkeleton, Page, PrimaryButton, Row, RowsSkeleton, SearchField, Section, SectionSkeleton, SecondaryButton } from "../ui";
import { companyOf, daysUntil, jobPhotoOf } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import {
  getMyApplications,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getMyMockInterviewAnswers,
  getMyMockInterviewUsage,
  getMyMockInterviews,
  getPublicPositionById,
  getPublicPositionsPage,
  type MockInterviewAnswer,
  type MockInterviewRecord,
  type MyApplication,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { MockGateModal } from "../../talent/jobs/MockGateModal";
import { MockInterviewModal } from "../../talent/jobs/MockInterviewModal";
import { InterviewPrepSheet } from "../../talent/jobs/InterviewPrepSheet";
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
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const [records, setRecords] = useState<MockInterviewRecord[] | null>(null);
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [positions, setPositions] = useState<PublicPositionListItem[] | null>(null);
  const [gate, setGate] = useState<{ item: PublicPositionListItem | null } | null>(null);
  const [practice, setPractice] = useState<{ item: PublicPositionListItem | null } | null>(null);
  const [sheetApp, setSheetApp] = useState<MyApplication | null>(null);
  const [limit, setLimit] = useState({ reached: false, limit: 3 });
  const [searching, setSearching] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<MockInterviewRecord | "self" | null>(null);

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

  const upcoming = useMemo(
    () =>
      (apps ?? [])
        .filter((a) => a.status === "INTERVIEW" && a.interviewSelectedAt && daysUntil(a.interviewSelectedAt) !== null)
        .sort((a, b) => new Date(a.interviewSelectedAt!).getTime() - new Date(b.interviewSelectedAt!).getTime()),
    [apps]
  );
  const candidates = useMemo(() => {
    const top = new Set(upcoming.map((a) => a.positionId));
    return (positions ?? []).filter((p) => !top.has(p.id)).slice(0, 4);
  }, [positions, upcoming]);
  const selfAnswers = (selfMock?.answers ?? []).filter((a) => typeof a.score === "number");
  const selfBest = selfAnswers.length ? Math.max(...selfAnswers.map((a) => a.score as number)) : null;
  const areas = analyzeMockWeakness(selfMock);
  const tried = areas.filter((r) => r.average !== null);
  const untried = areas.filter((r) => r.average === null && r.category !== "other");

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
    const item = (positions ?? []).find((p) => p.id === positionId) ?? (await getPublicPositionById(positionId, { locale }).catch(() => null));
    if (item) startJob(item, mode);
  };
  const startSelf = () => {
    trackInterviewStart("self");
    if (resumeCompleteness(resume) >= 100 && coverCompleteness(cover) >= 100) setPractice({ item: null });
    else setGate({ item: null });
  };

  const next = upcoming[0] ?? null;

  // 맨 위 한 가지는 지원(면접 일정)을 읽어야 정해진다 — 그 전엔 화면 모양만.
  if (apps === null)
    return (
      <Page>
        <MastheadSkeleton />
        <SectionSkeleton />
        <SectionSkeleton thumb={false} />
      </Page>
    );
  const d = next ? daysUntil(next.interviewSelectedAt!) ?? 0 : 0;

  return (
    <Page>
      {next ? (
        <Masthead
          eyebrow={[next.partnerOrganizationName, next.positionTitle].filter(Boolean).join(" · ")}
          title={d === 0 ? t("오늘 면접이에요", "Your interview is today", "今天面试", "Hôm nay phỏng vấn", "今日が面接です", "Hari ini wawancara") : t(`면접까지 ${d}일 남았어요`, `${d} days until your interview`, `距离面试还有 ${d} 天`, `Còn ${d} ngày đến phỏng vấn`, `面接まであと${d}日`, `${d} hari lagi wawancara`)}
          lede={t("나올 만한 질문을 미리 풀어 두면 당일에 당황하지 않아요.", "Practice the likely questions now so you stay calm on the day.", "提前练习可能的问题，当天就不会慌。", "Luyện trước câu hỏi có thể gặp để không bối rối hôm đó.", "出そうな質問を先に練習しておけば当日あわてません。", "Latih pertanyaan yang mungkin muncul agar tenang di hari H.")}
          action={
            <Actions>
              <PrimaryButton onClick={() => void startById(next.positionId, "upcoming")}>{t("이 공고로 연습하기", "Practice for this job", "用此职位练习", "Luyện cho tin này", "この求人で練習", "Latihan untuk lowongan ini")}</PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  trackInterviewPrepSheetOpened();
                  setSheetApp(next);
                }}
              >
                {t("면접 전날 볼 한 장", "Night-before sheet", "考前速览", "Bản ôn tập", "前日に見る1枚", "Lembar ringkas")}
              </SecondaryButton>
            </Actions>
          }
        />
      ) : (
        <Masthead
          eyebrow={t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}
          title={t("면접, 미리 연습해 두세요", "Practice before the real thing", "提前练习面试吧", "Hãy luyện phỏng vấn trước", "面接を先に練習しておきましょう", "Latih wawancara lebih dulu")}
          lede={t("질문 하나만 답해도 AI가 잘한 점과 고칠 점을 알려 줘요.", "Answer even one question and AI tells you what worked and what to fix.", "只回答一道题，AI 就会指出优点和改进点。", "Chỉ cần trả lời một câu, AI sẽ chỉ ra điểm tốt và cần sửa.", "1問答えるだけで、AIが良い点と直す点を教えます。", "Jawab satu pertanyaan saja, AI beri tahu yang bagus dan yang perlu diperbaiki.")}
          action={<PrimaryButton onClick={startSelf}>{t("내 서류로 연습하기", "Practice with my documents", "用我的材料练习", "Luyện từ hồ sơ", "自分の書類で練習", "Latihan dari dokumenku")}</PrimaryButton>}
        />
      )}

      {upcoming.length > 1 ? (
        <Section title={t("면접 일정", "Interview schedule", "面试日程", "Lịch phỏng vấn", "面接予定", "Jadwal wawancara")}>
          {upcoming.slice(1).map((a) => {
            const dd = daysUntil(a.interviewSelectedAt!) ?? 0;
            return <Row key={a.id} onClick={() => void startById(a.positionId, "upcoming")} title={a.positionTitle} meta={a.partnerOrganizationName ?? undefined} right={<Attention>{dd === 0 ? t("오늘", "Today", "今天", "Hôm nay", "今日", "Hari ini") : `D-${dd}`}</Attention>} />;
          })}
        </Section>
      ) : null}

      <Section title={t("연습하기", "Practice", "练习", "Luyện tập", "練習する", "Latihan")}>
        {next ? <Row onClick={startSelf} lead="📄" title={t("내 서류로 연습", "With my documents", "用我的材料", "Từ hồ sơ của tôi", "自分の書類で", "Dari dokumenku")} meta={t("이력서·자기소개서에서 나올 질문", "Questions from your resume & cover letter", "来自简历和自我介绍的问题", "Câu hỏi từ CV & thư", "履歴書・自己PRから出る質問", "Pertanyaan dari CV & surat")} /> : null}
        {positions === null ? <RowsSkeleton count={2} /> : null}
        {candidates.map((p) => {
          // 왜 이 공고인지 — 지원한 공고 / 저장한 공고(마감이 가까우면 D-n).
          const dd = p.sourceDeadlineDate && !p.sourceDeadlineRolling ? daysUntil(p.sourceDeadlineDate) : null;
          const why = appliedIds.has(p.id)
            ? t("지원한 공고", "Applied", "已投递", "Đã ứng tuyển", "応募済み", "Dilamar")
            : dd !== null && dd >= 0 && dd <= 7
              ? t(`저장한 공고 · ${dd === 0 ? "오늘" : `D-${dd}`} 마감`, `Saved · closes ${dd === 0 ? "today" : `D-${dd}`}`, `已收藏 · ${dd === 0 ? "今天" : `D-${dd}`}截止`, `Đã lưu · hết hạn ${dd === 0 ? "hôm nay" : `D-${dd}`}`, `保存済み · ${dd === 0 ? "今日" : `D-${dd}`}締切`, `Disimpan · tutup ${dd === 0 ? "hari ini" : `D-${dd}`}`)
              : t("저장한 공고", "Saved", "已收藏", "Đã lưu", "保存済み", "Disimpan");
          return <Row key={p.id} onClick={() => startJob(p, "job")} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={[companyOf(p), why].filter(Boolean).join(" · ") || undefined} />;
        })}
        {searching ? (
          <JobSearch onPick={(p) => startJob(p, "job")} />
        ) : (
          <Row onClick={() => setSearching(true)} lead="🔍" title={t("다른 공고 찾기", "Find another job", "查找其他职位", "Tìm tin khác", "他の求人を探す", "Cari lowongan lain")} meta={t("직무나 회사 이름으로", "By role or company", "按职位或公司", "Theo vị trí hoặc công ty", "職種や会社名で", "Berdasarkan peran atau perusahaan")} />
        )}
      </Section>

      {tried.length ? (
        <Section title={t("강점과 약점", "Strengths & gaps", "优势与不足", "Điểm mạnh & yếu", "強みと弱み", "Kekuatan & kekurangan")}>
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
        </Section>
      ) : null}

      <Section title={t("연습 기록", "History", "练习记录", "Lịch sử", "練習記録", "Riwayat")}>
        {records === null ? <RowsSkeleton count={3} thumb={false} /> : !selfAnswers.length && !records.length ? (
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
            {records.map((m) => (
              <Row
                key={m.positionId}
                onClick={() => setReview(m)}
                title={m.positionTitle}
                meta={[m.companyName, `${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${m.answeredCount}`, formatRelativeTime(new Date(m.lastPracticedAt).getTime(), undefined, t)].filter(Boolean).join(" · ")}
                right={m.bestScore != null ? <LevelChip t={t} score={m.bestScore} /> : undefined}
              />
            ))}
          </>
        )}
      </Section>

      {gate ? (
        <MockGateModal
          allowWithoutDocs={!!gate.item}
          dailyLimitReached={!!gate.item && limit.reached}
          dailyLimit={limit.limit}
          onClose={() => setGate(null)}
          onConfirm={() => {
            setPractice({ item: gate.item });
            setGate(null);
          }}
        />
      ) : null}
      {practice ? (
        <MockInterviewModal
          item={practice.item ?? undefined}
          onClose={() => {
            setPractice(null);
            loadRecords();
          }}
        />
      ) : null}
      {review ? (
        <ReviewSheet
          t={t}
          record={review}
          selfAnswers={selfMock?.answers ?? []}
          onClose={() => setReview(null)}
          onRetry={() => {
            const r = review;
            setReview(null);
            if (r === "self") startSelf();
            else void startById(r.positionId, "job");
          }}
        />
      ) : null}
      {sheetApp ? (
        <InterviewPrepSheet
          positionId={sheetApp.positionId}
          title={sheetApp.positionTitle}
          company={sheetApp.partnerOrganizationName}
          interviewAt={sheetApp.interviewSelectedAt}
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

/** 이 화면 안에서 공고 검색 — 포지션 탐색으로 넘어가지 않는다. */
function JobSearch({ onPick }: { onPick: (p: PublicPositionListItem) => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [q, setQ] = useState("");
  // 엔터·[검색]을 눌렀을 때만 찾는다(포지션 탐색과 같은 규칙). 비어 있으면 최신 공고 몇 개.
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<{ for: string; items: PublicPositionListItem[] } | null>(null);
  useEffect(() => {
    let alive = true;
    getPublicPositionsPage({ search: term || undefined, limit: term ? 8 : 4, locale })
      .then((p) => alive && setResult({ for: term, items: p.items }))
      .catch(() => alive && setResult({ for: term, items: [] }));
    return () => {
      alive = false;
    };
  }, [term, locale]);
  // 찾는 동안엔 옛 결과를 흐리게 둔다(스켈레톤으로 갈아끼우면 깜빡인다). 처음에만 스켈레톤.
  const searching = result !== null && result.for !== term;
  const items = result?.items ?? null;
  return (
    <div className="pt-2">
      <SearchField
        autoFocus
        value={q}
        onChange={setQ}
        onSubmit={() => setTerm(q.trim())}
        onClear={() => {
          setQ("");
          setTerm("");
        }}
        busy={searching}
        submitLabel={t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}
        clearLabel={t("지우기", "Clear", "清除", "Xóa", "クリア", "Hapus")}
        placeholder={t("직무나 회사 이름으로 찾기", "Search by role or company", "按职位或公司搜索", "Tìm theo vị trí hoặc công ty", "職種や会社名で探す", "Cari peran atau perusahaan")}
      />
      <div className={`mt-2 transition-opacity duration-200 ${searching ? "pointer-events-none opacity-60" : ""}`} aria-busy={searching}>
        {items === null ? <RowsSkeleton count={3} /> : items.length === 0 ? (
          <Empty>{t("맞는 공고가 없어요.", "No matching jobs.", "没有匹配的职位。", "Không có tin phù hợp.", "該当する求人がありません。", "Tidak ada yang cocok.")}</Empty>
        ) : (
          items.map((p) => <Row key={p.id} onClick={() => onPick(p)} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={companyOf(p) || undefined} />)
        )}
      </div>
    </div>
  );
}

/** 점수 → 단계. 80 이상 잘 쓴 답(mock-weakness 기준), 70 미만은 더 볼 곳. */
function LevelChip({ t, score }: { t: PlatformT; score: number | null | undefined }) {
  if (score == null) return null;
  const lv =
    score >= 80
      ? { text: t("잘해요", "Strong", "很好", "Tốt", "良い", "Bagus"), cls: "bg-[#e5f6ee] text-[color:var(--v2-good)]" }
      : score >= WEAK_BELOW
        ? { text: t("괜찮아요", "Okay", "还行", "Ổn", "まずまず", "Cukup"), cls: "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" }
        : { text: t("더 연습", "Practice more", "多练习", "Luyện thêm", "要練習", "Latih lagi"), cls: "bg-[#fdeced] text-[color:var(--v2-attention)]" };
  return <span className={`inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-[13px] font-bold ${lv.cls}`}>{lv.text}</span>;
}

type SelfAnswer = { question: string; category: string; answer: string; score: number | null; feedback?: { strengths: string[]; improvements: string[] } | null };

/** 기록 다시 보기 — 지난 답과 단계(내 서류 연습은 AI 피드백까지). [다시 연습]은 여기서. */
function ReviewSheet({ t, record, selfAnswers, onClose, onRetry }: { t: PlatformT; record: MockInterviewRecord | "self"; selfAnswers: SelfAnswer[]; onClose: () => void; onRetry: () => void }) {
  const isSelf = record === "self";
  const [answers, setAnswers] = useState<MockInterviewAnswer[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (isSelf) return;
    let alive = true;
    getMyMockInterviewAnswers(record.positionId)
      .then((a) => alive && setAnswers(a))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [isSelf, record]);
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
