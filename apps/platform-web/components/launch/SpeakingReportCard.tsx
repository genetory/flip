"use client";

// 말하기 리포트 — 말로 답한 한 문항의 말 빠르기·군말·멈춤·문장 길이·말투 + 어색한 표현 고치기 + 말로 하기 좋은 답(듣기).
// 내용 점수와 별개(말하기 연습 도움). 발음·억양은 평가하지 않는다.
import { SpeakButton, useSpeak } from "../v2/practice";
import { usePlatformT } from "../../lib/i18n";
import { useLaunchT } from "../../lib/launch/i18n";
import type { SpeakingData } from "../../lib/launch/speaking";

export function SpeakingReportCard({ data }: { data: SpeakingData }) {
  const t = useLaunchT();
  const pt = usePlatformT();
  const tts = useSpeak();
  const m = data.metrics;
  const r = data.report;
  const paceText =
    m.pace === "slow"
      ? t("조금 느려요", "A bit slow", "稍慢", "Hơi chậm", "少し遅め", "Agak lambat")
      : m.pace === "fast"
        ? t("조금 빨라요", "A bit fast", "稍快", "Hơi nhanh", "少し速め", "Agak cepat")
        : t("알맞아요", "Good pace", "刚好", "Vừa phải", "ちょうど良い", "Pas");
  const cells = [
    { label: t("말 빠르기", "Pace", "语速", "Tốc độ", "話す速さ", "Kecepatan"), value: t(`분당 ${m.cpm}자`, `${m.cpm}/min`, `每分钟 ${m.cpm} 字`, `${m.cpm}/phút`, `毎分${m.cpm}字`, `${m.cpm}/menit`), note: paceText, warn: m.pace !== "good" },
    { label: t("군말", "Fillers", "口头禅", "Từ đệm", "口癖", "Pengisi"), value: t(`${m.fillers}번`, `${m.fillers}`, `${m.fillers} 次`, `${m.fillers}`, `${m.fillers}回`, `${m.fillers}`), note: m.fillers > 2 ? t("줄여 봐요", "Cut down", "尽量减少", "Giảm bớt", "減らそう", "Kurangi") : t("좋아요", "Good", "很好", "Tốt", "良い", "Bagus"), warn: m.fillers > 2 },
    { label: t("긴 멈춤", "Long pauses", "长停顿", "Ngắt lâu", "長い間", "Jeda lama"), value: t(`${m.pauses}번`, `${m.pauses}`, `${m.pauses} 次`, `${m.pauses}`, `${m.pauses}回`, `${m.pauses}`), note: t("3초 넘게", "Over 3s", "超过 3 秒", "Trên 3 giây", "3秒以上", "Lebih 3 dtk"), warn: m.pauses > 2 },
    { label: t("긴 문장", "Long sentences", "长句", "Câu dài", "長い文", "Kalimat panjang"), value: t(`${m.longSentences}개`, `${m.longSentences}`, `${m.longSentences} 句`, `${m.longSentences}`, `${m.longSentences}文`, `${m.longSentences}`), note: t(`평균 ${m.avgSentence}자`, `Avg ${m.avgSentence}`, `平均 ${m.avgSentence} 字`, `TB ${m.avgSentence}`, `平均${m.avgSentence}字`, `Rata ${m.avgSentence}`), warn: m.longSentences > 0 }
  ];
  const honor = r?.honorific;
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-[color:var(--v2-line)]">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--v2-ink-2)]">
        <span aria-hidden>🗣️</span> {t("말하기 리포트", "Speaking report", "口语报告", "Báo cáo nói", "スピーキングレポート", "Laporan bicara")}
        <span className="font-semibold text-[color:var(--v2-faint)]">· {t(`${m.durationSec}초 말함`, `${m.durationSec}s spoken`, `说了 ${m.durationSec} 秒`, `Nói ${m.durationSec}s`, `${m.durationSec}秒`, `${m.durationSec} dtk`)}</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className={`rounded-xl px-3 py-2.5 ${c.warn ? "bg-[#fff4e8]" : "bg-[color:var(--v2-fill)]"}`}>
            <p className="text-[11.5px] font-semibold text-[color:var(--v2-muted)]">{c.label}</p>
            <p className="mt-0.5 text-[16px] font-bold tabular-nums text-[color:var(--v2-ink)]">{c.value}</p>
            <p className={`text-[11.5px] font-semibold ${c.warn ? "text-[#c2410c]" : "text-[color:var(--v2-good)]"}`}>{c.note}</p>
          </div>
        ))}
      </div>
      {r ? (
        <div className="mt-3 flex flex-col gap-3">
          {r.oneLine ? <p className="break-keep rounded-xl bg-[color:var(--v2-accent-weak)] px-3.5 py-2.5 text-[14px] font-semibold leading-[1.55] text-[#28407A]">💡 {r.oneLine}</p> : null}
          {r.honorificNote ? (
            <p className="break-keep text-[13px] leading-[1.55] text-[color:var(--v2-ink-3)]">
              <span className={`mr-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-bold ${honor === "consistent" ? "bg-[#E7F7EF] text-[color:var(--v2-good)]" : "bg-[#fff4e8] text-[#c2410c]"}`}>
                {honor === "consistent" ? t("말투 일관", "Consistent tone", "语气一致", "Giọng nhất quán", "口調OK", "Konsisten") : honor === "casual" ? t("반말 있음", "Casual speech", "有非敬语", "Có nói trống", "タメ口あり", "Ada bahasa santai") : t("말투 섞임", "Mixed tone", "语气混用", "Giọng lẫn lộn", "口調が混在", "Campur")}
              </span>
              {r.honorificNote}
            </p>
          ) : null}
          {r.fixes?.length ? (
            <div>
              <p className="text-[12px] font-bold text-[color:var(--v2-ink-2)]">{t("이렇게 말하면 더 자연스러워요", "Sounds more natural like this", "这样说更自然", "Nói thế này tự nhiên hơn", "こう言うと自然です", "Lebih alami begini")}</p>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {r.fixes.map((f, i) => (
                  <li key={i} className="rounded-xl bg-[color:var(--v2-fill)] px-3.5 py-2.5">
                    <p className="break-keep text-[13px] text-[color:var(--v2-muted)] line-through decoration-[color:var(--v2-attention)]/60">{f.original}</p>
                    <p className="mt-0.5 break-keep text-[14px] font-semibold text-[color:var(--v2-ink)]">→ {f.better}</p>
                    {f.why ? <p className="mt-0.5 break-keep text-[12px] text-[color:var(--v2-faint)]">{f.why}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.spokenVersion ? (
            <div className="rounded-xl bg-[color:var(--v2-band)] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold text-[color:var(--v2-ink-2)]">{t("말로 하기 좋게 다듬은 내 답", "Your answer, ready to say", "适合口说的我的回答", "Câu trả lời để nói", "話しやすく整えた回答", "Jawabanmu, siap diucapkan")}</p>
                <SpeakButton t={pt} tts={tts} text={r.spokenVersion} />
              </div>
              <p className="mt-1.5 whitespace-pre-wrap break-keep text-[14px] leading-[1.65] text-[color:var(--v2-ink-2)]">{r.spokenVersion}</p>
            </div>
          ) : null}
          {r.tips?.length ? (
            <ul className="flex flex-col gap-1">
              {r.tips.map((x, i) => (
                <li key={i} className="flex gap-1.5 break-keep text-[13px] leading-[1.55] text-[color:var(--v2-ink-3)]">
                  <span aria-hidden>·</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-[11.5px] leading-[1.5] text-[color:var(--v2-faint)]">{t("음성 인식으로 받아 적은 글을 기준으로 해요. 발음·억양은 평가하지 않아요.", "Based on the speech-to-text transcript. Pronunciation and accent are not judged.", "基于语音识别文字，不评价发音与口音。", "Dựa trên văn bản nhận giọng nói. Không chấm phát âm.", "音声認識の文字をもとにしています。発音・アクセントは評価しません。", "Berdasarkan transkrip. Pelafalan tidak dinilai.")}</p>
    </div>
  );
}
