"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CaretDown, CircleNotch, Plus } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { CoverLetterItemEditor, type CoverLetterContext } from "./CoverLetterItemEditor";
import { CoverLetterToolPreview } from "./CoverLetterToolPreview";
import { CoverLetterActiveSwitcher } from "./CoverLetterActiveSwitcher";
import { useCoverLetterAutosave } from "./useResumeMakerAutosave";
import { useToast } from "../toast/ToastProvider";
import type { ResumeCoverLetterItem } from "../../lib/member-profile-client";
import { getMyResumes } from "../../lib/member-profile-client";
import { getCoverLetter } from "../../lib/cover-letter-client";
import { getBuilderState, getDraftResume } from "../../lib/resume-maker-client";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";
import { useCoverLetterCopy } from "../../lib/resume-maker-i18n/cover-letter";
import { useSectionNavCopy } from "../../lib/resume-maker-i18n/section-nav";

const inputCls =
  "h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:bg-white focus:outline-none";

// 연결된 이력서에서 AI 작성용 컨텍스트(경력·학력·스킬·어학 등)를 만든다.
async function buildContextFor(resumeId: string | null): Promise<CoverLetterContext> {
  if (!resumeId) return {};
  try {
    const resume = await getDraftResume(resumeId);
    const builder = getBuilderState(resume);
    const c = resume.content;
    return {
      desiredJobRole: c.desiredJobRole || undefined,
      jobCategories: builder.onboarding.jobCategories,
      summary: c.summary || undefined,
      selfIntroduction: c.selfIntroduction || undefined,
      experiences: builder.experiences.map((e) => ({
        type: e.type,
        title: e.title,
        org: e.org,
        period: [e.startDate, e.endDate].filter(Boolean).join(" ~ ") || undefined,
        summary: e.rawInput || undefined,
        bullets: (e.approvedBullets ?? []).map((b) => b.text).filter(Boolean)
      })),
      education: (c.educations ?? []).map((e) => ({ school: e.schoolName, major: e.major, status: e.status })),
      skills: c.skills,
      languages: (c.languages ?? []).map((l) => ({ language: l.language, level: l.level }))
    };
  } catch {
    return {};
  }
}

// 표준 문항 5종을 항상 섹션으로 보장 — 매칭되는 항목이 있으면 유지, 없으면 빈 항목으로
// 추가(표준 먼저, 직접 추가한 문항은 뒤로). 빈 항목은 자소서 문서엔 안 뜬다(답변 기준 필터).
function ensureStandard(items: ResumeCoverLetterItem[], std: { prompt: string }[]): ResumeCoverLetterItem[] {
  const used = new Set<string>();
  const out: ResumeCoverLetterItem[] = [];
  for (const sp of std) {
    const found = items.find((it) => it.prompt.trim() === sp.prompt && !used.has(it.id));
    if (found) {
      used.add(found.id);
      out.push(found);
    } else {
      out.push({ id: crypto.randomUUID(), prompt: sp.prompt, answer: "" });
    }
  }
  for (const it of items) {
    if (!used.has(it.id) && !std.some((sp) => sp.prompt === it.prompt.trim())) out.push(it);
  }
  return out;
}

// 좌측 레일 항목 스타일 — 이력서 ResumeSectionNav(rail)와 동일.
function railCls(active: boolean): string {
  return `inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-4 text-[13.5px] font-semibold transition lg:h-auto lg:min-h-[2.25rem] lg:w-full lg:justify-start lg:whitespace-normal lg:rounded-xl lg:px-3 lg:py-1.5 lg:text-[13px] lg:leading-tight ${
    active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28]"
  }`;
}

