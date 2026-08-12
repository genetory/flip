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
import { usePlatformT } from "../../../lib/i18n";

function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function PartnerCandidateDetailScreen({ candidateUserId }: { candidateUserId: string }) {
  const t = usePlatformT();
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
                  <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{d.name ?? t("이름 비공개", "Name hidden", "姓名不公开", "Ẩn tên", "名前非公開", "Nama disembunyikan")}</p>
                  {d.connectionStatus === "ACCEPTED" ? (
                    <span className="rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">{t("연결됨", "Connected", "已连接", "Đã kết nối", "つながり済み", "Terhubung")}</span>
                  ) : d.connectionStatus === "PENDING" ? (
                    <span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">{t("요청 보냄", "Request sent", "已发送请求", "Đã gửi yêu cầu", "リクエスト送信", "Terkirim")}</span>
                  ) : d.connectionStatus === "DECLINED" ? (
                    <span className="rounded-md bg-[#FDECEE] px-2.5 py-0.5 text-[11px] font-bold text-[#F04452]">{t("거절됨", "Declined", "已拒绝", "Đã từ chối", "拒否済み", "Ditolak")}</span>
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
                <span className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#E7F8EF] px-4 text-[13.5px] font-bold text-[#0A9B59]">{t("연결됨 · 연락처가 공개됐어요", "Connected · contact revealed", "已连接 · 联系方式已公开", "Đã kết nối · đã hiện liên hệ", "つながり済み · 連絡先が公開されました", "Terhubung · kontak terbuka")}</span>
              ) : d.connectionStatus === "PENDING" ? (
                <span className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[13.5px] font-bold text-[#8B95A1]">{t("연결 요청을 보냈어요 · 수락 대기 중", "Request sent · awaiting acceptance", "已发送请求 · 等待接受", "Đã gửi yêu cầu · chờ chấp nhận", "リクエスト送信 · 承認待ち", "Terkirim · menunggu diterima")}</span>
              ) : d.connectionStatus === "DECLINED" ? (
                <span className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#FDECEE] px-4 text-[13.5px] font-bold text-[#F04452]">{t("후보가 연결 요청을 거절했어요", "The candidate declined your request", "候选人拒绝了连接请求", "Ứng viên đã từ chối yêu cầu", "候補者がリクエストを拒否しました", "Kandidat menolak permintaan")}</span>
              ) : (
                <button type="button" onClick={() => setConnectOpen(true)} className="inline-flex h-[44px] w-full items-center justify-center rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  {t("연결 요청하기", "Request connection", "发送连接请求", "Gửi yêu cầu kết nối", "つながりを申請", "Minta koneksi")}
                </button>
              )}
              {d.connectionStatus !== "ACCEPTED" && d.connectionStatus !== "DECLINED" ? (
                <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("후보가 수락하면 이메일·전화번호가 공개돼요.", "Once the candidate accepts, their email and phone are revealed.", "候选人接受后将公开邮箱和电话。", "Khi ứng viên chấp nhận, email và số điện thoại sẽ hiện.", "候補者が承認するとメール・電話番号が公開されます。", "Setelah kandidat menerima, email dan telepon terbuka.")}</p>
              ) : null}
            </div>
          </div>

          {/* 서류 요약 — 이력서·자기소개서 AI 불렛(지원자 상세와 동일) */}
          <section>
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("서류 요약", "Document summary", "材料摘要", "Tóm tắt hồ sơ", "書類要約", "Ringkasan dokumen")}</h2>
            <div className="flex flex-col gap-4 rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <SummaryBlock emoji="📄" title={t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume")} bullets={summary?.resumeBullets ?? []} loading={summaryLoading} />
              <SummaryBlock emoji="✍️" title={t("자기소개서", "Cover letter", "求职信", "Thư xin việc", "志望動機書", "Surat lamaran")} bullets={summary?.coverBullets ?? []} loading={summaryLoading} />
            </div>
          </section>

          {/* 소개 */}
          {summaryText ? (
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("소개", "Introduction", "简介", "Giới thiệu", "紹介", "Perkenalan")}</h2>
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <p className="whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{summaryText}</p>
              </div>
            </section>
          ) : null}

          {/* 기본 이력 */}
          {educations.length || careers.length || languages.length || skills.length ? (
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이력", "Background", "履历", "Hồ sơ", "経歴", "Riwayat")}</h2>
              <div className="flex flex-col gap-3">
                {educations.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]"><GraduationCap className="h-4 w-4 text-[#8B95A1]" /> {t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</p>
                    <div className="flex flex-col gap-2">
                      {educations.map((e, i) => (
                        <div key={i} className="text-[13px] text-[#4E5968]">
                          <span className="font-semibold text-[#191F28]">{str(e.schoolName) || t("학교", "School", "学校", "Trường", "学校", "Sekolah")}</span>
                          {str(e.major) ? ` · ${str(e.major)}` : ""}
                          {str(e.degree) ? ` · ${str(e.degree)}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {careers.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]"><Briefcase className="h-4 w-4 text-[#8B95A1]" /> {t("경력", "Experience", "工作经历", "Kinh nghiệm", "職歴", "Pengalaman")}</p>
                    <div className="flex flex-col gap-2.5">
                      {careers.map((w, i) => (
                        <div key={i} className="text-[13px] text-[#4E5968]">
                          <p><span className="font-semibold text-[#191F28]">{str(w.company) || t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")}</span>{str(w.role) || str(w.position) ? ` · ${str(w.role) || str(w.position)}` : ""}</p>
                          {str(w.description) ? <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{str(w.description)}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {languages.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]"><Translate className="h-4 w-4 text-[#8B95A1]" /> {t("언어", "Languages", "语言", "Ngôn ngữ", "言語", "Bahasa")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map((l) => <span key={l} className="rounded-md bg-[#F5F7FA] px-2 py-1 text-[12px] font-medium text-[#4E5968]">{l}</span>)}
                    </div>
                  </div>
                ) : null}
                {skills.length ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-2.5 text-[13px] font-bold text-[#191F28]">{t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian")}</p>
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
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("자기소개서", "Cover letter", "求职信", "Thư xin việc", "志望動機書", "Surat lamaran")}</h2>
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
          name={d.name ?? t("이 인재", "this talent", "该人才", "nhân tài này", "この人材", "talenta ini")}
          onClose={() => setConnectOpen(false)}
          onDone={() => {
            setD((prev) => (prev ? { ...prev, connectionStatus: "PENDING" } : prev));
            setConnectOpen(false);
            toast.success(t("연결 요청을 보냈어요", "Connection request sent", "已发送连接请求", "Đã gửi yêu cầu kết nối", "つながりリクエストを送りました", "Permintaan koneksi terkirim"));
          }}
          candidateUserId={candidateUserId}
        />
      ) : null}
    </PartnerAppShell>
  );
}

function SummaryBlock({ emoji, title, bullets, loading }: { emoji: string; title: string; bullets: string[]; loading: boolean }) {
  const t = usePlatformT();
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#191F28]"><span aria-hidden>{emoji}</span> {title}</p>
      <div className="mt-2 rounded-xl bg-[#F8FAFB] px-3.5 py-2.5">
        <p className="flex items-center gap-1 text-[11px] font-bold text-[#8B95A1]"><Sparkle className="h-3 w-3 text-[#0B46E8]" weight="fill" /> {t("AI 요약", "AI summary", "AI摘要", "Tóm tắt AI", "AI要約", "Ringkasan AI")}</p>
        {loading ? (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">{t("요약 생성 중…", "Generating summary…", "生成摘要中…", "Đang tạo tóm tắt…", "要約生成中…", "Membuat ringkasan…")}</p>
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
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">{t("요약할 내용이 없어요.", "Nothing to summarize yet.", "暂无可摘要的内容。", "Chưa có nội dung để tóm tắt.", "要約する内容がありません。", "Belum ada yang bisa diringkas.")}</p>
        )}
      </div>
    </div>
  );
}

function ConnectModal({ candidateUserId, name, onClose, onDone }: { candidateUserId: string; name: string; onClose: () => void; onDone: () => void }) {
  const t = usePlatformT();
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [message, setMessage] = useState(t("안녕하세요, 프로필을 보고 함께 이야기 나눠보고 싶어 연락드려요.", "Hi, I saw your profile and would love to connect and chat.", "您好，看了您的资料，很想和您聊聊。", "Xin chào, tôi xem hồ sơ của bạn và muốn kết nối trò chuyện.", "こんにちは、プロフィールを拝見しお話ししたくご連絡しました。", "Halo, saya melihat profil Anda dan ingin terhubung untuk berbincang."));
  const [saving, setSaving] = useState(false);

  function submit() {
    if (saving) return;
    setSaving(true);
    connectPartnerCandidate(candidateUserId, message.trim() || undefined)
      .then(onDone)
      .catch(() => toast.error(t("요청에 실패했어요.", "Couldn't send the request.", "请求失败。", "Không thể gửi yêu cầu.", "リクエストに失敗しました。", "Gagal mengirim permintaan.")))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`${name}에게 연결 요청`, `Connect with ${name}`, `向 ${name} 发送连接请求`, `Kết nối với ${name}`, `${name}さんへつながり申請`, `Terhubung dengan ${name}`)}</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("수락하면 연락처가 공유돼요. 간단한 인사를 남겨보세요.", "Once accepted, contact info is shared. Leave a short greeting.", "接受后将共享联系方式。留下简短问候吧。", "Khi được chấp nhận, thông tin liên hệ sẽ được chia sẻ. Hãy để lại lời chào ngắn.", "承認されると連絡先が共有されます。簡単な挨拶を残してください。", "Setelah diterima, kontak akan dibagikan. Tinggalkan sapaan singkat.")}</p>
        </div>
        <div className="px-6 py-4">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
          <button type="button" onClick={submit} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#0B46E8] text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{saving ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : t("요청 보내기", "Send request", "发送请求", "Gửi yêu cầu", "リクエスト送信", "Kirim")}</button>
        </div>
      </div>
    </div>
  );
}
