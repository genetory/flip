"use client";

// UX Phase 5 — 면접 오답노트. 상태 코드 대신 사용자 그룹, 점수보다 문제·다음 행동 우선. 반복 압박 최소화.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Target } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { EmptyState, ErrorState, CardSkeleton, DashboardSection } from "../../../components/launch/dashboard-states";
import { fetchCorrections, type CorrectionsVM, type CorrectionCard } from "../../../lib/launch/hub-client";
import { trackCareerFunnel } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;

const GROUP_ORDER = ["practice_first", "retrying", "transfer", "passed", "paused"];

// 그룹별 라벨·CTA — 공유 한국어 상수(copy.ts) 대신 페이지 내에서 6개국어 처리.
function groupLabel(t: LaunchT, g: string): string {
  switch (g) {
    case "practice_first": return t("먼저 연습할 답변", "Answers to practice first", "先练习的回答", "Câu trả lời cần luyện trước", "まず練習する答え", "Jawaban untuk dilatih dulu");
    case "retrying": return t("다시 답하는 중", "Retrying", "重新作答中", "Đang trả lời lại", "再回答中", "Sedang dijawab ulang");
    case "transfer": return t("다른 질문으로 확인 중", "Checking with other questions", "用其他问题确认中", "Đang kiểm tra bằng câu khác", "別の質問で確認中", "Mengecek dengan pertanyaan lain");
    case "passed": return t("해결한 답변", "Answers fixed", "已解决的回答", "Câu trả lời đã khắc phục", "解決した答え", "Jawaban yang diperbaiki");
    case "paused": return t("잠시 멈춘 답변", "Paused answers", "暂停的回答", "Câu trả lời tạm dừng", "一時停止した答え", "Jawaban yang dijeda");
    default: return g;
  }
}
function groupCta(t: LaunchT, g: string): string {
  switch (g) {
    case "practice_first": return t("먼저 개선할 부분 확인하기", "See what to improve first", "查看首先要改进的地方", "Xem cần cải thiện gì trước", "まず改善する点を見る", "Lihat yang perlu diperbaiki dulu");
    case "retrying": return t("같은 질문에 다시 답하기", "Answer the same question again", "再次回答同一问题", "Trả lời lại câu hỏi đó", "同じ質問にもう一度答える", "Jawab lagi pertanyaan sama");
    case "transfer": return t("다른 표현의 질문에 도전하기", "Try a reworded question", "挑战不同表述的问题", "Thử câu hỏi diễn đạt khác", "言い回しの違う質問に挑戦", "Coba pertanyaan versi lain");
    case "passed": return t("해결 내용 보기", "See what you fixed", "查看解决内容", "Xem nội dung đã giải quyết", "解決した内容を見る", "Lihat yang sudah diperbaiki");
    case "paused": return t("다시 이어가기", "Pick up again", "继续", "Tiếp tục lại", "再開する", "Lanjutkan lagi");
    default: return t("이어가기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan");
  }
}