export function CoverLetterEditorPage({ coverLetterId }: { coverLetterId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useEditorCopy();
  const c = useCoverLetterCopy();
  const nav = useSectionNavCopy();
  const pickerCopy = useToolPickerCopy();
  const { status, schedule } = useCoverLetterAutosave(coverLetterId);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [items, setItems] = useState<ResumeCoverLetterItem[]>([]);
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([]);
  const [resumeContext, setResumeContext] = useState<CoverLetterContext>({});
  const [activeKey, setActiveKey] = useState<string>("settings"); // "settings" | itemId

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [cl, allResumes] = await Promise.all([getCoverLetter(coverLetterId), getMyResumes().catch(() => [])]);
        if (!alive) return;
        setTitle(cl.title);
        setCompany(cl.company ?? "");
        setResumeId(cl.resumeId);
        const ensured = ensureStandard(cl.items, t.clStandardPrompts);
        setItems(ensured);
        setActiveKey(ensured[0]?.id ?? "settings");
        setResumes(allResumes.map((r) => ({ id: r.id, title: r.title })));
        setResumeContext(await buildContextFor(cl.resumeId));
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : c.loadFailed);
        router.replace("/resume-maker/cover-letters");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLetterId]);

  function commitItems(next: ResumeCoverLetterItem[]) {
    setItems(next);
    schedule({ items: next });
  }
  function commitTitle(v: string) {
    setTitle(v);
    schedule({ title: v.trim() || c.untitled });
  }
  function commitCompany(v: string) {
    setCompany(v);
    schedule({ company: v.trim() || null });
  }
  async function commitResume(v: string) {
    const next = v || null;
    setResumeId(next);
    schedule({ resumeId: next });
    setResumeContext(await buildContextFor(next));
  }
  function addItem(prompt: string) {
    const id = crypto.randomUUID();
    commitItems([...items, { id, prompt, answer: "" }]);
    setActiveKey(id);
  }
  function removeItem(id: string) {
    const next = items.filter((it) => it.id !== id);
    commitItems(next);
    if (activeKey === id) setActiveKey(next[0]?.id ?? "settings");
  }
  function updateItem(id: string, patch: Partial<ResumeCoverLetterItem>) {
    commitItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  if (loading) {
    return (
      <ResumeMakerShell>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {c.loading}
          </span>
        </div>
      </ResumeMakerShell>
    );
  }

  const activeIndex = items.findIndex((it) => it.id === activeKey);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;
  const answeredCount = items.filter((it) => it.answer.trim()).length;
  const percent = items.length ? Math.round((answeredCount / items.length) * 100) : 0;
  const standardSet = new Set(t.clStandardPrompts.map((p) => p.prompt));
  const activeIsStandard = activeItem ? standardSet.has(activeItem.prompt.trim()) : false;

  return (
    <ResumeMakerShell right={<AutoSaveIndicator status={status} />}>
      {/* 백바 — 목록으로 + 제목 */}
      <div className="bg-background/95 backdrop-blur lg:sticky lg:top-14 lg:z-30">
        <div className="container flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5">
          <Link
            href="/resume-maker/cover-letters"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {c.back}
          </Link>
          <CoverLetterActiveSwitcher currentTitle={title} />
        </div>
      </div>

      {/* 3컬럼: 좌 문항 섹션 레일 / 중 편집 / 우 A4 미리보기 — 이력서 편집기와 동일 */}
      <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[200px_minmax(0,1fr)_360px]">
        {/* 좌: 섹션 레일 */}
        <div className="min-w-0 border-b border-border/60 px-5 pt-6 lg:border-b-0 lg:border-r lg:py-6 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
          {/* 완성도 — 이력서 레일과 동일(작성한 문항 / 전체) */}
          <div className="mb-3">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[12px] font-bold text-[#191F28]">{nav.completion}</span>
              <span className="text-[13px] font-bold text-[#0B46E8]">{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
              <div className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <nav className="mb-2 flex items-center gap-1 overflow-x-auto border-b border-[#F2F4F6] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mb-0 lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:pb-0">
            <button type="button" onClick={() => setActiveKey("settings")} className={railCls(activeKey === "settings")}>
              {c.settings}
            </button>
            {items.map((it) => (
              <button type="button" key={it.id} onClick={() => setActiveKey(it.id)} className={railCls(activeKey === it.id)}>
                {it.prompt.trim() || c.newPrompt}
                {it.answer.trim() ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#15C47E]" aria-hidden /> : null}
              </button>
            ))}
          </nav>

          {/* 맨 아래 — 직접 문항 추가 */}
          <button
            type="button"
            onClick={() => addItem("")}
            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#0B46E8]/40 px-3 py-2 text-[12.5px] font-semibold text-[#0B46E8] transition hover:bg-[#EDF1FD] lg:mt-2.5"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" /> {t.clAddCustom}
          </button>
        </div>

        {/* 중: 활성 섹션 편집 */}
        <div className="flex min-w-0 flex-col border-r border-border/60 lg:h-[calc(100vh-56px)]">
          <div className="px-5 py-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {activeKey === "settings" ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#191F28] md:text-[26px]">{c.settings}</h2>
                  <p className="mt-2 text-[14px] text-[#8B95A1]">{t.hdrCoverLetterDesc}</p>
                </div>
                <div className="space-y-4">
                  {/* 이름 */}
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/80">{c.nameLabel}</label>
                    <input className={`${inputCls} mt-1`} placeholder={c.namePlaceholder} value={title} maxLength={120} onChange={(e) => commitTitle(e.target.value)} />
                  </div>
                  {/* 지원 회사 */}
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/80">{t.clCompanyLabel}</label>
                    <input className={`${inputCls} mt-1`} placeholder={t.clCompanyPlaceholder} value={company} onChange={(e) => commitCompany(e.target.value)} />
                  </div>
                  {/* 연결 이력서 */}
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/80">{c.linkResumeLabel}</label>
                    <div className="relative mt-1">
                      <select className={`${inputCls} appearance-none pr-9`} value={resumeId ?? ""} onChange={(e) => void commitResume(e.target.value)} aria-label={c.linkResumeLabel}>
                        <option value="">{c.linkResumeNone}</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                      <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" weight="bold" aria-hidden />
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8B95A1]">{c.linkResumeHint}</p>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[#8B95A1]">{t.clNote}</p>
                </div>
              </div>
            ) : activeItem ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#191F28] md:text-[26px]">{t.hdrCoverLetterTitle}</h2>
                  <p className="mt-2 text-[14px] text-[#8B95A1]">{t.clIntro}</p>
                </div>
                <CoverLetterItemEditor
                  key={activeItem.id}
                  item={activeItem}
                  index={activeIndex}
                  onChange={(patch) => updateItem(activeItem.id, patch)}
                  onRemove={() => removeItem(activeItem.id)}
                  company={company}
                  resumeContext={resumeContext}
                  promptEditable={!activeIsStandard}
                  removable={!activeIsStandard}
                />
              </div>
            ) : (
              <p className="rounded-2xl bg-[#F2F4F6] px-6 py-12 text-center text-[13.5px] leading-relaxed text-[#8B95A1]">{t.clEmpty}</p>
            )}
          </div>
        </div>

        {/* 우: A4 미리보기 */}
        <CoverLetterToolPreview
          items={items}
          title={t.hdrCoverLetterTitle}
          previewLabel={t.clPreviewLabel}
          emptyLabel={t.clEmpty}
          a4Label={t.clA4Label}
          companyName={company.trim() || undefined}
          pdfHref={`/resume-maker/cover-letters/${coverLetterId}/preview`}
          pdfLabel={pickerCopy.previewPdf}
        />
      </div>
    </ResumeMakerShell>
  );
}
