"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkle, X, MapPin, GraduationCap, Briefcase, EnvelopeSimple, Phone } from "@phosphor-icons/react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import {
  searchPartnerCandidates,
  aiSearchCandidates,
  getPartnerCandidate,
  requestPartnerConnect,
  type PartnerCandidateCard,
  type PartnerCandidateDetail,
  type ConnectionStatus
} from "../../../lib/candidate-connect-client";
import { ResumePreview } from "../../../components/resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../../lib/resume-maker-types";
import type { ResumeContent } from "../../../lib/member-profile-client";

function StatusBadge({ status }: { status: ConnectionStatus }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "요청함", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    ACCEPTED: { label: "연결됨", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    DECLINED: { label: "거절됨", cls: "bg-gray-100 text-gray-500 ring-gray-200" }
  };
  const m = map[status];
  if (!m) return null;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${m.cls}`}>{m.label}</span>;
}

export default function BusinessTalentPage() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const canView = isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="business" />
      <main className="flex-1">
        {/* 배너 — 포지션 탐색과 유사한 히어로 */}
        <section className="border-b border-[#EEF1F5] bg-gradient-to-br from-[#EDF1FD] to-[#F6F8FB]">
          <div className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
            <p className="text-[13px] font-bold text-[#0B46E8]">인재 탐색</p>
            <h1 className="mt-1.5 text-[26px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[32px]">우리 회사에 맞는 글로벌 인재를 직접 찾아보세요</h1>
            <p className="mt-2 max-w-2xl break-keep text-[14px] leading-relaxed text-[#4E5968]">
              인재풀 등록에 동의한 후보자의 대표 이력서를 검색하고, 관심 있는 인재에게 연결을 요청할 수 있어요. 연락처는 후보자가 수락하면 공개됩니다.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-5 py-6 md:py-8">
          {!isReady ? (
            <p className="py-16 text-center text-[13px] text-[#8B95A1]">불러오는 중…</p>
          ) : !canView ? (
            <AccessNotice authenticated={isAuthenticated} />
          ) : (
            <TalentSearch />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AccessNotice({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E8EB] bg-white p-8 text-center">
      <p className="text-[18px] font-black text-[#0B1227]">파트너 전용 기능이에요</p>
      <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
        인재 탐색은 검증된 파트너(기업)만 이용할 수 있어요. {authenticated ? "파트너 계정으로 로그인하거나 파트너 등록을 완료해 주세요." : "파트너 계정으로 로그인해 주세요."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {!authenticated ? (
          <Link href="/login" className="rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">로그인</Link>
        ) : null}
        <Link href="/business" className="rounded-xl border border-[#D7DCE3] bg-white px-5 py-2.5 text-[14px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40">파트너 소개 보기</Link>
      </div>
    </div>
  );
}

function TalentSearch() {
  const PAGE_SIZE = 20;
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PartnerCandidateCard[]>([]); // 전체 목록(비-AI) 누적
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [aiMode, setAiMode] = useState(false);
  const [aiAll, setAiAll] = useState<PartnerCandidateCard[]>([]); // AI 매칭 전체
  const [visible, setVisible] = useState(PAGE_SIZE); // AI 결과 노출 개수
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    setAiMode(false);
    setPage(1);
    try {
      const r = await searchPartnerCandidates({ page: 1 });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인재 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreBrowse = useCallback(async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const r = await searchPartnerCandidates({ page: next });
      setItems((prev) => [...prev, ...r.items]);
      setTotal(r.total);
      setPage(next);
    } catch {
      // 무시 — 재시도 가능
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  const runAi = useCallback(async (qStr: string) => {
    setLoading(true);
    setError("");
    setAiMode(true);
    setVisible(PAGE_SIZE);
    try {
      const r = await aiSearchCandidates(qStr);
      setAiAll(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 검색에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const patchStatus = (candidateUserId: string, status: ConnectionStatus) => {
    const upd = (c: PartnerCandidateCard) => (c.candidateUserId === candidateUserId ? { ...c, connectionStatus: status } : c);
    setItems((prev) => prev.map(upd));
    setAiAll((prev) => prev.map(upd));
  };

  const list = aiMode ? aiAll.slice(0, visible) : items;
  const shownTotal = aiMode ? aiAll.length : total;
  const hasMore = aiMode ? visible < aiAll.length : items.length < total;
  const onLoadMore = () => {
    if (aiMode) setVisible((v) => v + PAGE_SIZE);
    else void loadMoreBrowse();
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void runAi(query.trim());
          else void loadAll();
        }}
        className="mb-2 flex items-center gap-2 rounded-2xl border border-border/60 bg-white p-2 shadow-sm"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="원하는 인재상을 문장으로 (예: React 잘하고 스타트업 경험 있는 프론트엔드, 한국어 가능)"
          className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="inline-flex h-11 flex-none items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
          <Sparkle className="h-4 w-4" weight="fill" /> AI 검색
        </button>
      </form>
      <p className="mb-4 px-1 text-[12px] text-[#8B95A1]">문장으로 검색하면 AI가 인재풀에서 적합도 순으로 찾아줘요. 비워두고 검색하면 전체 목록을 봅니다.</p>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#E5E8EB] border-t-[#0B46E8]" />
          <p className="text-[13px] font-medium text-[#8B95A1]">{aiMode ? "AI가 적합한 인재를 찾는 중…" : "불러오는 중…"}</p>
        </div>
      ) : error ? (
        <p className="py-16 text-center text-[13px] text-rose-600">{error}</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7DCE3] bg-[#FAFBFC] py-16 text-center">
          <p className="text-[14px] font-semibold text-[#4E5968]">조건에 맞는 인재가 없어요.</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">인재풀 등록에 동의한 후보자만 표시됩니다. 검색어를 바꿔보세요.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-[#8B95A1]">{aiMode ? <span className="text-[#0B46E8]">✨ AI 매칭 {shownTotal}명 · 적합도 순</span> : `총 ${shownTotal}명`}</p>
            {aiMode ? <button type="button" onClick={() => { setQuery(""); void loadAll(); }} className="text-[12px] text-[#8B95A1] underline hover:text-[#4E5968]">전체 보기</button> : null}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <button
                key={c.candidateUserId}
                type="button"
                onClick={() => setDetailId(c.candidateUserId)}
                className="group relative flex h-full flex-col rounded-xl border border-border/60 bg-card p-4 text-left transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[15.5px] font-black text-[#0B1227]">{c.name ?? "이름 비공개"}</p>
                    {c.nationality ? <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-[#8B95A1]"><MapPin className="h-3.5 w-3.5" />{c.nationality}</p> : null}
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1">
                    {typeof c.score === "number" ? <span className="rounded-lg bg-[#0B46E8] px-2 py-0.5 text-[13px] font-black text-white">{c.score}</span> : null}
                    <StatusBadge status={c.connectionStatus} />
                  </div>
                </div>
                {c.school || c.major ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#4E5968]"><GraduationCap className="h-4 w-4 text-[#8B95A1]" />{[c.school, c.major].filter(Boolean).join(" · ")}</p>
                ) : null}
                {c.desiredJobRole ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#4E5968]"><Briefcase className="h-4 w-4 text-[#8B95A1]" />{c.desiredJobRole}{c.workType ? ` · ${c.workType}` : ""}</p>
                ) : null}
                {c.skills.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.skills.slice(0, 6).map((s, i) => (
                      <span key={i} className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-semibold text-[#0B46E8]">{s}</span>
                    ))}
                  </div>
                ) : null}
                {c.reason ? (
                  <p className="mt-2 rounded-lg bg-[#F6F8FB] px-2.5 py-1.5 text-[11.5px] leading-relaxed text-[#4E5968]">💡 {c.reason}</p>
                ) : c.summary ? (
                  <p className="mt-2 line-clamp-2 break-keep text-[12px] leading-relaxed text-[#8B95A1]">{c.summary}</p>
                ) : null}
                {c.languages.length ? <p className="mt-1.5 truncate text-[11.5px] text-[#8B95A1]">🗣 {c.languages.join(" · ")}</p> : null}
                <p className="mt-1 text-[11.5px] text-[#B0B8C1]">경력 {c.careerCount} · 활동 {c.activityCount}{c.visa ? ` · ${c.visa}` : ""}</p>
              </button>
            ))}
          </div>
          {hasMore ? (
            <div className="mt-8 flex items-center justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-border bg-white px-6 py-2.5 text-[14px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-50"
              >
                {loadingMore ? "불러오는 중…" : "더보기"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {detailId ? <CandidateDetailModal candidateUserId={detailId} onClose={() => setDetailId(null)} onStatusChange={(s) => patchStatus(detailId, s)} /> : null}
    </>
  );
}

function CandidateDetailModal({
  candidateUserId,
  onClose,
  onStatusChange
}: {
  candidateUserId: string;
  onClose: () => void;
  onStatusChange: (status: ConnectionStatus) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [detail, setDetail] = useState<PartnerCandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [docTab, setDocTab] = useState<"resume" | "cover">("resume");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void getPartnerCandidate(candidateUserId)
      .then((d) => {
        if (alive) setDetail(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "후보자 정보를 불러오지 못했어요.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [candidateUserId]);

  const connect = async () => {
    setConnecting(true);
    try {
      await requestPartnerConnect(candidateUserId, message);
      setDetail((d) => (d ? { ...d, connectionStatus: "PENDING" } : d));
      onStatusChange("PENDING");
    } catch (e) {
      setError(e instanceof Error ? e.message : "연결 요청에 실패했어요.");
    } finally {
      setConnecting(false);
    }
  };

  if (!mounted) return null;
  const status = detail?.connectionStatus ?? null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-8" onClick={onClose}>
      <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-3.5">
          <p className="text-[15px] font-black text-[#0B1227]">{detail?.name ?? "후보자"}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-12 text-center text-[13px] text-[#8B95A1]">불러오는 중…</p>
          ) : error && !detail ? (
            <p className="py-12 text-center text-[13px] text-rose-600">{error}</p>
          ) : detail ? (
            <>
              {status === "ACCEPTED" && detail.contact ? (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <p className="text-[12.5px] font-bold text-emerald-700">✅ 연결 완료 — 연락처</p>
                  <div className="mt-1.5 space-y-0.5 text-[13px] text-[#191F28]">
                    {detail.contact.email ? <p className="flex items-center gap-1.5"><EnvelopeSimple className="h-4 w-4 text-[#8B95A1]" />{detail.contact.email}</p> : null}
                    {detail.contact.phone ? <p className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-[#8B95A1]" />{detail.contact.phone}</p> : null}
                  </div>
                </div>
              ) : (
                <div className="mb-3 rounded-xl bg-[#F8FAFC] p-3 text-[12px] text-[#8B95A1]">🔒 연락처는 후보자가 연결을 수락하면 공개됩니다.</div>
              )}
              {/* 이력서 / 자기소개서 탭 */}
              <div className="mb-3 flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
                <button type="button" onClick={() => setDocTab("resume")} className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-bold transition ${docTab === "resume" ? "bg-white text-[#0B1227] shadow-sm" : "text-[#8B95A1]"}`}>이력서</button>
                <button type="button" onClick={() => setDocTab("cover")} className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-bold transition ${docTab === "cover" ? "bg-white text-[#0B1227] shadow-sm" : "text-[#8B95A1]"}`}>자기소개서{detail.coverLetter ? "" : " (없음)"}</button>
              </div>
              {docTab === "resume" ? (
                <div className="overflow-hidden rounded-xl border border-[#EEF1F5] [&_*]:!shadow-none">
                  <ResumePreview content={detail.content as ResumeContent} design={DEFAULT_DESIGN} />
                </div>
              ) : detail.coverLetter ? (
                <div className="rounded-xl border border-[#EEF1F5] p-4">
                  {detail.coverLetter.company ? <p className="mb-2 text-[12px] font-semibold text-[#0B46E8]">{detail.coverLetter.company}</p> : null}
                  <div className="space-y-3.5">
                    {detail.coverLetter.items.map((it, i) => (
                      <div key={i}>
                        {it.prompt ? <p className="text-[13px] font-bold text-[#191F28]">{it.prompt}</p> : null}
                        <p className="mt-1 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{it.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D7DCE3] bg-[#FAFBFC] py-10 text-center text-[13px] text-[#8B95A1]">아직 등록된 자기소개서가 없어요.</div>
              )}
            </>
          ) : null}
        </div>
        {detail ? (
          <div className="border-t border-[#EEF1F5] px-5 py-3.5">
            {error && detail ? <p className="mb-2 text-[12px] text-rose-600">{error}</p> : null}
            {!status ? (
              <div className="space-y-2">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="후보자에게 전할 메시지 (선택) — 우리 회사·포지션을 소개해보세요" className="w-full resize-none rounded-xl border border-[#E5E8EB] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0B46E8]" />
                <button type="button" onClick={() => void connect()} disabled={connecting} className="w-full rounded-xl bg-[#0B46E8] py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {connecting ? "요청 중…" : "연결 요청 보내기"}
                </button>
              </div>
            ) : status === "PENDING" ? (
              <p className="text-center text-[13px] font-semibold text-amber-700">연결 요청을 보냈어요. 후보자의 수락을 기다리는 중입니다.</p>
            ) : status === "DECLINED" ? (
              <p className="text-center text-[13px] text-[#8B95A1]">후보자가 이 연결 요청을 거절했어요.</p>
            ) : (
              <p className="text-center text-[13px] font-semibold text-emerald-700">연결된 후보자입니다.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