function Card({ c }: { c: CorrectionCard }) {
  const t = useLaunchT();
  return (
    <Link
      href="/career-launch/week/4"
      onClick={() => trackCareerFunnel("career_correction_opened", { missionKey: c.id, missionStatus: c.status })}
      className="block rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#3182F6]/30"
    >
      <p className="text-[14px] font-bold leading-snug text-[#191F28]">{c.question || t("면접 질문", "Interview question", "面试问题", "Câu hỏi phỏng vấn", "面接の質問", "Pertanyaan wawancara")}</p>
      {c.coachOneLine ? (
        <div className="mt-2 rounded-xl bg-[#F4F8FF] px-3 py-2">
          <p className="text-[11.5px] font-bold text-[#1B64DA]">{t("먼저 개선할 부분", "Fix this first", "先改进这一点", "Cần cải thiện trước", "まず改善する点", "Perbaiki dulu ini")}</p>
          <p className="mt-0.5 text-[13px] text-[#191F28]">{c.coachOneLine}</p>
        </div>
      ) : null}
      <p className="mt-2 text-[12.5px] text-[#8B95A1]">
        {c.weakness ? `${c.weakness} · ` : ""}
        {c.attemptCount > 0
          ? t(`재도전 ${c.attemptCount}회`, `${c.attemptCount} retries`, `重试 ${c.attemptCount} 次`, `${c.attemptCount} lần thử lại`, `再挑戦 ${c.attemptCount}回`, `${c.attemptCount} kali coba lagi`)
          : t("재도전 전", "Not retried yet", "尚未重试", "Chưa thử lại", "再挑戦前", "Belum dicoba lagi")}
        {c.transferPassed
          ? ` · ${t("유사 질문 통과", "Passed similar question", "通过相似问题", "Đạt câu hỏi tương tự", "類似質問クリア", "Lolos pertanyaan serupa")}`
          : c.transferAttempts > 0
            ? ` · ${t("유사 질문 확인 중", "Checking similar questions", "确认相似问题中", "Đang kiểm tra câu tương tự", "類似質問を確認中", "Memeriksa pertanyaan serupa")}`
            : ""}
      </p>
      <span className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1B64DA]">
        {groupCta(t, c.group)} <ArrowRight size={13} weight="bold" />
      </span>
    </Link>
  );
}

