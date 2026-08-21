"use client";

// Week 2 — Resume Bullet 개선. 거친 문장을 넣으면 Action/Method/Result로 다듬어 Before→After.
import { useState } from "react";
import { CircleNotch, MagicWand, ArrowRight } from "@phosphor-icons/react";
import { improveResumeBullet } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

export function ResumeBulletCard() {
  const t = useLaunchT();
  const [bullet, setBullet] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ before: string; after: string; tips: string[] } | null>(null);
  const [err, setErr] = useState("");

  const run = async () => {
    const b = bullet.trim();
    if (b.length < 2 || busy) return;
    setBusy(true);
    setErr("");
    try {
      setResult(await improveResumeBullet(b));
    } catch (e) {
      const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
      setErr(quota ? t("AI 포인트를 모두 사용했어요.", "You're out of AI points.", "AI积分已用完。", "Hết điểm AI.", "AIポイントを使い切りました。", "Poin AI habis.") : t("잠시 문제가 생겼어요. 다시 시도해 주세요.", "Something went wrong. Please try again.", "出现了一点问题，请重试。", "Đã xảy ra sự cố. Vui lòng thử lại.", "問題が発生しました。もう一度お試しください。", "Terjadi masalah. Coba lagi."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="md:!p-6">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]"><MagicWand className="h-4 w-4" weight="fill" /> {t("이력서 문장 다듬기", "Improve a resume bullet", "润色简历句子", "Chỉnh câu hồ sơ", "履歴書の文を磨く", "Poles kalimat resume")}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("거칠게 쓴 문장을 넣으면 채용담당자가 읽기 좋은 개조식으로 다듬어드려요. 없는 숫자는 지어내지 않아요.", "Paste a rough line and we'll sharpen it into a recruiter-ready bullet — never inventing numbers.", "输入粗略的句子，我们会润色成招聘者易读的条目，绝不编造数字。", "Dán câu thô, chúng tôi mài thành gạch đầu dòng cho NTD — không bịa số liệu.", "ざっくり書いた文を採用担当が読みやすい箇条書きに磨きます。数字は捏造しません。", "Tempel kalimat kasar, kami poles jadi butir siap-perekrut — tanpa mengarang angka.")}</p>

      <textarea
        value={bullet}
        onChange={(e) => setBullet(e.target.value)}
        rows={2}
        placeholder={t("예: SNS를 관리했습니다", "e.g. Managed our SNS", "例：管理了SNS", "VD: Quản lý SNS", "例：SNSを管理しました", "cth: Mengelola SNS")}
        className="mt-3 w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        {err ? <p className="text-[12.5px] font-semibold text-[#F04452]">{err}</p> : <span />}
        <button type="button" onClick={run} disabled={bullet.trim().length < 2 || busy} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition ${bullet.trim().length >= 2 && !busy ? "bg-[#191F28] text-white hover:bg-[#0B1227]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
          {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
          {busy ? t("다듬는 중…", "Improving…", "润色中…", "Đang chỉnh…", "改善中…", "Memoles…") : t("다듬기", "Improve", "润色", "Chỉnh", "磨く", "Poles")}
        </button>
      </div>

      {result ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div className="flex-1 rounded-xl border border-[#EEF1F5] bg-[#FAFBFC] p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">Before</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1] line-through">{result.before}</p>
            </div>
            <div className="hidden items-center sm:flex"><ArrowRight className="h-5 w-5 text-[#0B46E8]" weight="bold" /></div>
            <div className="flex-1 rounded-xl border border-[#D8E4FF] bg-[#F8FAFF] p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">After</p>
              <p className="mt-1 break-keep text-[13.5px] font-semibold leading-relaxed text-[#0B1227]">{result.after}</p>
            </div>
          </div>
          {result.tips.length > 0 ? (
            <div className="rounded-xl border border-[#EEF1F5] p-3.5">
              <p className="text-[11.5px] font-bold text-[#C77700]">💡 {t("이걸 추가하면 더 강해져요", "Add these to make it stronger", "补充这些会更有力", "Thêm để mạnh hơn", "これを足すともっと強く", "Tambahkan agar lebih kuat")}</p>
              <ul className="mt-1.5 space-y-1">{result.tips.map((tp, i) => <li key={i} className="break-keep text-[12.5px] leading-relaxed text-[#333D4B]">· {tp}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
