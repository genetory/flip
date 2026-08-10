"use client";

// 파트너 인재 검색 — aply 인재풀(이력서 등록 + 공개 동의)에서 키워드/AI로 후보를 찾는다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, X, Sparkle, GraduationCap, Globe, Translate, Briefcase, BookmarkSimple } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TListSkeleton, TError } from "../../talent/ui/primitives";
import { PartnerEmptyCard } from "../ui/cards";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { getPartnerCandidates, searchPartnerCandidatesAI, getSavedCandidates, saveCandidate, unsaveCandidate, type PartnerCandidateCard } from "../../../lib/member-profile-client";

type Mode = "keyword" | "ai" | "saved";

export function PartnerTalentSearchScreen() {
  const toast = useTalentPopup();
  const [mode, setMode] = useState<Mode>("keyword");
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<PartnerCandidateCard[]>([]);
  const [total, setTotal] = useState(0);
  const [aiUsed, setAiUsed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  // 처음 진입 시 최신 인재풀 + 관심 인재 목록 로드.
  useEffect(() => {
    void getSavedCandidates().then((list) => setSavedIds(new Set(list.map((c) => c.candidateUserId)))).catch(() => {});
    run("keyword", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function run(m: Mode, q: string) {
    setStatus("loading");
    const p =
      m === "ai"
        ? searchPartnerCandidatesAI(q).then((r) => {
            setItems(r.items);
            setTotal(r.items.length);
            setAiUsed(r.ai);
          })
        : m === "saved"
          ? getSavedCandidates().then((list) => {
              setItems(list);
              setTotal(list.length);
              setAiUsed(false);
              setSavedIds(new Set(list.map((c) => c.candidateUserId)));
            })
          : getPartnerCandidates({ q: q || undefined }).then((r) => {
              setItems(r.items);
              setTotal(r.total);
              setAiUsed(false);
            });
    p.then(() => setStatus("ready")).catch(() => setStatus("error"));
  }

  // 관심 인재 저장/해제(낙관적).
  function toggleSave(id: string) {
    const willSave = !savedIds.has(id);
    setSavedIds((prev) => {
      const n = new Set(prev);
      if (willSave) n.add(id);
      else n.delete(id);
      return n;
    });
    const req = willSave ? saveCandidate(id) : unsaveCandidate(id);
    void req.catch(() => {
      setSavedIds((prev) => {
        const n = new Set(prev);
        if (willSave) n.delete(id);
        else n.add(id);
        return n;
      });
      toast.error("저장에 실패했어요");
    });
    if (!willSave && mode === "saved") setItems((prev) => prev.filter((c) => c.candidateUserId !== id));
  }

  function submit() {
    if (mode === "ai" && !query.trim()) return;
    run(mode, query.trim());
  }

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">인재 검색</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">Aply에 이력서를 등록하고 공개에 동의한 인재를 찾아보세요.</p>
        </div>

        {/* 검색 모드 */}
        <div className="flex items-center gap-1 self-start rounded-full bg-[#F2F4F6] p-0.5">
          {([["keyword", "키워드"], ["ai", "AI 검색"], ["saved", "관심 인재"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                if (key === "saved") run("saved", "");
                else if (key === "keyword") run("keyword", query.trim());
              }}
              className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${mode === key ? "bg-white text-[#191F28] shadow-[0_1px_4px_rgba(11,18,39,0.08)]" : "text-[#8B95A1]"}`}
            >
              {key === "ai" ? <Sparkle className="h-3.5 w-3.5" weight="fill" /> : key === "saved" ? <BookmarkSimple className="h-3.5 w-3.5" weight="fill" /> : null}
              {label}
            </button>
          ))}
        </div>

        {/* 검색 입력 — 관심 인재 모드에서는 숨김 */}
        {mode !== "saved" ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#B0B8C1]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={mode === "ai" ? "예: 중국어 가능한 마케터, 개발 인턴 경험 있는 사람" : "이름·학교·전공·직무·스킬·국적 검색"}
              className="w-full rounded-2xl border border-[#EEF1F5] bg-white py-3 pl-11 pr-10 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="지우기" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#B0B8C1] transition hover:bg-[#F2F4F6]">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <button type="button" onClick={submit} className="shrink-0 rounded-2xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">검색</button>
        </div>
        ) : null}

        {status === "loading" ? <TListSkeleton /> : null}
        {status === "error" ? <TError onRetry={() => run(mode, query.trim())} /> : null}

        {status === "ready" ? (
          items.length === 0 ? (
            mode === "saved" ? (
              <PartnerEmptyCard emoji="⭐" title="저장한 관심 인재가 없어요" desc="키워드·AI 검색에서 마음에 드는 인재의 별을 눌러 모아보세요." />
            ) : (
              <PartnerEmptyCard emoji="🔍" title="검색 결과가 없어요" desc={mode === "ai" ? "다른 표현으로 다시 검색해보세요." : "다른 키워드로 다시 검색해보세요."} />
            )
          ) : (
            <>
              <p className="text-[12.5px] text-[#8B95A1]">
                {aiUsed ? "AI가 적합도 순으로 정렬했어요 · " : ""}인재 {items.length}명{items.length !== total ? ` (전체 ${total})` : ""}
              </p>
              <div className="flex flex-col gap-2.5">
                {items.map((c) => (
                  <CandidateCard key={c.candidateUserId} c={c} saved={savedIds.has(c.candidateUserId)} onToggleSave={() => toggleSave(c.candidateUserId)} />
                ))}
              </div>
            </>
          )
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function CandidateCard({ c, saved, onToggleSave }: { c: PartnerCandidateCard; saved: boolean; onToggleSave: () => void }) {
  const edu = [c.school, c.major].filter(Boolean).join(" · ");
  return (
    <Link href={`${partnerRoutes.talent}/${encodeURIComponent(c.candidateUserId)}`} className="rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[17px] font-black text-[#0B46E8]">{(c.name ?? "?").slice(0, 1)}</span>
        <button
          type="button"
          aria-label={saved ? "관심 인재 해제" : "관심 인재로 저장"}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave();
          }}
          className={`order-last shrink-0 rounded-full p-1.5 transition ${saved ? "text-[#0B46E8]" : "text-[#C4CAD2] hover:text-[#4E5968]"}`}
        >
          <BookmarkSimple className="h-5 w-5" weight={saved ? "fill" : "regular"} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[15px] font-bold text-[#191F28]">{c.name ?? "이름 비공개"}</p>
            {typeof c.score === "number" ? <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">적합 {c.score}</span> : null}
            {c.connectionStatus === "ACCEPTED" ? (
              <span className="rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">연결됨</span>
            ) : c.connectionStatus === "PENDING" ? (
              <span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">요청 보냄</span>
            ) : null}
          </div>
          {c.desiredJobRole ? <p className="mt-1 truncate text-[13px] font-semibold text-[#4E5968]">{c.desiredJobRole}</p> : null}

          <div className="mt-2 flex flex-col gap-1">
            {edu ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><GraduationCap className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{edu}</span></span> : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {c.nationality ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Globe className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> {c.nationality}</span> : null}
              {c.languages.length ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Translate className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{c.languages.slice(0, 2).join(", ")}</span></span> : null}
              {c.careerCount > 0 ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Briefcase className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> 경력 {c.careerCount}</span> : null}
            </div>
          </div>

          {c.skills.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {c.skills.slice(0, 6).map((s) => (
                <span key={s} className="rounded-md bg-[#F5F7FA] px-2.5 py-0.5 text-[11px] font-medium text-[#4E5968]">{s}</span>
              ))}
            </div>
          ) : null}

          {c.resumeBullets && c.resumeBullets.length ? (
            <div className="mt-2 rounded-lg bg-[#F8FAFB] px-3 py-2">
              <p className="flex items-center gap-1 text-[10.5px] font-bold text-[#8B95A1]"><Sparkle className="h-3 w-3 text-[#0B46E8]" weight="fill" /> AI 이력서 요약</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {c.resumeBullets.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-[#4E5968]">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                    <span className="min-w-0 flex-1 break-keep">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {c.reason ? <p className="mt-2 break-keep rounded-lg bg-[#F5F8FF] px-2.5 py-1.5 text-[12px] leading-relaxed text-[#0B46E8]">{c.reason}</p> : null}
        </div>
      </div>
    </Link>
  );
}
