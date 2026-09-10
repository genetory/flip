"use client";

// 공개 Talent Passport — 기업 제출/공유용(무인증). 검증·역량 요약 + 공유 유도.
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, NotePencil, QrCode, ShareNetwork, ShieldCheck, X } from "@phosphor-icons/react";
import { fetchSharedPassport, type SharedPassport, type PassportTier } from "../../lib/launch/progress-client";
import { usePlatformT } from "../../lib/i18n";

const TIER: Record<PassportTier, { label: string; ring: string; bg: string; ink: string }> = {
  preparing: { label: "준비 중", ring: "#C9CDD2", bg: "#F2F4F6", ink: "#8B95A1" },
  bronze: { label: "Verified Bronze", ring: "#C08457", bg: "#F6ECE3", ink: "#A96A3E" },
  silver: { label: "Verified Silver", ring: "#8B95A1", bg: "#EEF1F5", ink: "#5A6472" },
  gold: { label: "Verified Gold", ring: "#E0A500", bg: "#FBF2D6", ink: "#A97B00" }
};

const GAUGE_R = 47;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1">
      <span className="text-[19px] font-black leading-none tabular-nums text-[#111826]">{value}</span>
      <span className="text-[11px] font-semibold text-[#8B95A1]">{label}</span>
    </div>
  );
}

