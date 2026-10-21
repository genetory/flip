"use client";

// 1분 자기소개 집중 훈련 — 모든 면접의 첫 질문. 60초 타이머로 말하고(또는 쓰고), 구성(한 줄 소개 → 강점 → 근거 경험 → 입사 후 한마디)·길이를 점검받고,
// 60초 분량으로 다듬은 버전을 들어 본다. 말로 하면 말하기 리포트도. 시도는 state.introPractice 에 쌓여 처음과 최근을 비교한다.
import { useEffect, useRef, useState } from "react";
import { ArrowClockwise, CheckCircle, CircleNotch, PaperPlaneRight, XCircle } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { SpeakingReportCard } from "../../../components/launch/SpeakingReportCard";
import { VoiceAnswerControls, useVoiceAnswer } from "../../../components/launch/voice-answer";
import { SpeakButton, TimerBar } from "../../../components/v2/practice";
import { useLaunchT } from "../../../lib/launch/i18n";
import { fetchProgress, patchProgress } from "../../../lib/launch/progress-client";
import { evaluateIntro1min, type Intro1minResult, type IntroAttempt, type IntroKey, type SpeakingData } from "../../../lib/launch/speaking";
import { trackCareerFunnel } from "../../../lib/analytics";

const LIMIT = 60;
const QUESTION = "1분 동안 자기소개를 해 주세요.";

