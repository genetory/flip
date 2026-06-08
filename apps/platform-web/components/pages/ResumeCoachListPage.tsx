"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Star, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  getMyResumes,
  type Resume
} from "../../lib/member-profile-client";
import { ResumeCoachPanel } from "./ResumeCoachPanel";

// ---------------------------------------------------------------------------
// "이력서 코칭" 통합 화면. 세로 이력서 리스트 + 선택된 항목 아래에 인라인으로
// 펼쳐지는 Coach 패널 (점수/액션/매칭/챗). 별도 페이지 이동 없이 한 화면에서
// 모든 코칭 정보를 확인.
//
// - 진입 URL 이 /resume       → 첫 번째 이력서(대표 우선) 자동 선택
// - 진입 URL 이 /resume/[id]  → 해당 id 자동 선택 (deep link)
// - 카드 클릭 시 router.replace 로 URL 만 동기화 (페이지는 재마운트 안 됨)
// ---------------------------------------------------------------------------

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

function formatUpdatedAt(value: string): string {
  try {
    const d = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    return d.toLocaleDateString("ko-KR");
  } catch {
    return value;
  }
}

function pickInitialId(resumes: Resume[], requestedId?: string): string | null {
  if (resumes.length === 0) return null;
  if (requestedId && resumes.some((r) => r.id === requestedId)) return requestedId;
  // 대표 이력서 우선, 없으면 첫 번째.
  const primary = resumes.find((r) => r.isPrimary);
  return (primary ?? resumes[0]).id;
}

