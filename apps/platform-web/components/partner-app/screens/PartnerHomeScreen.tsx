"use client";

// 파트너 홈 — 대시보드. 처리 필요 + 채용 파이프라인 + 공고별 지원 현황 + 최근 지원자 + 빠른 작업.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, Plus, ChatCircleDots, X, PaperPlaneTilt, ArrowUpRight } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { PARTNER_APPLICANT_STATUS, PARTNER_POSITION_STATUS, PARTNER_RECOMMENDATION } from "../../../lib/partner/labels";
import {
  getMyPartnerOrganization,
  getMyPartnerPositions,
  getMyPartnerApplicants,
  getPartnerPendingMessages,
  getPartnerApplicantMessages,
  sendPartnerApplicantMessage,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PartnerApplicantListItem,
  type PartnerApplicantStatus,
  type PartnerPendingMessage,
  type PartnerApplicantMessage
} from "../../../lib/member-profile-client";

export function PartnerHomeScreen() {
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [pending, setPending] = useState<PartnerPendingMessage[]>([]);
  const [chat, setChat] = useState<{ applicationId: string; applicantId: string; name: string; positionTitle: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    Promise.all([
      getMyPartnerOrganization().catch(() => null),
      getMyPartnerPositions().catch(() => []),
      getMyPartnerApplicants().catch(() => [])
    ])
      .then(([o, p, a]) => {
        setOrg(o);
        setPositions(p);
        setApplicants(a);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    void getPartnerPendingMessages().then(setPending).catch(() => setPending([]));
  }
  useEffect(() => {
    load();
  }, []);

  const count = (s: PartnerApplicantStatus) => applicants.filter((a) => a.status === s).length;

  // 처리 필요 — 지금 액션할 것들.
  const actions = useMemo(() => {
    const list: { emoji: string; title: string; desc: string; href: string }[] = [];
    const newApplied = count("APPLIED");
    if (newApplied > 0) list.push({ emoji: "🧑‍💼", title: `신규 지원자 ${newApplied}명`, desc: "새로 지원한 인재를 검토해보세요.", href: partnerRoutes.applicants });
    const pending = positions.filter((p) => p.status === "PENDING_REVIEW").length;
    if (pending > 0) list.push({ emoji: "📋", title: `검토 중 공고 ${pending}개`, desc: "게시 승인을 기다리는 공고가 있어요.", href: partnerRoutes.positions });
    const draft = positions.filter((p) => p.status === "DRAFT").length;
    if (draft > 0) list.push({ emoji: "✏️", title: `작성 중 공고 ${draft}개`, desc: "마무리하지 못한 공고가 있어요.", href: partnerRoutes.positions });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicants, positions]);

  // 채용 파이프라인.
  const pipeline = useMemo(
    () => [
      { label: "지원", count: count("APPLIED") },
      { label: "검토", count: count("REVIEWING") },
      { label: "면접", count: count("INTERVIEW") },
      { label: "합격", count: count("ACCEPTED") + count("OFFERED") }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applicants]
  );

  // 공고별 지원 현황(게시 중 공고).
  const byPosition = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of applicants) counts.set(a.positionId, (counts.get(a.positionId) ?? 0) + 1);
    return positions
      .filter((p) => p.status === "OPEN")
      .map((p) => ({ p, count: counts.get(p.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applicants, positions]);

  const recent = useMemo(
    () => [...applicants].sort((a, b) => (b.appliedAt ?? "").localeCompare(a.appliedAt ?? "")).slice(0, 5),
    [applicants]
  );

  return (
    <PartnerAppShell>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" ? (
        <div className="flex flex-col gap-10">
          {/* 인사 */}
          <div className="rounded-3xl bg-[#F5F8FF] p-7">
            <div className="flex items-center gap-3">
              {org?.companyLogoImageData ? (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
                  <Image src={org.companyLogoImageData} alt="" fill sizes="48px" className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[20px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">{(org?.name || "회").slice(0, 1)}</span>
              )}
              <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">PARTNER</p>
            </div>
            <h1 className="mt-3 break-keep text-[24px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227]">
              {org?.name ? org.name : "우리 회사"}, 좋은 인재를 만나요
            </h1>
            <p className="mt-1.5 text-[14px] text-[#8B95A1]">게시 중 공고 {positions.filter((p) => p.status === "OPEN").length}개 · 전체 지원자 {applicants.length}명</p>
          </div>

          {/* 처리 필요 */}
          <section className="flex flex-col gap-4">
            <SectionHead title="처리 필요" desc="지금 확인하면 좋은 일이에요." />
            {actions.length ? (
              <div className="flex flex-col gap-2.5">
                {actions.map((a) => (
                  <Link key={a.title} href={a.href} className="flex items-center gap-3.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4 transition hover:border-[#0B46E8]/40">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[19px]" aria-hidden>{a.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold text-[#191F28]">{a.title}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{a.desc}</p>
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-6 text-center text-[13.5px] text-[#8B95A1]">지금 처리할 일이 없어요 👍</div>
            )}
          </section>

          {/* 답장을 기다리는 메시지 */}
          {pending.length ? (
            <section className="flex flex-col gap-4">
              <SectionHead title={`답장을 기다리는 메시지 ${pending.length}`} desc="지원자가 보낸 메시지에 아직 답하지 않았어요." />
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {pending.slice(0, 6).map((m, i) => (
                  <button key={m.applicantId} type="button" onClick={() => setChat({ applicationId: m.applicationId, applicantId: m.applicantId, name: m.name, positionTitle: m.positionTitle })} className={`flex items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#F6F8FB] ${i === Math.min(pending.length, 6) - 1 ? "" : "border-b border-[#F2F4F6]"}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3E6] text-[#E8890C]"><ChatCircleDots className="h-5 w-5" weight="fill" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-[#191F28]">{m.name}</p>
                        <span className="shrink-0 text-[11px] text-[#B0B8C1]">{formatRelativeTime(new Date(m.lastMessageAt).getTime())}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.lastMessage}</p>
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* 채용 파이프라인 */}
          <section className="flex flex-col gap-4">
            <SectionHead title="채용 파이프라인" desc="지원부터 합격까지 단계별 인원이에요." />
            <div className="grid grid-cols-4 gap-2">
              {pipeline.map((s) => (
                <div key={s.label} className="rounded-2xl border border-[#EEF1F5] bg-white px-3 py-4 text-center">
                  <p className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{s.count}</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#8B95A1]">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 공고별 지원 현황 */}
          {byPosition.length ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <SectionHead title="공고별 지원 현황" desc="게시 중 공고에 얼마나 지원했는지 확인해요." />
                <Link href={partnerRoutes.positions} className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] transition hover:text-[#0A3ECB]">전체 보기</Link>
              </div>
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {byPosition.map(({ p, count: c }, i) => (
                  <Link key={p.id} href={`${partnerRoutes.positions}/${p.id}`} className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F6F8FB] ${i === byPosition.length - 1 ? "" : "border-b border-[#F2F4F6]"}`}>
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${PARTNER_POSITION_STATUS[p.status].cls}`}>{PARTNER_POSITION_STATUS[p.status].label}</span>
                    <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#191F28]">{p.title || "제목 없는 공고"}</p>
                    <span className="shrink-0 text-[13px] font-bold text-[#0B46E8]">지원 {c}명</span>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* 최근 지원자 */}
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <SectionHead title="최근 지원자" desc="새로 지원한 인재를 확인해요." />
              {applicants.length ? <Link href={partnerRoutes.applicants} className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] transition hover:text-[#0A3ECB]">전체 보기</Link> : null}
            </div>
            {recent.length ? (
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {recent.map((a, i) => (
                  <ApplicantRow key={a.id} a={a} last={i === recent.length - 1} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🧑‍💼</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">아직 지원자가 없어요</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">공고를 올리면 지원자가 여기에 모여요.</p>
              </div>
            )}
          </section>

          {/* 빠른 작업 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={partnerRoutes.positionNew} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-5 py-3.5 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
              <Plus className="h-4 w-4" weight="bold" /> 새 공고 작성
            </Link>
            <Link href={partnerRoutes.positions} className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#E5E8EB] bg-white px-5 py-3.5 text-[14.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
              공고 관리
            </Link>
          </div>
        </div>
      ) : null}

      {chat ? (
        <ChatModal
          applicationId={chat.applicationId}
          applicantId={chat.applicantId}
          name={chat.name}
          positionTitle={chat.positionTitle}
          onReplied={() => setPending((prev) => prev.filter((x) => x.applicationId !== chat.applicationId))}
          onClose={() => {
            setChat(null);
            void getPartnerPendingMessages().then(setPending).catch(() => {});
          }}
        />
      ) : null}
    </PartnerAppShell>
  );
}

// 지원자와의 대화 팝업 — 스레드 + 답장.
function ChatModal({ applicationId, applicantId, name, positionTitle, onClose, onReplied }: { applicationId: string; applicantId: string; name: string; positionTitle: string; onClose: () => void; onReplied: () => void }) {
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [messages, setMessages] = useState<PartnerApplicantMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  function loadMessages() {
    void getPartnerApplicantMessages(applicationId).then(setMessages).catch(() => {});
  }
  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    sendPartnerApplicantMessage(applicationId, t)
      .then(() => {
        setText("");
        loadMessages();
        onReplied(); // 답장했으니 미답장 목록에서 즉시 제거.
      })
      .catch(() => toast.error("메시지 전송에 실패했어요."))
      .finally(() => setSending(false));
  }

  const chat = messages.filter((m) => m.visibility === "CANDIDATE");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[560px] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-[#191F28]">{name}</p>
            <p className="truncate text-[12px] text-[#8B95A1]">{positionTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`${partnerRoutes.applicants}/${encodeURIComponent(applicantId)}`} className="inline-flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
              지원자 상세 <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
            </Link>
            <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4">
          {chat.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#B0B8C1]">아직 주고받은 메시지가 없어요.</p>
          ) : (
            chat.map((m) => {
              const mine = m.authorRole !== "STUDENT";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[#0B46E8] text-white" : "border border-[#EEF1F5] bg-white text-[#191F28]"}`}>
                    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">{m.content}</p>
                    <p className={`mt-1 text-[10.5px] ${mine ? "text-white/60" : "text-[#B0B8C1]"}`}>{formatRelativeTime(new Date(m.createdAt).getTime())}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-end gap-2 border-t border-[#F2F4F6] px-4 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="답장 보내기…"
            className="max-h-28 flex-1 resize-none rounded-2xl bg-[#F2F4F6] px-4 py-2.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#0B46E8]/30"
          />
          <button type="button" onClick={send} disabled={!text.trim() || sending} aria-label="보내기" className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
            <PaperPlaneTilt className="h-5 w-5" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{desc}</p>
    </div>
  );
}

function ApplicantRow({ a, last }: { a: PartnerApplicantListItem; last: boolean }) {
  const s = PARTNER_APPLICANT_STATUS[a.status];
  const rec = PARTNER_RECOMMENDATION[a.recommendation];
  return (
    <Link href={`${partnerRoutes.applicants}/${encodeURIComponent(a.id)}`} className={`flex items-center gap-3 px-4 py-4 transition hover:bg-[#F6F8FB] ${last ? "" : "border-b border-[#F2F4F6]"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14.5px] font-bold text-[#191F28]">{a.name}</p>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
          {a.recommendation === "HIGH" ? <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${rec.cls}`}>{rec.label}</span> : null}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{a.positionTitle}</p>
      </div>
      <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
    </Link>
  );
}
