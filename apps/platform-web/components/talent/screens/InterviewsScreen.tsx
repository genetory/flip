"use client";

// 모의 면접 — 내가 연습한 공고별 모의 면접 기록. 회사가 준비한 모의 면접을 풀면 여기 쌓인다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle, CaretRight } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyMockInterviews, type MockInterviewRecord } from "../../../lib/member-profile-client";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { analyzeMockWeakness, hasWeakArea, WEAK_BELOW, type WeaknessRow } from "../../../lib/talent/mock-weakness";
import { usePlatformT } from "../../../lib/i18n";

export function InterviewsScreen() {
  const t = usePlatformT();
  const [items, setItems] = useState<MockInterviewRecord[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // 내 면접 약점 — 이미 가진 답변 기록에서 계산한다(서버 호출·저장 없음).
  // 이 화면이 실패해도 아래 기록 목록은 그대로다.
  const selfMock = useSelfMock();
  const weakness = analyzeMockWeakness(selfMock);
  // 이 화면의 목록은 '회사 공고로 푼' 기록만 보여 준다. 공고 없이 혼자 연습한 기록은 따로다.
  // 둘을 구분해 말하지 않으면, 위에 약점이 떠 있는데 아래는 "아직 없어요" 라고 하게 된다.
  const selfAnswered = (selfMock?.answers ?? []).filter((a) => typeof a.score === "number").length;

  function load() {
    setStatus("loading");
    getMyMockInterviews()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <CareerLayout>
      <div className="flex flex-col gap-5">
        <TPageHeader title={t("모의 면접", "Mock interviews", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} description={t("회사가 준비한 모의 면접을 풀고 AI 피드백을 받아보세요. 연습한 공고가 여기 쌓여요.", "Take mock interviews prepared by companies and get AI feedback. Your practice sessions collect here.", "参加企业准备的模拟面试并获得 AI 反馈。练习过的职位会汇集在这里。", "Làm bài phỏng vấn thử do công ty chuẩn bị và nhận phản hồi AI. Các buổi luyện tập sẽ tập hợp ở đây.", "会社が用意した模擬面接に挑戦してAIフィードバックを受けましょう。練習した求人がここに集まります。", "Ikuti wawancara simulasi dari perusahaan dan dapatkan umpan balik AI. Sesi latihanmu terkumpul di sini.")} />

        {hasWeakArea(weakness) ? <WeaknessCard t={t} rows={weakness} /> : null}

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          (items?.length ?? 0) === 0 ? (
            <TEmpty
              icon="🎤"
              title={
                selfAnswered > 0
                  ? t("공고로 푼 모의 면접은 아직 없어요", "No company mock interviews yet", "还没有按职位练习的模拟面试", "Chưa có phỏng vấn thử theo tin tuyển dụng", "求人で解いた模擬面接はまだありません", "Belum ada wawancara simulasi per lowongan")
                  : t("아직 연습한 모의 면접이 없어요", "No mock interviews yet", "还没有练习的模拟面试", "Chưa có phỏng vấn thử nào", "まだ練習した模擬面接がありません", "Belum ada wawancara simulasi")
              }
              description={
                selfAnswered > 0
                  ? t(
                      `혼자 연습한 답변 ${selfAnswered}개는 위 약점에 반영돼 있어요. 공고로 풀면 그 회사에 기록이 남아요.`,
                      `Your ${selfAnswered} self-practice answers are reflected above. Practicing from a job leaves a record with that company.`,
                      `你独自练习的 ${selfAnswered} 条回答已反映在上方。按职位练习会在该公司留下记录。`,
                      `${selfAnswered} câu bạn tự luyện đã phản ánh ở trên. Luyện theo tin tuyển dụng sẽ lưu hồ sơ ở công ty đó.`,
                      `ひとりで練習した回答 ${selfAnswered} 件は上の弱点に反映されています。求人から解くとその会社に記録が残ります。`,
                      `${selfAnswered} jawaban latihan mandiri sudah tercermin di atas. Berlatih dari lowongan meninggalkan catatan di perusahaan itu.`
                    )
                  : t("공고 상세에서 '이 회사 모의 면접 미리 풀기'로 시작해보세요.", "Start from a job's detail page with 'Try this company's mock interview'.", "在职位详情页点击“提前体验该公司模拟面试”开始。", "Bắt đầu từ trang chi tiết tin tuyển dụng với 'Thử phỏng vấn công ty này'.", "求人詳細の「この会社の模擬面接を試す」から始めましょう。", "Mulai dari halaman detail lowongan lewat 'Coba wawancara simulasi perusahaan ini'.")
              }
              action={<TalentButton href={talentAppRoutes.jobs} variant="soft" size="md">{t("공고 둘러보기", "Browse jobs", "浏览职位", "Xem tin tuyển dụng", "求人を見る", "Lihat lowongan")}</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {items!.map((m) => (
                <Link key={m.positionId} href={`/talent/jobs/${m.positionId}`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Sparkle className="h-5 w-5" weight="fill" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-[#191F28]">{m.positionTitle}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">
                      {m.companyName ? `${m.companyName} · ` : ""}{t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} {m.answeredCount} · {formatRelativeTime(new Date(m.lastPracticedAt).getTime(), undefined, t)}
                    </p>
                  </div>
                  {m.bestScore != null ? (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold tabular-nums ${m.bestScore >= 80 ? "bg-[#E7F7EF] text-[#0A9B59]" : m.bestScore >= 60 ? "bg-[#EDF1FD] text-[#0B46E8]" : "bg-[#FEF3E7] text-[#C77700]"}`}>
                      {t(`최고 ${m.bestScore}점`, `Best ${m.bestScore}`, `最高 ${m.bestScore}分`, `Cao nhất ${m.bestScore}`, `最高 ${m.bestScore}点`, `Terbaik ${m.bestScore}`)}
                    </span>
                  ) : null}
                  <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                </Link>
              ))}
            </div>
          )
        ) : null}
      </div>
    </CareerLayout>
  );
}

/**
 * 내 면접 약점 — 영역별 평균과 가장 낮았던 질문.
 *
 * 저장된 '약점 레코드'가 아니라 답변 기록에서 그때그때 계산한 값이다. 그래서 다시 연습해
 * 점수가 오르면 저절로 내려간다 — 따로 '해결됨' 표시를 할 필요가 없다.
 */
function WeaknessCard({ t, rows }: { t: ReturnType<typeof usePlatformT>; rows: WeaknessRow[] }) {
  const weak = rows.filter((r) => r.average !== null && r.average < WEAK_BELOW);
  const untouched = rows.filter((r) => r.average === null);
  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <p className="text-[14.5px] font-bold text-[#191F28]">{t("내 면접 약점", "Where you're weakest", "我的面试弱点", "Điểm yếu phỏng vấn", "面接の弱点", "Kelemahan wawancaramu")}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B95A1]">
        {t(
          "지금까지 연습한 답변을 영역별로 모은 거예요. 다시 연습해서 점수가 오르면 저절로 내려가요.",
          "Grouped from the answers you've practiced. Practice again and a weak area drops off on its own.",
          "按领域汇总你练习过的回答。再次练习提高分数后会自动消失。",
          "Tổng hợp theo lĩnh vực từ các câu đã luyện. Luyện lại và điểm tăng thì sẽ tự mất.",
          "これまで練習した回答を領域ごとにまとめたものです。練習して点が上がれば自然に消えます。",
          "Dikelompokkan dari jawaban yang sudah kamu latih. Berlatih lagi dan skornya naik, otomatis hilang."
        )}
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {weak.map((r) => (
          <li key={r.category}>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[13px]" aria-hidden>{r.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#333D4B]">{r.label}</span>
              <span className="shrink-0 text-[12px] font-bold tabular-nums text-[#C77700]">{r.average}</span>
            </div>
            {/* 막대는 보조 표시라 숫자를 읽는 사람에게 중복이 되지 않게 aria-hidden */}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F2F4F6]" aria-hidden>
              <div className="h-full rounded-full bg-[#F59F00]" style={{ width: `${Math.max(4, Math.min(100, r.average ?? 0))}%` }} />
            </div>
            {r.worst?.question ? (
              <p className="mt-1.5 break-anywhere text-[12px] leading-[1.6] text-[#6B7684]">
                <span className="text-[#8B95A1]">{t("가장 낮았던 질문", "Lowest-scoring question", "得分最低的问题", "Câu điểm thấp nhất", "いちばん低かった質問", "Pertanyaan skor terendah")}</span>{" "}
                「{r.worst.question.slice(0, 40)}」 {r.worst.score}
                {r.worst.improvement ? <span className="mt-0.5 block text-[#8B95A1]">{r.worst.improvement}</span> : null}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {untouched.length ? (
        <p className="mt-3 text-[12px] leading-relaxed text-[#B0B8C1]">
          {t("아직 안 해 본 영역", "Not practiced yet", "尚未练习的领域", "Lĩnh vực chưa luyện", "まだ練習していない領域", "Belum dilatih")}: {untouched.map((r) => r.label).join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
