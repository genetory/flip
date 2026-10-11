"use client";

// v2 모의 면접 — 맨 위에 '지금 연습할 것' 하나(면접 잡힌 공고 우선), 아래로 연습 시작·약점·기록.
// 실제 연습은 기존 팝업(MockGateModal → MockInterviewModal)과 '전날 볼 한 장'을 그대로 쓴다.
import { useEffect, useMemo, useRef, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Actions, Attention, Empty, Masthead, MastheadSkeleton, Page, PrimaryButton, Row, RowsSkeleton, SearchField, Section, SectionSkeleton, SecondaryButton } from "../ui";
import { companyOf, daysUntil, jobPhotoOf } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT } from "../../../lib/i18n";
import {
  getMyApplications,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getMyMockInterviewUsage,
  getMyMockInterviews,
  getPublicPositionById,
  getPublicPositionsPage,
  type MockInterviewRecord,
  type MyApplication,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { MockGateModal } from "../../talent/jobs/MockGateModal";
import { MockInterviewModal } from "../../talent/jobs/MockInterviewModal";
import { SelfMockResultModal } from "../../talent/jobs/SelfMockResultModal";
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
  const [selfResult, setSelfResult] = useState(false);
  const [sheetApp, setSheetApp] = useState<MyApplication | null>(null);
  const [limit, setLimit] = useState({ reached: false, limit: 3 });
  const [searching, setSearching] = useState(false);

  const loadRecords = () => getMyMockInterviews().then(setRecords).catch(() => setRecords([]));
  useEffect(() => {
    loadRecords();
    getMyApplications().then(setApps).catch(() => setApps([]));
    Promise.all([getMyAppliedPositions().catch(() => []), getMyFavoritePositions().catch(() => [])]).then(([a, b]) => {
      const seen = new Set<string>();
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
  const weak = analyzeMockWeakness(selfMock).filter((r) => r.average !== null && r.average < WEAK_BELOW);

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
        {candidates.map((p) => (
          <Row key={p.id} onClick={() => startJob(p, "job")} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={companyOf(p) || undefined} />
        ))}
        {searching ? (
          <JobSearch onPick={(p) => startJob(p, "job")} />
        ) : (
          <Row onClick={() => setSearching(true)} lead="🔍" title={t("다른 공고 찾기", "Find another job", "查找其他职位", "Tìm tin khác", "他の求人を探す", "Cari lowongan lain")} meta={t("직무나 회사 이름으로", "By role or company", "按职位或公司", "Theo vị trí hoặc công ty", "職種や会社名で", "Berdasarkan peran atau perusahaan")} />
        )}
      </Section>

      {weak.length ? (
        <Section title={t("내 약점", "Where I'm weakest", "我的弱点", "Điểm yếu", "私の弱点", "Kelemahanku")}>
          {weak.map((r) => (
            <Row key={r.category} onClick={startSelf} lead={r.emoji} title={r.label} meta={r.worst?.improvement || undefined} right={<Attention>{r.average}</Attention>} />
          ))}
        </Section>
      ) : null}

      <Section title={t("연습 기록", "History", "练习记录", "Lịch sử", "練習記録", "Riwayat")}>
        {records === null ? <RowsSkeleton count={3} thumb={false} /> : !selfAnswers.length && !records.length ? (
          <Empty>{t("아직 연습 기록이 없어요.", "No practice yet.", "还没有练习记录。", "Chưa có lịch sử.", "まだ練習記録がありません。", "Belum ada riwayat.")}</Empty>
        ) : (
          <>
            {selfAnswers.length ? (
              <Row
                onClick={() => setSelfResult(true)}
                title={t("내 서류로 연습", "With my documents", "用我的材料", "Từ hồ sơ của tôi", "自分の書類で", "Dari dokumenku")}
                meta={`${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${selfAnswers.length}${selfMock?.updatedAt ? ` · ${formatRelativeTime(selfMock.updatedAt, undefined, t)}` : ""}`}
                right={selfBest != null ? t(`최고 ${selfBest}점`, `Best ${selfBest}`, `最高 ${selfBest}`, `Cao nhất ${selfBest}`, `最高${selfBest}点`, `Terbaik ${selfBest}`) : undefined}
              />
            ) : null}
            {records.map((m) => (
              <Row
                key={m.positionId}
                onClick={() => void startById(m.positionId, "job")}
                title={m.positionTitle}
                meta={[m.companyName, `${t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} ${m.answeredCount}`, formatRelativeTime(new Date(m.lastPracticedAt).getTime(), undefined, t)].filter(Boolean).join(" · ")}
                right={m.bestScore != null ? (m.bestScore < WEAK_BELOW ? <Attention>{t(`최고 ${m.bestScore}점`, `Best ${m.bestScore}`, `最高 ${m.bestScore}`, `Cao nhất ${m.bestScore}`, `最高${m.bestScore}点`, `Terbaik ${m.bestScore}`)}</Attention> : t(`최고 ${m.bestScore}점`, `Best ${m.bestScore}`, `最高 ${m.bestScore}`, `Cao nhất ${m.bestScore}`, `最高${m.bestScore}点`, `Terbaik ${m.bestScore}`)) : undefined}
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
      {selfResult ? <SelfMockResultModal onClose={() => setSelfResult(false)} /> : null}
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
  const [items, setItems] = useState<PublicPositionListItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      getPublicPositionsPage({ search: q.trim() || undefined, limit: q.trim() ? 8 : 4, locale })
        .then((p) => alive && setItems(p.items))
        .catch(() => alive && setItems([]));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, locale]);
  return (
    <div className="pt-2">
      <SearchField autoFocus value={q} onChange={setQ} placeholder={t("직무나 회사 이름으로 찾기", "Search by role or company", "按职位或公司搜索", "Tìm theo vị trí hoặc công ty", "職種や会社名で探す", "Cari peran atau perusahaan")} />
      <div className="mt-2">
        {items === null ? <RowsSkeleton count={3} /> : items.length === 0 ? (
          <Empty>{t("맞는 공고가 없어요.", "No matching jobs.", "没有匹配的职位。", "Không có tin phù hợp.", "該当する求人がありません。", "Tidak ada yang cocok.")}</Empty>
        ) : (
          items.map((p) => <Row key={p.id} onClick={() => onPick(p)} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={companyOf(p) || undefined} />)
        )}
      </div>
    </div>
  );
}