export default function CorrectionNotebookPage() {
  const t = useLaunchT();
  const [vm, setVm] = useState<CorrectionsVM | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const load = () => {
    setPhase("loading");
    void fetchCorrections()
      .then((d) => {
        setVm(d);
        setPhase("ready");
        trackCareerFunnel("career_correction_notebook_viewed", {});
      })
      .catch(() => setPhase("error"));
  };
  useEffect(load, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FB]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <p className="cl-eyebrow">Week 3 · 4</p>
          <h1 className="cl-display mt-1.5">{t("면접 오답노트", "Interview review notes", "面试错题本", "Sổ lỗi phỏng vấn", "面接の復習ノート", "Catatan koreksi wawancara")}</h1>
          <p className="cl-lead mt-2.5 max-w-[52ch]">
            {t(
              "면접에서 약했던 답변을 다시 연습하고, 표현이 다른 질문에도 대응할 수 있는지 확인해요.",
              "Practice the answers you were weak on, and check you can handle the same question worded differently.",
              "重新练习面试中较弱的回答，并确认能否应对不同表述的问题。",
              "Luyện lại những câu trả lời còn yếu và kiểm tra khả năng ứng phó khi câu hỏi được diễn đạt khác.",
              "面接で弱かった答えを練習し直し、言い回しの違う質問にも対応できるか確認します。",
              "Latih ulang jawaban yang lemah dan pastikan bisa menghadapi pertanyaan dengan ungkapan berbeda."
            )}
          </p>
          <hr className="cl-rule mt-5" />

          {phase === "loading" ? (
            <div className="mt-5 flex flex-col gap-3">
              <CardSkeleton height={110} />
              <CardSkeleton height={120} />
              <CardSkeleton height={120} />
            </div>
          ) : phase === "error" || !vm ? (
            <div className="mt-5">
              <ErrorState onRetry={load} />
            </div>
          ) : vm.summary.total === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={t("아직 면접 오답노트가 없어요", "No interview review notes yet", "还没有面试错题本", "Chưa có sổ lỗi phỏng vấn", "まだ面接復習ノートがありません", "Belum ada catatan koreksi wawancara")}
                description={t("지원 패키지를 바탕으로 첫 실전면접을 완료하면 코치가 먼저 개선할 답변을 정리해 드려요.", "Finish your first mock interview based on your application package, and the coach will organize the answers to improve first.", "基于申请材料完成首次实战面试后，教练会整理出优先改进的回答。", "Hoàn thành phỏng vấn thử đầu tiên dựa trên bộ hồ sơ, coach sẽ tổng hợp các câu cần cải thiện trước.", "応募パッケージをもとに初回の実戦模擬面接を終えると、コーチがまず改善する答えを整理します。", "Selesaikan wawancara simulasi pertama berdasarkan paket lamaran, coach akan merangkum jawaban yang perlu diperbaiki dulu.")}
                ctaLabel={t("면접 준비하기", "Prepare for the interview", "准备面试", "Chuẩn bị phỏng vấn", "面接を準備する", "Siapkan wawancara")}
                href="/career-launch/week/3"
              />
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-7">
              {/* 상단 요약 + 다음 훈련(상단 고정 성격) */}
              <div className="rounded-2xl bg-[#191F28] p-5 text-white">
                <p className="text-[14.5px] font-semibold">
                  {t(
                    `핵심 오답 ${vm.summary.total}개 중 ${vm.summary.passed}개를 해결했어요.`,
                    `You've fixed ${vm.summary.passed} of ${vm.summary.total} key corrections.`,
                    `在 ${vm.summary.total} 个核心错题中已解决 ${vm.summary.passed} 个。`,
                    `Bạn đã khắc phục ${vm.summary.passed}/${vm.summary.total} lỗi chính.`,
                    `重要な復習 ${vm.summary.total}件のうち ${vm.summary.passed}件を解決しました。`,
                    `Kamu telah memperbaiki ${vm.summary.passed} dari ${vm.summary.total} koreksi utama.`
                  )}
                </p>
                {vm.summary.nextRecommended ? (
                  <>
                    <p className="mt-1.5 text-[13px] text-white/85">
                      {t("다음은 이 답변을 연습할 차례예요", "Next up: practice this answer", "接下来练习这个回答", "Tiếp theo: luyện câu trả lời này", "次はこの答えを練習しましょう", "Berikutnya: latih jawaban ini")} · {vm.summary.nextRecommended.question?.slice(0, 40)}
                    </p>
                    <Link
                      href="/career-launch/week/4"
                      onClick={() => trackCareerFunnel("career_correction_next_action_clicked", { missionKey: vm.summary.nextRecommended?.id })}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[13px] font-bold text-[#191F28]"
                    >
                      <Target size={14} weight="bold" /> {t("다음 오답 연습하기", "Practice the next correction", "练习下一个错题", "Luyện lỗi tiếp theo", "次の復習を練習する", "Latih koreksi berikutnya")}
                    </Link>
                  </>
                ) : null}
                {vm.summary.transferPassRatePct != null ? (
                  <p className="mt-2 text-[12px] text-white/70">
                    {t(`유사 질문 통과율 ${vm.summary.transferPassRatePct}%`, `Similar-question pass rate ${vm.summary.transferPassRatePct}%`, `相似问题通过率 ${vm.summary.transferPassRatePct}%`, `Tỷ lệ đạt câu tương tự ${vm.summary.transferPassRatePct}%`, `類似質問の通過率 ${vm.summary.transferPassRatePct}%`, `Tingkat lolos pertanyaan serupa ${vm.summary.transferPassRatePct}%`)}
                  </p>
                ) : null}
              </div>

              {GROUP_ORDER.map((g) => {
                const cards = vm.cards.filter((c) => c.group === g);
                if (cards.length === 0) return null;
                return (
                  <DashboardSection key={g} title={groupLabel(t, g)}>
                    <div className="flex flex-col gap-2.5">
                      {cards.map((c) => (
                        <Card key={c.id} c={c} />
                      ))}
                    </div>
                  </DashboardSection>
                );
              })}
              <p className="text-[12px] text-[#B0B8C1]">
                {t(
                  "같은 질문을 반복하기보다, 다른 표현의 질문으로 바꿔가며 연습해요. 오늘은 여기까지 해도 괜찮아요.",
                  "Rather than repeating the same question, practice with reworded ones. It's fine to stop here for today.",
                  "与其重复同一问题，不如换成不同表述来练习。今天到这里也没关系。",
                  "Thay vì lặp lại cùng câu hỏi, hãy luyện với các câu diễn đạt khác. Dừng ở đây hôm nay cũng ổn.",
                  "同じ質問を繰り返すより、言い回しの違う質問で練習しましょう。今日はここまでで大丈夫です。",
                  "Daripada mengulang pertanyaan sama, berlatihlah dengan versi lain. Berhenti di sini hari ini pun tak apa."
                )}
              </p>
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