export function SharedPassportView({ token }: { token: string }) {
  const t = usePlatformT();
  const [p, setP] = useState<SharedPassport | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    void fetchSharedPassport(token).then((x) => {
      if (!alive) return;
      setP(x);
      setStatus(x ? "ready" : "notfound");
    });
    return () => {
      alive = false;
    };
  }, [token]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : `/p/${token}`;

  // 핵심 강점 — 대표 경험의 성과 문장에서 추린다.
  const strengths = Array.from(new Set((p?.highlights ?? []).flatMap((h) => h.bullets ?? []).map((b) => (b ?? "").trim()).filter((b) => b.length > 6))).slice(0, 3);
  // 준비 상태 — 약점을 노출하지 않고, 얼마나 준비됐는지(느낌)를 긍정적으로 전한다.
  const bd = p?.breakdown;
  const dims = bd
    ? [
        { label: t("뚜렷한 목표 방향", "Clear career direction", "明确的目标方向", "Định hướng rõ ràng", "明確な目標設定", "Arah karier jelas"), v: bd.direction || 0 },
        { label: t("탄탄한 이력서", "Solid resume", "扎实的简历", "Sơ yếu vững chắc", "充実した履歴書", "Resume yang kuat"), v: bd.resume || 0 },
        { label: t("설득력 있는 자소서", "Compelling cover letter", "有说服力的自荐信", "Thư giới thiệu thuyết phục", "説得力ある自己PR", "Surat lamaran meyakinkan"), v: bd.cover || 0 },
        { label: t("면접 실전 준비", "Interview-ready", "面试实战准备", "Sẵn sàng phỏng vấn", "面接の実践準備", "Siap wawancara"), v: bd.interview || 0 },
        { label: t("풍부한 경험", "Rich experience", "丰富的经验", "Kinh nghiệm phong phú", "豊富な経験", "Pengalaman kaya"), v: bd.experience || 0 }
      ]
    : [];
  // 강한 영역만 위에서부터 최대 3개(약한 영역은 감춰서 인상을 좋게).
  const topAreas = dims.filter((d) => d.v > 0).sort((a, b) => b.v - a.v).slice(0, 3).map((d) => d.label);
  const r = p?.readiness ?? 0;
  const readyPhrase =
    r >= 80
      ? {
          h: t("채용에 바로 투입될 만큼 준비됐어요", "Ready to be hired right away", "已准备好即刻上岗", "Sẵn sàng để được tuyển ngay", "すぐに採用できるほど準備万全", "Siap direkrut segera"),
          s: t("서류부터 면접까지 실전 수준으로 마쳤어요", "Completed everything from documents to interviews at a practical level", "从材料到面试都达到实战水平", "Hoàn tất từ hồ sơ đến phỏng vấn ở mức thực chiến", "書類から面接まで実践レベルで完了", "Menuntaskan dari dokumen hingga wawancara di level nyata")
        }
      : r >= 60
        ? {
            h: t("실전 지원 단계까지 준비를 마쳤어요", "Ready for real job applications", "已完成实战申请阶段的准备", "Đã sẵn sàng cho giai đoạn ứng tuyển thực tế", "実践的な応募段階まで準備完了", "Siap untuk tahap melamar nyata"),
            s: t("핵심 서류와 면접 준비가 탄탄해요", "Core documents and interview prep are solid", "核心材料与面试准备都很扎实", "Hồ sơ cốt lõi và chuẩn bị phỏng vấn đều vững", "主要書類と面接準備がしっかり整っています", "Dokumen inti dan persiapan wawancara solid")
          }
        : r >= 40
          ? {
              h: t("핵심 준비를 갖춘 성장형 지원자예요", "A growing candidate with the essentials in place", "已具备核心准备的成长型候选人", "Ứng viên đang phát triển với nền tảng cốt lõi", "基礎を備えた成長型の候補者です", "Kandidat berkembang dengan dasar inti"),
              s: t("방향을 잡고 꾸준히 채워가고 있어요", "Setting a direction and building up steadily", "已确定方向并稳步充实中", "Đã có định hướng và đang bồi đắp đều đặn", "方向性を定め着実に積み上げています", "Menetapkan arah dan terus melengkapi")
            }
          : {
              h: t("커리어 방향을 잡아가는 단계예요", "Still shaping a career direction", "正在确立职业方向的阶段", "Đang trong giai đoạn định hình hướng đi", "キャリアの方向性を定めている段階です", "Sedang membentuk arah karier"),
              s: t("기초부터 차근차근 준비하고 있어요", "Building up step by step from the basics", "正从基础开始循序渐进地准备", "Đang chuẩn bị từng bước từ cơ bản", "基礎から一歩ずつ準備しています", "Menyiapkan langkah demi langkah dari dasar")
            };
  const verifiedLabel = p?.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long" }) : null;

  async function openQr() {
    setQrOpen(true);
    if (qr) return;
    try {
      const QR = (await import("qrcode")).default;
      const url = await QR.toDataURL(shareUrl, { margin: 1, width: 320, color: { dark: "#0B1227", light: "#FFFFFF" } });
      setQr(url);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    const tierLabel = p && p.tier !== "preparing" ? (TIER[p.tier] ?? TIER.preparing).label : t("준비 중", "Preparing", "准备中", "Đang chuẩn bị", "準備中", "Sedang disiapkan");
    const title = p?.name ? `${p.name} · ${tierLabel}` : "APLY Talent Passport";
    const text = `${title} · ${t("취업 준비도", "Job readiness", "求职准备度", "Mức sẵn sàng ứng tuyển", "就活準備度", "Kesiapan kerja")} ${p?.readiness ?? ""} — ${t("APLY로 검증된 인재 프로필", "A talent profile verified by APLY", "由 APLY 验证的人才档案", "Hồ sơ nhân tài được APLY xác minh", "APLYが検証した人材プロフィール", "Profil talenta terverifikasi APLY")}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        /* 취소 → 링크 복사로 폴백 */
      }
    }
    void copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-10">
      <style>{`@media print { body { background: #ffffff !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 12mm; } .print\\:hidden { display: none !important; } }`}</style>
      <div className="mx-auto w-full max-w-[400px]">
        {status === "loading" ? (
          <p className="py-20 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
        ) : status === "notfound" || !p ? (
          <div className="rounded-3xl border border-[#EEF1F5] bg-white p-8 text-center">
            <p className="text-[15px] font-bold text-[#191F28]">{t("공유된 프로필을 찾을 수 없어요", "Shared profile not found", "找不到分享的档案", "Không tìm thấy hồ sơ được chia sẻ", "共有されたプロフィールが見つかりません", "Profil yang dibagikan tidak ditemukan")}</p>
            <p className="mt-1.5 text-[13px] text-[#8B95A1]">{t("링크가 만료되었거나 잘못된 주소일 수 있어요.", "The link may have expired or the address may be incorrect.", "链接可能已过期或地址有误。", "Liên kết có thể đã hết hạn hoặc địa chỉ không đúng.", "リンクの有効期限が切れているか、アドレスが正しくない可能性があります。", "Tautan mungkin sudah kedaluwarsa atau alamatnya salah.")}</p>
            <Link href="/career-launch" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
              {t("내 커리어 패스포트 만들기", "Create my Career Passport", "创建我的职业护照", "Tạo Career Passport của tôi", "自分のキャリアパスポートを作成", "Buat Career Passport saya")}
            </Link>
          </div>
        ) : (
          <>
            {/* 상단 액션 — 최소 */}
            <div className="mb-3 flex items-center justify-end gap-1.5 print:hidden">
              <button
                type="button"
                onClick={nativeShare}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0B1227] px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-black"
              >
                <ShareNetwork className="h-4 w-4" weight="bold" aria-hidden /> {t("공유하기", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E8EC] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
              >
                {copied ? t("복사됨!", "Copied!", "已复制！", "Đã sao chép!", "コピー完了！", "Tersalin!") : t("링크 복사", "Copy link", "复制链接", "Sao chép liên kết", "リンクをコピー", "Salin tautan")}
              </button>
            </div>

            {/* 메인 카드 — 심플 프로필 */}
            <div className="overflow-hidden rounded-[26px] bg-white p-2.5 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.4)] ring-1 ring-black/[0.06]">
              {/* 커버 */}
              <div className="relative h-[150px] overflow-hidden rounded-[19px]" style={p.background ? undefined : { background: "linear-gradient(150deg,#EAF0F8 0%,#E3EAF4 52%,#DBE6F1 100%)" }}>
                {p.background ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.background} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                ) : (
                  <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 12% 8%, rgba(255,255,255,0.75), transparent 55%)" }} aria-hidden />
                )}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11.5px] font-bold text-[#191F28] shadow-sm backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: (TIER[p.tier] ?? TIER.preparing).ring }} aria-hidden />
                  {p.verified ? "✓ " : ""}{p.tier !== "preparing" ? (TIER[p.tier] ?? TIER.preparing).label : t("준비 중", "Preparing", "准备中", "Đang chuẩn bị", "準備中", "Sedang disiapkan")}
                </span>
              </div>

              <div className="px-5 pb-6">
                {/* 아바타 + 준비도 게이지 */}
                <div className="relative mx-auto -mt-[52px] h-[104px] w-[104px]">
                  <svg viewBox="0 0 104 104" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                    <defs>
                      <linearGradient id="pp-gauge" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#7BB0FF" />
                        <stop offset="50%" stopColor="#3182F6" />
                        <stop offset="100%" stopColor="#0B46E8" />
                      </linearGradient>
                    </defs>
                    <circle cx="52" cy="52" r={GAUGE_R} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="9" />
                    <circle cx="52" cy="52" r={GAUGE_R} fill="none" stroke="url(#pp-gauge)" strokeWidth="9" strokeLinecap="round" strokeDasharray={GAUGE_C} strokeDashoffset={GAUGE_C * (1 - Math.max(0, Math.min(100, p.readiness || 0)) / 100)} />
                  </svg>
                  <div className="absolute inset-[11px] overflow-hidden rounded-full bg-[#EEF1F5] ring-4 ring-white">
                    {p.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photo} alt={p.name || ""} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[34px] font-black text-[#0B46E8]">{(p.name?.trim()?.charAt(0) || "A").toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* 이름 · 소개 */}
                <h1 className="mt-4 break-keep text-center text-[26px] font-black leading-[1.1] tracking-[-0.035em] text-[#111826]">{p.name || t("익명 인재", "Anonymous talent", "匿名人才", "Nhân tài ẩn danh", "匿名の人材", "Talenta anonim")}</h1>
                {p.headline || p.pitch ? (
                  <p className="mx-auto mt-2 max-w-[21rem] break-keep text-center text-[14.5px] leading-[1.6] text-[#4E5968]">{p.headline || p.pitch}</p>
                ) : null}
                {p.targetJobs && p.targetJobs.length > 0 ? (
                  <p className="mt-3 break-keep text-center text-[12.5px] font-bold tracking-[-0.01em] text-[#0B46E8]">{p.targetJobs.join(" · ")}</p>
                ) : null}

                {/* 스탯 */}
                <div className="mt-5 flex items-stretch rounded-2xl bg-[#F6F7F9] py-3.5">
                  <Stat value={p.readiness} label={t("준비도", "Readiness", "准备度", "Sẵn sàng", "準備度", "Kesiapan")} />
                  <span className="my-1 w-px bg-[#E7E9ED]" aria-hidden />
                  <Stat value={p.experienceCount} label={t("경험", "Experience", "经验", "Kinh nghiệm", "経験", "Pengalaman")} />
                  <span className="my-1 w-px bg-[#E7E9ED]" aria-hidden />
                  <Stat value={p.languages?.length ?? 0} label={t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")} />
                </div>

                {/* 검증 라인 */}
                {p.verified && verifiedLabel ? (
                  <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#8B95A1]">
                    <ShieldCheck className="h-4 w-4 text-[#0A9B59]" weight="fill" aria-hidden />
                    {t("APLY 검증", "Verified by APLY", "APLY 认证", "Xác minh bởi APLY", "APLY認証", "Terverifikasi APLY")} · {verifiedLabel}
                  </p>
                ) : null}

                {/* 준비 상태 — 얼마나 준비됐고 어떤 느낌인지 */}
                <div className="mt-5 rounded-2xl bg-[#EEF3FF] p-4">
                  <p className="text-[14px] font-black leading-[1.4] tracking-[-0.01em] text-[#0B2A66]">{readyPhrase.h}</p>
                  <p className="mt-1 break-keep text-[12.5px] leading-[1.5] text-[#4E5968]">{readyPhrase.s}</p>
                  {topAreas.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {topAreas.map((a, i) => (
                        <span key={i} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8] ring-1 ring-[#0B46E8]/15">{a}</span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* 핵심 강점 */}
                {strengths.length > 0 ? (
                  <div className="mt-5 border-t border-[#F0F1F4] pt-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">{t("핵심 강점", "Key strengths", "核心优势", "Điểm mạnh chính", "強み", "Kekuatan utama")}</p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {strengths.map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-[9px] h-px w-4 shrink-0 bg-[#0B46E8]" aria-hidden />
                          <p className="break-keep text-[13.5px] leading-[1.55] text-[#333D4B]">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 대표 경험 */}
                {p.highlights && p.highlights.length > 0 ? (
                  <div className="mt-5 border-t border-[#F0F1F4] pt-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">{t("대표 경험", "Highlight experience", "代表经历", "Kinh nghiệm tiêu biểu", "主な経験", "Pengalaman utama")}</p>
                    <div className="mt-1.5 divide-y divide-[#F0F1F4]">
                      {p.highlights.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-3 py-2.5">
                          <p className="min-w-0 break-keep text-[13.5px] font-bold text-[#191F28]">{h.head}</p>
                          {h.period ? <p className="shrink-0 text-[11.5px] font-semibold tabular-nums text-[#A8ADB8]">{h.period}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 보유 스킬 */}
                {p.skills && p.skills.length > 0 ? (
                  <div className="mt-5 border-t border-[#F0F1F4] pt-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">{t("보유 스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keterampilan")}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.skills.slice(0, 12).map((s, i) => (
                        <span key={i} className="rounded-lg bg-[#F1F3F5] px-2.5 py-1 text-[12px] font-semibold text-[#4E5968]">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 문서 · QR — 자세한 내용은 링크/QR로 */}
                <div className="mt-5 flex items-stretch overflow-hidden rounded-2xl border border-[#EEF0F3]">
                  {p.hasResume ? (
                    <Link href={`/p/${token}/resume`} target="_blank" rel="noopener noreferrer" className="group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition hover:bg-[#F6F8FF]">
                      <FileText className="h-5 w-5 text-[#4E5968] transition group-hover:text-[#0B46E8]" aria-hidden />
                      <span className="text-[11.5px] font-bold text-[#4E5968] transition group-hover:text-[#0B46E8]">{t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume")}</span>
                    </Link>
                  ) : null}
                  {p.hasResume && p.hasCover ? <span className="w-px bg-[#EEF0F3]" aria-hidden /> : null}
                  {p.hasCover ? (
                    <Link href={`/p/${token}/cover`} target="_blank" rel="noopener noreferrer" className="group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition hover:bg-[#F6F8FF]">
                      <NotePencil className="h-5 w-5 text-[#4E5968] transition group-hover:text-[#0B46E8]" aria-hidden />
                      <span className="text-[11.5px] font-bold text-[#4E5968] transition group-hover:text-[#0B46E8]">{t("자기소개서", "Cover Letter", "自我介绍信", "Thư giới thiệu", "自己PR", "Surat Lamaran")}</span>
                    </Link>
                  ) : null}
                  {p.hasResume || p.hasCover ? <span className="w-px bg-[#EEF0F3]" aria-hidden /> : null}
                  <button type="button" onClick={openQr} className="group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition hover:bg-[#F6F8FF] print:hidden">
                    <QrCode className="h-5 w-5 text-[#4E5968] transition group-hover:text-[#0B46E8]" aria-hidden />
                    <span className="text-[11.5px] font-bold text-[#4E5968] transition group-hover:text-[#0B46E8]">{t("QR 코드", "QR code", "二维码", "Mã QR", "QRコード", "Kode QR")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 바이럴 CTA — 본 사람이 자기 패스포트를 만들게 */}
            <div className="mt-4 overflow-hidden rounded-3xl bg-[#0B1227] p-6 text-center text-white print:hidden">
              <p className="text-[15px] font-black tracking-[-0.02em]">{t("나도 이런 커리어 카드 만들 수 있어요", "You can make a career card like this too", "我也能做出这样的职业卡片", "Bạn cũng có thể tạo thẻ nghề nghiệp như thế này", "あなたもこんなキャリアカードを作れます", "Anda juga bisa membuat kartu karier seperti ini")}</p>
              <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-white/70">{t("APLY Career Launch로 이력서·자소서·면접까지 준비하고, 검증된 인재 프로필을 무료로 받아보세요.", "Prepare your resume, cover letter, and interviews with APLY Career Launch, and get a verified talent profile for free.", "用 APLY Career Launch 准备简历、自荐信和面试，免费获取经过验证的人才档案。", "Chuẩn bị sơ yếu lý lịch, thư giới thiệu và phỏng vấn với APLY Career Launch, và nhận hồ sơ nhân tài đã được xác minh miễn phí.", "APLY Career Launchで履歴書・自己PR・面接まで準備し、検証済みの人材プロフィールを無料で受け取りましょう。", "Siapkan resume, surat lamaran, dan wawancara dengan APLY Career Launch, lalu dapatkan profil talenta terverifikasi secara gratis.")}</p>
              <Link href="/career-launch" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-[14px] font-bold text-[#0B1227] transition hover:bg-[#F5F8FF]">
                {t("내 커리어 카드 만들기", "Create my career card", "创建我的职业卡片", "Tạo thẻ nghề nghiệp của tôi", "自分のキャリアカードを作成", "Buat kartu karier saya")} →
              </Link>
            </div>

            <p className="mt-4 text-center text-[11.5px] text-[#B0B8C1] print:mt-2">{t("APLY Career Launch로 검증된 인재 프로필이에요.", "A talent profile verified by APLY Career Launch.", "这是由 APLY Career Launch 验证的人才档案。", "Đây là hồ sơ nhân tài được APLY Career Launch xác minh.", "APLY Career Launchが検証した人材プロフィールです。", "Ini profil talenta yang terverifikasi oleh APLY Career Launch.")}</p>

            {/* QR 오버레이 */}
            {qrOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 print:hidden" onClick={() => setQrOpen(false)}>
                <div className="w-full max-w-[288px] rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setQrOpen(false)} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="text-[#8B95A1] transition hover:text-[#191F28]">
                      <X className="h-5 w-5" weight="bold" aria-hidden />
                    </button>
                  </div>
                  {qr ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qr} alt={t("프로필 QR 코드", "Profile QR code", "档案二维码", "Mã QR hồ sơ", "プロフィールQRコード", "Kode QR profil")} className="mx-auto h-52 w-52" />
                  ) : (
                    <div className="mx-auto flex h-52 w-52 items-center justify-center text-[13px] text-[#8B95A1]">{t("생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…")}</div>
                  )}
                  <p className="mt-3 text-[13.5px] font-bold text-[#191F28]">{t("스캔해서 이 프로필 열기", "Scan to open this profile", "扫码打开此档案", "Quét để mở hồ sơ này", "スキャンしてこのプロフィールを開く", "Pindai untuk membuka profil ini")}</p>
                  <p className="mt-1 text-[12px] text-[#8B95A1]">{t("이력서·자소서도 여기서 확인할 수 있어요", "You can also view the resume and cover letter here", "简历和自荐信也可在此查看", "Bạn cũng có thể xem sơ yếu và thư giới thiệu tại đây", "履歴書・自己PRもここで確認できます", "Resume dan surat lamaran juga bisa dilihat di sini")}</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
