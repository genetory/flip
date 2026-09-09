"use client";

// 커리어 프로필 — '검증된 나의 커리어' 카드(TalentPassportCard) 하나 + 공개 프로필 꾸미기(사진·한 줄 소개·문서).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Image as ImageIcon, CircleNotch, Sparkle, FileText, PencilSimpleLine, Check } from "@phosphor-icons/react";
import { fileToResizedDataUrl } from "../../../lib/launch/image-util";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { TalentPassportCard } from "../../../components/launch/TalentPassportCard";
import { AplyFooter } from "../../../components/AplyFooter";
import { fetchProgress, sharePassport, savePassportMedia, type CareerProgress } from "../../../lib/launch/progress-client";
import { fetchResumeData, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, type CoverData } from "../../../lib/launch/cover-data";
import { fetchProfileHeadline, saveProfileHeadline } from "../../../lib/launch/feedback-client";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

export default function CareerProfilePage() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState<"" | "photo" | "bg">("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [headline, setHeadline] = useState<string>("");
  const [hlBusy, setHlBusy] = useState(false);
  const [hlSaving, setHlSaving] = useState(false);
  const [hlSaved, setHlSaved] = useState(false);

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
  const onGenHeadline = async () => {
    if (hlBusy) return;
    setHlBusy(true);
    try {
      const r = await fetchProfileHeadline(true);
      if (r.headline) setHeadline(r.headline);
    } catch {
      /* 무시 */
    } finally {
      setHlBusy(false);
    }
  };
  const onSaveHeadline = async () => {
    setHlSaving(true);
    try {
      await saveProfileHeadline(headline.trim());
      setHlSaved(true);
      window.setTimeout(() => setHlSaved(false), 1600);
    } catch {
      /* 무시 */
    } finally {
      setHlSaving(false);
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
      setResume(r.data ?? {});
      setCover(c.data ?? {});
      setPhoto(p?.passportMedia?.photo ?? null);
      setBackground(p?.passportMedia?.background ?? null);
      void fetchProfileHeadline(false).then((h) => { if (alive && h.headline) setHeadline(h.headline); }).catch(() => {});
      void sharePassport().then((tk) => { if (alive) setShareToken(tk); }).catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, []);

  const name = (user?.name?.trim() || user?.email || "").trim();
  const initial = (name.charAt(0) || "A").toUpperCase();
  const hasResume = (resume.experiences ?? []).some((e) => (e.title ?? "").trim() || (e.org ?? "").trim()) || (resume.skills ?? []).length > 0 || Boolean(resume.basic && (resume.basic.name || resume.basic.summary));
  const hasCover = (cover.items ?? []).some((it) => (it.answer ?? "").trim().length > 0);

  return (
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[#F1F1F4]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <div className="flex flex-col gap-5">
            {/* 검증된 나의 커리어 — 메인 카드(공유 링크 포함) */}
            <TalentPassportCard />

            {/* 공개 프로필 꾸미기 — 사진·한 줄 소개·문서 */}
            <div className="rounded-3xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(20,24,31,0.16)] md:p-6">
              <p className="text-[14.5px] font-black tracking-[-0.01em] text-[#191F28]">{t("공개 프로필 꾸미기", "Style your public profile", "美化公开档案", "Tùy chỉnh hồ sơ công khai", "公開プロフィールを整える", "Atur profil publik")}</p>
              <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("공유 링크로 보이는 화면(사진·한 줄 소개)을 다듬어요.", "Tune what the share link shows — photo and headline.", "调整分享链接显示的照片和标语。", "Chỉnh ảnh và tiêu đề hiển thị qua link chia sẻ.", "共有リンクで見える写真・紹介を整えます。", "Atur foto dan headline yang tampil di link.")}</p>

              {/* 사진 · 배경 */}
              <div className="mt-4 flex items-center gap-3.5">
                <label className="group relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-[#F4F6F9] ring-1 ring-[#ECEEF1]">
                  {photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[20px] font-black text-[#0B46E8]">{initial}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    {mediaBusy === "photo" ? <CircleNotch className="h-4 w-4 animate-spin text-white" weight="bold" /> : <Camera className="h-4 w-4 text-white" weight="fill" />}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { void onPickPhoto(e.target.files?.[0]); e.currentTarget.value = ""; }} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:text-[#191F28]"><Camera className="h-4 w-4" weight="bold" /> {t("프로필 사진", "Photo", "头像", "Ảnh", "写真", "Foto")}<input type="file" accept="image/*" className="hidden" onChange={(e) => { void onPickPhoto(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:text-[#191F28]">{mediaBusy === "bg" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <ImageIcon className="h-4 w-4" weight="bold" />} {t("배경 사진", "Cover", "背景", "Nền", "背景", "Latar")}<input type="file" accept="image/*" className="hidden" onChange={(e) => { void onPickBg(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
                </div>
              </div>

              {/* 한 줄 소개 — AI 또는 직접 입력 */}
              <div className="mt-3.5 rounded-2xl bg-[#F4F6F9] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">{t("한 줄 소개", "Headline", "标语", "Tiêu đề", "紹介", "Headline")}</p>
                  <button type="button" onClick={onGenHeadline} disabled={hlBusy} className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0B46E8] disabled:opacity-60">{hlBusy ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />}{hlBusy ? t("생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…") : t("AI로 만들기", "Write with AI", "用AI生成", "Tạo bằng AI", "AIで作成", "Buat dgn AI")}</button>
                </div>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={2}
                  maxLength={120}
                  placeholder={t("나를 한 줄로 소개해요. 직접 쓰거나 'AI로 만들기'를 눌러요.", "Introduce yourself in one line — write it or tap 'Write with AI'.", "用一句话介绍自己，或点击'用AI生成'。", "Giới thiệu một dòng, hoặc nhấn 'Tạo bằng AI'.", "一言で自己紹介。直接書くかAIで作成。", "Perkenalkan diri satu baris atau pakai AI.")}
                  className="mt-2 w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#B0B8C1]">{headline.length}/120</span>
                  <button type="button" onClick={onSaveHeadline} disabled={hlSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B46E8] px-3.5 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-60">{hlSaving ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : hlSaved ? <Check className="h-3.5 w-3.5" weight="bold" /> : null}{hlSaved ? t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</button>
                </div>
              </div>

              {/* 이력서 · 자기소개서 보기 */}
              {shareToken && (hasResume || hasCover) ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {hasResume ? <Link href={`/p/${shareToken}/resume`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]"><span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" weight="duotone" /> {t("이력서 보기", "Resume", "查看简历", "Xem CV", "履歴書", "Resume")}</span><span aria-hidden>→</span></Link> : null}
                  {hasCover ? <Link href={`/p/${shareToken}/cover`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl bg-[var(--cl-accent-soft)] px-3.5 py-2.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:brightness-95"><span className="inline-flex items-center gap-1.5"><PencilSimpleLine className="h-4 w-4" weight="duotone" /> {t("자기소개서 보기", "Cover letter", "查看自我介绍", "Xem thư", "自己紹介書", "Surat")}</span><span aria-hidden>→</span></Link> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
