"use client";

// 통합 Career Profile — 커리어 패스포트 히어로(이름·Career Score 링·강점) + 점수 게이지 +
// 4주 내내 쌓인 데이터(방향·경험은행·서류·스토리·면접)를 홈 톤 흰 카드로. 읽기 전용 집계.
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { CaretLeft, ShareNetwork, Check, Sparkle, CircleNotch, X, DownloadSimple, Copy, Camera, Image as ImageIcon, FileText, PencilSimpleLine } from "@phosphor-icons/react";
import { fileToResizedDataUrl } from "../../../lib/launch/image-util";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { TalentPassportCard } from "../../../components/launch/TalentPassportCard";
import { AplyFooter } from "../../../components/AplyFooter";
import { fetchProgress, sharePassport, savePassportMedia, type CareerProgress } from "../../../lib/launch/progress-client";
import { fetchResumeData, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, type CoverData } from "../../../lib/launch/cover-data";
import { fetchProfileHeadline } from "../../../lib/launch/feedback-client";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

export default function CareerProfilePage() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const [prog, setProg] = useState<CareerProgress | null>(null);
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [copied, setCopied] = useState(false);
  const [headline, setHeadline] = useState<string | null>(null);
  const [subline, setSubline] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState<"" | "photo" | "bg">("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const onPickPhoto = async (file?: File | null) => {
    if (!file) return;
    setMediaBusy("photo");
    try {
      const dataUrl = await fileToResizedDataUrl(file, 480, 0.85);
      const m = await savePassportMedia({ photo: dataUrl });
      if (m) setPhoto(m.photo);
    } catch {
      /* 무시 */
    } finally {
      setMediaBusy("");
    }
  };
  const onPickBg = async (file?: File | null) => {
    if (!file) return;
    setMediaBusy("bg");
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1600, 0.8);
      const m = await savePassportMedia({ background: dataUrl });
      if (m) setBackground(m.background);
    } catch {
      /* 무시 */
    } finally {
      setMediaBusy("");
    }
  };
  const [hlBusy, setHlBusy] = useState(false);
  const onGenHeadline = async () => {
    if (hlBusy) return;
    setHlBusy(true);
    try {
      const r = await fetchProfileHeadline(true);
      setHeadline(r.headline);
      setSubline(r.subline);
    } catch {
      /* 안내는 무시 — 버튼 재시도 가능 */
    } finally {
      setHlBusy(false);
    }
  };
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [qr, setQr] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  // 공유 시트 — 공개 링크(/p/token) 발급 + QR 생성.
  const openShare = async () => {
    setShareOpen(true);
    if (shareUrl || shareBusy) return;
    setShareBusy(true);
    try {
      const token = await sharePassport();
      const url = token ? `${window.location.origin}/p/${token}` : window.location.href;
      setShareUrl(url);
      setQr(await QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#0B1227", light: "#ffffff" } }));
    } catch {
      setShareUrl(typeof window !== "undefined" ? window.location.href : "");
    } finally {
      setShareBusy(false);
    }
  };
  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  const nativeShare = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) await navigator.share({ url: shareUrl });
      else await copyShare();
    } catch {
      /* 취소 */
    }
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, r, c] = await Promise.all([
        fetchProgress().catch(() => ({}) as CareerProgress),
        fetchResumeData().catch(() => ({ data: {} })),
        fetchCoverData().catch(() => ({ data: {} }))
      ]);
      if (!alive) return;
      setProg(p);
      setResume(r.data ?? {});
      setCover(c.data ?? {});
      setPhoto(p?.passportMedia?.photo ?? null);
      setBackground(p?.passportMedia?.background ?? null);
      // AI 헤드라인 캐시 조회(생성은 버튼).
      void fetchProfileHeadline(false).then((h) => { if (!alive) return; setHeadline(h.headline); setSubline(h.subline); }).catch(() => {});
      // 공유 토큰(문서 링크·QR용) — 멱등.
      void sharePassport().then((tk) => { if (alive) setShareToken(tk); }).catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, []);

  const name = user?.name?.trim() || user?.email || "";
  const initial = (name.trim().charAt(0) || "A").toUpperCase();
  const selectedJobs = Array.isArray(prog?.selectedJobs) ? prog!.selectedJobs! : [];
  const recoJobs = prog?.jobRecommendation?.data?.jobs ?? [];
  const educations = resume.educations ?? [];
  const languages = resume.languages ?? [];
  const direction = selectedJobs[0] || recoJobs[0]?.role || "";

  // ── 공유 카드용 요약(이력서·자소서 기반) — '내가 어떤 사람인지'를 매력적으로 ──
  // 한줄 소개는 이력서 요약 → 없으면 자기소개서 첫 문항 답변에서 가져온다.
  const coverIntro = (cover.items ?? []).map((it) => (it.answer ?? "").trim()).find(Boolean) ?? "";
  const pitch = (resume.basic?.summary ?? "").trim() || coverIntro;
  // 관심 직무 — 어떤 직무를 보고 있는지(여러 개). 확정 직무 → 없으면 추천 직무.
  const targetJobs = (selectedJobs.length ? selectedJobs : recoJobs.map((r) => r.role)).map((j) => (j ?? "").trim()).filter(Boolean);
  const skills = (resume.skills ?? []).map((s) => (s ?? "").trim()).filter(Boolean);
  const highlights = (resume.experiences ?? [])
    .filter((e) => (e.title ?? "").trim() || (e.org ?? "").trim())
    .slice(0, 4)
    .map((e) => ({ head: [e.title, e.org].map((x) => (x ?? "").trim()).filter(Boolean).join(" · "), period: (e.period ?? "").trim(), bullets: (e.bullets ?? []).map((b) => (b ?? "").trim()).filter(Boolean).slice(0, 2) }));
  const eduLine = educations.map((ed) => [ed.school, ed.major].map((x) => (x ?? "").trim()).filter(Boolean).join(" ")).filter(Boolean).join(" · ");
  const langLine = languages.map((l) => [l.language, l.level].map((x) => (x ?? "").trim()).filter(Boolean).join(" ")).filter(Boolean).join(", ");
  const cardEmpty = !pitch && targetJobs.length === 0 && skills.length === 0 && highlights.length === 0 && !eduLine && !langLine;
  const hasResume = highlights.length > 0 || skills.length > 0 || Boolean(resume.basic && (resume.basic.name || resume.basic.summary));
  const hasCover = (cover.items ?? []).some((it) => (it.answer ?? "").trim().length > 0);
  // 핵심 강점 — 경험의 성과 불렛에서 근거 있는 한 줄 3개(칩 대신 문장).
  const strengths = Array.from(new Set((resume.experiences ?? []).flatMap((e) => (e.bullets ?? []).map((b) => (b ?? "").trim())).filter((b) => b.length > 6))).slice(0, 3);
  const expCount = (resume.experiences ?? []).filter((e) => (e.title ?? "").trim() || (e.org ?? "").trim()).length;
  const langCount = languages.filter((l) => (l.language ?? "").trim()).length;
  const mrz = `APLY<CAREER<LAUNCH<PASSPORT<<<<<<<<ISSUED<${new Date().getFullYear()}`;

  // 이력서·자소서 문서 QR — 공유 토큰 있을 때 생성.
  const [docQr, setDocQr] = useState<{ resume?: string; cover?: string }>({});
  useEffect(() => {
    if (!shareToken || typeof window === "undefined") return;
    let alive = true;
    void (async () => {
      const origin = window.location.origin;
      const opt = { margin: 1, width: 240, color: { dark: "#0B1227", light: "#ffffff" } } as const;
      const out: { resume?: string; cover?: string } = {};
      if (hasResume) out.resume = await QRCode.toDataURL(`${origin}/p/${shareToken}/resume`, opt);
      if (hasCover) out.cover = await QRCode.toDataURL(`${origin}/p/${shareToken}/cover`, opt);
      if (alive) setDocQr(out);
    })();
    return () => { alive = false; };
  }, [shareToken, hasResume, hasCover]);

  return (
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[#F1F1F4]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <Link href="/career-launch/dashboard" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>

          <div className="mt-4 flex flex-col gap-6">
            {/* ── 공유 카드 — 남들에게 보여줄 나의 커리어 여권 ── */}
            <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_28px_64px_-26px_rgba(11,18,39,0.55)] ring-1 ring-black/5">
              {/* 히어로 밴드 — 모션 오로라 / 배경 사진 */}
              <div className="cl-pp-hero overflow-hidden px-7 pb-7 pt-6 text-white md:px-9">
                {background ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={background} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" aria-hidden />
                    <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,16,32,0.35), rgba(10,16,32,0.72))" }} aria-hidden />
                  </>
                ) : (
                  <>
                    <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1.2px)", backgroundSize: "15px 15px" }} aria-hidden />
                    <div className="cl-pp-shine" aria-hidden />
                  </>
                )}
                <div className="relative flex items-center gap-2">
                  <span className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/90">✈ Career Passport</span>
                  <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25">
                    {mediaBusy === "bg" ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <ImageIcon className="h-3.5 w-3.5" weight="bold" />}
                    {t("배경", "Cover", "背景", "Nền", "背景", "Latar")}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { void onPickBg(e.target.files?.[0]); e.currentTarget.value = ""; }} />
                  </label>
                  <button type="button" onClick={openShare} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25">
                    <ShareNetwork className="h-3.5 w-3.5" weight="bold" />
                    {t("공유", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}
                  </button>
                </div>
                <div className="relative mt-6 flex items-center gap-4">
                  <label className="group relative flex h-[66px] w-[66px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-white/12 ring-1 ring-white/35 backdrop-blur-sm">
                    {photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[26px] font-black text-white">{initial}</span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      {mediaBusy === "photo" ? <CircleNotch className="h-5 w-5 animate-spin text-white" weight="bold" /> : <Camera className="h-5 w-5 text-white" weight="fill" />}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { void onPickPhoto(e.target.files?.[0]); e.currentTarget.value = ""; }} />
                  </label>
                  <div className="min-w-0 flex-1">
                    <h1 className="break-keep text-[25px] font-black leading-[1.08] tracking-[-0.035em] text-white md:text-[30px]">{name || t("내 커리어 프로필", "My career profile", "我的职业档案", "Hồ sơ nghề của tôi", "私のキャリアプロフィール", "Profil karierku")}</h1>
                    <p className="mt-1.5 break-keep text-[12px] font-bold uppercase tracking-[0.06em] text-[#AFC6FF]">{direction ? t(`${direction} 준비생`, `Aiming for ${direction}`, `${direction} 求职中`, `Hướng ${direction}`, `${direction} 志望`, `Menuju ${direction}`) : t("4주 커리어 런치 수료", "Career Launch graduate", "职业启程结业", "Hoàn thành Career Launch", "キャリアランチ修了", "Lulusan Career Launch")}</p>
                  </div>
                </div>
                {headline ? (
                  <div className="relative mt-6">
                    <p className="break-keep font-[Georgia,'Times_New_Roman',serif] text-[19px] italic leading-[1.45] text-white md:text-[22px]"><span className="mr-0.5 align-[-0.2em] text-[30px] not-italic text-white/60">“</span>{headline}<span className="not-italic text-white/60">”</span></p>
                    {subline ? <p className="mt-2.5 break-keep text-[12.5px] leading-[1.7] text-white/70">{subline}</p> : null}
                  </div>
                ) : pitch ? (
                  <p className="relative mt-6 break-keep text-[14px] font-medium leading-[1.7] text-white/85 line-clamp-3">{pitch}</p>
                ) : null}
              </div>

              {/* 바디 — 홈처럼 미니 카드 벤토 그리드(비율 다양) */}
              <div className="flex flex-wrap gap-3 px-5 py-5 md:px-6 md:py-6">
                {/* 찾는 직무 — 넓은 카드 */}
                {targetJobs.length > 0 ? (
                  <div className="grow basis-full min-w-[200px] rounded-2xl bg-[var(--cl-card-2)] p-4 sm:basis-[44%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">{t("찾는 직무", "Looking for", "关注职务", "Đang tìm", "希望職種", "Mencari")}</p>
                    <p className="mt-2 break-keep text-[17px] font-black leading-[1.35] tracking-[-0.01em] text-[#0B1227]">{targetJobs.join(" · ")}</p>
                  </div>
                ) : null}

                {/* 경험 수 — 딥네이비 하이라이트 카드 */}
                {expCount > 0 ? (
                  <div className="grow basis-[46%] min-w-[110px] flex flex-col justify-center rounded-2xl bg-[#0E1526] p-4 text-white sm:basis-[22%]">
                    <p className="text-[30px] font-black leading-none tabular-nums">{expCount}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman")}</p>
                  </div>
                ) : null}

                {/* 어학/직무 수 — 작은 스탯 카드(칸 채우기) */}
                {langCount > 0 ? (
                  <div className="grow basis-[46%] min-w-[110px] flex flex-col justify-center rounded-2xl bg-[var(--cl-card-2)] p-4 sm:basis-[22%]">
                    <p className="text-[26px] font-black leading-none tabular-nums text-[#0B1227]">{langCount}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">{t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</p>
                  </div>
                ) : null}

                {/* 핵심 강점 — 전체 폭 카드 */}
                {strengths.length > 0 ? (
                  <div className="grow basis-full rounded-2xl bg-[var(--cl-card-2)] p-4 md:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">{t("핵심 강점", "Strengths", "核心优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {strengths.map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-[10px] h-px w-4 shrink-0 bg-[#0B46E8]" aria-hidden />
                          <p className="break-keep text-[13.5px] leading-[1.6] text-[#333D4B]">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 대표 경험 — 절반 카드 */}
                {highlights.length > 0 ? (
                  <div className="grow basis-full min-w-[220px] rounded-2xl bg-[var(--cl-card-2)] p-4 sm:basis-[47%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">{t("대표 경험", "Experience", "代表经历", "Kinh nghiệm", "経験", "Pengalaman")}</p>
                    <div className="mt-1.5 divide-y divide-[#E4E7EC]">
                      {highlights.map((h, i) => (
                        <div key={i} className="py-2.5">
                          <p className="break-keep text-[13.5px] font-bold text-[#191F28]">{h.head}</p>
                          {h.period ? <p className="mt-0.5 text-[11.5px] font-semibold tabular-nums text-[#A8ADB8]">{h.period}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 문서 — 절반 카드(링크·QR) */}
                {shareToken && (hasResume || hasCover) ? (
                  <div className="grow basis-full min-w-[220px] rounded-2xl bg-[var(--cl-card-2)] p-4 sm:basis-[47%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">{t("내 문서 · 링크·QR", "Documents · link/QR", "我的文档", "Tài liệu", "書類", "Dokumen")}</p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {hasResume ? (
                        <div className="rounded-xl bg-white p-3">
                          <div className="flex items-center gap-3">
                            <p className="inline-flex flex-1 items-center gap-1.5 text-[13px] font-black text-[#191F28]"><FileText className="h-4 w-4 text-[#0B46E8]" weight="duotone" /> {t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</p>
                            {docQr.resume ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <a href={`/p/${shareToken}/resume`} target="_blank" rel="noopener noreferrer" className="shrink-0"><img src={docQr.resume} alt="QR" className="h-11 w-11 rounded-lg ring-1 ring-[#ECEEF1]" /></a>
                            ) : null}
                          </div>
                          <Link href={`/p/${shareToken}/resume`} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-[var(--cl-accent-soft)] py-2 text-[12px] font-bold text-[#0B46E8] transition hover:brightness-95">{t("바로 보기", "Open", "查看", "Xem", "開く", "Buka")} <span aria-hidden>→</span></Link>
                        </div>
                      ) : null}
                      {hasCover ? (
                        <div className="rounded-xl bg-white p-3">
                          <div className="flex items-center gap-3">
                            <p className="inline-flex flex-1 items-center gap-1.5 text-[13px] font-black text-[#191F28]"><PencilSimpleLine className="h-4 w-4 text-[#0B46E8]" weight="duotone" /> {t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}</p>
                            {docQr.cover ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <a href={`/p/${shareToken}/cover`} target="_blank" rel="noopener noreferrer" className="shrink-0"><img src={docQr.cover} alt="QR" className="h-11 w-11 rounded-lg ring-1 ring-[#ECEEF1]" /></a>
                            ) : null}
                          </div>
                          <Link href={`/p/${shareToken}/cover`} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-[var(--cl-accent-soft)] py-2 text-[12px] font-bold text-[#0B46E8] transition hover:brightness-95">{t("바로 보기", "Open", "查看", "Xem", "開く", "Buka")} <span aria-hidden>→</span></Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {cardEmpty ? <p className="basis-full break-keep text-[13.5px] leading-[1.7] text-[#8B95A1]">{t("이력서·자기소개서를 작성하면 나를 소개하는 프로필이 자동으로 채워져요.", "Fill your resume and cover letter to auto-build a profile that introduces you.", "填写简历与自我介绍后，会自动生成介绍你的档案。", "Điền CV và thư giới thiệu để tự tạo hồ sơ giới thiệu bạn.", "履歴書・自己紹介書を作成すると自己紹介プロフィールが自動で埋まります。", "Isi resume dan surat lamaran untuk membangun profil yang memperkenalkanmu.")}</p> : null}
              </div>
              {/* MRZ 풋터 — 여권 느낌 데코 */}
              <div className="overflow-hidden border-t border-dashed border-[#E5E8EB] px-7 py-3 md:px-9">
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.26em] text-[#C4CAD2]">{mrz}</p>
              </div>
            </div>

            {/* AI 헤드라인 생성/새로고침 */}
            {!cardEmpty ? (
              <button type="button" onClick={onGenHeadline} disabled={hlBusy} className="-mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-[#E5E8EB] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-60">
                {hlBusy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" />}
                {hlBusy ? t("생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…") : headline ? t("AI 소개 문구 다시 만들기", "Regenerate AI headline", "重新生成AI标语", "Tạo lại tiêu đề AI", "AI紹介文を再生成", "Buat ulang headline AI") : t("AI로 소개 문구 만들기", "Create AI headline", "用AI生成标语", "Tạo tiêu đề bằng AI", "AIで紹介文を作成", "Buat headline dengan AI")}
              </button>
            ) : null}

            {/* ── 나만 보는 커리어 데이터 ── */}
            <div className="mt-2">
              <h2 className="text-[15px] font-black tracking-[-0.01em] text-[#191F28]">{t("나만 보는 커리어 데이터", "My working data", "仅我可见的数据", "Dữ liệu chỉ mình xem", "自分だけの作業データ", "Data kerja pribadi")}</h2>
              <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("4주 동안 쌓은 자료예요. 공유 카드에는 표시되지 않아요.", "The material you built over 4 weeks. Not shown on the share card.", "你4周积累的资料，不会显示在分享卡上。", "Tư liệu bạn xây trong 4 tuần. Không hiện trên thẻ chia sẻ.", "4週間で蓄積した資料です。共有カードには表示されません。", "Materi yang kamu buat selama 4 minggu. Tidak tampil di kartu bagikan.")}</p>
            </div>

            {/* Talent Passport — 검증된 Talent 프로필(Readiness·Verified) */}
            <TalentPassportCard />
          </div>
        </div>
      </main>
      <AplyFooter />

      {/* 공유 시트 — 공개 링크 + QR */}
      {shareOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/50 p-4" onClick={() => setShareOpen(false)}>
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-[0_30px_70px_-24px_rgba(11,18,39,0.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-black tracking-[-0.01em] text-[#191F28]">{t("커리어 패스포트 공유", "Share your passport", "分享职业护照", "Chia sẻ hộ chiếu", "パスポートを共有", "Bagikan paspor")}</p>
              <button type="button" onClick={() => setShareOpen(false)} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B95A1] transition hover:bg-[#F4F6F9]"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("이 링크·QR로 누구나 로그인 없이 내 프로필을 볼 수 있어요.", "Anyone can view your profile with this link or QR — no login.", "任何人都能通过此链接或二维码查看你的档案，无需登录。", "Bất kỳ ai cũng xem được hồ sơ qua link/QR này, không cần đăng nhập.", "このリンク・QRで誰でもログインなしにプロフィールを見られます。", "Siapa pun bisa melihat profilmu lewat link/QR ini tanpa login.")}</p>

            <div className="mt-4 flex items-center justify-center rounded-2xl bg-[#F4F6F9] p-5">
              {shareBusy || !qr ? (
                <div className="flex h-[180px] w-[180px] items-center justify-center"><CircleNotch className="h-6 w-6 animate-spin text-[#0B46E8]" weight="bold" /></div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qr} alt="QR" className="h-[180px] w-[180px] rounded-lg" />
              )}
            </div>

            {shareUrl ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F4F6F9] px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#4E5968]">{shareUrl.replace(/^https?:\/\//, "")}</span>
                <button type="button" onClick={copyShare} className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#0B46E8]">{copied ? <Check className="h-3.5 w-3.5" weight="bold" /> : <Copy className="h-3.5 w-3.5" weight="bold" />}{copied ? t("복사됨", "Copied", "已复制", "Đã chép", "コピー済", "Tersalin") : t("복사", "Copy", "复制", "Chép", "コピー", "Salin")}</button>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={nativeShare} disabled={!shareUrl} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"><ShareNetwork className="h-4 w-4" weight="bold" /> {t("공유하기", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}</button>
              {qr ? <a href={qr} download="career-passport-qr.png" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#4E5968] transition hover:text-[#191F28]"><DownloadSimple className="h-4 w-4" weight="bold" /> {t("QR 저장", "Save QR", "保存二维码", "Lưu QR", "QR保存", "Simpan QR")}</a> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
