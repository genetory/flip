"use client";

// Week 3 키스톤 — Interview Score. 자기소개·직무·인성·압박 모의면접을 종합 채점해
// 점수·5개 영역·강점·개선점을 보여준다. 면접은 별도 피드백 섹션이 없어 강점/개선을 함께 노출(showSections).
import { ScoreCard, type ScoreFetch } from "./ScoreCard";
import { fetchInterviewScore } from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function InterviewScoreCard() {
  const t = useLaunchT();
  const fetchScore: ScoreFetch = async (opts) => {
    const r = await fetchInterviewScore(opts);
    if (!r.score) return { view: null, stale: r.stale, needsGenerate: r.needsGenerate, unavailable: r.unavailable };
    return {
      view: {
        total: r.score.total,
        breakdown: [
          { label: t("답변 구조", "Structure", "回答结构", "Cấu trúc", "回答構成", "Struktur"), value: r.score.breakdown.structure },
          { label: t("구체성", "Specificity", "具体性", "Cụ thể", "具体性", "Spesifik"), value: r.score.breakdown.specificity },
          { label: t("직무 이해", "Job grasp", "职务理解", "Hiểu nghề", "職務理解", "Paham peran"), value: r.score.breakdown.jobUnderstanding },
          { label: t("논리성", "Logic", "逻辑性", "Logic", "論理性", "Logika"), value: r.score.breakdown.logic },
          { label: t("설득력", "Persuasion", "说服力", "Thuyết phục", "説得力", "Persuasi"), value: r.score.breakdown.persuasiveness }
        ],
        why: r.score.why,
        sections: [
          ...(r.score.good?.length ? [{ title: t("잘한 점", "Strengths", "做得好", "Điểm mạnh", "良い点", "Kelebihan"), tone: "good" as const, items: r.score.good }] : []),
          ...(r.score.improve?.length ? [{ title: t("보완할 점", "Improve these", "需改进", "Cần cải thiện", "改善点", "Perbaiki"), tone: "info" as const, items: r.score.improve }] : [])
        ]
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
      ctaTitle={t("내 모의면접 점수를 받아보세요", "Get your Interview Score", "领取你的面试分数", "Nhận điểm phỏng vấn của bạn", "模擬面接スコアを受け取りましょう", "Dapatkan skor wawancaramu")}
      ctaDesc={t("자기소개·직무·인성·압박 면접 답변을 종합해 구조·구체성·직무이해·논리·설득력을 평가해드려요.", "We review your self/job/fit/pressure answers for structure, specificity, job grasp, logic, and persuasion.", "综合自我介绍·职务·人性·压力面试回答，评估结构、具体性、职务理解、逻辑与说服力。", "Tổng hợp câu trả lời tự giới thiệu/nghề/nhân cách/áp lực để đánh giá cấu trúc, cụ thể, hiểu nghề, logic, thuyết phục.", "自己紹介・職務・人柄・圧迫面接の回答を総合し、構成・具体性・職務理解・論理・説得力を評価します。", "Kami menilai jawaban perkenalan/peran/kepribadian/tekanan untuk struktur, spesifisitas, pemahaman peran, logika, dan persuasi.")}
      ctaLabel={t("면접 평가 받기", "Score my interview", "评估我的面试", "Chấm điểm phỏng vấn", "面接を評価する", "Nilai wawancara saya")}
      editHref="/career-launch/program?week=3"
      editLabel={t("면접 더 보기", "More interviews", "继续面试", "Phỏng vấn thêm", "面接を続ける", "Wawancara lagi")}
      showSections
    />
  );
}
