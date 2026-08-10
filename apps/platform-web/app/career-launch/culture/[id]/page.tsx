"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchProgress, patchProgress } from "../../../../lib/launch/progress-client";
import { useLocalizedCulture } from "../../../../lib/launch/culture-i18n";
import { Card } from "../../../../components/launch/ui";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { Footer } from "../../../../components/site/Footer";
import { useLaunchT } from "../../../../lib/launch/i18n";

// Week 별 '한국 기업문화·예절' 학습 카드. 핵심 포인트를 읽고 '학습 완료'로 체크하면
// 대시보드 스텝이 완료 처리된다(백엔드 progress.doneSteps 에 스텝 id 저장).

export default function CultureLessonPage() {
  const t = useLaunchT();
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  const lesson = useLocalizedCulture(id);
  const [done, setDone] = useState(false);
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

  const complete = () => {
    setDone(true);
    void (async () => {
      try {
        const { doneSteps } = await fetchProgress();
        const list = Array.isArray(doneSteps) ? doneSteps : [];
        if (!list.includes(id)) await patchProgress({ doneSteps: [...list, id] });
      } catch {
        // 저장 실패해도 화면 완료 처리
      }
    })();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← {t("대시보드", "Dashboard", "仪表盘", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>

          {!lesson ? (
            <Card className="mt-4 text-[14px] text-[#4E5968]">{t("학습 내용을 찾을 수 없어요. 대시보드로 돌아가주세요.", "We couldn't find this lesson. Please go back to the dashboard.", "找不到该学习内容，请返回仪表盘。", "Không tìm thấy nội dung học này. Vui lòng quay lại bảng điều khiển.", "この学習内容が見つかりません。ダッシュボードに戻ってください。", "Materi pembelajaran ini tidak ditemukan. Silakan kembali ke dasbor.")}</Card>
          ) : (
            <>
              {/* 헤더 */}
              <div className="mt-3 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">{lesson.emoji}</span>
                  <p className="text-[12.5px] font-bold text-[#0B46E8]">{t("한국 직장 문화·예절", "Korean Workplace Culture & Etiquette", "韩国职场文化与礼仪", "Văn hóa & phép tắc nơi làm việc Hàn Quốc", "韓国の職場文化・マナー", "Budaya & Etika Kerja Korea")}</p>
                </div>
                <h1 className="mt-1.5 text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{lesson.title}</h1>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968] md:text-[14px]">{lesson.intro}</p>
              </div>

              {/* 학습 목표 */}
              {lesson.objectives?.length ? (
                <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-white p-4 md:p-5">
                  <p className="text-[12.5px] font-bold text-[#0B46E8]">🎯 {t("이 학습을 마치면", "After this lesson, you'll be able to", "完成本课后你将能够", "Sau bài học này, bạn sẽ có thể", "この学習を終えると", "Setelah pelajaran ini, kamu akan bisa")}</p>
                  <ul className="mt-2 space-y-1.5">
                    {lesson.objectives.map((o, i) => (
                      <li key={i} className="flex gap-2 break-keep text-[13.5px] leading-relaxed text-[#333D4B]">
                        <span className="text-[#0B46E8]">✓</span>
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
                        <h2 className="text-[15.5px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[16.5px]">{sec.heading}</h2>
                      </div>
                      {sec.summary ? (
                        <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{sec.summary}</p>
                      ) : null}
                      <div className="mt-3 space-y-3">
                        {sec.items.map((p, i) => (
                          <Card key={i} className="flex gap-3 md:!p-5">
                            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#0B46E8] text-[12.5px] font-black text-white">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-[14.5px] font-bold text-[#191F28]">{p.title}</p>
                              <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{p.body}</p>
                              {p.example ? (
                                <div className="mt-2 rounded-lg border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-2.5">
                                  <p className="text-[11px] font-bold text-[#8B95A1]">{t("예시", "Example", "示例", "Ví dụ", "例", "Contoh")}</p>
                                  <p className="mt-1 whitespace-pre-wrap break-keep text-[12.5px] leading-relaxed text-[#333D4B]">{p.example}</p>
                                </div>
                              ) : null}
                              {p.tip ? (
                                <p className="mt-2 flex gap-1.5 break-keep rounded-lg bg-[#F6FFE9] px-2.5 py-2 text-[12.5px] leading-relaxed text-[#3A6B00]">
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
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#0B46E8] text-[12.5px] font-black text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[14.5px] font-bold text-[#191F28]">{p.title}</p>
                        <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{p.body}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* 이해도 확인 퀴즈 */}
              {quiz.length ? (
                <div className="mt-9">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[15.5px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[16.5px]">📝 {t("이해도 확인 퀴즈", "Comprehension Quiz", "理解检测测验", "Bài kiểm tra mức độ hiểu", "理解度チェッククイズ", "Kuis Pemahaman")}</h2>
                    <span className="text-[12.5px] font-bold text-[#8B95A1]">
                      {answeredCount}/{quiz.length}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#8B95A1]">{t("배운 내용을 가볍게 확인해봐요. 정답을 고르면 해설이 나와요.", "Quickly check what you learned. Pick an answer to see the explanation.", "轻松检验一下所学内容。选择答案后会显示解析。", "Kiểm tra nhẹ nhàng những gì bạn đã học. Chọn đáp án để xem lời giải.", "学んだ内容を軽く確認しましょう。答えを選ぶと解説が表示されます。", "Cek ringan apa yang kamu pelajari. Pilih jawaban untuk melihat penjelasannya.")}</p>
                  <div className="mt-4 space-y-4">
                    {quiz.map((q, qi) => {
                      const picked = answers[qi];
                      const answered = picked !== undefined;
                      return (
                        <Card key={qi} className="md:!p-5">
                          <p className="break-keep text-[14px] font-bold text-[#191F28]">
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
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : state === "wrong"
                                    ? "border-red-300 bg-red-50 text-red-700"
                                    : state === "dim"
                                      ? "border-[#EEF1F5] bg-white text-[#B0B8C1]"
                                      : "border-[#E5E8EB] bg-white text-[#333D4B] hover:border-[#0B46E8] hover:text-[#0B46E8]";
                              return (
                                <button
                                  key={oi}
                                  type="button"
                                  disabled={answered}
                                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                                  className={`flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] font-medium transition ${cls} ${answered ? "cursor-default" : ""}`}
                                >
                                  <span className="flex-none text-[12px] font-bold opacity-70">{String.fromCharCode(65 + oi)}</span>
                                  <span className="break-keep">{opt}</span>
                                  {answered && isAnswer ? <span className="ml-auto flex-none">✓</span> : null}
                                  {answered && isPicked && !isAnswer ? <span className="ml-auto flex-none">✕</span> : null}
                                </button>
                              );
                            })}
                          </div>
                          {answered ? (
                            <p
                              className={`mt-3 break-keep rounded-lg px-3 py-2.5 text-[12.5px] leading-relaxed ${
                                picked === q.answer ? "bg-emerald-50 text-emerald-800" : "bg-[#F8FAFC] text-[#4E5968]"
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
                    <p className="mt-4 rounded-xl border border-[#CFE0FF] bg-[#EDF1FD] px-4 py-3 text-center text-[13.5px] font-bold text-[#0B46E8]">
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
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-[14px] font-bold text-emerald-700">
                    ✓ {t("학습 완료", "Lesson complete", "学习完成", "Hoàn thành bài học", "学習完了", "Pelajaran selesai")}
                  </div>
                  <Link
                    href="/career-launch/dashboard"
                    className="flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
                  >
                    {t("대시보드로 →", "To dashboard →", "前往仪表盘 →", "Đến bảng điều khiển →", "ダッシュボードへ →", "Ke dasbor →")}
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={complete}
                    disabled={!quizDone}
                    className={`mt-7 flex w-full items-center justify-center rounded-xl py-3.5 text-[14.5px] font-bold transition ${
                      quizDone ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                    }`}
                  >
                    {t("다 읽었어요 · 학습 완료", "I've read it all · Mark complete", "已全部读完 · 完成学习", "Đã đọc hết · Hoàn thành bài học", "全部読みました · 学習完了", "Sudah dibaca semua · Tandai selesai")}
                  </button>
                  {!quizDone ? (
                    <p className="mt-2 text-center text-[12.5px] text-[#8B95A1]">{t("퀴즈를 모두 풀면 학습을 완료할 수 있어요", "Finish all quiz questions to complete this lesson.", "答完所有测验题目即可完成本课学习。", "Hoàn thành tất cả câu hỏi để kết thúc bài học.", "すべてのクイズを解くと学習を完了できます。", "Selesaikan semua soal kuis untuk menuntaskan pelajaran ini.")}</p>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
