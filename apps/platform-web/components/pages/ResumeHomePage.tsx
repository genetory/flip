"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FileText, Lock, PencilSimple, Plus, Sparkle, Star, Trash } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";
import { createMyResume, deleteMyResume, getMyResumes, setMyPrimaryResume, type Resume } from "../../lib/member-profile-client";

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

export function ResumeHomePage() {
  const tr = useTr();
  const { locale } = useLanguage();
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuthSession();

  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [primaryBusyId, setPrimaryBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const items = await getMyResumes();
      setResumes(items);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    void load();
  }, [isReady, isAuthenticated, load]);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const count = resumes?.length ?? 0;
      const title = `${tr("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")} ${count + 1}`;
      const created = await createMyResume({ title });
      router.push(`/resume/${created.id}/edit`);
    } catch {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, resumeTitle: string) {
    if (deletingId) return;
    const ok = window.confirm(
      tr(
        `'${resumeTitle}' 이력서를 삭제할까요? 되돌릴 수 없어요.`,
        `Delete the resume "${resumeTitle}"? This can't be undone.`,
        `确定删除简历“${resumeTitle}”吗？无法撤销。`,
        `Xóa hồ sơ "${resumeTitle}"? Không thể hoàn tác.`,
        `履歴書「${resumeTitle}」を削除しますか？元に戻せません。`,
        `Hapus resume "${resumeTitle}"? Tidak bisa dibatalkan.`
      )
    );
    if (!ok) return;
    setDeletingId(id);
    try {
      await deleteMyResume(id);
      setResumes((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrimary(id: string) {
    if (primaryBusyId) return;
    setPrimaryBusyId(id);
    try {
      await setMyPrimaryResume(id);
      setResumes((prev) => (prev ? prev.map((r) => ({ ...r, isPrimary: r.id === id })) : prev));
    } catch {
      // ignore
    } finally {
      setPrimaryBusyId(null);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === "ko" ? "ko-KR" : locale, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "";
    }
  }

  // ---- Auth gate ---------------------------------------------------------
  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-5 py-24 text-center">
          <Lock className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {tr("로그인하고 시작하세요", "Sign in to start", "登录后开始", "Đăng nhập để bắt đầu", "ログインして始める", "Masuk untuk memulai")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tr(
              "한국형 이력서를 만들고 관리할 수 있어요.",
              "Create and manage your Korean-style resumes.",
              "创建并管理你的韩式简历。",
              "Tạo và quản lý hồ sơ kiểu Hàn của bạn.",
              "韓国式履歴書を作成・管理できます。",
              "Buat dan kelola resume gaya Korea Anda."
            )}
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button asChild className="h-12 w-full">
              <Link href="/signup?next=/resume">{tr("회원가입", "Sign up", "注册", "Đăng ký", "新規登録", "Daftar")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full">
              <Link href="/login?next=/resume">{tr("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!isReady || (!resumes && !loadError)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="mx-auto flex max-w-md items-center justify-center px-5 py-24">
          <Sparkle className="h-6 w-6 animate-pulse text-primary" />
        </main>
      </div>
    );
  }

  // Primary resume is always pinned to the top.
  const list = [...(resumes ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
        {/* What this page is */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
            <FileText weight="fill" className="h-3.5 w-3.5" />
            {tr("한국형 이력서", "Korean resume", "韩式简历", "Hồ sơ kiểu Hàn", "韓国式履歴書", "Resume Korea")}
          </div>
          <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>
            {tr(
              "한국 기업이 기대하는\n이력서를 만들어보세요",
              "Build a resume\nKorean employers expect",
              "制作韩国企业\n期待的简历",
              "Tạo hồ sơ mà\nnhà tuyển dụng Hàn mong đợi",
              "韓国企業が期待する\n履歴書を作りましょう",
              "Buat resume yang\ndiharapkan perusahaan Korea"
            )
              .split("\n")
              .map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
          </h1>
          <p className="mt-2 text-sm font-normal leading-relaxed text-slate-600 md:text-base">
            {tr(
              "몇 단계만 입력하면 비자·학력·한국어·경력이 담긴 한국형 이력서가 완성돼요. 직무별로 여러 버전을 만들어 관리하고, 바로 채용 공고에 매칭할 수 있어요.",
              "Answer a few steps and get a Korean-style resume with your visa, education, Korean level, and experience. Keep multiple versions per role and match them to jobs.",
              "只需几步即可生成包含签证、学历、韩语和经历的韩式简历。可按职务创建多个版本并直接匹配职位。",
              "Chỉ vài bước để có hồ sơ kiểu Hàn gồm visa, học vấn, tiếng Hàn và kinh nghiệm. Tạo nhiều phiên bản theo vị trí và ghép với việc làm.",
              "数ステップでビザ・学歴・韓国語・経歴を含む韓国式履歴書が完成。職務別に複数バージョンを管理し求人にマッチできます。",
              "Beberapa langkah untuk resume gaya Korea berisi visa, pendidikan, bahasa Korea, dan pengalaman. Buat beberapa versi per posisi dan cocokkan dengan lowongan."
            )}
          </p>
        </div>

        {/* Create button */}
        <Button onClick={handleCreate} disabled={creating} className="mb-6 h-12 w-full rounded-xl text-[15px] font-semibold md:w-auto md:px-6">
          <span className="inline-flex items-center gap-2">
            <Plus weight="bold" className="h-4 w-4" />
            {tr("이력서 만들기", "Create a resume", "创建简历", "Tạo hồ sơ", "履歴書を作る", "Buat resume")}
          </span>
        </Button>

        {/* My resumes */}
        <h2 className="mb-3 text-[15px] font-semibold text-foreground">
          {tr("내가 만든 이력서", "My resumes", "我的简历", "Hồ sơ của tôi", "作成した履歴書", "Resume saya")}
          {list.length > 0 ? <span className="ml-1.5 text-muted-foreground">{list.length}</span> : null}
        </h2>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-[14px] text-muted-foreground">
              {tr(
                "아직 만든 이력서가 없어요. 위 버튼으로 시작해보세요.",
                "No resumes yet. Tap the button above to start.",
                "还没有简历。点击上方按钮开始吧。",
                "Chưa có hồ sơ nào. Nhấn nút phía trên để bắt đầu.",
                "まだ履歴書がありません。上のボタンから始めましょう。",
                "Belum ada resume. Ketuk tombol di atas untuk mulai."
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {list.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-5 transition hover:bg-muted/40">
                <Link href={`/resume/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText weight="fill" className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-2">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[17px] font-semibold text-foreground">{r.title}</span>
                      {r.isPrimary ? (
                        <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[#b7ff5a] px-2 py-0.5 text-[11px] font-semibold text-[#111111]">
                          <Star weight="fill" className="h-3 w-3" />
                          {tr("대표", "Primary", "代表", "Đại diện", "代表", "Utama")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[13px] text-muted-foreground">
                      {tr("수정일", "Updated", "更新", "Cập nhật", "更新", "Diperbarui")} {formatDate(r.updatedAt)}
                    </span>
                  </span>
                </Link>
                <div className="flex flex-none items-center gap-1">
                  {!r.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(r.id)}
                      disabled={primaryBusyId === r.id}
                      className="mr-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground ring-1 ring-border transition hover:text-amber-700 hover:ring-amber-300 disabled:opacity-50"
                    >
                      {tr("대표로 설정", "Set primary", "设为代表", "Đặt đại diện", "代表に設定", "Jadikan utama")}
                    </button>
                  ) : null}
                  <Link
                    href={`/resume/${r.id}/edit`}
                    aria-label={tr("수정", "Edit", "编辑", "Sửa", "編集", "Edit")}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <PencilSimple className="h-4.5 w-4.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id, r.title)}
                    disabled={deletingId === r.id}
                    aria-label={tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
