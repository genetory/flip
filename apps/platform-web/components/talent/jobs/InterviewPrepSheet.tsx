"use client";

// 면접 전날 볼 한 장 — 연습한 답 중 가장 좋은 것들을 한 화면에 모은다.
// 연습에 쓴 시간이 '손에 쥐는 결과물'이 되게 하려는 화면. 지하철에서 훑어볼 수 있게 짧게.
//
// 새로 AI 를 부르지 않는다 — 이미 쌓인 기록만 쓴다:
//  - 이 공고로 연습한 답(서버) + 내 서류로 연습한 답(계정)
//  - 다시 볼 점: 약점 분석(analyzeMockWeakness)의 개선 한 줄
//  - 면접관에게 할 질문: 고정 문구(어느 회사에나 무난한 것)
import { useEffect, useMemo, useState } from "react";
import { X, CircleNotch } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useVisualViewport } from "../../../lib/useVisualViewport";
import { getMyMockInterviewAnswers, type MockInterviewAnswer } from "../../../lib/member-profile-client";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

type Row = { question: string; answer: string; score: number | null };

const INTRO = /자기\s*소개|소개해|introduce yourself|self-introduction/i;
const TOP = 5;
/** 처음에 보이는 질문 수 — 나머지는 '더 보기'. 한 장에 다 펼치면 길어서 전날 훑어보기 어렵다. */
const FIRST = 3;

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
  const [showAll, setShowAll] = useState(false);

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
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{[company, title, interviewAt ? whenLabel(t, interviewAt) : null].filter(Boolean).join(" · ")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F5F6F8] px-4 py-5 sm:px-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <CircleNotch className="h-7 w-7 animate-spin text-[#0B46E8]" weight="bold" />
            </div>
          ) : empty ? (
            <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(11,18,39,0.06)] ring-1 ring-[#EEF1F5] text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("아직 모을 답이 없어요", "Nothing to collect yet", "还没有可汇总的回答", "Chưa có câu trả lời để tổng hợp", "まだまとめる回答がありません", "Belum ada jawaban untuk dikumpulkan")}</p>
              <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{t("이 공고로 2~3문항만 연습하면, 가장 잘한 답이 여기 정리돼요.", "Practice 2–3 questions for this job and your best answers will be collected here.", "用此职位练习 2~3 道题，最好的回答会整理在这里。", "Luyện 2–3 câu cho tin này, câu trả lời tốt nhất sẽ được gom ở đây.", "この求人で2〜3問練習すると、いちばん良い回答がここにまとまります。", "Latih 2–3 pertanyaan untuk lowongan ini, jawaban terbaik akan dikumpulkan di sini.")}</p>
              <button type="button" onClick={onPractice} className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                {t("이 공고로 연습하기", "Practice for this job", "用此职位练习", "Luyện cho tin này", "この求人で練習する", "Latihan untuk lowongan ini")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              <Block title={t("1분 자기소개", "1-minute introduction", "1分钟自我介绍", "Giới thiệu 1 phút", "1分自己紹介", "Perkenalan 1 menit")}>
                {intro ? (
                  <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(11,18,39,0.06)] ring-1 ring-[#EEF1F5]">
                    <Answer t={t} row={intro} lines={5} quote={false} />
                  </div>
                ) : (
                  <p className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(11,18,39,0.06)] ring-1 ring-[#EEF1F5] break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">
                    {t("아직 자기소개를 연습하지 않았어요. 거의 모든 면접의 첫 질문이라 꼭 한 번 연습해 두세요.", "You haven't practiced an introduction yet. It's the first question in almost every interview, so practice it once.", "还没有练习自我介绍。这几乎是所有面试的第一个问题，务必练习一次。", "Bạn chưa luyện phần giới thiệu. Đây là câu đầu tiên của hầu hết buổi phỏng vấn, hãy luyện một lần.", "まだ自己紹介を練習していません。ほぼすべての面接の最初の質問なので、一度練習しておきましょう。", "Kamu belum latihan perkenalan. Ini pertanyaan pertama hampir di semua wawancara, latih sekali.")}
                  </p>
                )}
              </Block>

              {top.length ? (
                <Block title={t("예상 질문과 내 답", "Likely questions & my answers", "预测问题与我的回答", "Câu hỏi dự kiến & câu trả lời", "予想質問と自分の回答", "Pertanyaan & jawabanku")}>
                  <ol className="flex flex-col gap-3">
                    {(showAll ? top : top.slice(0, FIRST)).map((r, i) => (
                      <li key={r.question} className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(11,18,39,0.06)] ring-1 ring-[#EEF1F5]">
                        {/* 질문 — 번호는 앞에 따로 세워 질문끼리 구분되게. 다듬을 답이면 질문 줄에 작게 표시. */}
                        <div className="flex gap-2.5">
                          <span className="mt-[1px] w-5 shrink-0 text-[15px] font-black tabular-nums text-[#0B46E8]">Q{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="break-keep text-[15px] font-semibold leading-[1.6] text-[#191F28]">{r.question}</p>
                            {r.score != null && r.score < WEAK_BELOW ? (
                              <p className="mt-1 text-[12px] font-semibold text-[#C77700]">{t("이 답은 한 번 더 다듬어 보세요", "Polish this answer once more", "这个回答再打磨一下", "Nên trau chuốt câu này thêm", "この回答はもう一度磨きましょう", "Poles jawaban ini lagi")}</p>
                            ) : null}
                            <div className="mt-2.5">
                              <Answer t={t} row={r} lines={3} quote />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {top.length > FIRST ? (
                    <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold text-[#6B7684] transition hover:bg-white">
                      {showAll
                        ? t("접기", "Show less", "收起", "Thu gọn", "閉じる", "Tutup")
                        : t(`${top.length - FIRST}개 더 보기`, `Show ${top.length - FIRST} more`, `再看 ${top.length - FIRST} 个`, `Xem thêm ${top.length - FIRST}`, `あと${top.length - FIRST}件を見る`, `Lihat ${top.length - FIRST} lagi`)}
                    </button>
                  ) : null}
                </Block>
              ) : null}

              {recheck.length ? (
                <Block title={t("들어가기 전에 다시 볼 점", "Check before you walk in", "进门前再看一眼", "Xem lại trước khi vào", "入る前にもう一度見ること", "Cek sebelum masuk")}>
                  <ul className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(11,18,39,0.06)] ring-1 ring-[#EEF1F5] flex flex-col gap-2">
                    {recheck.map((r) => (
                      <li key={r.label} className="break-keep text-[14px] leading-[1.7] text-[#333D4B]">
                        · {r.tip}
                      </li>
                    ))}
                  </ul>
                </Block>
              ) : null}

              <Block title={t("면접관에게 할 질문", "Questions to ask them", "向面试官提的问题", "Câu hỏi để hỏi lại", "面接官への逆質問", "Pertanyaan untuk pewawancara")}>
                <ul className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(11,18,39,0.06)] ring-1 ring-[#EEF1F5] flex flex-col gap-2">
                  {askBack.map((q) => (
                    <li key={q} className="break-keep text-[14px] leading-[1.7] text-[#333D4B]">
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
  // 제목은 또렷하게 — 전날 훑어볼 때 어디가 무슨 칸인지 바로 보이게.
  return (
    <section>
      <h3 className="px-1 text-[16px] font-black tracking-[-0.02em] text-[#191F28]">{title}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/** 답 — 처음엔 몇 줄만, 누르면 전부. quote 면 왼쪽 선으로 질문과 갈라 '내 답'임을 보이게. */
function Answer({ t, row, lines, quote }: { t: PlatformT; row: Row; lines: 3 | 5; quote: boolean }) {
  const [open, setOpen] = useState(false);
  const long = row.answer.length > (lines === 3 ? 110 : 180);
  return (
    <div className={quote ? "border-l-2 border-[#E5E8EB] pl-3.5" : ""}>
      <p className={`whitespace-pre-wrap break-keep text-[14.5px] leading-[1.8] text-[#4E5968] ${!open && long ? (lines === 3 ? "line-clamp-3" : "line-clamp-5") : ""}`}>{row.answer}</p>
      {long ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-[12.5px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]">
          {open ? t("접기", "Show less", "收起", "Thu gọn", "閉じる", "Tutup") : t("더 보기", "More", "展开", "Xem thêm", "もっと見る", "Selengkapnya")}
        </button>
      ) : null}
    </div>
  );
}