export default function IntroPracticePage() {
  const t = useLaunchT();
  const [text, setText] = useState("");
  const [left, setLeft] = useState(LIMIT);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ r: Intro1minResult; speaking?: SpeakingData } | null>(null);
  const [history, setHistory] = useState<IntroAttempt[]>([]);
  const voice = useVoiceAnswer((add) => setText((a) => (a.trim() ? `${a.trim()} ${add}` : add)));
  const stopRef = useRef(voice.dict.stop);
  useEffect(() => {
    stopRef.current = voice.dict.stop;
  });

  useEffect(() => {
    let alive = true;
    fetchProgress()
      .then((p) => alive && setHistory(Array.isArray(p.introPractice) ? p.introPractice : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 60초 타이머 — 말하기를 누르거나 쓰기 시작하면 돈다. 0초가 되면 마이크를 멈춘다(실제 1분처럼).
  const listening = voice.dict.listening;
  const timing = running || listening;
  useEffect(() => {
    if (!timing || result || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timing, result, left]);
  useEffect(() => {
    if (left <= 0) stopRef.current();
  }, [left]);

  const submit = async () => {
    const a = text.trim();
    if (a.length < 10 || busy) return;
    setBusy(true);
    setError(null);
    const v = await voice.capture();
    const spoke = Boolean(v?.transcript);
    try {
      const [r, speaking] = await Promise.all([evaluateIntro1min({ text: a, voice: spoke, durationSec: spoke ? Math.max(1, v!.ms / 1000) : undefined }), voice.analyze(QUESTION, v)]);
      setResult({ r, speaking });
      trackCareerFunnel("career_intro_practiced", { score: r.score, voice: spoke });
      const attempt: IntroAttempt = { at: new Date().toISOString(), text: a, seconds: r.seconds, voice: spoke, score: r.score, ...(speaking ? { speakingData: speaking } : {}) };
      const next = [attempt, ...history].slice(0, 30);
      setHistory(next);
      void patchProgress({ introPractice: next }).catch(() => {});
    } catch (e) {
      setError((e as { message?: string })?.message || t("평가하지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't evaluate. Try again soon.", "无法评估，请稍后再试。", "Không đánh giá được. Thử lại sau.", "評価できませんでした。", "Gagal menilai. Coba lagi."));
    } finally {
      setBusy(false);
    }
  };
  const again = () => {
    setResult(null);
    setText("");
    setLeft(LIMIT);
    setRunning(false);
    voice.reset();
  };

  const keyLabel = (k: IntroKey) =>
    k === "intro"
      ? t("한 줄 소개", "One-line intro", "一句话介绍", "Giới thiệu 1 câu", "一言紹介", "Perkenalan singkat")
      : k === "strength"
        ? t("핵심 강점", "Key strength", "核心优势", "Điểm mạnh chính", "強み", "Kekuatan utama")
        : k === "evidence"
          ? t("근거 경험", "Evidence", "依据经历", "Kinh nghiệm chứng minh", "根拠の経験", "Bukti pengalaman")
          : t("입사 후 한마디", "Closing line", "入职后的一句话", "Câu kết", "入社後の一言", "Kalimat penutup");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">Career Launch</p>
          <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{t("1분 자기소개 훈련", "1-minute self-intro", "1分钟自我介绍训练", "Giới thiệu 1 phút", "1分自己紹介トレーニング", "Perkenalan 1 menit")}</h1>
          <p className="mt-2.5 break-keep text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {t("모든 면접은 '자기소개 해 주세요'로 시작해요. 60초 안에 나를 기억하게 만드는 연습을 해요.", "Every interview starts with 'Introduce yourself.' Practice making them remember you in 60 seconds.", "所有面试都从“请做自我介绍”开始。练习在 60 秒内让人记住你。", "Mọi buổi PV đều bắt đầu bằng 'Hãy giới thiệu bản thân'. Luyện để được nhớ trong 60 giây.", "面接は必ず「自己紹介をお願いします」から。60秒で印象に残る練習を。", "Setiap wawancara dimulai dengan 'Perkenalkan diri'. Latih agar diingat dalam 60 detik.")}
          </p>

          {/* 구성 안내 */}
          <ol className="mt-4 flex flex-wrap gap-1.5">
            {(["intro", "strength", "evidence", "closing"] as IntroKey[]).map((k, i) => (
              <li key={k} className="rounded-full bg-[color:var(--v2-band)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
                {i + 1}. {keyLabel(k)}
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-3xl bg-[color:var(--v2-band)] p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="break-keep text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">🎤 {QUESTION}</p>
              <SpeakButton t={voice.pt} tts={voice.tts} text={QUESTION} />
            </div>

            {!result ? (
              <>
                {timing || left < LIMIT ? <TimerBar t={voice.pt} left={left} total={LIMIT} paused={busy} /> : <p className="mt-3 text-[14px] font-semibold text-[color:var(--v2-muted)]">⏱ {t("말하기를 누르거나 쓰기 시작하면 60초가 돌아가요", "The 60s timer starts when you speak or type", "开始说或写时 60 秒计时开始", "Đồng hồ 60 giây chạy khi bạn nói hoặc gõ", "話すか書き始めると60秒が始まります", "Timer 60 detik mulai saat bicara atau mengetik")}</p>}
                <textarea
                  value={text}
                  onChange={(e) => {
                    if (!running) setRunning(true);
                    setText(e.target.value);
                  }}
                  rows={7}
                  placeholder={t("말로 하거나 직접 써 보세요. 받아 적은 글은 고칠 수 있어요.", "Speak or type. You can edit the transcript.", "可以说或写，转写内容可修改。", "Nói hoặc gõ. Có thể sửa văn bản.", "話すか書いてください。文字は直せます。", "Bicara atau ketik. Transkrip bisa diedit.")}
                  className="mt-3 w-full resize-none rounded-2xl bg-white p-4 text-[16px] leading-relaxed text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:ring-2"
                />
                <VoiceAnswerControls voice={voice} disabled={busy} />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[13px] tabular-nums text-[color:var(--v2-faint)]">
                    {text.replace(/\s+/g, "").length}
                    {t("자 · 1분은 약 280~330자", " chars · 1 min ≈ 280–330", "字 · 1 分钟约 280~330 字", " ký tự · 1 phút ≈ 280–330", "字・1分は約280〜330字", " kar · 1 menit ≈ 280–330")}
                  </span>
                  <button type="button" onClick={() => void submit()} disabled={busy || text.trim().length < 10} className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[color:var(--v2-accent)] px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-50">
                    {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}
                    {busy ? t("평가 중…", "Evaluating…", "评估中…", "Đang đánh giá…", "評価中…", "Menilai…") : t("평가받기", "Get feedback", "获取评估", "Nhận đánh giá", "評価を受ける", "Dapatkan penilaian")}
                  </button>
                </div>
                {error ? <p className="mt-2 text-[14px] text-[#f04452]">{error}</p> : null}
              </>
            ) : (
              <IntroResult t={t} r={result.r} speaking={result.speaking} keyLabel={keyLabel} voice={voice} onAgain={again} />
            )}
          </div>

          <IntroHistory t={t} history={history} />
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

type T = ReturnType<typeof useLaunchT>;

function IntroResult({ t, r, speaking, keyLabel, voice, onAgain }: { t: T; r: Intro1minResult; speaking?: SpeakingData; keyLabel: (k: IntroKey) => string; voice: ReturnType<typeof useVoiceAnswer>; onAgain: () => void }) {
  const tone = r.score >= 80 ? "text-[color:var(--v2-good)] bg-[#E7F7EF]" : r.score >= 60 ? "text-[color:var(--v2-accent)] bg-[color:var(--v2-accent-weak)]" : "text-[#c2410c] bg-[#fff4e8]";
  const timeOk = r.seconds >= 45 && r.seconds <= 70;
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4">
        <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${tone}`}>
          <span className="text-[24px] font-bold leading-none">{r.score}</span>
          <span className="text-[10px] font-bold">/ 100</span>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">
            {r.estimated ? t(`말하면 약 ${r.seconds}초`, `About ${r.seconds}s if spoken`, `说出来约 ${r.seconds} 秒`, `Khoảng ${r.seconds}s nếu nói`, `話すと約${r.seconds}秒`, `Sekitar ${r.seconds} dtk`) : t(`${r.seconds}초 동안 말했어요`, `You spoke for ${r.seconds}s`, `说了 ${r.seconds} 秒`, `Bạn nói ${r.seconds}s`, `${r.seconds}秒話しました`, `Bicara ${r.seconds} dtk`)}
            <span className={`ml-1.5 text-[13px] font-semibold ${timeOk ? "text-[color:var(--v2-good)]" : "text-[#c2410c]"}`}>{timeOk ? t("· 알맞아요", "· Good length", "· 长度合适", "· Vừa", "・ちょうど良い", "· Pas") : r.seconds > 70 ? t("· 길어요", "· Too long", "· 偏长", "· Dài", "・長い", "· Terlalu panjang") : t("· 짧아요", "· Too short", "· 偏短", "· Ngắn", "・短い", "· Terlalu pendek")}</span>
          </p>
          {r.timeNote ? <p className="mt-0.5 break-keep text-[13px] leading-[1.55] text-[color:var(--v2-muted)]">{r.timeNote}</p> : null}
        </div>
      </div>

      <ul className="flex flex-col gap-1.5 rounded-2xl bg-white p-4">
        {r.structure.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            {s.ok ? <CheckCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--v2-good)]" weight="fill" /> : <XCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--v2-attention)]" weight="fill" />}
            <span className="min-w-0 break-keep text-[14px] leading-[1.55]">
              <b className="text-[color:var(--v2-ink)]">{keyLabel(s.key)}</b> <span className="text-[color:var(--v2-ink-3)]">{s.note}</span>
            </span>
          </li>
        ))}
      </ul>

      {r.improved ? (
        <div className="rounded-2xl bg-[color:var(--v2-accent-weak)] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{t("60초로 다듬은 내 자기소개", "Your intro, polished to 60s", "润色为 60 秒的自我介绍", "Bản giới thiệu 60 giây", "60秒に整えた自己紹介", "Perkenalan versi 60 detik")}</p>
            <SpeakButton t={voice.pt} tts={voice.tts} text={r.improved} />
          </div>
          <p className="mt-1.5 whitespace-pre-wrap break-keep text-[15px] leading-[1.7] text-[#28407A]">{r.improved}</p>
        </div>
      ) : null}
      {speaking ? <SpeakingReportCard data={speaking} /> : null}
      {r.tips?.length ? (
        <ul className="flex flex-col gap-1 px-1">
          {r.tips.map((x, i) => (
            <li key={i} className="flex gap-1.5 break-keep text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">
              <span aria-hidden>·</span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={onAgain} className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--v2-accent)] px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90">
        <ArrowClockwise className="h-4 w-4" weight="bold" /> {t("다시 해 보기", "Try again", "再试一次", "Thử lại", "もう一度", "Coba lagi")}
      </button>
    </div>
  );
}

/** 연습 기록 — 처음과 최근 비교 + 최근 5번. */
function IntroHistory({ t, history }: { t: T; history: IntroAttempt[] }) {
  if (!history.length) return null;
  const first = history[history.length - 1];
  const latest = history[0];
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}/${d.getDate()}`;
  };
  return (
    <section className="mt-8">
      <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t(`연습 기록 ${history.length}번`, `${history.length} attempts`, `练习记录 ${history.length} 次`, `${history.length} lần luyện`, `練習記録 ${history.length}回`, `${history.length} percobaan`)}</p>
      {history.length >= 2 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: t("점수", "Score", "分数", "Điểm", "スコア", "Skor"), a: first.score, b: latest.score, unit: "", up: true },
            { label: t("길이(초)", "Length (s)", "时长（秒）", "Độ dài (s)", "長さ（秒）", "Durasi (dtk)"), a: first.seconds, b: latest.seconds, unit: "", up: null }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl bg-[color:var(--v2-band)] px-4 py-3">
              <p className="text-[12.5px] font-semibold text-[color:var(--v2-muted)]">{c.label}</p>
              <p className="mt-1 text-[15px] tabular-nums text-[color:var(--v2-ink-3)]">
                {c.a} → <b className={`text-[20px] ${c.up && c.b > c.a ? "text-[color:var(--v2-good)]" : "text-[color:var(--v2-ink)]"}`}>{c.b}</b>
              </p>
              <p className="text-[11.5px] text-[color:var(--v2-faint)]">{t("처음 → 최근", "First → latest", "最初 → 最近", "Đầu → gần đây", "最初 → 最近", "Awal → terbaru")}</p>
            </div>
          ))}
        </div>
      ) : null}
      <ul className="mt-3 divide-y divide-[color:var(--v2-line)] overflow-hidden rounded-2xl bg-[color:var(--v2-band)]">
        {history.slice(0, 5).map((h, i) => (
          <li key={`${h.at}-${i}`} className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 shrink-0 text-[13px] tabular-nums text-[color:var(--v2-faint)]">{fmt(h.at)}</span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-[color:var(--v2-ink-3)]">{h.text}</span>
            <span className="shrink-0 text-[13px] tabular-nums text-[color:var(--v2-muted)]">{h.seconds}s{h.voice ? " 🎤" : ""}</span>
            <span className="w-9 shrink-0 text-right text-[15px] font-bold tabular-nums text-[color:var(--v2-ink)]">{h.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