export function ResumeCoachListPage({ selectedResumeId }: { selectedResumeId?: string }) {
  const router = useRouter();
  const tr = useTr();
  const { isReady, isAuthenticated } = useAuthSession();

  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 비로그인은 GNB 클릭만으로 들어올 수 있으니 진입 시 게이트.
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      const target = selectedResumeId ? `/resume/${selectedResumeId}` : "/resume";
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [isReady, isAuthenticated, selectedResumeId, router]);

  // 이력서 목록 fetch. 한 번만.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await getMyResumes();
        if (cancelled) return;
        setResumes(list);
        const initial = pickInitialId(list, selectedResumeId);
        if (initial) setCurrentId(initial);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "이력서 목록을 불러오지 못했어요.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // selectedResumeId 변경은 별도 effect 에서 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated]);

  // URL 의 [id] 가 바뀌면 currentId 동기화 (예: 브라우저 뒤로가기로 다른 id 진입).
  useEffect(() => {
    if (!selectedResumeId || !resumes) return;
    if (resumes.some((r) => r.id === selectedResumeId) && selectedResumeId !== currentId) {
      setCurrentId(selectedResumeId);
    }
  }, [selectedResumeId, resumes, currentId]);

  function selectResume(id: string) {
    if (id === currentId) return;
    setCurrentId(id);
    // URL 만 부드럽게 갱신. 페이지 재마운트는 일어나지 않음.
    router.replace(`/resume/${id}`);
  }

  function handleCreate() {
    // DB row 는 첫 "저장" 시점에만 만들어진다. 그 전에 페이지를 떠나면
    // 아무 흔적도 남지 않음. /resume/new/edit 는 ResumeEditPage 가
    // resumeId === "new" sentinel 로 인식해서 빈 폼으로 띄움.
    router.push("/resume/new/edit");
  }

  // 코치 패널에서 LLM 적용으로 본문/점수가 바뀌면 부모 리스트도 카드의
  // 점수 배지를 갱신.
  function handleResumeUpdated(updated: Resume) {
    setResumes((prev) => (prev ?? []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }

  // 삭제 후 처리: 리스트에서 제거하고, 삭제된 게 현재 선택 중이었다면
  // 가까운 이력서로 selection 을 옮긴다. 남은 이력서가 0개면 빈 상태로 전환.
  function handleResumeDeleted(deletedId: string) {
    setResumes((prev) => {
      const next = (prev ?? []).filter((r) => r.id !== deletedId);
      if (deletedId === currentId) {
        if (next.length > 0) {
          const fallback = next.find((r) => r.isPrimary) ?? next[0];
          setCurrentId(fallback.id);
          router.replace(`/resume/${fallback.id}`);
        } else {
          setCurrentId(null);
          router.replace("/resume");
        }
      }
      return next;
    });
  }

  // ---- Loading / unauth ------------------------------------------------
  if (!isReady || (isAuthenticated && resumes === null && !loadError)) {
    return (
      <>
        <Header />
        <div className="container py-16">
          <div className="mx-auto max-w-4xl space-y-3">
            <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </>
    );
  }
  if (!isAuthenticated) return null;

  const list = resumes ?? [];
  const hasResumes = list.length > 0;

  return (
    <>
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 md:mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tr("AI 이력서 코치", "AI Resume Coach", "AI 简历教练", "Huấn luyện viên hồ sơ AI", "AI履歴書コーチ", "Pelatih Resume AI")}
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
              {tr("내 이력서 코칭", "My Resume Coaching", "我的简历辅导", "Tư vấn hồ sơ của tôi", "私の履歴書コーチング", "Bimbingan Resume Saya")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {tr(
                "이력서 점수, 개선 액션, 관심 포지션과의 매칭, 그리고 AI 코치 챗까지 — 하나의 화면에서 모두 확인하세요.",
                "Resume score, improvement actions, position match, and AI coach chat — all in one place.",
                "简历分数、改进建议、职位匹配、AI教练对话 — 一站式查看。",
                "Điểm hồ sơ, hành động cải thiện, độ phù hợp với vị trí và chat với huấn luyện viên AI — tất cả trong một.",
                "履歴書スコア、改善アクション、ポジションマッチング、AIコーチチャット — すべてを一画面で。",
                "Skor resume, tindakan perbaikan, kecocokan posisi, dan chat dengan pelatih AI — semua dalam satu tempat."
              )}
            </p>
          </header>

          {loadError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              {loadError}
            </div>
          ) : !hasResumes ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#b7ff5a]">
                <Sparkle className="h-7 w-7 text-[#111]" weight="fill" />
              </div>
              <h2 className="font-display text-xl font-bold">
                {tr("첫 이력서를 만들어보세요", "Create your first resume", "创建你的第一份简历", "Tạo hồ sơ đầu tiên của bạn", "最初の履歴書を作成しましょう", "Buat resume pertama Anda")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {tr(
                  "이력서를 작성하면 AI 코치가 점수를 매기고 개선 액션과 맞춤 포지션까지 제시해줍니다.",
                  "Once you have a resume, the AI coach scores it and suggests improvements and matching positions.",
                  "创建简历后，AI 教练会为您评分并推荐改进方向和匹配的职位。",
                  "Sau khi tạo hồ sơ, huấn luyện viên AI sẽ chấm điểm và đề xuất cải tiến cũng như vị trí phù hợp.",
                  "履歴書を作成すると、AIコーチが採点して改善アクションとマッチするポジションを提案します。",
                  "Setelah memiliki resume, pelatih AI akan menilai dan menyarankan perbaikan serta posisi yang cocok."
                )}
              </p>
              <Button variant="dark" size="lg" className="mt-6" onClick={handleCreate}>
                <Plus className="h-4 w-4" weight="bold" />
                {tr("첫 이력서 만들기", "Create resume", "创建简历", "Tạo hồ sơ", "履歴書を作る", "Buat resume")}
              </Button>
            </div>
          ) : (
            // 2열 레이아웃: lg 이상에서 좌측 리스트 + 우측 패널. md 이하에서는
            // 리스트가 상단, 패널이 하단으로 자연스러운 세로 흐름.
            <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
              {/* 좌측 — 이력서 리스트 */}
              <aside className="space-y-2">
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr("내 이력서", "My resumes", "我的简历", "Hồ sơ của tôi", "私の履歴書", "Resume saya")}
                </p>
                <ul className="space-y-1.5">
                  {list.map((resume) => (
                    <li key={resume.id}>
                      <ResumeListRow
                        resume={resume}
                        selected={resume.id === currentId}
                        onSelect={() => selectResume(resume.id)}
                        tr={tr}
                      />
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={handleCreate}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card py-3 text-[12.5px] font-semibold text-muted-foreground transition hover:border-foreground hover:bg-muted/40 hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" weight="bold" />
                      {tr("새 이력서", "New resume", "新建简历", "Hồ sơ mới", "新規履歴書", "Resume baru")}
                    </button>
                  </li>
                </ul>
              </aside>

              {/* 우측 — 선택된 이력서의 코치 패널 */}
              <div className="min-w-0">
                {currentId ? (
                  <ResumeCoachPanel
                    key={currentId}
                    resumeId={currentId}
                    onResumeUpdated={handleResumeUpdated}
                    onResumeDeleted={handleResumeDeleted}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// 리스트 카드는 readiness level 하나만 시각 신호로 — "제출 가능 / 보완 후 /
// 불가" 를 색상 점으로 표현. 자세한 점수는 패널에서 확인.
const LEVEL_DOT: Record<"submittable" | "needs_polish" | "not_submittable", { dot: string; label: { ko: string; en: string; zh: string; vi: string; ja: string; id: string } }> = {
  submittable:     { dot: "bg-emerald-500", label: { ko: "제출 가능",     en: "Ready",          zh: "可提交",       vi: "Sẵn sàng",         ja: "提出可能",     id: "Siap" } },
  needs_polish:    { dot: "bg-amber-500",   label: { ko: "보완 후",       en: "Needs polish",   zh: "需完善",       vi: "Cần hoàn thiện",   ja: "補強後",       id: "Perlu polish" } },
  not_submittable: { dot: "bg-slate-400",   label: { ko: "기본 정보 필요", en: "Essentials",     zh: "需基础信息",    vi: "Cần thông tin",    ja: "基本情報必要", id: "Perlu dasar" } }
};

function ResumeListRow({
  resume,
  selected,
  onSelect,
  tr
}: {
  resume: Resume;
  selected: boolean;
  onSelect: () => void;
  tr: (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => string;
}) {
  const level = resume.score?.level ?? "not_submittable";
  const dotMeta = LEVEL_DOT[level];
  const levelLabel = tr(dotMeta.label.ko, dotMeta.label.en, dotMeta.label.zh, dotMeta.label.vi, dotMeta.label.ja, dotMeta.label.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        selected
          ? "border-foreground bg-foreground/[0.04]"
          : "border-border bg-card hover:border-foreground/40 hover:bg-muted/30"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-semibold tracking-tight">{resume.title}</span>
          {resume.isPrimary ? (
            <Star className="h-3 w-3 flex-none text-foreground" weight="fill" aria-label={tr("대표", "Primary", "代表", "Chính", "代表", "Utama")} />
          ) : null}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dotMeta.dot}`} />
          <span>{levelLabel}</span>
          <span className="text-muted-foreground/60">·</span>
          <span>{formatUpdatedAt(resume.updatedAt)}</span>
        </p>
      </div>

    </button>
  );
}
