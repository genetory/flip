"use client";

// Week 4 키스톤 — Interview Score. 공용 ScoreCard 재사용.
import { ScoreCard, type ScoreFetch } from "./ScoreCard";
import { fetchInterviewScore } from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function InterviewScoreCard() {
  const t = useLaunchT();
  const fetchScore: ScoreFetch = async (opts) => {
    const r = await fetchInterviewScore(opts);
    if (!r.score) return { view: null, stale: r.stale, needsGenerate: r.needsGenerate, unavailable: r.unavailable };
    const sections: { title: string; tone: "good" | "warn" | "info"; items: string[] }[] = [];
    if (r.score.good.length) sections.push({ title: t("잘한 답변", "What went well", "回答亮点", "Trả lời tốt", "良かった回答", "Jawaban bagus"), tone: "good", items: r.score.good });
    if (r.score.improve.length) sections.push({ title: t("개선할 답변", "Answers to improve", "需改进的回答", "Cần cải thiện", "改善する回答", "Perlu diperbaiki"), tone: "warn", items: r.score.improve });
    if (r.score.retryTop5.length) sections.push({ title: t("다시 연습할 질문 TOP 5", "Top 5 to re-practice", "值得再练的问题 TOP 5", "5 câu nên luyện lại", "再練習したい質問 TOP5", "5 pertanyaan untuk dilatih ulang"), tone: "info", items: r.score.retryTop5 });
    return {
      view: {
        total: r.score.total,
        breakdown: [
          { label: t("답변 구조", "Structure", "回答结构", "Cấu trúc", "回答構造", "Struktur"), value: r.score.breakdown.structure },
          { label: t("구체성", "Specificity", "具体性", "Cụ thể", "具体性", "Spesifik"), value: r.score.breakdown.specificity },
          { label: t("직무 이해도", "Job insight", "职务理解", "Hiểu nghề", "職務理解", "Paham peran"), value: r.score.breakdown.jobUnderstanding },
          { label: t("논리성", "Logic", "逻辑性", "Logic", "論理性", "Logika"), value: r.score.breakdown.logic },
          { label: t("설득력", "Persuasion", "说服力", "Thuyết phục", "説得力", "Persuasi"), value: r.score.breakdown.persuasiveness }
        ],
        why: r.score.why,
        sections
      },
      stale: r.stale,
      needsGenerate: r.needsGenerate,
      unavailable: r.unavailable
    };
  };
  return (
    <ScoreCard
      fetchScore={fetchScore}
      scoreLabel="Interview Score"
      badgeEmoji="🎤"
      badgeLabel="INTERVIEW READY"
      ctaTitle={t("내 모의면접 점수를 받아보세요", "Get your Interview Score", "领取你的面试分数", "Nhận điểm phỏng vấn", "模擬面接スコアを受け取りましょう", "Dapatkan skor wawancaramu")}
      ctaDesc={t("연습한 모의면접을 종합해 답변구조·구체성·직무이해도·논리성·설득력을 평가하고, 다시 연습할 질문을 알려드려요.", "We combine your mock interviews to assess structure, specificity, job insight, logic, and persuasion — and list questions to re-practice.", "综合你的模拟面试，评估结构、具体性、职务理解、逻辑与说服力，并列出值得再练的问题。", "Tổng hợp các buổi phỏng vấn thử để đánh giá cấu trúc, cụ thể, hiểu nghề, logic, thuyết phục — và gợi ý câu nên luyện lại.", "模擬面接を統合して回答構造・具体性・職務理解・論理性・説得力を評価し、再練習する質問を提示します。", "Menggabungkan wawancara simulasi untuk menilai struktur, spesifisitas, wawasan peran, logika, dan persuasi — serta daftar pertanyaan untuk dilatih ulang.")}
      ctaLabel={t("모의면접 평가 받기", "Score my interview", "评估我的面试", "Chấm điểm phỏng vấn", "面接を評価する", "Nilai wawancara saya")}
    />
  );
}
