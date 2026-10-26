"use client";

// 커리어런치 면접 한 문항 — 탤런트 모의 면접과 같은 연습 시트(PracticeSheet: 실전 모드 60초 타이머·말로 답하기·
// 단계 평가·잘한 점/고칠 점·고쳐 쓴 예시·고쳐서 다시 답하기)를 쓴다. 다른 점만 여기서 붙인다:
// 채점은 커리어런치 엔드포인트(프로그램 안이라 포인트 차감 없음), 말하기 리포트, 꼬리 질문 면접관, 결과 보기.
// 3주차 기본 면접·4주차 공고별 면접이 같이 쓴다.
import { useRef, useState } from "react";
import { PracticeSheet, type SpeechTotals } from "../v2/practice";
import type { InterviewFeedback } from "../../lib/member-profile-client";
import type { PostingScore } from "../../lib/launch/posting-interview";
import type { PostingInterviewItem } from "../../lib/launch/progress-client";
import { analyzeSpeaking, type SpeakingData } from "../../lib/launch/speaking";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { SpeakingReportCard } from "./SpeakingReportCard";
import { FollowUpBadge, FollowUpButton } from "./voice-answer";

export function CareerPracticeSheet({
  heading,
  progress,
  question,
  category,
  depth,
  intent,
  context,
  score,
  onRecord,
  onFollowUp,
  onNext,
  nextBusy,
  nextError,
  onFinish
}: {
  heading: string;
  progress: string;
  question: string;
  category: string;
  /** 꼬리 질문 깊이(0 = 원래 질문) — 질문당 최대 2번 */
  depth: number;
  intent?: string;
  /** 꼬리 질문 면접관에게 줄 맥락(면접 유형·공고) */
  context: string;
  score: (question: string, answer: string) => Promise<PostingScore>;
  /** 채점이 끝날 때마다(다시 답하면 같은 문항을 바꿔 쓴다). 말하기 리포트가 나중에 오면 한 번 더 부른다. */
  onRecord: (item: PostingInterviewItem) => void;
  onFollowUp: (question: string, intent: string) => void;
  onNext?: () => void;
  nextBusy?: boolean;
  nextError?: boolean;
  onFinish: () => void;
}) {
  const t = useLaunchT();
  const lastScore = useRef<PostingScore | null>(null);
  const [answered, setAnswered] = useState<{ answer: string; speaking?: SpeakingData; analyzing: boolean } | null>(null);

  const grade = async (q: string, a: string): Promise<InterviewFeedback> => {
    const s = await score(q, a);
    lastScore.current = s;
    // 커리어런치 채점의 한 줄 피드백은 '고칠 점' 맨 앞에 — 연습 시트가 그 줄을 한눈 평가로 보여 준다.
    const improvements = [s.feedback, ...s.improvements].map((x) => x.trim()).filter(Boolean);
    return { score: s.score, strengths: s.strengths, improvements: [...new Set(improvements)], sampleAnswer: s.modelAnswer };
  };

  const save = (q: string, a: string, speech: SpeechTotals | null | undefined) => {
    const s = lastScore.current;
    if (!s) return;
    const item: PostingInterviewItem = { question: q, answer: a, score: s.score, modelAnswer: s.modelAnswer, feedback: s.feedback, strengths: s.strengths, improvements: s.improvements, ...(depth > 0 ? { followUp: true } : {}) };
    onRecord(item);
    if (!speech?.transcript) {
      setAnswered({ answer: a, analyzing: false });
      return;
    }
    // 말로 답했으면 말하기 리포트 — 내용 평가는 먼저 보여 주고, 리포트는 오는 대로 붙인다.
    setAnswered({ answer: a, analyzing: true });
    void analyzeSpeaking({ question: q, transcript: speech.transcript, durationSec: Math.max(1, speech.ms / 1000), pauses: speech.pauses })
      .then((sp) => {
        trackCareerFunnel("career_speaking_analyzed", { cpm: sp.metrics.cpm });
        const speaking: SpeakingData = { mode: "voice", at: new Date().toISOString(), metrics: sp.metrics, report: sp.report, transcript: speech.transcript };
        onRecord({ ...item, speakingData: speaking });
        setAnswered((cur) => (cur && cur.answer === a ? { ...cur, speaking, analyzing: false } : cur));
      })
      .catch(() => setAnswered((cur) => (cur && cur.answer === a ? { ...cur, analyzing: false } : cur)));
  };

  const extra = answered ? (
    <div className="flex flex-col gap-2">
      {answered.speaking ? <SpeakingReportCard data={answered.speaking} /> : null}
      {answered.analyzing ? <p className="text-[13px] text-[color:var(--v2-faint)]">{t("말하기 리포트를 만들고 있어요…", "Preparing your speaking report…", "正在生成口语报告…", "Đang tạo báo cáo nói…", "話し方レポートを作成中…", "Menyiapkan laporan bicara…")}</p> : null}
      {/* 실전처럼 — 면접관이 방금 답을 파고든다(질문당 최대 2번) */}
      <FollowUpButton question={question} answer={answered.answer} context={context} depth={depth} onReady={onFollowUp} />
      <button type="button" onClick={onFinish} disabled={nextBusy} className="w-full rounded-2xl bg-[color:var(--v2-band)] px-5 py-2.5 text-[14px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)] disabled:opacity-60">
        {t("여기까지 · 결과 보기", "Finish · see results", "到此为止 · 查看结果", "Dừng · xem kết quả", "ここまで · 結果を見る", "Selesai · lihat hasil")}
      </button>
      {nextError ? <p className="text-center text-[13px] font-semibold text-[color:var(--v2-attention)]">{t("다음 질문을 만들지 못했어요. 다시 시도해 주세요.", "Couldn't create the next question. Please try again.", "无法生成下一题，请重试。", "Không tạo được câu hỏi tiếp. Thử lại nhé.", "次の質問を作れませんでした。もう一度お試しください。", "Gagal membuat soal berikutnya. Coba lagi.")}</p> : null}
    </div>
  ) : null;

  return (
    <PracticeSheet
      heading={heading}
      progress={progress}
      question={{ ko: question, shown: question, category }}
      intent={depth > 0 ? undefined : intent}
      grade={grade}
      onSave={(q, a, _fb, speech) => save(q.ko, a, speech)}
      onNext={onNext}
      nextBusy={nextBusy}
      onClose={onFinish}
      resultExtra={extra}
      header={depth > 0 ? <FollowUpBadge depth={depth} intent={intent} /> : undefined}
      // 커리어런치는 실전처럼 60초 제한을 켠 채로 시작한다(스위치로 끌 수 있다)
      defaultTimed
    />
  );
}
