"use client";

// Week 3 면접 피드백 — 면접 유형별(자기소개·직무·인성·압박)로 따로.
// 각 면접 로그(basicInterviews)의 문항별 점수·강점·개선을 종합해 카드로 보여준다(추가 AI 호출 없음).
import Link from "next/link";
import { IdentificationCard, Target, GlobeHemisphereEast, Fire, ArrowClockwise } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { PostingInterviewLog } from "../../lib/launch/progress-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

const FOCI = ["self", "job", "fit", "pressure"] as const;
type Focus = (typeof FOCI)[number];
const ICON: Record<Focus, Icon> = { self: IdentificationCard, job: Target, fit: GlobeHemisphereEast, pressure: Fire };

function dedup(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => (s ?? "").trim()).filter(Boolean)));
}
function scoreTone(s: number): string {
  return s >= 75 ? "var(--cl-mint)" : s >= 50 ? "var(--cl-accent)" : "#C77700";
}

export function InterviewFeedback({ logs }: { logs: PostingInterviewLog[] }) {
  const t = useLaunchT();
  const title = (f: Focus) =>
    f === "self" ? t("자기소개 면접", "Intro interview", "自我介绍面试", "PV giới thiệu", "自己紹介面接", "Wawancara perkenalan")
    : f === "job" ? t("직무 면접", "Job interview", "职务面试", "PV chuyên môn", "職務面接", "Wawancara peran")
    : f === "fit" ? t("인성·컬처핏 면접", "Fit interview", "人性面试", "PV văn hóa", "人柄面接", "Wawancara kecocokan")
    : t("압박 면접", "Pressure interview", "压力面试", "PV áp lực", "圧迫面接", "Wawancara tekanan");

  const rows = FOCI.map((f) => ({ f, log: logs.find((l) => l.focus === f) })).filter((x) => (x.log?.items?.length ?? 0) > 0);

  if (!rows.length) {
    return (
      <Card>
        <p className="break-keep text-[13px] leading-relaxed text-[var(--cl-muted)]">{t("먼저 위 면접을 진행하면 면접 유형별로 점수와 피드백이 여기에 나타나요.", "Do the interviews above and you'll see a score and feedback for each type here.", "先完成上面的面试，各类型的分数与反馈会显示在这里。", "Hãy làm các buổi phỏng vấn ở trên, điểm và phản hồi từng loại sẽ hiện ở đây.", "上の面接を進めると、面接タイプ別の点数とフィードバックがここに出ます。", "Lakukan wawancara di atas, skor dan umpan balik tiap tipe muncul di sini.")}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ f, log }) => {
        const items = log!.items ?? [];
        const avg = Math.round(items.reduce((s, it) => s + (typeof it.score === "number" ? it.score : 0), 0) / items.length);
        const strengths = dedup(items.flatMap((it) => it.strengths ?? [])).slice(0, 4);
        let improves = dedup(items.flatMap((it) => it.improvements ?? [])).slice(0, 4);
        if (!strengths.length && !improves.length) improves = dedup(items.map((it) => it.feedback ?? "")).slice(0, 3);
        const MIcon = ICON[f];
        return (
          <Card key={f}>
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-[14px] font-black text-[var(--cl-ink)]">
                <MIcon className="h-4 w-4" weight="duotone" style={{ color: "var(--cl-accent)" }} aria-hidden />
                {title(f)}
              </p>
              <span className="inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-1 text-[13px] font-black tabular-nums" style={{ color: scoreTone(avg), background: "var(--cl-card-2)" }}>
                {avg}<span className="text-[10px] font-bold" style={{ color: "var(--cl-faint)" }}>/100</span>
              </span>
            </div>
            <p className="mt-1 text-[11.5px] font-semibold" style={{ color: "var(--cl-faint)" }}>{t(`${items.length}문항 연습`, `${items.length} questions`, `练习 ${items.length} 题`, `${items.length} câu`, `${items.length}問 練習`, `${items.length} soal`)}</p>
            <div className="mt-3 flex flex-col gap-3">
              {strengths.length ? (
                <div className="rounded-2xl bg-[var(--cl-card-2)] p-4">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--cl-mint)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cl-mint)]" aria-hidden />
                    {t("잘한 점", "Strengths", "做得好", "Điểm mạnh", "良い点", "Kelebihan")}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {strengths.map((it, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[var(--cl-ink)]">· {it}</li>)}
                  </ul>
                </div>
              ) : null}
              {improves.length ? (
                <div className="rounded-2xl bg-[var(--cl-card-2)] p-4">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--cl-accent)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cl-accent)]" aria-hidden />
                    {t("보완할 점", "Improve these", "需改进", "Cần cải thiện", "改善点", "Perbaiki")}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {improves.map((it, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[var(--cl-ink)]">· {it}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
            <Link href={`/career-launch/basic-interview?focus=${f}`} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--cl-accent)] transition hover:underline">
              <ArrowClockwise className="h-4 w-4" weight="bold" aria-hidden /> {t("다시 면접 보기", "Retake this interview", "再次面试", "Phỏng vấn lại", "もう一度面接", "Ulangi wawancara")}
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
