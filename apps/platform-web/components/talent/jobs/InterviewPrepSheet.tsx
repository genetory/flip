"use client";

// 면접 전날 볼 한 장 — 연습한 답 중 가장 좋은 것들을 한 화면에 모은다.
// 연습에 쓴 시간이 '손에 쥐는 결과물'이 되게 하려는 화면. 지하철에서 훑어볼 수 있게 짧게.
//
// 새로 AI 를 부르지 않는다 — 이미 쌓인 기록만 쓴다:
//  - 이 공고로 연습한 답(서버) + 내 서류로 연습한 답(계정)
//  - 다시 볼 점: 약점 분석(analyzeMockWeakness)의 개선 한 줄
//  - 면접관에게 할 질문: 고정 문구(어느 회사에나 무난한 것)
import { useEffect, useMemo, useState } from "react";
import { X, CalendarCheck, CircleNotch } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useVisualViewport } from "../../../lib/useVisualViewport";
import { getMyMockInterviewAnswers, type MockInterviewAnswer } from "../../../lib/member-profile-client";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

type Row = { question: string; answer: string; score: number | null };

const INTRO = /자기\s*소개|소개해|introduce yourself|self-introduction/i;
const TOP = 5;

function whenLabel(t: PlatformT, iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return t(
    `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    `${d.toLocaleDateString("en", { month: "short", day: "numeric" })} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    `${d.getDate()}/${d.getMonth() + 1} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    `${d.getDate()}/${d.getMonth() + 1} ${pad(d.getHours())}.${pad(d.getMinutes())}`
  );
}

export function InterviewPrepSheet({
  positionId,
  title,
  company,
  interviewAt,
  onPractice,
  onClose
}: {
  positionId: string;
  title: string;
  company?: string | null;
  interviewAt?: string | null;
  /** 답이 모자랄 때 '이 공고로 연습하기' — 같은 화면에서 연습 팝업을 연다. */
  onPractice: () => void;
  onClose: () => void;
}) {
  const t = usePlatformT();
  useLockBodyScroll();
  const vp = useVisualViewport();
  const self = useSelfMock();
  const [jobAnswers, setJobAnswers] = useState<MockInterviewAnswer[] | null>(null);

  useEffect(() => {
    let alive = true;
    getMyMockInterviewAnswers(positionId)
      .then((a) => alive && setJobAnswers(a))
      .catch(() => alive && setJobAnswers([]));
    return () => {
      alive = false;
    };
  }, [positionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { intro, top } = useMemo(() => {
    const selfRows: Row[] = (self?.answers ?? []).map((a) => ({ question: a.question, answer: a.answer, score: a.score }));
    const all: Row[] = [...(jobAnswers ?? []), ...selfRows].filter((r) => r.answer.trim());
    // 같은 질문은 점수 높은 답 하나만.
    const best = new Map<string, Row>();
    for (const r of all) {
      const prev = best.get(r.question);
      if (!prev || (r.score ?? -1) > (prev.score ?? -1)) best.set(r.question, r);
    }
    const rows = [...best.values()];
    const introRow = rows.filter((r) => INTRO.test(r.question)).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0] ?? null;
    // 이 공고 답을 먼저, 그다음 점수순.
    const jobQs = new Set((jobAnswers ?? []).map((a) => a.question));
    const ordered = rows
      .filter((r) => r !== introRow)
      .sort((a, b) => Number(jobQs.has(b.question)) - Number(jobQs.has(a.question)) || (b.score ?? -1) - (a.score ?? -1))
      .slice(0, TOP);
    return { intro: introRow, top: ordered };
  }, [jobAnswers, self]);

  const recheck = useMemo(
    () =>
      analyzeMockWeakness(self)
        .filter((r) => r.average !== null && r.average < WEAK_BELOW && r.worst?.improvement)
        .map((r) => ({ label: r.label, tip: r.worst!.improvement! }))
        .slice(0, 3),
    [self]
  );

  const askBack = [
    t("입사하면 첫 3개월 동안 어떤 성과를 기대하시나요?", "What would you expect me to achieve in the first three months?", "入职后前三个月，您期望我取得什么成果？", "Trong 3 tháng đầu, anh/chị kỳ vọng tôi đạt được gì?", "入社後の最初の3か月で、どんな成果を期待されていますか？", "Apa yang Bapak/Ibu harapkan saya capai dalam 3 bulan pertama?"),
    t("이 팀에서 잘하는 사람들은 공통적으로 어떤 점이 있나요?", "What do people who do well on this team have in common?", "这个团队里表现好的人有什么共同点？", "Những người làm tốt trong đội này có điểm chung gì?", "このチームで活躍している人に共通する点は何ですか？", "Apa kesamaan orang yang berhasil di tim ini?"),
    t("외국인 직원이 적응할 때 팀에서 어떻게 도와주시나요?", "How does the team help international members settle in?", "外籍员工适应时，团队会如何提供帮助？", "Đội hỗ trợ nhân viên nước ngoài hòa nhập thế nào?", "外国人社員が慣れるまで、チームではどのようにサポートしていますか？", "Bagaimana tim membantu karyawan asing beradaptasi?")
  ];

  const loading = jobAnswers === null;
  const empty = !loading && !intro && top.length === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" style={vp ? { top: vp.offsetTop, height: vp.height, bottom: "auto" } : undefined} onClick={onClose}>
      <div className="flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-white sm:h-[720px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">{t("면접 전날 볼 한 장", "Your night-before sheet", "面试前一晚速览", "Bản ôn trước buổi phỏng vấn", "面接前日に見る1枚", "Lembar malam sebelum wawancara")}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{[company, title].filter(Boolean).join(" · ")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {interviewAt ? (
            <p className="mb-5 flex items-center gap-1.5 rounded-xl bg-[#FFF3E6] px-3.5 py-2.5 text-[13px] font-bold text-[#E8890C]">
              <CalendarCheck className="h-4 w-4" weight="fill" /> {t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} · {whenLabel(t, interviewAt)}
            </p>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-16">
              <CircleNotch className="h-7 w-7 animate-spin text-[#0B46E8]" weight="bold" />
            </div>
          ) : empty ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("아직 모을 답이 없어요", "Nothing to collect yet", "还没有可汇总的回答", "Chưa có câu trả lời để tổng hợp", "まだまとめる回答がありません", "Belum ada jawaban untuk dikumpulkan")}</p>
              <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{t("이 공고로 2~3문항만 연습하면, 가장 잘한 답이 여기 정리돼요.", "Practice 2–3 questions for this job and your best answers will be collected here.", "用此职位练习 2~3 道题，最好的回答会整理在这里。", "Luyện 2–3 câu cho tin này, câu trả lời tốt nhất sẽ được gom ở đây.", "この求人で2〜3問練習すると、いちばん良い回答がここにまとまります。", "Latih 2–3 pertanyaan untuk lowongan ini, jawaban terbaik akan dikumpulkan di sini.")}</p>
              <button type="button" onClick={onPractice} className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                {t("이 공고로 연습하기", "Practice for this job", "用此职位练习", "Luyện cho tin này", "この求人で練習する", "Latihan untuk lowongan ini")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <Block title={t("1분 자기소개", "1-minute introduction", "1分钟自我介绍", "Giới thiệu 1 phút", "1分自己紹介", "Perkenalan 1 menit")}>
                {intro ? (
                  <Answer t={t} row={intro} />
                ) : (
                  <p className="text-[13px] text-[#8B95A1]">
                    {t("아직 자기소개를 연습하지 않았어요. 거의 모든 면접의 첫 질문이라 꼭 한 번 연습해 두세요.", "You haven't practiced an introduction yet. It's the first question in almost every interview, so practice it once.", "还没有练习自我介绍。这几乎是所有面试的第一个问题，务必练习一次。", "Bạn chưa luyện phần giới thiệu. Đây là câu đầu tiên của hầu hết buổi phỏng vấn, hãy luyện một lần.", "まだ自己紹介を練習していません。ほぼすべての面接の最初の質問なので、一度練習しておきましょう。", "Kamu belum latihan perkenalan. Ini pertanyaan pertama hampir di semua wawancara, latih sekali.")}
                  </p>
                )}
              </Block>

              {top.length ? (
                <Block title={t("예상 질문과 내 최고 답변", "Likely questions & my best answers", "预测问题与我的最佳回答", "Câu hỏi dự kiến & câu trả lời tốt nhất", "予想質問と自分のベスト回答", "Pertanyaan & jawaban terbaikku")}>
                  <ol className="flex flex-col gap-4">
                    {top.map((r, i) => (
                      <li key={r.question}>
                        <p className="break-keep text-[14px] font-bold leading-relaxed text-[#191F28]">
                          {i + 1}. {r.question}
                        </p>
                        <div className="mt-1.5">
                          <Answer t={t} row={r} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </Block>
              ) : null}

              {recheck.length ? (
                <Block title={t("들어가기 전에 다시 볼 점", "Check before you walk in", "进门前再看一眼", "Xem lại trước khi vào", "入る前にもう一度見ること", "Cek sebelum masuk")}>
                  <ul className="flex flex-col gap-1.5">
                    {recheck.map((r) => (
                      <li key={r.label} className="break-keep text-[13px] leading-relaxed text-[#4E5968]">
                        <span className="font-bold text-[#C77700]">{r.label}</span> · {r.tip}
                      </li>
                    ))}
                  </ul>
                </Block>
              ) : null}

              <Block title={t("면접관에게 할 질문", "Questions to ask them", "向面试官提的问题", "Câu hỏi để hỏi lại", "面接官への逆質問", "Pertanyaan untuk pewawancara")}>
                <ul className="flex flex-col gap-1.5">
                  {askBack.map((q) => (
                    <li key={q} className="break-keep text-[13px] leading-relaxed text-[#4E5968]">
                      · {q}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[12.5px] font-black uppercase tracking-[0.04em] text-[#0B46E8]">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Answer({ t, row }: { t: PlatformT; row: Row }) {
  const weak = row.score != null && row.score < WEAK_BELOW;
  return (
    <div className="rounded-xl bg-[#F8FAFB] px-3.5 py-3">
      <p className="whitespace-pre-wrap break-keep text-[13px] leading-[1.7] text-[#333D4B]">{row.answer}</p>
      {row.score != null ? (
        <p className={`mt-1.5 text-[11.5px] font-bold ${weak ? "text-[#C77700]" : "text-[#0A9B59]"}`}>
          {row.score}
          {t("점", " pts", "分", " điểm", "点", " poin")}
          {weak ? ` · ${t("한 번 더 다듬어 보세요", "worth polishing once more", "再打磨一下", "nên trau chuốt thêm", "もう一度磨きましょう", "perlu dipoles lagi")}` : ""}
        </p>
      ) : null}
    </div>
  );
}
