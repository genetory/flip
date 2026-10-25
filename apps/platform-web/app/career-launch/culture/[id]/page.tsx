"use client";
import { CaretLeft } from "@phosphor-icons/react";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { completeCultureLesson, fetchProgress } from "../../../../lib/launch/progress-client";
import { WEEKS } from "../../../../lib/launch/data";
import { useLocalizedCulture } from "../../../../lib/launch/culture-i18n";
import { Card } from "../../../../components/launch/ui";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../../components/AplyFooter";
import { useLaunchT } from "../../../../lib/launch/i18n";

// Week 별 '한국 기업문화·예절' 학습 카드. 핵심 포인트를 읽고 '학습 완료'로 체크하면
// 대시보드 스텝이 완료 처리된다(백엔드 progress.doneSteps 에 스텝 id 저장).

export default function CultureLessonPage() {
  const t = useLaunchT();
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  const lesson = useLocalizedCulture(id);
  // 이 학습 스텝이 속한 주차로 돌아간다(대시보드가 아니라). id 로 WEEKS 에서 소속 주차를 찾음.
  const backWeek = WEEKS.find((w) => w.steps.some((s) => s.id === id))?.week ?? 1;
  const backHref = `/career-launch/week/${backWeek}`;
  const backLabel = t(`${backWeek}주차`, `Week ${backWeek}`, `第${backWeek}周`, `Tuần ${backWeek}`, `${backWeek}週目`, `Minggu ${backWeek}`);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const quiz = lesson?.quiz ?? [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = quiz.reduce((n, q, qi) => (answers[qi] === q.answer ? n + 1 : n), 0);
  const quizDone = quiz.length === 0 || answeredCount === quiz.length;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { doneSteps } = await fetchProgress();
        if (alive && Array.isArray(doneSteps) && doneSteps.includes(id)) setDone(true);
      } catch {
        // 무시
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // 저장이 끝난 뒤에 완료로 표시한다 — 바로 다음 화면으로 넘어가 저장 요청이 취소되는 걸 막는다.
  const complete = () => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    void (async () => {
      try {
        await completeCultureLesson(id);
        setDone(true);
      } catch {
        setSaveError(true);
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-[880px] px-5 pt-6 md:pt-10">
          <Link href={backHref} className="inline-flex items-center gap-1 text-[15px] font-medium text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {backLabel}
          </Link>

          {!lesson ? (
            <Card className="mt-4 text-[15px] text-[color:var(--v2-ink-3)]">{t("학습 내용을 찾을 수 없어요. 대시보드로 돌아가주세요.", "We couldn't find this lesson. Please go back to the dashboard.", "找不到该学习内容，请返回仪表盘。", "Không tìm thấy nội dung học này. Vui lòng quay lại bảng điều khiển.", "この学習内容が見つかりません。ダッシュボードに戻ってください。", "Materi pembelajaran ini tidak ditemukan. Silakan kembali ke dasbor.")}</Card>
          ) : (
            <>
              {/* 헤더 */}
              <div className="mt-4 rounded-3xl bg-[color:var(--v2-accent-weak)] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">{lesson.emoji}</span>
                  <p className="text-[14px] font-semibold text-[color:var(--v2-accent)]">{t("한국 직장 문화·예절", "Korean Workplace Culture & Etiquette", "韩国职场文化与礼仪", "Văn hóa & phép tắc nơi làm việc Hàn Quốc", "韓国の職場文化・マナー", "Budaya & Etika Kerja Korea")}</p>
                </div>
                <h1 className="mt-1.5 text-[24px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[28px]">{lesson.title}</h1>
                <p className="mt-2 text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">{lesson.intro}</p>
              </div>

              {/* 학습 목표 */}
              {lesson.objectives?.length ? (
                <div className="mt-4 rounded-3xl bg-[color:var(--v2-band)] p-5">
                  <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">🎯 {t("이 학습을 마치면", "After this lesson, you'll be able to", "完成本课后你将能够", "Sau bài học này, bạn sẽ có thể", "この学習を終えると", "Setelah pelajaran ini, kamu akan bisa")}</p>
                  <ul className="mt-2 space-y-1.5">
                    {lesson.objectives.map((o, i) => (
                      <li key={i} className="flex gap-2 break-keep text-[15px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                        <span className="text-[color:var(--v2-accent)]">✓</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* 상세형: 주제별 섹션 */}
              {lesson.sections?.length ? (
                <div className="mt-6 space-y-7">
                  {lesson.sections.map((sec, si) => (
                    <div key={si}>
                      <div className="flex items-center gap-2">
                        {sec.emoji ? <span className="text-[16px]">{sec.emoji}</span> : null}
                        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{sec.heading}</h2>
                      </div>
                      {sec.summary ? (
                        <p className="mt-1.5 break-keep text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{sec.summary}</p>
                      ) : null}
                      <div className="mt-3 space-y-3">
                        {sec.items.map((p, i) => (
                          <Card key={i} className="flex gap-3 md:!p-5">
                            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[13px] font-bold text-[color:var(--v2-accent)]">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{p.title}</p>
                              <p className="mt-1 break-keep text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{p.body}</p>
                              {p.example ? (
                                <div className="mt-2.5 rounded-xl bg-white px-3.5 py-3">
                                  <p className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{t("예시", "Example", "示例", "Ví dụ", "例", "Contoh")}</p>
                                  <p className="mt-1 whitespace-pre-wrap break-keep text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">{p.example}</p>
                                </div>
                              ) : null}
                              {p.tip ? (
                                <p className="mt-2.5 flex gap-1.5 break-keep rounded-xl bg-[color:var(--v2-accent-weak)] px-3.5 py-3 text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                                  <span className="flex-none">💡</span>
                                  {p.tip}
                                </p>
                              ) : null}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 간단형: 핵심 포인트 카드 */
                <div className="mt-6 space-y-3">
                  {(lesson.points ?? []).map((p, i) => (
                    <Card key={i} className="flex gap-3 md:!p-5">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[13px] font-bold text-[color:var(--v2-accent)]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{p.title}</p>
                        <p className="mt-1 break-keep text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{p.body}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* 이해도 확인 퀴즈 */}
              {quiz.length ? (
                <div className="mt-9">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">📝 {t("이해도 확인 퀴즈", "Comprehension Quiz", "理解检测测验", "Bài kiểm tra mức độ hiểu", "理解度チェッククイズ", "Kuis Pemahaman")}</h2>
                    <span className="text-[14px] font-semibold text-[color:var(--v2-faint)]">
                      {answeredCount}/{quiz.length}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("배운 내용을 가볍게 확인해봐요. 정답을 고르면 해설이 나와요.", "Quickly check what you learned. Pick an answer to see the explanation.", "轻松检验一下所学内容。选择答案后会显示解析。", "Kiểm tra nhẹ nhàng những gì bạn đã học. Chọn đáp án để xem lời giải.", "学んだ内容を軽く確認しましょう。答えを選ぶと解説が表示されます。", "Cek ringan apa yang kamu pelajari. Pilih jawaban untuk melihat penjelasannya.")}</p>
                  <div className="mt-4 space-y-4">
                    {quiz.map((q, qi) => {
                      const picked = answers[qi];
                      const answered = picked !== undefined;
                      return (
                        <Card key={qi} className="md:!p-5">
                          <p className="break-keep text-[16px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">
                            Q{qi + 1}. {q.question}
                          </p>
                          <div className="mt-3 space-y-2">
                            {q.options.map((opt, oi) => {
                              const isPicked = picked === oi;
                              const isAnswer = q.answer === oi;
                              const state = !answered
                                ? "idle"
                                : isAnswer
                                  ? "correct"
                                  : isPicked
                                    ? "wrong"
                                    : "dim";
                              const cls =
                                state === "correct"
                                  ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)] ring-2 ring-inset ring-[color:var(--v2-accent)]"
                                  : state === "wrong"
                                    ? "bg-white text-[color:var(--v2-attention)] ring-2 ring-inset ring-[color:var(--v2-attention)]"
                                    : state === "dim"
                                      ? "bg-white/60 text-[color:var(--v2-faint)]"
                                      : "bg-white text-[color:var(--v2-ink-2)] md:hover:bg-[color:var(--v2-fill)] active:scale-[0.99]";
                              return (
                                <button
                                  key={oi}
                                  type="button"
                                  disabled={answered}
                                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                                  className={`flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition ${cls} ${answered ? "cursor-default" : ""}`}
                                >
                                  <span className="flex-none text-[13px] font-bold opacity-70">{String.fromCharCode(65 + oi)}</span>
                                  <span className="break-keep">{opt}</span>
                                  {answered && isAnswer ? <span className="ml-auto flex-none">✓</span> : null}
                                  {answered && isPicked && !isAnswer ? <span className="ml-auto flex-none">✕</span> : null}
                                </button>
                              );
                            })}
                          </div>
                          {answered ? (
                            <p
                              className={`mt-3 break-keep rounded-xl px-3.5 py-3 text-[14px] leading-[1.6] ${
                                picked === q.answer ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-ink-2)]" : "bg-white text-[color:var(--v2-ink-3)]"
                              }`}
                            >
                              {picked === q.answer
                                ? t("정답이에요! ", "Correct! ", "答对了！ ", "Chính xác! ", "正解です！ ", "Benar! ")
                                : t("아쉬워요. ", "Not quite. ", "很可惜。 ", "Tiếc quá. ", "残念です。 ", "Sayang sekali. ")}
                              {q.explain}
                            </p>
                          ) : null}
                        </Card>
                      );
                    })}
                  </div>
                  {quizDone ? (
                    <p className="mt-4 rounded-2xl bg-[color:var(--v2-accent-weak)] px-4 py-3.5 text-center text-[15px] font-bold text-[color:var(--v2-accent)]">
                      {t(
                        `퀴즈 완료! ${quiz.length}문제 중 ${correctCount}문제를 맞혔어요`,
                        `Quiz complete! You got ${correctCount} of ${quiz.length} right`,
                        `测验完成！${quiz.length}题中你答对了${correctCount}题`,
                        `Hoàn thành bài kiểm tra! Bạn trả lời đúng ${correctCount}/${quiz.length} câu`,
                        `クイズ完了！${quiz.length}問中${correctCount}問正解しました`,
                        `Kuis selesai! Kamu menjawab benar ${correctCount} dari ${quiz.length} soal`
                      )}{" "}
                      🎉
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* 완료 체크 */}
              {done ? (
                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <div className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-accent-weak)] text-[16px] font-semibold text-[color:var(--v2-accent)]">
                    ✓ {t("학습 완료", "Lesson complete", "学习完成", "Hoàn thành bài học", "学習完了", "Pelajaran selesai")}
                  </div>
                  <Link
                    href={backHref}
                    className="flex h-12 items-center justify-center rounded-xl bg-[color:var(--v2-accent)] px-5 text-[16px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
                  >
                    {t(`${backLabel}로 →`, `To ${backLabel} →`, `返回${backLabel} →`, `Về ${backLabel} →`, `${backLabel}へ →`, `Ke ${backLabel} →`)}
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={complete}
                    disabled={!quizDone || saving}
                    className={`mt-7 flex h-14 w-full items-center justify-center rounded-2xl text-[17px] font-semibold transition active:scale-[0.99] ${
                      quizDone && !saving ? "bg-[color:var(--v2-accent)] text-white hover:opacity-90" : "cursor-not-allowed bg-[color:var(--v2-band)] text-[color:var(--v2-faint)]"
                    }`}
                  >
                    {saving
                      ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")
                      : t("다 읽었어요 · 학습 완료", "I've read it all · Mark complete", "已全部读完 · 完成学习", "Đã đọc hết · Hoàn thành bài học", "全部読みました · 学習完了", "Sudah dibaca semua · Tandai selesai")}
                  </button>
                  {saveError ? (
                    <p className="mt-2 text-center text-[14px] font-semibold text-[color:var(--v2-attention)]">{t("완료를 저장하지 못했어요. 잠시 후 다시 눌러주세요.", "We couldn't save your completion. Please try again in a moment.", "未能保存完成状态，请稍后再试。", "Chưa lưu được hoàn thành. Vui lòng thử lại sau.", "完了を保存できませんでした。しばらくしてからもう一度押してください。", "Gagal menyimpan penyelesaian. Coba lagi sebentar lagi.")}</p>
                  ) : null}
                  {!quizDone ? (
                    <p className="mt-2.5 text-center text-[14px] text-[color:var(--v2-faint)]">{t("퀴즈를 모두 풀면 학습을 완료할 수 있어요", "Finish all quiz questions to complete this lesson.", "答完所有测验题目即可完成本课学习。", "Hoàn thành tất cả câu hỏi để kết thúc bài học.", "すべてのクイズを解くと学習を完了できます。", "Selesaikan semua soal kuis untuk menuntaskan pelajaran ini.")}</p>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
