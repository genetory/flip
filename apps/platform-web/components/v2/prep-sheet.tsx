"use client";

// v2 '면접 전날 볼 한 장' — 연습한 답 중 가장 좋은 것들을 한 화면에. 새로 AI 를 부르지 않는다(쌓인 기록만).
//  - 이 공고로 연습한 답: Aply·원티드 공고는 서버 기록, 가져온 공고(ext-…)는 계정의 가져온 공고 기록
//  - 내 서류로 연습한 답(self-mock) · 다시 볼 점(약점 분석의 고칠 점)
//  - 이 회사에서 실제로 나온 질문(면접 후기, 익명)
//  - 면접관에게 할 질문: 공고의 주요 업무·우대 사항으로 회사에 맞춘 것 + 무난한 것
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "./sheets";
import { Button, RowsSkeleton } from "./ui";
import { LevelChip } from "./practice";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import { getInterviewQuestions, getMyMockInterviewAnswers, getPublicPositionById, type InterviewReportItem, type MockInterviewAnswer } from "../../lib/member-profile-client";
import { useSelfMock } from "../../lib/talent/self-mock";
import { useImportedJobs } from "../../lib/talent/imported-jobs";
import { analyzeMockWeakness, WEAK_BELOW } from "../../lib/talent/mock-weakness";
import { mockCategoryLabelOf } from "../../lib/talent/career-labels";

type Row = { question: string; answer: string; score: number | null; fromJob: boolean };
const INTRO = /자기\s*소개|소개해|introduce yourself|self-introduction/i;

/** 공고 글의 첫 항목 한 줄(앞의 '- '·번호 제거, 40자 안). */
function firstLine(text: string | null | undefined): string {
  const line = (text ?? "")
    .split("\n")
    .map((x) => x.replace(/^[\s\-•·*\d.)]+/, "").trim())
    .find((x) => x.length >= 4);
  return line ? (line.length > 40 ? `${line.slice(0, 40)}…` : line) : "";
}

