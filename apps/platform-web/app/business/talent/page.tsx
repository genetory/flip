"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlass, X, MapPin, GraduationCap, Briefcase, EnvelopeSimple, Phone } from "@phosphor-icons/react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import {
  searchPartnerCandidates,
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
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [items, setItems] = useState<PartnerCandidateCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await searchPartnerCandidates({ q, skill, jobRole });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인재 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [q, skill, jobRole]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchStatus = (candidateUserId: string, status: ConnectionStatus) => {
    setItems((prev) => prev.map((c) => (c.candidateUserId === candidateUserId ? { ...c, connectionStatus: status } : c)));
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
        className="mb-5 grid grid-cols-1 gap-2 rounded-2xl border border-[#E5E8EB] bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·학교·전공·키워드" className="rounded-xl border border-[#E5E8EB] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0B46E8]" />
        <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="스킬 (예: Python)" className="rounded-xl border border-[#E5E8EB] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0B46E8]" />
        <input value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="희망 직무 (예: 마케팅)" className="rounded-xl border border-[#E5E8EB] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0B46E8]" />
        <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
          <MagnifyingGlass className="h-4 w-4" weight="bold" /> 검색
        </button>
      </form>

      {loading ? (
        <p className="py-16 text-center text-[13px] text-[#8B95A1]">불러오는 중…</p>
      ) : error ? (
        <p className="py-16 text-center text-[13px] text-rose-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7DCE3] bg-[#FAFBFC] py-16 text-center">
          <p className="text-[14px] font-semibold text-[#4E5968]">조건에 맞는 인재가 없어요.</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">인재풀 등록에 동의한 후보자만 표시됩니다. 검색어를 넓혀보세요.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-[12.5px] text-[#8B95A1]">총 {total}명</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <button
                key={c.candidateUserId}
                type="button"
                onClick={() => setDetailId(c.candidateUserId)}
                className="flex flex-col rounded-2xl border border-[#E5E8EB] bg-white p-4 text-left transition hover:border-[#0B46E8]/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[15.5px] font-black text-[#0B1227]">{c.name ?? "이름 비공개"}</p>
                    {c.nationality ? <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-[#8B95A1]"><MapPin className="h-3.5 w-3.5" />{c.nationality}</p> : null}
                  </div>
                  <StatusBadge status={c.connectionStatus} />
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
                {c.summary ? <p className="mt-2 line-clamp-2 break-keep text-[12px] leading-relaxed text-[#8B95A1]">{c.summary}</p> : null}
                <p className="mt-2 text-[11.5px] text-[#B0B8C1]">경력 {c.careerCount} · 활동 {c.activityCount}{c.visa ? ` · ${c.visa}` : ""}</p>
              </button>
            ))}
          </div>
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
              <div className="overflow-hidden rounded-xl border border-[#EEF1F5] [&_*]:!shadow-none">
                <ResumePreview content={detail.content as ResumeContent} design={DEFAULT_DESIGN} />
              </div>
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
