"use client";

// 파트너 인재 상세 — 인재풀 후보의 이력 요약 + 자기소개서 + 연결 요청.
// 연락처(이메일·전화)는 후보가 연결을 수락해야 공개된다.
import { useEffect, useState } from "react";
import { Globe, EnvelopeSimple, Phone, GraduationCap, Briefcase, Translate, Sparkle } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { getPartnerCandidate, connectPartnerCandidate, getPartnerCandidateDocumentSummary, type PartnerCandidateDetail } from "../../../lib/member-profile-client";

function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function PartnerCandidateDetailScreen({ candidateUserId }: { candidateUserId: string }) {
  const toast = useTalentPopup();
  const [d, setD] = useState<PartnerCandidateDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [connectOpen, setConnectOpen] = useState(false);
  const [summary, setSummary] = useState<{ resumeBullets: string[]; coverBullets: string[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  function load() {
    setStatus("loading");
    getPartnerCandidate(candidateUserId)
      .then((r) => {
        setD(r);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    setSummaryLoading(true);
    getPartnerCandidateDocumentSummary(candidateUserId)
      .then(setSummary)
      .catch(() => setSummary({ resumeBullets: [], coverBullets: [] }))
      .finally(() => setSummaryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateUserId]);

  const c = (d?.content ?? {}) as Record<string, unknown>;
  const summaryText = str(c.summary) || str(c.selfIntroduction);
  const skills = Array.isArray(c.skills) ? (c.skills as unknown[]).filter((s): s is string => typeof s === "string") : [];
  const languages = asArray(c.languages).map((l) => [str(l.language), str(l.level)].filter(Boolean).join(" ")).filter(Boolean);
  const educations = asArray(c.educations);
  const careers = asArray(c.careers);

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && d ? (
        <div className="flex flex-col gap-6">
          {/* 헤더 */}
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{(d.name ?? "?").slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{d.name ?? "이름 비공개"}</p>
                  {d.connectionStatus === "ACCEPTED" ? (
                    <span className="rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">연결됨</span>
                  ) : d.connectionStatus === "PENDING" ? (
                    <span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">요청 보냄</span>
                  ) : d.connectionStatus === "DECLINED" ? (
                    <span className="rounded-md bg-[#FDECEE] px-2.5 py-0.5 text-[11px] font-bold text-[#F04452]">거절됨</span>
                  ) : null}
                </div>
                {d.nationality ? <p className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[#8B95A1]"><Globe className="h-3.5 w-3.5 text-[#B0B8C1]" /> {d.nationality}</p> : null}
              </div>
            </div>

            {/* 연락처 — 연결 수락 시에만 */}
            {d.contactUnlocked && d.contact ? (
              <div className="mt-4 flex flex-col gap-2 rounded-xl bg-[#F5F8FF] p-3.5">
                {d.contact.email ? <p className="flex items-center gap-2 text-[13px] font-semibold text-[#191F28]"><EnvelopeSimple className="h-4 w-4 text-[#0B46E8]" /> {d.contact.email}</p> : null}
                {d.contact.phone ? <p className="flex items-center gap-2 text-[13px] font-semibold text-[#191F28]"><Phone className="h-4 w-4 text-[#0B46E8]" /> {d.contact.phone}</p> : null}
              </div>
            ) : null}

            {/* 연결 액션 */}
            <div className="mt-4">
              {d.connectionStatus === "ACCEPTED" ? (
                <span className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#E7F8EF] px-4 text-[13.5px] font-bold text-[#0A9B59]">연결됨 · 연락처가 공개됐어요</span>
              ) : d.connectionStatus === "PENDING" ? (
                <span className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[13.5px] font-bold text-[#8B95A1]">연결 요청을 보냈어요 · 수락 대기 중</span>
              ) : d.connectionStatus === "DECLINED" ? (
                <span className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#FDECEE] px-4 text-[13.5px] font-bold text-[#F04452]">후보가 연결 요청을 거절했어요</span>
              ) : (
                <button type="button" onClick={() => setConnectOpen(true)} className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  연결 요청하기
                </button>
              )}
              {d.connectionStatus !== "ACCEPTED" && d.connectionStatus !== "DECLINED" ? (
                <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">후보가 수락하면 이메일·전화번호가 공개돼요.</p>
              ) : null}
            </div>
          </div>

          {/* 서류 요약 — 이력서·자기소개서 AI 불렛(지원자 상세와 동일) */}
          <section>
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">서류 요약</h2>
            <div className="flex flex-col gap-4 rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <SummaryBlock emoji="📄" title="이력서" bullets={summary?.resumeBullets ?? []} loading={summaryLoading} />
              <SummaryBlock emoji="✍️" title="자기소개서" bullets={summary?.coverBullets ?? []} loading={summaryLoading} />
            </div>
          </section>

          {/* 소개 */}
          {summaryText ? (
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">소개</h2>
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <p className="whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{summaryText}</p>
              </div>
            </section>
          ) : null}

          {/* 기본 이력 */}
          {educations.length || careers.length || languages.length || skills.length ? (
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">이력</h2>
              <div className="flex flex-col gap-3">
                {educations.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]"><GraduationCap className="h-4 w-4 text-[#8B95A1]" /> 학력</p>
                    <div className="flex flex-col gap-2">
                      {educations.map((e, i) => (
                        <div key={i} className="text-[13px] text-[#4E5968]">
                          <span className="font-semibold text-[#191F28]">{str(e.schoolName) || "학교"}</span>
                          {str(e.major) ? ` · ${str(e.major)}` : ""}
                          {str(e.degree) ? ` · ${str(e.degree)}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {careers.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]"><Briefcase className="h-4 w-4 text-[#8B95A1]" /> 경력</p>
                    <div className="flex flex-col gap-2.5">
                      {careers.map((w, i) => (
                        <div key={i} className="text-[13px] text-[#4E5968]">
                          <p><span className="font-semibold text-[#191F28]">{str(w.company) || "회사"}</span>{str(w.role) || str(w.position) ? ` · ${str(w.role) || str(w.position)}` : ""}</p>
                          {str(w.description) ? <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{str(w.description)}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {languages.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]"><Translate className="h-4 w-4 text-[#8B95A1]" /> 언어</p>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map((l) => <span key={l} className="rounded-md bg-[#F5F7FA] px-2 py-1 text-[12px] font-medium text-[#4E5968]">{l}</span>)}
                    </div>
                  </div>
                ) : null}
                {skills.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 text-[13px] font-bold text-[#191F28]">스킬</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => <span key={s} className="rounded-md bg-[#F5F7FA] px-2 py-1 text-[12px] font-medium text-[#4E5968]">{s}</span>)}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 자기소개서 */}
          {d.coverLetter && d.coverLetter.items.length ? (
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">자기소개서</h2>
              <div className="flex flex-col gap-3">
                {d.coverLetter.items.map((it, i) => (
                  <div key={i} className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    {it.prompt ? <p className="mb-1.5 break-keep text-[13px] font-bold text-[#191F28]">{it.prompt}</p> : null}
                    <p className="whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{it.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {connectOpen && d ? (
        <ConnectModal
          name={d.name ?? "이 인재"}
          onClose={() => setConnectOpen(false)}
          onDone={() => {
            setD((prev) => (prev ? { ...prev, connectionStatus: "PENDING" } : prev));
            setConnectOpen(false);
            toast.success("연결 요청을 보냈어요");
          }}
          candidateUserId={candidateUserId}
        />
      ) : null}
    </PartnerAppShell>
  );
}

function SummaryBlock({ emoji, title, bullets, loading }: { emoji: string; title: string; bullets: string[]; loading: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#191F28]"><span aria-hidden>{emoji}</span> {title}</p>
      <div className="mt-2 rounded-xl bg-[#F8FAFB] px-3.5 py-2.5">
        <p className="flex items-center gap-1 text-[11px] font-bold text-[#8B95A1]"><Sparkle className="h-3 w-3 text-[#0B46E8]" weight="fill" /> AI 요약</p>
        {loading ? (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">요약 생성 중…</p>
        ) : bullets.length ? (
          <ul className="mt-1.5 flex flex-col gap-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#4E5968]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                <span className="min-w-0 flex-1 break-keep">{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">요약할 내용이 없어요.</p>
        )}
      </div>
    </div>
  );
}

function ConnectModal({ candidateUserId, name, onClose, onDone }: { candidateUserId: string; name: string; onClose: () => void; onDone: () => void }) {
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [message, setMessage] = useState("안녕하세요, 프로필을 보고 함께 이야기 나눠보고 싶어 연락드려요.");
  const [saving, setSaving] = useState(false);

  function submit() {
    if (saving) return;
    setSaving(true);
    connectPartnerCandidate(candidateUserId, message.trim() || undefined)
      .then(onDone)
      .catch(() => toast.error("요청에 실패했어요."))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{name}에게 연결 요청</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">수락하면 연락처가 공유돼요. 간단한 인사를 남겨보세요.</p>
        </div>
        <div className="px-6 py-4">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">취소</button>
          <button type="button" onClick={submit} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#0B46E8] text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{saving ? "보내는 중…" : "요청 보내기"}</button>
        </div>
      </div>
    </div>
  );
}