export function PrepSheetV2({ positionId, title, company, interviewAt, onPractice, onClose }: { positionId: string; title: string; company?: string | null; interviewAt?: string | null; onPractice: () => void; onClose: () => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const self = useSelfMock();
  const imported = useImportedJobs();
  const ext = positionId.startsWith("ext-") ? imported.find((j) => j.id === positionId) : undefined;
  const [serverAnswers, setServerAnswers] = useState<MockInterviewAnswer[] | null>(positionId.startsWith("ext-") ? [] : null);
  const [job, setJob] = useState<{ duty: string; preferred: string } | null>(null);
  const [reports, setReports] = useState<InterviewReportItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (positionId.startsWith("ext-")) return;
    let alive = true;
    getMyMockInterviewAnswers(positionId)
      .then((a) => alive && setServerAnswers(a))
      .catch(() => alive && setServerAnswers([]));
    getPublicPositionById(positionId, { locale })
      .then((p) => alive && setJob({ duty: firstLine(p.mainResponsibilities), preferred: firstLine(p.preferredQualifications) }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [positionId, locale]);
  useEffect(() => {
    if (!company) return;
    let alive = true;
    getInterviewQuestions({ organization: company, limit: 5 })
      .then((d) => alive && setReports(d.items))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [company]);

  const jobAnswers = useMemo(() => (ext ? ext.answers ?? [] : serverAnswers), [ext, serverAnswers]);
  const duty = ext ? firstLine(ext.mainResponsibilities) : job?.duty ?? "";
  const preferred = ext ? firstLine(ext.preferredQualifications) : job?.preferred ?? "";

  const { intro, top } = useMemo(() => {
    const all: Row[] = [...(jobAnswers ?? []).map((a) => ({ ...a, fromJob: true })), ...(self?.answers ?? []).map((a) => ({ question: a.question, answer: a.answer, score: a.score, fromJob: false }))].filter((r) => r.answer.trim());
    const best = new Map<string, Row>();
    for (const r of all) {
      const p = best.get(r.question);
      if (!p || (r.score ?? -1) > (p.score ?? -1)) best.set(r.question, r);
    }
    const rows = [...best.values()];
    const introRow = rows.filter((r) => INTRO.test(r.question)).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0] ?? null;
    const ordered = rows
      .filter((r) => r !== introRow)
      .sort((a, b) => Number(b.fromJob) - Number(a.fromJob) || (b.score ?? -1) - (a.score ?? -1))
      .slice(0, 5);
    return { intro: introRow, top: ordered };
  }, [jobAnswers, self]);

  const recheck = useMemo(
    () =>
      analyzeMockWeakness(self)
        .filter((r) => r.average !== null && r.average < WEAK_BELOW && r.worst?.improvement)
        .map((r) => ({ label: mockCategoryLabelOf(t, r.category), tip: r.worst!.improvement! }))
        .slice(0, 3),
    [self, t]
  );

  // 면접관에게 할 질문 — 공고 내용으로 이 회사에 맞춘 것을 먼저, 그다음 무난한 것.
  const askBack = [
    duty ? t(`'${duty}' 업무는 팀에서 어떤 방식으로 진행되나요?`, `How does the team handle '${duty}' day to day?`, `'${duty}'这项工作在团队里是怎样进行的？`, `Công việc '${duty}' được đội thực hiện thế nào?`, `「${duty}」の業務はチームでどのように進めていますか？`, `Bagaimana tim menjalankan pekerjaan '${duty}'?`) : "",
    preferred ? t(`우대 사항의 '${preferred}'은(는) 입사 후 어떻게 키울 수 있을까요?`, `How could I grow '${preferred}' after joining?`, `优先条件中的'${preferred}'，入职后可以怎样提升？`, `Sau khi vào làm, tôi có thể phát triển '${preferred}' thế nào?`, `歓迎条件の「${preferred}」は入社後どう伸ばせますか？`, `Bagaimana saya bisa mengembangkan '${preferred}' setelah bergabung?`) : "",
    t("입사하면 첫 3개월 동안 어떤 성과를 기대하시나요?", "What would you expect me to achieve in the first three months?", "入职后前三个月，您期望我取得什么成果？", "Trong 3 tháng đầu, anh/chị kỳ vọng tôi đạt được gì?", "入社後の最初の3か月で、どんな成果を期待されていますか？", "Apa yang diharapkan dalam 3 bulan pertama?"),
    t("외국인 직원이 적응할 때 팀에서 어떻게 도와주시나요?", "How does the team help international members settle in?", "外籍员工适应时，团队会如何提供帮助？", "Đội hỗ trợ nhân viên nước ngoài hòa nhập thế nào?", "外国人社員が慣れるまで、チームではどうサポートしていますか？", "Bagaimana tim membantu karyawan asing beradaptasi?")
  ]
    .filter(Boolean)
    .slice(0, 3);

  const loading = jobAnswers === null;
  const empty = !loading && !intro && top.length === 0;
  const when = interviewAt ? new Date(interviewAt) : null;
  const subtitle = [company, when ? `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}` : ""].filter(Boolean).join(" · ");
  const visible = showAll ? top : top.slice(0, 3);

  const head = (text: string, tone: string) => <p className={`text-[14px] font-bold ${tone}`}>{text}</p>;

  return (
    <Sheet
      tall
      title={t("면접 전날 볼 한 장", "Night-before sheet", "考前速览", "Bản ôn tập trước PV", "前日に見る1枚", "Lembar ringkas")}
      subtitle={[title, subtitle].filter(Boolean).join(" · ")}
      onClose={onClose}
      footer={
        <Button full onClick={onPractice}>
          {empty ? t("이 공고로 연습하기", "Practice for this job", "用此职位练习", "Luyện cho tin này", "この求人で練習", "Latihan untuk lowongan ini") : t("이 공고로 더 연습하기", "Practice more for this job", "继续用此职位练习", "Luyện thêm cho tin này", "この求人でもっと練習", "Latihan lagi")}
        </Button>
      }
    >
      {loading ? (
        <RowsSkeleton count={4} thumb={false} />
      ) : (
        <div className="flex flex-col gap-3">
          {empty ? (
            <div className="rounded-3xl bg-[color:var(--v2-band)] p-5 text-center">
              <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t("아직 모을 답이 없어요", "Nothing to collect yet", "还没有可汇总的回答", "Chưa có câu trả lời", "まだまとめる回答がありません", "Belum ada jawaban")}</p>
              <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">{t("이 공고로 2~3문항만 연습하면, 가장 잘한 답이 여기 정리돼요.", "Practice 2–3 questions and your best answers will appear here.", "练习2~3题后，最好的回答会整理在这里。", "Luyện 2–3 câu, câu tốt nhất sẽ hiện ở đây.", "2〜3問練習すれば、ベストな回答がここにまとまります。", "Latih 2–3 soal, jawaban terbaik muncul di sini.")}</p>
            </div>
          ) : null}

          {/* 1분 자기소개 */}
          <div className="rounded-3xl bg-[#fff4e8] p-5">
            <div className="flex items-center justify-between gap-2">
              {head(t("🎤 1분 자기소개", "🎤 1-min self-intro", "🎤 1分钟自我介绍", "🎤 Giới thiệu 1 phút", "🎤 1分自己紹介", "🎤 Perkenalan 1 menit"), "text-[#e8590c]")}
              {intro ? <LevelChip t={t} score={intro.score} /> : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-2)]">{intro ? intro.answer : t("아직 자기소개를 연습하지 않았어요. 거의 모든 면접의 첫 질문이라 꼭 한 번 연습해 두세요.", "No self-intro yet — it's the first question in almost every interview.", "还没练习自我介绍。这几乎是所有面试的第一题，一定要练一次。", "Chưa luyện tự giới thiệu — câu đầu tiên hầu như mọi buổi PV.", "まだ自己紹介を練習していません。ほぼ全ての面接の最初の質問です。", "Belum latihan perkenalan — pertanyaan pertama hampir di setiap wawancara.")}</p>
          </div>

          {/* 예상 질문과 내 답 */}
          {top.length ? (
            <div>
              {head(t("예상 질문과 내 답", "Likely questions & my answers", "预测问题与我的回答", "Câu hỏi dự kiến & câu trả lời", "予想質問と自分の回答", "Pertanyaan & jawabanku"), "text-[color:var(--v2-ink-2)]")}
              <ol className="mt-2 flex flex-col gap-2">
                {visible.map((r, i) => (
                  <li key={i} className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{r.question}</p>
                      <LevelChip t={t} score={r.score} />
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">{r.answer}</p>
                    {r.fromJob ? <p className="mt-1.5 text-[12px] font-semibold text-[color:var(--v2-accent)]">{t("이 공고로 연습한 답", "Practiced for this job", "此职位练习的回答", "Đã luyện cho tin này", "この求人で練習した回答", "Dilatih untuk lowongan ini")}</p> : null}
                  </li>
                ))}
              </ol>
              {top.length > 3 ? (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 h-10 text-[14px] font-semibold text-[color:var(--v2-muted)]">
                  {showAll ? t("접기", "Show less", "收起", "Thu gọn", "閉じる", "Tutup") : t(`${top.length - 3}개 더 보기`, `Show ${top.length - 3} more`, `再看 ${top.length - 3} 个`, `Xem thêm ${top.length - 3}`, `あと${top.length - 3}件`, `${top.length - 3} lagi`)}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* 이 회사에서 실제로 나온 질문(면접 후기) */}
          {reports.length ? (
            <div className="rounded-3xl bg-[#f3eeff] p-5">
              {head(t("💬 이 회사 면접에서 나온 질문", "💬 Asked in this company's interviews", "💬 该公司面试中出现的问题", "💬 Câu hỏi PV ở công ty này", "💬 この会社の面接で出た質問", "💬 Pertanyaan di perusahaan ini"), "text-[#7c4dff]")}
              <ul className="mt-2 flex flex-col gap-1.5">
                {reports.map((r) => (
                  <li key={r.id} className="text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                    · {r.question}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-[color:var(--v2-faint)]">{t("면접을 본 사람들이 남긴 질문이에요(익명).", "Shared anonymously by past interviewees.", "来自面试过的人（匿名）。", "Chia sẻ ẩn danh từ người đã PV.", "面接を受けた人の匿名共有です。", "Dibagikan anonim.")}</p>
            </div>
          ) : null}

          {/* 다시 볼 점 */}
          {recheck.length ? (
            <div className="rounded-3xl bg-[#fff0f3] p-5">
              {head(t("⚠️ 들어가기 전에 다시 볼 점", "⚠️ Review before you go in", "⚠️ 进场前再看一遍", "⚠️ Xem lại trước khi vào", "⚠️ 入る前に見直すこと", "⚠️ Tinjau sebelum masuk"), "text-[#e5484d]")}
              <ul className="mt-2 flex flex-col gap-1.5">
                {recheck.map((r) => (
                  <li key={r.label} className="text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                    <b>{r.label}</b> · {r.tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* 면접관에게 할 질문 */}
          <div className="rounded-3xl bg-[#edf1fd] p-5">
            {head(t("🙋 면접관에게 할 질문", "🙋 Questions to ask them", "🙋 可以问面试官的问题", "🙋 Câu hỏi cho người PV", "🙋 面接官への質問", "🙋 Pertanyaan untuk pewawancara"), "text-[color:var(--v2-accent)]")}
            <ul className="mt-2 flex flex-col gap-1.5">
              {askBack.map((q) => (
                <li key={q} className="text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                  · {q}
                </li>
              ))}
            </ul>
            {duty || preferred ? <p className="mt-2 text-[12px] text-[color:var(--v2-faint)]">{t("위 질문은 이 공고의 주요 업무·우대 사항으로 만들었어요.", "The top ones are based on this job's duties and preferences.", "前面的问题根据该职位的工作内容和优先条件生成。", "Các câu đầu dựa trên công việc & ưu tiên của tin.", "上の質問はこの求人の業務・歓迎条件から作りました。", "Pertanyaan atas berdasarkan tugas & preferensi lowongan.")}</p> : null}
          </div>
        </div>
      )}
    </Sheet>
  );
}
