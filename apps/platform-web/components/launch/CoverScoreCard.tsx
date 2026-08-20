"use client";

// Week 3 키스톤 — Cover Letter Score. 공용 ScoreCard 재사용.
import { ScoreCard, type ScoreFetch } from "./ScoreCard";
import { fetchCoverScore } from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function CoverScoreCard() {
  const t = useLaunchT();
  const fetchScore: ScoreFetch = async (opts) => {
    const r = await fetchCoverScore(opts);
    if (!r.score) return { view: null, stale: r.stale, needsGenerate: r.needsGenerate, unavailable: r.unavailable };
    const sections: { title: string; tone: "good" | "warn" | "info"; items: string[] }[] = [];
    if (r.score.aiFlags.length) sections.push({ title: t("AI 티가 나거나 추상적인 표현", "AI-sounding or vague phrasing", "有AI感或过于抽象的表达", "Câu văn giống AI hoặc mơ hồ", "AIっぽい/抽象的な表現", "Frasa terkesan AI atau kabur"), tone: "warn", items: r.score.aiFlags });
    if (r.score.tips.length) sections.push({ title: t("바로 고칠 개선 팁", "Quick tips to improve", "改进建议", "Gợi ý cải thiện", "改善のヒント", "Tips perbaikan"), tone: "info", items: r.score.tips });
    return {
      view: {
        total: r.score.total,
        breakdown: [
          { label: t("논리성", "Logic", "逻辑性", "Logic", "論理性", "Logika"), value: r.score.breakdown.logic },
          { label: t("구체성", "Specificity", "具体性", "Cụ thể", "具体性", "Spesifik"), value: r.score.breakdown.specificity },
          { label: t("직무 연관성", "Relevance", "职务相关", "Liên quan nghề", "職務関連", "Relevansi"), value: r.score.breakdown.relevance },
          { label: t("기업 이해도", "Company insight", "企业理解", "Hiểu công ty", "企業理解", "Paham perusahaan"), value: r.score.breakdown.companyUnderstanding },
          { label: t("진정성", "Authenticity", "真诚度", "Chân thành", "誠実さ", "Ketulusan"), value: r.score.breakdown.authenticity }
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
      scoreLabel="Cover Letter Score"
      badgeEmoji="✍️"
      badgeLabel="COVER LETTER READY"
      ctaTitle={t("내 자기소개서 점수를 받아보세요", "Get your Cover Letter Score", "领取你的自我介绍分数", "Nhận điểm thư giới thiệu", "自己紹介書スコアを受け取りましょう", "Dapatkan skor surat lamaranmu")}
      ctaDesc={t("논리성·구체성·직무연관성·기업이해도·진정성을 평가하고, AI 티나는 표현도 짚어드려요.", "We assess logic, specificity, relevance, company insight, and authenticity — and flag AI-sounding phrasing.", "评估逻辑、具体性、职务相关、企业理解与真诚度，并指出有AI感的表达。", "Đánh giá logic, cụ thể, liên quan, hiểu công ty, chân thành — và chỉ ra câu giống AI.", "論理性・具体性・職務関連性・企業理解・誠実さを評価し、AIっぽい表現も指摘します。", "Menilai logika, spesifisitas, relevansi, wawasan perusahaan, ketulusan — dan menandai frasa yang terkesan AI.")}
      ctaLabel={t("자기소개서 평가 받기", "Score my cover letter", "评估我的自我介绍", "Chấm điểm thư", "自己紹介書を評価する", "Nilai surat lamaran")}
    />
  );
}
