"use client";

// Week 2 키스톤 — Resume Score. 공용 ScoreCard 에 이력서 점수를 i18n ScoreView 로 매핑해 넘긴다.
import { ScoreCard, type ScoreFetch } from "./ScoreCard";
import { fetchResumeScore } from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function ResumeScoreCard() {
  const t = useLaunchT();
  const fetchScore: ScoreFetch = async (opts) => {
    const r = await fetchResumeScore(opts);
    if (!r.score) return { view: null, stale: r.stale, needsGenerate: r.needsGenerate, unavailable: r.unavailable };
    return {
      view: {
        total: r.score.total,
        breakdown: [
          { label: t("구체성", "Specificity", "具体性", "Cụ thể", "具体性", "Spesifik"), value: r.score.breakdown.specificity },
          { label: t("성과 표현", "Achievements", "成果表达", "Thành tích", "成果表現", "Pencapaian"), value: r.score.breakdown.achievement },
          { label: t("직무 연관성", "Relevance", "职务相关", "Liên quan nghề", "職務関連", "Relevansi"), value: r.score.breakdown.relevance },
          { label: t("가독성", "Readability", "可读性", "Dễ đọc", "可読性", "Keterbacaan"), value: r.score.breakdown.readability }
        ],
        why: r.score.why,
        sections: r.score.tips.length
          ? [{ title: t("바로 고칠 개선 팁", "Quick tips to improve", "改进建议", "Gợi ý cải thiện", "改善のヒント", "Tips perbaikan"), tone: "info" as const, items: r.score.tips }]
          : []
      },
      stale: r.stale,
      needsGenerate: r.needsGenerate,
      unavailable: r.unavailable
    };
  };
  return (
    <ScoreCard
      fetchScore={fetchScore}
      scoreLabel="Resume Score"
      badgeEmoji="📄"
      badgeLabel="RESUME READY"
      ctaTitle={t("내 이력서 점수를 받아보세요", "Get your Resume Score", "领取你的简历分数", "Nhận điểm hồ sơ của bạn", "履歴書スコアを受け取りましょう", "Dapatkan skor resume-mu")}
      ctaDesc={t("채용 담당자 관점에서 구체성·성과표현·직무연관성·가독성을 평가해드려요.", "We evaluate specificity, achievements, relevance, and readability like a recruiter.", "从招聘者角度评估具体性、成果表达、职务相关性与可读性。", "Đánh giá tính cụ thể, thành tích, liên quan nghề và dễ đọc như nhà tuyển dụng.", "採用担当者の視点で具体性・成果表現・職務関連性・可読性を評価します。", "Kami menilai spesifisitas, pencapaian, relevansi, dan keterbacaan seperti perekrut.")}
      ctaLabel={t("이력서 평가 받기", "Score my resume", "评估我的简历", "Chấm điểm hồ sơ", "履歴書を評価する", "Nilai resume saya")}
    />
  );
}
