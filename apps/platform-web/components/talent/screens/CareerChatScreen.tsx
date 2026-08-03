"use client";

// AI 커리어 노트 — 편하게 남긴 한 줄을 LLM이 판단해 이력서/프로필 섹션으로 정리해주는 채팅.
// LLM(/api/career-assist) 우선, 실패 시 규칙 기반 폴백.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkle, PaperPlaneTilt } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ProfileGate } from "../career/ProfileGate";
import { TLoading, TError } from "../ui/primitives";
import { careerChatStarters } from "../../../lib/talent/home-content";
import { SECTION_META, type CareerSection } from "../../../lib/talent/career-chat";
import { careerAssist } from "../../../lib/talent/career-assist-client";
import { addFeedEntry, useCareerFeed } from "../../../lib/talent/career-feed";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";

export function CareerChatScreen() {
  const params = useSearchParams();
  const { status, reload } = useTalentSnapshot();
  const basicInfo = useBasicInfo();
  const feed = useCareerFeed(); // 최신순
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null); // 관련 없는 입력 안내
  // 이번 세션에서 방금 남긴 항목에만 AI 코칭 한 줄을 보여준다.
  const [coach, setCoach] = useState<Record<string, string>>({});
  const listEndRef = useRef<HTMLDivElement>(null);

  // 홈에서 예시 칩으로 넘어온 경우 입력창에 미리 채움(자동 전송 X — 사용자가 다듬을 수 있게).
  useEffect(() => {
    const prompt = params.get("prompt");
    if (prompt) setInput(prompt);
  }, [params]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length, coach, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setInput("");
    setPending(true);
    setNotice(null);
    const res = await careerAssist(trimmed);
    if (!res.relevant) {
      // 이력서·자기소개서와 무관한 내용은 저장하지 않고 안내만.
      setNotice(res.followUp || "이력서·자기소개서에 담을 커리어 내용을 적어주세요.");
      setPending(false);
      return;
    }
    const entry = addFeedEntry(trimmed, res.section);
    setCoach((prev) => ({ ...prev, [entry.id]: res.followUp }));
    setPending(false);
  }

  const chronological = [...feed].reverse(); // 오래된 → 최신(아래로)
  const started = chronological.length > 0;
  const ready = isBasicInfoComplete(basicInfo);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        {/* 헤더 */}
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-center gap-1.5">
            <Sparkle className="h-[18px] w-[18px] text-[#0B46E8]" weight="fill" />
            <h1 className="text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">AI 커리어 노트</h1>
          </div>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={reload} /> : null}

        {/* 기본 정보가 등록되지 않으면 무조건 그것부터 */}
        {status === "ready" && !ready ? <ProfileGate /> : null}

        {/* 대화 영역 — 피드 기록을 시간순으로 */}
        {status === "ready" && ready ? (
          <>
            {started || pending || notice ? (
              <div className="flex flex-col gap-3">
                {chronological.map((e) => (
                  <div key={e.id} className="flex flex-col gap-2">
                    <UserBubble text={e.text} />
                    <AssistantBubble section={e.section} text={coach[e.id]} />
                  </div>
                ))}
                {pending ? (
                  <div className="flex justify-start">
                    <p className="rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-white px-4 py-2.5 text-[14px] text-[#8B95A1]">AI가 정리 중…</p>
                  </div>
                ) : null}
                {notice ? (
                  <div className="flex justify-start">
                    <p className="max-w-[85%] break-keep rounded-2xl rounded-tl-md border border-[#FBE2A9] bg-[#FFF9EC] px-4 py-2.5 text-[14px] leading-relaxed text-[#8A6D1B]">{notice}</p>
                  </div>
                ) : null}
                <div ref={listEndRef} />
              </div>
            ) : (
              <EmptyState onPick={send} />
            )}

            {/* 입력창 */}
            <div className="sticky bottom-[84px] z-10 md:bottom-4">
              <Composer value={input} onChange={setInput} onSend={() => send(input)} disabled={pending} />
            </div>
          </>
        ) : null}
      </div>
    </TalentAppShell>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[80%] break-keep rounded-2xl rounded-tr-md bg-[#0B46E8] px-4 py-2.5 text-[14px] leading-relaxed text-white">{text}</p>
    </div>
  );
}

function AssistantBubble({ section, text }: { section: CareerSection; text?: string }) {
  const meta = SECTION_META[section];
  return (
    <div className="flex flex-col items-start gap-2">
      {text ? (
        <p className="max-w-[85%] break-keep rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-white px-4 py-2.5 text-[14px] leading-relaxed text-[#191F28]">{text}</p>
      ) : null}
      <div className="ml-1 inline-flex items-center gap-2 rounded-xl border border-[#E4EDFB] bg-[#F5F8FF] px-3 py-2">
        <span aria-hidden>{meta.emoji}</span>
        <span className="text-[12.5px] font-bold text-[#0B46E8]">{meta.label}에 정리됨</span>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>💬</span>
      <p className="mt-3 text-[15px] font-bold text-[#191F28]">무엇이든 편하게 남겨보세요</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">한 줄만 적어도 AI가 이력서·프로필의 알맞은 곳에 정리해드려요.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {careerChatStarters.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E4EDFB] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
          >
            <span aria-hidden>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Composer({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-end gap-2 rounded-2xl border border-[#DCE3F0] bg-white p-2 shadow-[0_6px_20px_rgba(11,18,39,0.06)]">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // 한글 IME 조합 중 Enter 는 무시(마지막 글자 잘림 방지).
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={1}
        placeholder="오늘 있었던 일을 편하게 적어보세요"
        className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!value.trim() || disabled}
        aria-label="보내기"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B46E8] text-white transition enabled:hover:bg-[#0A3ECB] disabled:opacity-40"
      >
        <PaperPlaneTilt className="h-[18px] w-[18px]" weight="fill" />
      </button>
    </div>
  );
}
