"use client";

// Week 2 — JD Match. 관심 공고(JD)를 붙여넣으면 이력서·Experience Bank와 대조해 매칭도·충족/부족을 보여준다.
import { useState } from "react";
import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import { runJdMatch, type JdMatchResult } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

const STATUS_STYLE: Record<string, { icon: string; cls: string }> = {
  matched: { icon: "✅", cls: "text-[#0A9B59]" },
  partial: { icon: "△", cls: "text-[#C77700]" },
  missing: { icon: "❌", cls: "text-[#E5484D]" }
};

export function JdMatchCard() {
  const t = useLaunchT();
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JdMatchResult | null>(null);
  const [err, setErr] = useState("");

  const analyze = async () => {
    const text = jd.trim();
    if (text.length < 20 || busy) return;
    setBusy(true);
    setErr("");
    try {
      const { result: r, needsResume } = await runJdMatch(text);
      if (needsResume) setErr(t("먼저 이력서를 작성해 주세요.", "Please build your resume first.", "请先完成简历。", "Hãy hoàn thành hồ sơ trước.", "先に履歴書を作成してください。", "Susun resume dulu."));
      else setResult(r);
    } catch (e) {
      const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
      setErr(quota ? t("AI 포인트를 모두 사용했어요.", "You're out of AI points.", "AI积分已用完。", "Hết điểm AI.", "AIポイントを使い切りました。", "Poin AI habis.") : t("잠시 문제가 생겼어요. 다시 시도해 주세요.", "Something went wrong. Please try again.", "出现了一点问题，请重试。", "Đã xảy ra sự cố. Vui lòng thử lại.", "問題が発生しました。もう一度お試しください。", "Terjadi masalah. Coba lagi."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="md:!p-6">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]"><MagnifyingGlass className="h-4 w-4" weight="bold" /> JD Match</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("관심 있는 채용공고를 붙여넣으면 내 이력서와 얼마나 맞는지, 어떤 경험을 강조하면 좋을지 알려드려요.", "Paste a job posting to see how well your resume matches and which experiences to emphasize.", "粘贴感兴趣的招聘公告，看看你的简历匹配度以及该强调哪些经验。", "Dán tin tuyển dụng để xem hồ sơ khớp bao nhiêu và nên nhấn mạnh kinh nghiệm nào.", "気になる求人を貼ると、履歴書との一致度と強調すべき経験を教えます。", "Tempel lowongan untuk melihat kecocokan resume dan pengalaman mana yang ditekankan.")}</p>

      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={4}
        placeholder={t("채용공고 내용을 붙여넣어 주세요 (주요 업무·자격요건 등)", "Paste the job posting (responsibilities, requirements, etc.)", "粘贴招聘公告内容（主要职责、任职要求等）", "Dán nội dung tin tuyển dụng (công việc, yêu cầu…)", "求人内容を貼り付けてください（主な業務・応募資格など）", "Tempel isi lowongan (tugas, syarat, dll.)")}
        className="mt-3 w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        {err ? <p className="text-[12.5px] font-semibold text-[#F04452]">{err}</p> : <span />}
        <button type="button" onClick={analyze} disabled={jd.trim().length < 20 || busy} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition ${jd.trim().length >= 20 && !busy ? "bg-[#191F28] text-white hover:bg-[#0B1227]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
          {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
          {busy ? t("분석 중…", "Analyzing…", "分析中…", "Đang phân tích…", "分析中…", "Menganalisis…") : t("JD 매칭 분석", "Analyze match", "分析匹配", "Phân tích khớp", "マッチ分析", "Analisis kecocokan")}
        </button>
      </div>

      {result ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-2xl bg-[#F8FAFF] p-5 text-center">
            <p className="text-[12px] font-bold text-[#8B95A1]">JD Match</p>
            <p className="mt-1 text-[40px] font-black leading-none tracking-[-0.03em] text-[#0B1227]">{result.matchPercent}<span className="text-[18px] font-bold text-[#B0B8C1]">%</span></p>
          </div>
          <div className="flex flex-col gap-1.5">
            {result.classification.map((c, i) => {
              const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.partial;
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-[#EEF1F5] px-3 py-2">
                  <span className={`shrink-0 text-[13px] ${s.cls}`}>{s.icon}</span>
                  <span className="min-w-0 flex-1 break-keep text-[13px] text-[#333D4B]">{c.item}</span>
                </div>
              );
            })}
          </div>
          {result.emphasize.length > 0 ? (
            <div className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className="text-[11.5px] font-bold text-[#0B46E8]">💡 {t("이 공고에 강조하면 좋은 경험", "Experiences to emphasize", "值得强调的经验", "Kinh nghiệm nên nhấn mạnh", "強調すると良い経験", "Pengalaman untuk ditekankan")}</p>
              <ul className="mt-2 space-y-1.5">
                {result.emphasize.map((e, i) => (
                  <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]"><span className="font-bold text-[#191F28]">{e.experience}</span> — {e.why}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
