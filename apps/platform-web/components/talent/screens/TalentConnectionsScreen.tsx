"use client";

// 탤런트 기업 연결 — 인재풀 등록(동의) + 받은 연결/제안 요청 수락·거절. (레거시 /profile?tab=connections 의 모던 버전)
import { useEffect, useState } from "react";
import { EnvelopeSimple, Buildings } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TLoading, TError } from "../ui/primitives";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getTalentPoolStatus, listMyConnections, respondConnection, setTalentPool, type MyConnection } from "../../../lib/candidate-connect-client";
import { usePlatformT } from "../../../lib/i18n";

export function TalentConnectionsScreen() {
  const t = usePlatformT();
  const toast = useTalentPopup();
  const [conns, setConns] = useState<MyConnection[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [optIn, setOptIn] = useState(false);
  const [poolBusy, setPoolBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setStatus("loading");
    // 인재 검색 노출은 가입하면 기본으로 켜져 있다 — 끈 기록(optedOut)이 있을 때만 꺼짐.
    Promise.all([listMyConnections().catch(() => [] as MyConnection[]), getTalentPoolStatus().catch(() => null)])
      .then(([c, pool]) => {
        setConns(c);
        setOptIn(pool ? !pool.optedOut : true);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);


  async function toggle() {
    if (poolBusy) return;
    const next = !optIn;
    setPoolBusy(true);
    try {
      await setTalentPool(next);
      setOptIn(next);
      toast.success(next ? t("인재 검색 노출을 켰어요", "Talent search visibility on", "已开启人才搜索展示", "Đã bật hiển thị", "人材検索への表示をオンにしました", "Visibilitas aktif") : t("인재 검색 노출을 껐어요", "Talent search visibility off", "已关闭人才搜索展示", "Đã tắt hiển thị", "人材検索への表示をオフにしました", "Visibilitas nonaktif"));
    } catch {
      toast.error(t("변경에 실패했어요.", "Change failed.", "更改失败。", "Thay đổi thất bại.", "変更に失敗しました。", "Gagal mengubah."));
    } finally {
      setPoolBusy(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      await respondConnection(id, action);
      setConns((prev) => prev.map((c) => (c.id === id ? { ...c, status: action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date().toISOString() } : c)));
      toast.success(action === "accept" ? t("연결을 수락했어요", "Connection accepted", "已接受连接", "Đã chấp nhận kết nối", "つながりを承認しました", "Koneksi diterima") : t("연결을 거절했어요", "Connection declined", "已拒绝连接", "Đã từ chối kết nối", "つながりを拒否しました", "Koneksi ditolak"));
    } catch {
      toast.error(t("처리에 실패했어요.", "Something went wrong.", "处理失败。", "Xử lý thất bại.", "処理に失敗しました。", "Gagal memproses."));
    } finally {
      setBusyId(null);
    }
  }

  const pending = conns.filter((c) => c.status === "PENDING");

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-6">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("기업 연결", "Company connections", "企业连接", "Kết nối doanh nghiệp", "企業とのつながり", "Koneksi perusahaan")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("기업이 보낸 연결·제안을 확인하고, 인재 검색 노출을 관리해요.", "Review connections and offers from companies, and manage your talent search visibility.", "查看企业发来的连接和邀请，并管理人才搜索展示。", "Xem kết nối, lời mời và quản lý hiển thị.", "企業からのつながり・提案を確認し、人材検索への表示を管理します。", "Lihat koneksi dan tawaran, serta atur visibilitas.")}</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 기업 인재 검색 노출 — 가입하면 기본 노출(블라인드), 여기서 끌 수 있다 */}
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("인재 검색 노출", "Talent search", "人才搜索展示", "Hiển thị tìm kiếm", "人材検索への表示", "Pencarian talenta")}</h2>
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-bold text-[#191F28]">{t("기업 인재 검색에 노출", "Appear in company talent search", "出现在企业人才搜索中", "Hiển thị trong tìm kiếm nhân tài", "企業の人材検索に表示", "Tampil di pencarian talenta")}</p>
                    <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">
                      {t("기본으로 켜져 있어요. 대표 이력서가 이름·연락처를 가린 채 기업 인재 검색에 보이고, 연락처는 내가 연결을 수락할 때만 공개돼요. 끄면 검색과 새 연결 요청에서 빠져요.", "On by default. Your primary resume appears in company talent search with your name and contact hidden; contact is shared only when you accept a connection. Turn it off to leave search and new requests.", "默认开启。主简历会在隐藏姓名和联系方式的情况下出现在企业人才搜索中，仅在你接受连接时公开联系方式。关闭后将不再出现在搜索和新请求中。", "Bật mặc định. CV chính hiển thị trong tìm kiếm của doanh nghiệp, ẩn tên và liên hệ; liên hệ chỉ chia sẻ khi bạn chấp nhận. Tắt để rời khỏi tìm kiếm.", "初期設定でオンです。代表の履歴書が名前・連絡先を隠した状態で企業の人材検索に表示され、連絡先はつながりを承認したときのみ公開されます。オフにすると検索と新しい申請から外れます。", "Aktif secara bawaan. CV utama tampil di pencarian perusahaan dengan nama dan kontak disembunyikan. Matikan untuk keluar dari pencarian.")}
                    </p>
                    <p className="mt-1.5 text-[12px] text-[#8B95A1]">{t("이력서와 자기소개서가 어느정도 채워져 있어야 검색 결과에 노출돼요.", "Your resume and cover letter need to be reasonably complete to appear in search results.", "简历和自我介绍需填写到一定程度才会出现在搜索结果中。", "Hồ sơ và thư giới thiệu cần được điền tương đối đầy đủ mới hiển thị trong kết quả tìm kiếm.", "履歴書と自己紹介書がある程度埋まっていると検索結果に表示されます。", "Resume dan surat lamaran harus cukup lengkap agar muncul di hasil pencarian.")}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={optIn}
                    disabled={poolBusy}
                    onClick={() => void toggle()}
                    className={`relative mt-0.5 h-7 w-12 flex-none rounded-full transition ${optIn ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"} disabled:opacity-50`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${optIn ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* 받은 연결 요청 */}
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("받은 연결 요청", "Connection requests", "收到的连接请求", "Yêu cầu kết nối", "受け取ったつながり申請", "Permintaan koneksi")} {pending.length ? <span className="text-[#0B46E8]">({pending.length})</span> : null}</h2>
              {conns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🤝</span>
                  <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("아직 받은 연결 요청이 없어요", "No connection requests yet", "还没有收到连接请求", "Chưa có yêu cầu kết nối", "まだつながり申請がありません", "Belum ada permintaan koneksi")}</p>
                  <p className="mt-1 text-[13px] text-[#8B95A1]">{t("인재 검색에 보이면 기업이 먼저 연락할 수 있어요.", "Companies can reach out first while you're visible in talent search.", "在人才搜索中可见时，企业可以主动联系你。", "Khi hiển thị, doanh nghiệp có thể liên hệ trước.", "人材検索に表示されていると企業から先に連絡が来ることがあります。", "Saat terlihat, perusahaan bisa menghubungimu lebih dulu.")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {conns.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                      <div className="flex items-start gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[15px] font-bold text-[#191F28]">{c.orgName}</p>
                            <span className="shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(new Date(c.createdAt).getTime(), undefined, t)}</span>
                          </div>
                          {c.message ? <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#4E5968]">“{c.message}”</p> : null}
                          {c.status === "ACCEPTED" && c.partnerEmail ? (
                            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#F5F8FF] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0B46E8]"><EnvelopeSimple className="h-4 w-4" /> {c.partnerEmail}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        {c.status === "PENDING" ? (
                          <>
                            <button type="button" disabled={busyId === c.id} onClick={() => void respond(c.id, "decline")} className="rounded-xl px-3.5 py-2 text-[13px] font-bold text-[#4E5968] ring-1 ring-[#E4EAF2] transition hover:bg-[#F6F8FB] disabled:opacity-50">{t("거절", "Decline", "拒绝", "Từ chối", "拒否", "Tolak")}</button>
                            <button type="button" disabled={busyId === c.id} onClick={() => void respond(c.id, "accept")} className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{t("수락하기", "Accept", "接受", "Chấp nhận", "承認する", "Terima")}</button>
                          </>
                        ) : c.status === "ACCEPTED" ? (
                          <span className="rounded-lg bg-[#E7F8EF] px-2.5 py-1 text-[12px] font-bold text-[#0A9B59]">{t("수락함", "Accepted", "已接受", "Đã chấp nhận", "承認済み", "Diterima")}</span>
                        ) : (
                          <span className="rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-[12px] font-bold text-[#8B95A1]">{t("거절함", "Declined", "已拒绝", "Đã từ chối", "拒否済み", "Ditolak")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </TalentAppShell>
  );
}
