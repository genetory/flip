"use client";

// 커리어런치 면접 공용 — 말로 답하기(받아쓰기 + 말하기 리포트)와 꼬리 질문 면접관.
// 3주차 기본 면접·4주차 공고별 면접이 같이 쓴다.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, ArrowBendDownRight } from "@phosphor-icons/react";
import { DictationControls, useDictation, useSpeak } from "../v2/practice";
import { usePlatformT } from "../../lib/i18n";
import { useLaunchT } from "../../lib/launch/i18n";
import { analyzeSpeaking, requestFollowUp, type SpeakingData } from "../../lib/launch/speaking";
import { trackCareerFunnel } from "../../lib/analytics";

type Totals = { ms: number; chars: number; fillers: number; pauses: number; transcript: string } | null;

/** 말로 답하기 — onText 로 받아쓴 글을 답변 칸에 이어 붙인다. capture() 로 한 답변 동안의 기록을 받고, analyze() 로 말하기 리포트를 만든다. */
export function useVoiceAnswer(onText: (add: string) => void) {
  const pt = usePlatformT();
  const tts = useSpeak();
  const dict = useDictation({ onFinal: onText });
  const totalsRef = useRef<Totals>(dict.totals);
  useEffect(() => {
    totalsRef.current = dict.totals;
  }, [dict.totals]);
  /** 제출 직전 — 듣는 중이면 멈추고 마지막 말까지 받아 적힐 때까지 잠깐 기다린 뒤 기록을 돌려준다. */
  const capture = async (): Promise<Totals> => {
    tts.stop();
    if (dict.listening) {
      dict.stop();
      await new Promise((r) => window.setTimeout(r, 900));
    }
    return totalsRef.current;
  };
  /** 말하기 리포트 — 말로 답하지 않았으면 undefined(실패해도 내용 채점은 그대로). */
  const analyze = async (question: string, v: Totals): Promise<SpeakingData | undefined> => {
    if (!v?.transcript) return undefined;
    try {
      const sp = await analyzeSpeaking({ question, transcript: v.transcript, durationSec: Math.max(1, v.ms / 1000), pauses: v.pauses });
      trackCareerFunnel("career_speaking_analyzed", { cpm: sp.metrics.cpm });
      return { mode: "voice", at: new Date().toISOString(), metrics: sp.metrics, report: sp.report, transcript: v.transcript };
    } catch {
      return undefined;
    }
  };
  const reset = () => {
    dict.resetTotals();
    tts.stop();
  };
  return { pt, tts, dict, capture, analyze, reset };
}
export type VoiceAnswer = ReturnType<typeof useVoiceAnswer>;

/** 답변 칸 아래 — 말로 답하기 버튼·듣는 중 표시, 지원 안 하는 브라우저 안내. */
export function VoiceAnswerControls({ voice, disabled }: { voice: VoiceAnswer; disabled?: boolean }) {
  const t = useLaunchT();
  return (
    <>
      <DictationControls t={voice.pt} dict={voice.dict} disabled={disabled} />
      {!voice.dict.supported ? <p className="mt-2 text-[12px] text-[color:var(--v2-faint)]">{t("말로 답하기는 크롬·엣지·사파리에서 쓸 수 있어요.", "Voice answers work in Chrome, Edge and Safari.", "语音作答支持 Chrome、Edge、Safari。", "Trả lời bằng giọng dùng được trên Chrome, Edge, Safari.", "音声回答はChrome・Edge・Safariで使えます。", "Jawaban suara bisa di Chrome, Edge, Safari.")}</p> : null}
    </>
  );
}

/** 꼬리 질문 받기 — 면접관이 방금 답을 파고드는 질문 하나(질문당 최대 2번). onReady 로 다음 질문 자리에 넣는다. */
export function FollowUpButton({ question, answer, context, depth, onReady }: { question: string; answer: string; context?: string; depth: number; onReady: (q: string, intent: string) => void }) {
  const t = useLaunchT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  if (depth >= 2) return null;
  const go = async () => {
    setBusy(true);
    setErr(false);
    try {
      const r = await requestFollowUp({ question, answer, context, depth: depth + 1 });
      if (!r.followUp) throw new Error("empty");
      trackCareerFunnel("career_follow_up_asked", { depth: depth + 1 });
      onReady(r.followUp, r.intent);
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <button type="button" onClick={() => void go()} disabled={busy} className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--v2-ink)] px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <ArrowBendDownRight className="h-4 w-4" weight="bold" />}
        {busy
          ? t("면접관이 질문을 고르는 중…", "The interviewer is thinking…", "面试官正在想问题…", "Người PV đang nghĩ…", "面接官が考え中…", "Pewawancara berpikir…")
          : depth === 0
            ? t("꼬리 질문 받기 (실전처럼)", "Get a follow-up (like the real thing)", "接受追问（像实战一样）", "Nhận câu hỏi nối tiếp", "追加質問を受ける（本番のように）", "Dapat pertanyaan lanjutan")
            : t("한 번 더 파고들기", "Dig deeper once more", "再追问一次", "Hỏi sâu thêm", "もう一度深掘り", "Gali lebih dalam")}
      </button>
      {err ? <p className="mt-1.5 text-center text-[12px] font-semibold text-[color:var(--v2-attention)]">{t("꼬리 질문을 만들지 못했어요. 다시 시도해 주세요.", "Couldn't create a follow-up. Try again.", "无法生成追问，请重试。", "Không tạo được. Thử lại.", "作れませんでした。もう一度。", "Gagal. Coba lagi.")}</p> : null}
    </div>
  );
}

/** 꼬리 질문 표시 — 질문 카드 위 배지 + 면접관 의도 힌트. */
export function FollowUpBadge({ depth, intent }: { depth: number; intent?: string }) {
  const t = useLaunchT();
  if (!depth) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--v2-ink)] px-2.5 py-1 text-[11.5px] font-bold text-white">
        <ArrowBendDownRight className="h-3 w-3" weight="bold" /> {t(depth >= 2 ? "꼬리 질문 2" : "꼬리 질문", depth >= 2 ? "Follow-up 2" : "Follow-up", depth >= 2 ? "追问 2" : "追问", depth >= 2 ? "Hỏi tiếp 2" : "Hỏi tiếp", depth >= 2 ? "追加質問2" : "追加質問", depth >= 2 ? "Lanjutan 2" : "Lanjutan")}
      </span>
      {intent ? <span className="break-keep text-[12px] text-[color:var(--v2-muted)]">{t(`확인하려는 것: ${intent}`, `Checking: ${intent}`, `考察点：${intent}`, `Muốn kiểm tra: ${intent}`, `確認したいこと：${intent}`, `Yang dicek: ${intent}`)}</span> : null}
    </div>
  );
}
