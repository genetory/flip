"use client";

// 말하기 성장 — 말로 답한 문항들(speakingData)의 처음과 최근을 비교한다(4주 동안 말하기가 나아지는지).
// 서버 호출 없이 면접 기록(state.basicInterviews·postingInterviews)에서 계산.
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";
import type { PostingInterviewLog } from "../../lib/launch/progress-client";
import type { SpeakingData } from "../../lib/launch/speaking";

type Row = { key: string; label: string; first: number; recent: number; unit: string; better: "down" | "up" | "band" };

export function SpeakingGrowthCard({ logs }: { logs: PostingInterviewLog[] }) {
  const t = useLaunchT();
  const voice: SpeakingData[] = logs
    .flatMap((l) => (l.items ?? []).map((it) => it.speakingData).filter((x): x is SpeakingData => Boolean(x?.metrics)))
    .sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
  if (voice.length === 0) {
    return (
      <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
        <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">🗣️ {t("말로 답하면 말하기 실력이 기록돼요", "Answer by voice to track your speaking", "用语音作答即可记录口语进步", "Trả lời bằng giọng để theo dõi kỹ năng nói", "声で答えると話す力が記録されます", "Jawab dengan suara untuk melacak kemampuan bicara")}</p>
        <p className="mt-1 break-keep text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("면접 연습에서 [말로 답하기]를 누르면 말 빠르기·군말·멈춤·말투를 재서, 4주 동안 얼마나 나아졌는지 보여 드려요.", "Tap [Answer by voice] in practice — we measure pace, fillers, pauses and tone, and show your progress over 4 weeks.", "在面试练习中点击[语音作答]，测量语速、口头禅、停顿和语气，展示 4 周的进步。", "Bấm [Trả lời bằng giọng] khi luyện — đo tốc độ, từ đệm, ngắt và giọng, cho thấy tiến bộ 4 tuần.", "練習で[声で答える]を押すと、速さ・口癖・間・口調を測り、4週間の成長を表示します。", "Ketuk [Jawab dengan suara] — kami ukur kecepatan, pengisi, jeda, nada, dan tunjukkan kemajuan 4 minggu.")}</p>
        <Link href="/career-launch/basic-interview?focus=self" className="mt-3 inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3.5 text-[14px] font-semibold text-[color:var(--v2-accent)]">
          {t("말로 연습해 보기", "Try speaking practice", "试试口语练习", "Thử luyện nói", "声で練習する", "Coba latihan bicara")} <ArrowRight className="h-3.5 w-3.5" weight="bold" />
        </Link>
      </div>
    );
  }
  // 처음 3문항 vs 최근 3문항 평균(문항이 적으면 겹칠 수 있다 — 2문항 이상부터 비교)
  const n = Math.min(3, Math.floor(voice.length / 2) || 1);
  const avg = (arr: SpeakingData[], f: (d: SpeakingData) => number) => Math.round((arr.reduce((s, d) => s + f(d), 0) / Math.max(arr.length, 1)) * 10) / 10;
  const first = voice.slice(0, n);
  const recent = voice.slice(-n);
  const consistent = (arr: SpeakingData[]) => Math.round((arr.filter((d) => d.report?.honorific === "consistent").length / Math.max(arr.filter((d) => d.report).length, 1)) * 100);
  const rows: Row[] = [
    { key: "cpm", label: t("말 빠르기(분당 글자)", "Pace (chars/min)", "语速（字/分钟）", "Tốc độ (ký tự/phút)", "話す速さ（字/分）", "Kecepatan (kar/menit)"), first: avg(first, (d) => d.metrics.cpm), recent: avg(recent, (d) => d.metrics.cpm), unit: "", better: "band" },
    { key: "fillers", label: t("군말(문항당)", "Fillers (per answer)", "口头禅（每题）", "Từ đệm (mỗi câu)", "口癖（1問あたり）", "Pengisi (per jawaban)"), first: avg(first, (d) => d.metrics.fillers), recent: avg(recent, (d) => d.metrics.fillers), unit: "", better: "down" },
    { key: "pauses", label: t("긴 멈춤(문항당)", "Long pauses (per answer)", "长停顿（每题）", "Ngắt lâu (mỗi câu)", "長い間（1問あたり）", "Jeda lama (per jawaban)"), first: avg(first, (d) => d.metrics.pauses), recent: avg(recent, (d) => d.metrics.pauses), unit: "", better: "down" },
    { key: "long", label: t("긴 문장(문항당)", "Long sentences (per answer)", "长句（每题）", "Câu dài (mỗi câu)", "長い文（1問あたり）", "Kalimat panjang"), first: avg(first, (d) => d.metrics.longSentences), recent: avg(recent, (d) => d.metrics.longSentences), unit: "", better: "down" },
    { key: "honor", label: t("말투 일관된 답", "Consistent tone", "语气一致的回答", "Giọng nhất quán", "口調が揃った回答", "Nada konsisten"), first: consistent(first), recent: consistent(recent), unit: "%", better: "up" }
  ];
  // 좋아졌나 — 군말·멈춤·긴 문장은 줄면, 말투는 늘면, 말 빠르기는 알맞은 범위(150~320)에 가까워지면
  const dist = (v: number) => (v < 150 ? 150 - v : v > 320 ? v - 320 : 0);
  const improved = (r: Row) => (r.better === "down" ? r.recent < r.first : r.better === "up" ? r.recent > r.first : dist(r.recent) < dist(r.first));
  const worse = (r: Row) => (r.better === "down" ? r.recent > r.first : r.better === "up" ? r.recent < r.first : dist(r.recent) > dist(r.first));
  const comparable = voice.length >= 2;
  return (
    <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">🗣️ {t("말하기 성장", "Speaking progress", "口语进步", "Tiến bộ nói", "話す力の成長", "Kemajuan bicara")}</p>
        <span className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{t(`말로 답한 문항 ${voice.length}개`, `${voice.length} voice answers`, `语音作答 ${voice.length} 题`, `${voice.length} câu bằng giọng`, `声の回答 ${voice.length}問`, `${voice.length} jawaban suara`)}</span>
      </div>
      {comparable ? (
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-[color:var(--v2-line)] px-4 py-2 text-[12px] font-semibold text-[color:var(--v2-faint)]">
            <span />
            <span className="w-12 text-right">{t("처음", "First", "最初", "Đầu", "最初", "Awal")}</span>
            <span className="w-16 text-right">{t("최근", "Recent", "最近", "Gần đây", "最近", "Terbaru")}</span>
          </div>
          {rows.map((r) => (
            <div key={r.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-[color:var(--v2-line)] px-4 py-2.5 last:border-0">
              <span className="min-w-0 truncate text-[14px] text-[color:var(--v2-ink-3)]">{r.label}</span>
              <span className="w-12 text-right text-[14px] tabular-nums text-[color:var(--v2-muted)]">{r.first}{r.unit}</span>
              <span className={`w-16 text-right text-[15px] font-bold tabular-nums ${improved(r) ? "text-[color:var(--v2-good)]" : worse(r) ? "text-[#c2410c]" : "text-[color:var(--v2-ink)]"}`}>
                {r.recent}
                {r.unit} {/* 화살표는 숫자 방향, 색은 좋아졌는지(초록)·나빠졌는지(주황) */}
                {r.recent > r.first ? "▲" : r.recent < r.first ? "▼" : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 break-keep text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("한 문항 더 말로 답하면 처음과 비교해 보여 드려요.", "Answer one more by voice to compare with your first.", "再用语音答一题，即可与最初对比。", "Trả lời thêm một câu bằng giọng để so sánh.", "もう1問声で答えると最初と比較できます。", "Jawab satu lagi dengan suara untuk membandingkan.")}</p>
      )}
      <p className="mt-2 text-[11.5px] text-[color:var(--v2-faint)]">{t("말 빠르기는 분당 150~320자(멈춘 시간 포함)를 알맞게 봐요.", "Pace of 150–320 chars/min (incl. pauses) counts as good.", "语速以每分钟 150~320 字（含停顿）为宜。", "Tốc độ 150–320 ký tự/phút (gồm ngắt) là vừa.", "話す速さは毎分150〜320字（間を含む）を目安にします。", "Kecepatan 150–320 kar/menit (termasuk jeda) dianggap pas.")}</p>
    </div>
  );
}
