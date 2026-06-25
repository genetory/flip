"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  CaretDown,
  CaretRight,
  CheckCircle,
  Circle,
  CircleNotch,
  DotsSixVertical,
  Eye,
  Plus,
  Sparkle,
  Trash,
  User,
  X
} from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeSectionNav } from "./ResumeSectionNav";
import { AiTicketCost } from "./AiTicketCost";
import { AiChipButton } from "./AiChipButton";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { useResumeContentAutosave } from "./useResumeMakerAutosave";
import { ResumePreview } from "./ResumePreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import {
  getResumeCoach,
  postDraftResumeText,
  type CandidateEducationStatus,
  type CandidateEducationType,
  type CandidateVisaType,
  type ResumeCertificationEntry,
  type ResumeCoachData,
  type ResumeContent,
  type ResumeEducationEntry,
  type ResumeLanguageEntry,
  type ResumeLinkEntry
} from "../../lib/member-profile-client";
import {
  getBuilderState,
  getDraftResume,
  importResume,
  POLISH_STYLES,
  polishSelfIntro,
  suggestSkills,
  summarizeSelfIntro,
  updateResumeTitle,
  type PolishStyle
} from "../../lib/resume-maker-client";
import { compileResumeContent, hasPeriod } from "../../lib/resume-maker-compile";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";
import { ResumeDiagnosisResult } from "./ResumeDiagnosisResult";
import {
  ACCENT_PRESETS,
  DEFAULT_DESIGN,
  RESUME_SECTION_KEYS,
  TEMPLATE_SECTION_ORDER,
  type BuilderExperience,
  type ResumeBuilderState,
  type ResumeDesignSettings,
  type ResumeLayoutId,
  type ResumeSectionKey
} from "../../lib/resume-maker-types";
import { trackResumeDiagnosed } from "../../lib/analytics";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";
import { ResumeBackBar } from "./ResumeBackBar";
import { useExperienceTypeLabel, usePolishStyleLabel, useResumeSectionLabel } from "../../lib/resume-maker-i18n/labels";
import { useLayoutOptions, useTitleMarkerOptions, useVisaOptions } from "../../lib/resume-maker-i18n/options";

type EditorSection = "basic" | "intro" | "education" | "awards" | "skills" | "languages" | "links" | "diagnosis" | "design";
type Basic = {
  basicName: string;
  basicEmail: string;
  basicPhone: string;
  basicResidence: string;
  basicVisa: CandidateVisaType | "";
  basicPhotoUrl: string;
  nationality: string;
  desiredJobRole: string;
  desiredLocation: string;
  availableFrom: string;
  summary: string;
  selfIntroduction: string;
};
type Preserved = {
  educations?: ResumeEducationEntry[];
  languages?: ResumeLanguageEntry[];
  certifications?: ResumeCertificationEntry[];
  links?: ResumeLinkEntry[];
  skills?: string[];
};

const inputCls = "h-10 w-full rounded-xl border border-border bg-white px-3 text-[13.5px] focus:border-primary focus:outline-none";

// 프로필 사진 — 자주 자동저장되므로 캔버스로 최대 변(maxPx)을 줄여 data URL 을
// 가볍게 만든다. 저장 시 백엔드(resolveResumePhoto)가 Blob 으로 업로드한다.
async function readPhotoAsDataUrl(file: File, maxPx = 480): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
  return await new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const longest = Math.max(img.width, img.height);
      const scale = longest > maxPx ? maxPx / longest : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

type EditorCopy = ReturnType<typeof useEditorCopy>;
const educationTypes = (t: EditorCopy): { value: CandidateEducationType; label: string }[] => [
  { value: "HIGH_SCHOOL", label: t.eduHighSchool },
  { value: "ASSOCIATE", label: t.eduAssociate },
  { value: "BACHELOR", label: t.eduBachelor },
  { value: "MASTER", label: t.eduMaster },
  { value: "DOCTOR", label: t.eduDoctor },
  { value: "BOOTCAMP", label: t.eduBootcamp },
  { value: "CERTIFICATE", label: t.eduCertificate },
  { value: "OTHER", label: t.eduOther }
];
const educationStatuses = (t: EditorCopy): { value: CandidateEducationStatus; label: string }[] => [
  { value: "ENROLLED", label: t.statusEnrolled },
  { value: "GRADUATED", label: t.statusGraduated },
  { value: "LEAVE_OF_ABSENCE", label: t.statusLeave },
  { value: "DROPPED_OUT", label: t.statusDropped }
];
const chipCls = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
    active ? "border-primary bg-primary/10 text-[#0B46E8]" : "border-border bg-card text-foreground/80 hover:border-primary/40"
  }`;
const languageLevels = (t: EditorCopy): string[] => [t.langBasic, t.langConversational, t.langBusiness, t.langFluent, t.langNative];

// 아코디언 리스트 — 항목을 한 줄 요약으로 보여주고, 누르면 펼쳐서 편집.
// 새로 추가된 항목은 자동으로 펼쳐진다.
function AccordionRows<T>({
  items,
  label,
  summary,
  renderBody,
  onRemove,
  removeLabel
}: {
  items: T[];
  label: (i: number) => string;
  summary: (item: T, i: number) => string;
  renderBody: (item: T, i: number) => ReactNode;
  onRemove: (i: number) => void;
  removeLabel: string;
}) {
  const [open, setOpen] = useState<number | null>(items.length > 0 ? items.length - 1 : null);
  const prevLen = useRef(items.length);
  useEffect(() => {
    if (items.length > prevLen.current) setOpen(items.length - 1);
    prevLen.current = items.length;
  }, [items.length]);
  if (items.length === 0) return null;
  return (
    <div className="mt-1 space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        const sum = summary(item, i).trim();
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-xl border bg-card transition ${
              isOpen ? "border-primary/50 shadow-card" : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-1.5 px-3.5 py-2.5">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-[#0B46E8]">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#0B1227]">{sum || label(i)}</span>
                <CaretDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} weight="bold" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={removeLabel}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash className="h-4 w-4" weight="bold" />
              </button>
            </div>
            {isOpen ? <div className="space-y-4 border-t border-border/60 px-3.5 pb-4 pt-3.5">{renderBody(item, i)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

// 각 입력 카테고리 상단에 표시할 큰 타이틀 (경험 목록 화면과 동일한 스타일).
const sectionHeaders = (t: EditorCopy): Record<EditorSection, { title: string; desc: string }> => ({
  basic: { title: t.hdrBasicTitle, desc: t.hdrBasicDesc },
  intro: { title: t.hdrIntroTitle, desc: t.hdrIntroDesc },
  education: { title: t.hdrEducationTitle, desc: t.hdrEducationDesc },
  awards: { title: t.hdrAwardsTitle, desc: t.hdrAwardsDesc },
  skills: { title: t.hdrSkillsTitle, desc: t.hdrSkillsDesc },
  languages: { title: t.hdrLanguagesTitle, desc: t.hdrLanguagesDesc },
  links: { title: t.hdrLinksTitle, desc: t.hdrLinksDesc },
  diagnosis: { title: t.hdrDiagnosisTitle, desc: t.hdrDiagnosisDesc },
  design: { title: t.hdrDesignTitle, desc: t.hdrDesignDesc }
});

// 드롭다운 — native 화살표 대신 phosphor CaretDown 을 얹는다(appearance-none).
function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  ariaLabel
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <label className="text-[12px] font-medium text-foreground/80">
      {label}
      <div className="relative mt-1">
        <select
          className={`${inputCls} appearance-none pr-9`}
          value={value ?? ""}
          onChange={(ev) => onChange(ev.target.value as T)}
          aria-label={ariaLabel ?? label}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" weight="bold" aria-hidden />
      </div>
    </label>
  );
}

export function ResumeBuilderEditorPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useEditorCopy();
  const pickerCopy = useToolPickerCopy();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const section: EditorSection =
    sectionParam === "basic" ||
    sectionParam === "intro" ||
    sectionParam === "education" ||
    sectionParam === "awards" ||
    sectionParam === "skills" ||
    sectionParam === "languages" ||
    sectionParam === "links" ||
    sectionParam === "diagnosis" ||
    sectionParam === "design"
      ? sectionParam
      : "basic";
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [builder, setBuilder] = useState<ResumeBuilderState | null>(null);
  const [basic, setBasic] = useState<Basic>({
    basicName: "",
    basicEmail: "",
    basicPhone: "",
    basicResidence: "",
    basicVisa: "",
    basicPhotoUrl: "",
    nationality: "",
    desiredJobRole: "",
    desiredLocation: "",
    availableFrom: "",
    summary: "",
    selfIntroduction: ""
  });
  const [extra, setExtra] = useState<Preserved>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [highlight, setHighlight] = useState<"summary" | "selfIntro" | "careers" | "activities" | null>(null);
  const [coach, setCoach] = useState<ResumeCoachData | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const { status, schedule, flush } = useResumeContentAutosave(resumeId);

  const design: ResumeDesignSettings = builder?.design ?? DEFAULT_DESIGN;

  function buildContent(b: ResumeBuilderState, ba: Basic, ex: Preserved): ResumeContent {
    const base: ResumeContent = {
      basicName: ba.basicName || undefined,
      basicEmail: ba.basicEmail || undefined,
      basicPhone: ba.basicPhone || undefined,
      basicResidence: ba.basicResidence || undefined,
      basicVisa: ba.basicVisa || undefined,
      basicPhotoUrl: ba.basicPhotoUrl || undefined,
      nationality: ba.nationality || undefined,
      desiredJobRole: ba.desiredJobRole || undefined,
      desiredLocation: ba.desiredLocation || undefined,
      availableFrom: ba.availableFrom || undefined,
      summary: ba.summary || undefined,
      selfIntroduction: ba.selfIntroduction || undefined,
      educations: ex.educations,
      languages: ex.languages,
      certifications: ex.certifications,
      links: ex.links,
      skills: ex.skills
    };
    const compiled = compileResumeContent(b, base);
    return { ...compiled, builder: b } as ResumeContent;
  }

  const content = useMemo(
    () => (builder ? buildContent(builder, basic, extra) : ({} as ResumeContent)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builder, basic, extra]
  );
  const progress = builder ? computeResumeProgress(content, builder) : null;

  function commit(nextBuilder: ResumeBuilderState, nextBasic: Basic, nextExtra: Preserved) {
    setBuilder(nextBuilder);
    setBasic(nextBasic);
    setExtra(nextExtra);
    schedule(buildContent(nextBuilder, nextBasic, nextExtra));
  }
  const commitBuilder = (b: ResumeBuilderState) => commit(b, basic, extra);
  const commitBasic = (ba: Basic) => builder && commit(builder, ba, extra);
  const commitExtra = (ex: Preserved) => builder && commit(builder, basic, ex);

  // 브레인덤프 — 자유롭게 적은 텍스트를 AI(import)가 섹션별로 분배해 비어 있는 칸을
  // 채우고, 학력·경험·스킬 등은 기존 항목 뒤에 더한다.
  const [brainBusy, setBrainBusy] = useState(false);
  async function runBrainDump(text: string): Promise<boolean> {
    if (!builder || brainBusy) return false;
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      toast.info(t.writeMore);
      return false;
    }
    setBrainBusy(true);
    try {
      const imp = await importResume({ text: trimmed });
      const now = new Date().toISOString();
      const nextBasic: Basic = {
        ...basic,
        basicName: basic.basicName || imp.basicName || "",
        basicEmail: basic.basicEmail || imp.basicEmail || "",
        basicPhone: basic.basicPhone || imp.basicPhone || "",
        basicResidence: basic.basicResidence || imp.basicResidence || "",
        desiredJobRole: basic.desiredJobRole || imp.desiredJobRole || "",
        summary: basic.summary || imp.summary || "",
        selfIntroduction: basic.selfIntroduction || imp.selfIntroduction || ""
      };
      const dedupeSkills = (arr: string[]) => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const s of arr) {
          const k = s.trim().toLowerCase();
          if (s.trim() && !seen.has(k)) {
            seen.add(k);
            out.push(s.trim());
          }
        }
        return out;
      };
      const nextExtra: Preserved = {
        educations: [...(extra.educations ?? []), ...(imp.educations ?? [])],
        certifications: [...(extra.certifications ?? []), ...(imp.certifications ?? [])],
        languages: [...(extra.languages ?? []), ...(imp.languages ?? [])],
        links: [...(extra.links ?? []), ...(imp.links ?? [])],
        skills: dedupeSkills([...(extra.skills ?? []), ...(imp.skills ?? [])])
      };
      const newExps: BuilderExperience[] = (imp.experiences ?? []).map((e) => ({
        id: crypto.randomUUID(),
        type: (e.type as BuilderExperience["type"]) || "etc",
        title: e.title || e.org || t.experienceFallback,
        org: e.org,
        startDate: e.startDate,
        endDate: e.endDate,
        rawInput: e.description,
        status: "collecting",
        createdAt: now,
        updatedAt: now
      }));
      const nextBuilder: ResumeBuilderState = { ...builder, experiences: [...builder.experiences, ...newExps] };
      commit(nextBuilder, nextBasic, nextExtra);
      const added =
        (imp.educations?.length ?? 0) +
        (imp.certifications?.length ?? 0) +
        (imp.languages?.length ?? 0) +
        (imp.skills?.length ?? 0) +
        newExps.length;
      toast.success(added > 0 ? t.aiFilledCount(added) : t.organizedConfirm);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.organizeFailed);
      return false;
    } finally {
      setBrainBusy(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        const c = resume.content;
        setTitle(resume.title);
        setExtra({
          educations: c.educations,
          languages: c.languages,
          certifications: c.certifications,
          links: c.links,
          skills: c.skills
        });
        setBasic({
          basicName: c.basicName ?? "",
          basicEmail: c.basicEmail ?? "",
          basicPhone: c.basicPhone ?? "",
          basicResidence: c.basicResidence ?? "",
          basicVisa: c.basicVisa ?? "",
          basicPhotoUrl: c.basicPhotoUrl ?? "",
          nationality: c.nationality ?? "",
          desiredJobRole: c.desiredJobRole ?? "",
          desiredLocation: c.desiredLocation ?? "",
          availableFrom: c.availableFrom ?? "",
          summary: c.summary ?? "",
          selfIntroduction: c.selfIntroduction ?? ""
        });
        const state = getBuilderState(resume);
        setBuilder({ ...state, design: state.design ?? DEFAULT_DESIGN });
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : t.loadResumeFailed);
        router.replace("/resume-maker");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  async function loadCoach() {
    setCoachLoading(true);
    try {
      await flush(); // 최신 내용 저장 후 코칭 계산
      const data = await getResumeCoach(resumeId);
      setCoach(data);
      trackResumeDiagnosed(data.score.level);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.loadDiagnosisFailed);
    } finally {
      setCoachLoading(false);
    }
  }

  useEffect(() => {
    if (section === "diagnosis" && !coach && !coachLoading) void loadCoach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  if (loading || !builder) {
    return (
      <ResumeMakerShell>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loading}
          </span>
        </div>
      </ResumeMakerShell>
    );
  }

  return (
    <ResumeMakerShell right={<AutoSaveIndicator status={status} onRetry={() => void flush()} />}>
      <ResumeBackBar backHref="/resume-maker" backLabel={pickerCopy.back} title={title} />
      {/* 3컬럼: 좌 섹션 레일 / 중 편집 폼 / 우 실시간 미리보기(항상 표시) */}
      <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* 섹션 레일 — 데스크탑 세로, 모바일은 상단 가로 */}
        <div className="min-w-0 border-b border-border/60 px-5 pt-6 lg:border-b-0 lg:border-r lg:py-6 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
          {progress ? <ResumeCompletionConfetti percent={progress.percent} /> : null}
          <ResumeSectionNav
            resumeId={resumeId}
            active={section}
            progress={progress ? { percent: progress.percent, level: progress.level } : undefined}
            done={progress?.done}
            orientation="rail"
          />
        </div>
        {/* 가운데: 편집 폼 */}
        <div className="flex min-w-0 flex-col border-r border-border/60 lg:h-[calc(100vh-56px)]">
          {/* 스크롤 */}
          <div className="px-5 py-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>
                {sectionHeaders(t)[section].title}
              </h2>
              <p className="mt-2 text-[14px] text-muted-foreground">{sectionHeaders(t)[section].desc}</p>
            </div>
            {section === "education" ? (
              <Button
                variant="default"
                size="sm"
                className="mt-1 shrink-0"
                onClick={() => commitExtra({ ...extra, educations: [...(extra.educations ?? []), { status: "GRADUATED" }] })}
              >
                <Plus weight="bold" /> {t.add}
              </Button>
            ) : null}
            {section === "awards" ? (
              <Button
                variant="default"
                size="sm"
                className="mt-1 shrink-0"
                onClick={() => commitExtra({ ...extra, certifications: [...(extra.certifications ?? []), {}] })}
              >
                <Plus weight="bold" /> {t.add}
              </Button>
            ) : null}
            {section === "languages" ? (
              <Button
                variant="default"
                size="sm"
                className="mt-1 shrink-0"
                onClick={() => commitExtra({ ...extra, languages: [...(extra.languages ?? []), {}] })}
              >
                <Plus weight="bold" /> {t.add}
              </Button>
            ) : null}
            {section === "links" ? (
              <Button
                variant="default"
                size="sm"
                className="mt-1 shrink-0"
                onClick={() => commitExtra({ ...extra, links: [...(extra.links ?? []), {}] })}
              >
                <Plus weight="bold" /> {t.add}
              </Button>
            ) : null}
          </div>

          {section !== "diagnosis" && section !== "design" ? (
            <Link
              href={`/resume-maker/${resumeId}/chat?section=${section}`}
              className="mb-5 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-[13px] font-semibold text-[#0B46E8] transition hover:bg-primary/10"
            >
              <Sparkle weight="fill" className="h-4 w-4" />{t.fillWithAi}
              <CaretRight weight="bold" className="ml-auto h-4 w-4" />
            </Link>
          ) : null}

          {section === "basic" ? (
            <BasicSection
              basic={basic}
              onBasic={commitBasic}
              showPhoto={design.showPhoto}
              onShowPhoto={(v) => commitBuilder({ ...builder, design: { ...design, showPhoto: v } })}
              isForeigner={Boolean(builder.onboarding.isForeigner)}
              onIsForeigner={(v) =>
                // 끄면 국적·비자 값을 비워 미리보기에서도 사라지게 한다.
                commit(
                  { ...builder, onboarding: { ...builder.onboarding, isForeigner: v } },
                  v ? basic : { ...basic, nationality: "", basicVisa: "" },
                  extra
                )
              }
              resumeTitle={title}
              onResumeTitle={setTitle}
              onResumeTitleSave={(v) => void updateResumeTitle(resumeId, v).catch(() => toast.error(t.resumeTitleSaveFailed))}
            />
          ) : null}

          {section === "intro" ? (
            <IntroSection
              basic={basic}
              onBasic={commitBasic}
              setHighlight={setHighlight}
              jobCategories={builder.onboarding.jobCategories ?? []}
            />
          ) : null}

          {section === "education" ? (
            <EducationSection educations={extra.educations ?? []} onChange={(eds) => commitExtra({ ...extra, educations: eds })} />
          ) : null}

          {section === "awards" ? (
            <AwardsSection items={extra.certifications ?? []} onChange={(cs) => commitExtra({ ...extra, certifications: cs })} />
          ) : null}

          {section === "skills" ? (
            <SkillsSection
              skills={extra.skills ?? []}
              onChange={(skills) => commitExtra({ ...extra, skills })}
              context={{
                desiredJobRole: basic.desiredJobRole || undefined,
                jobCategories: builder.onboarding.jobCategories,
                major: (extra.educations ?? []).find((e) => e.major)?.major,
                experiences: builder.experiences.map((e) => e.title).filter(Boolean)
              }}
            />
          ) : null}

          {section === "languages" ? (
            <LanguagesSection languages={extra.languages ?? []} onChange={(languages) => commitExtra({ ...extra, languages })} />
          ) : null}

          {section === "links" ? (
            <LinksSection links={extra.links ?? []} onChange={(links) => commitExtra({ ...extra, links })} />
          ) : null}

          {section === "diagnosis" ? (
            <ResumeDiagnosisResult
              coach={coach}
              loading={coachLoading}
              onReload={() => void loadCoach()}
              onGoto={(targetSection) => {
                // 코치 actions 의 targetSection → 편집 화면 경로 매핑.
                if (["careers", "activities", "experiences", "experience"].includes(targetSection)) {
                  router.push(`/resume-maker/${resumeId}/experiences`);
                  return;
                }
                const sectionMap: Record<string, string> = {
                  basics: "basic",
                  basic: "basic",
                  summary: "intro",
                  selfIntroduction: "intro",
                  selfIntro: "intro",
                  intro: "intro",
                  education: "education",
                  educations: "education",
                  certifications: "awards",
                  certification: "awards",
                  awards: "awards",
                  skills: "skills",
                  languages: "languages",
                  links: "links"
                };
                const section = sectionMap[targetSection] ?? "basic";
                router.push(`/resume-maker/${resumeId}/edit?section=${section}`);
              }}
            />
          ) : null}

          {section === "design" ? <DesignTab design={design} onChange={(d) => commitBuilder({ ...builder, design: d })} /> : null}
          </div>
        </div>

        {/* 우측: 실시간 미리보기 (데스크탑) — 모바일은 버튼→팝업 */}
        <div className="hidden bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
          <div className="mb-4 flex items-center justify-end">
            <Link
              href={`/resume-maker/${resumeId}/preview`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-primary/5"
            >
              <Eye className="h-4 w-4" weight="bold" aria-hidden /> {t.previewPdf}
            </Link>
          </div>
          <ResumePreview content={content} design={design} highlightSection={highlight} />
        </div>
      </div>

      {/* 모바일: 하단 미리보기 버튼 + 시트 */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-5 py-3 backdrop-blur lg:hidden">
        <Button variant="default" size="lg" className="w-full" onClick={() => setPreviewOpen(true)}>
          <Eye weight="bold" /> {t.previewResume}
        </Button>
      </div>
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-[14px] font-bold text-[#0B1227]">{t.preview}</span>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label={t.close} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
            <ResumePreview content={content} design={design} highlightSection={highlight} />
          </div>
        </div>
      ) : null}
    </ResumeMakerShell>
  );
}

// ---- 내용 탭 ----
function ContentTab({
  basic,
  builder,
  onBasic,
  onBuilder,
  setHighlight,
  goInterview,
  toast
}: {
  basic: Basic;
  builder: ResumeBuilderState;
  onBasic: (b: Basic) => void;
  onBuilder: (b: ResumeBuilderState) => void;
  setHighlight: (s: "summary" | "selfIntro" | "careers" | "activities" | null) => void;
  goInterview: (experienceId: string) => void;
  toast: ReturnType<typeof useToast>;
}) {
  const t = useEditorCopy();
  const expTypeLabel = useExperienceTypeLabel();
  const [rewriting, setRewriting] = useState<string | null>(null);

  function patchExp(id: string, mutate: (e: BuilderExperience) => BuilderExperience) {
    onBuilder({ ...builder, experiences: builder.experiences.map((e) => (e.id === id ? mutate(e) : e)) });
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...builder.experiences];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onBuilder({ ...builder, experiences: next });
  }
  function toggleInclude(id: string) {
    const ready = builder.experiences.filter((e) => e.approvedBullets && e.approvedBullets.length).map((e) => e.id);
    const current = builder.includedExperienceIds ?? ready;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onBuilder({ ...builder, includedExperienceIds: next });
  }
  async function rewriteBullet(expId: string, bulletId: string, current: string) {
    setRewriting(bulletId);
    try {
      const r = await postDraftResumeText({ fieldType: "career", currentText: current, mode: "improve" });
      patchExp(expId, (e) => ({
        ...e,
        approvedBullets: (e.approvedBullets ?? []).map((b) => (b.id === bulletId ? { ...b, text: r.text } : b))
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.rewriteFailed);
    } finally {
      setRewriting(null);
    }
  }

  const includedSet = new Set(
    builder.includedExperienceIds ??
      builder.experiences.filter((e) => e.approvedBullets && e.approvedBullets.length).map((e) => e.id)
  );

  return (
    <div className="mt-5 space-y-6">
      {/* 기본 정보 */}
      <section id="content-basic">
        <h3 className="text-[13px] font-bold text-[#0B1227]">{t.sectionBasic}</h3>
        <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
          <input className={inputCls} placeholder={t.fieldName} value={basic.basicName} onChange={(e) => onBasic({ ...basic, basicName: e.target.value })} />
          <input className={inputCls} placeholder={t.fieldPhone} value={basic.basicPhone} onChange={(e) => onBasic({ ...basic, basicPhone: e.target.value })} />
          <input className={inputCls} placeholder={t.fieldEmail} value={basic.basicEmail} onChange={(e) => onBasic({ ...basic, basicEmail: e.target.value })} />
          <input className={inputCls} placeholder={t.fieldResidence} value={basic.basicResidence} onChange={(e) => onBasic({ ...basic, basicResidence: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder={t.fieldDesiredRole} value={basic.desiredJobRole} onChange={(e) => onBasic({ ...basic, desiredJobRole: e.target.value })} />
        </div>
      </section>

      {/* 요약 */}
      <section id="content-summary">
        <h3 className="text-[13px] font-bold text-[#0B1227]">{t.summaryHeading}</h3>
        <input
          className={`${inputCls} mt-2`}
          placeholder={t.oneLineSummary}
          value={basic.summary}
          onFocus={() => setHighlight("summary")}
          onBlur={() => setHighlight(null)}
          onChange={(e) => onBasic({ ...basic, summary: e.target.value })}
        />
      </section>

      {/* 자기소개 */}
      <section id="content-selfIntro">
        <h3 className="text-[13px] font-bold text-[#0B1227]">{t.selfIntroHeading}</h3>
        <textarea
          className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-primary focus:outline-none"
          rows={5}
          placeholder={t.selfIntroPlaceholder}
          value={basic.selfIntroduction}
          onFocus={() => setHighlight("selfIntro")}
          onBlur={() => setHighlight(null)}
          onChange={(e) => onBasic({ ...basic, selfIntroduction: e.target.value })}
        />
      </section>

      {/* 경험 (포함/제외 · 문장 편집 · 순서) */}
      <section id="content-experiences">
        <h3 className="text-[13px] font-bold text-[#0B1227]">{t.experienceSentences}</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">{t.experienceHint}</p>
        <div className="mt-3 space-y-2.5">
          {builder.experiences.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">{t.noExperience}</p>
          ) : (
            builder.experiences.map((exp, idx) => {
              const ready = Boolean(exp.approvedBullets && exp.approvedBullets.length);
              return (
                <div key={exp.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    {ready ? (
                      <button type="button" onClick={() => toggleInclude(exp.id)} aria-label={t.includeToggle}>
                        {includedSet.has(exp.id) ? (
                          <CheckCircle className="h-5 w-5 text-primary" weight="fill" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50" weight="bold" />
                        )}
                      </button>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30" weight="bold" />
                    )}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{expTypeLabel(exp.type)}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0B1227]">{exp.title}</span>
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={t.moveUp}>
                      <ArrowUp className="h-3.5 w-3.5" weight="bold" />
                    </button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === builder.experiences.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={t.moveDown}>
                      <ArrowDown className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </div>

                  {ready && !hasPeriod(exp) ? (
                    <p className="mt-1.5 text-[11.5px] font-medium text-amber-700">
                      {t.noPeriodWarning}
                    </p>
                  ) : null}

                  {ready ? (
                    <div
                      className="mt-2 space-y-2"
                      onFocus={() => setHighlight(["career", "intern", "part_time"].includes(exp.type) ? "careers" : "activities")}
                      onBlur={() => setHighlight(null)}
                    >
                      {(exp.approvedBullets ?? []).map((b) => (
                        <div key={b.id} className="rounded-lg bg-muted/40 p-2">
                          <textarea
                            className="w-full resize-none rounded-md border border-transparent bg-transparent px-1 py-1 text-[13px] leading-relaxed focus:border-border focus:bg-white focus:outline-none"
                            rows={2}
                            value={b.text}
                            onChange={(e) =>
                              patchExp(exp.id, (x) => ({
                                ...x,
                                approvedBullets: (x.approvedBullets ?? []).map((y) => (y.id === b.id ? { ...y, text: e.target.value } : y))
                              }))
                            }
                          />
                          <button
                            type="button"
                            disabled={rewriting === b.id}
                            onClick={() => void rewriteBullet(exp.id, b.id, b.text)}
                            className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0B46E8] hover:underline disabled:opacity-50"
                          >
                            {rewriting === b.id ? <CircleNotch className="h-3 w-3 animate-spin" weight="bold" /> : <Sparkle className="h-3 w-3" weight="fill" />}
                            {t.aiRewrite}
                            {rewriting === b.id ? null : <AiTicketCost feature="draft_resume_text" tone="muted" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button type="button" onClick={() => goInterview(exp.id)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0B46E8] hover:underline">
                      {t.makeWithInterview} <CaretRight className="h-3 w-3" weight="bold" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

// ---- 브레인덤프(생각나는 대로 적기 → AI 섹션 분배) ----
function BrainDump({ busy, onRun }: { busy: boolean; onRun: (text: string) => Promise<boolean> }) {
  const t = useEditorCopy();
  const [text, setText] = useState("");
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5">
        <Sparkle weight="fill" className="h-4 w-4 text-[#0B46E8]" />
        <p className="text-[13.5px] font-bold text-[#0B1227]">{t.brainTitle}</p>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{t.brainDesc}</p>
      <textarea
        className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-primary focus:outline-none"
        rows={4}
        placeholder={t.brainPlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
      />
      <Button
        variant="hero"
        size="sm"
        className="mt-2"
        disabled={busy || text.trim().length < 10}
        onClick={async () => {
          const ok = await onRun(text);
          if (ok) setText("");
        }}
      >
        {busy ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
        {busy ? t.organizing : t.fillWithAiShort}
      </Button>
    </div>
  );
}

// ---- 기본 정보 섹션 ----
function BasicSection({
  basic,
  onBasic,
  showPhoto,
  onShowPhoto,
  isForeigner,
  onIsForeigner,
  resumeTitle,
  onResumeTitle,
  onResumeTitleSave
}: {
  basic: Basic;
  onBasic: (b: Basic) => void;
  showPhoto: boolean;
  onShowPhoto: (v: boolean) => void;
  isForeigner: boolean;
  onIsForeigner: (v: boolean) => void;
  resumeTitle: string;
  onResumeTitle: (v: string) => void;
  onResumeTitleSave: (v: string) => void;
}) {
  const toast = useToast();
  const t = useEditorCopy();
  const visaOptions = useVisaOptions();
  const onPhoto = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = ""; // 같은 파일 다시 선택 허용
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t.imageOnly);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t.imageMaxSize);
      return;
    }
    try {
      const url = await readPhotoAsDataUrl(file);
      onBasic({ ...basic, basicPhotoUrl: url });
      onShowPhoto(true); // 업로드하면 바로 이력서에 표시
    } catch {
      toast.error(t.imageLoadFailed);
    }
  };
  return (
    <div className="mt-1">
      {/* 이력서 이름 — 목록·PDF 파일명용 (본인 이름과 별개) */}
      <label className="block text-[12px] font-medium text-foreground/80">
        {t.resumeName} <span className="text-muted-foreground">{t.resumeNameHint}</span>
        <input
          className={`${inputCls} mt-1`}
          placeholder={t.resumeNamePlaceholder}
          value={resumeTitle}
          maxLength={120}
          onChange={(e) => onResumeTitle(e.target.value)}
          onBlur={(e) => onResumeTitleSave(e.target.value)}
        />
      </label>

      {/* 프로필 사진 */}
      <div className="mt-3 flex items-start gap-4">
        <div className="flex h-[112px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {basic.basicPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={basic.basicPhotoUrl} alt={t.profilePhotoAlt} className="h-full w-full object-cover" />
          ) : (
            <User className="h-9 w-9 text-muted-foreground" weight="fill" aria-hidden />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 pt-0.5">
          <p className="text-[12px] font-semibold text-muted-foreground">{t.profilePhoto}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground/80 transition hover:border-primary/40">
              <Camera weight="bold" className="h-4 w-4" />
              {basic.basicPhotoUrl ? t.changePhoto : t.uploadPhoto}
              <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
            </label>
            {basic.basicPhotoUrl ? (
              <button
                type="button"
                onClick={() => onBasic({ ...basic, basicPhotoUrl: "" })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
              >
                <Trash weight="bold" className="h-4 w-4" /> {t.remove}
              </button>
            ) : null}
          </div>
          {/* 표시 토글 (스위치) */}
          <button
            type="button"
            role="switch"
            aria-checked={showPhoto}
            onClick={() => onShowPhoto(!showPhoto)}
            className="inline-flex w-fit items-center gap-2 text-[12.5px] font-medium text-foreground/80"
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                showPhoto ? "bg-[#0B46E8]" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  showPhoto ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </span>
            {t.showPhotoOnResume}
          </button>
        </div>
      </div>

      {/* 외국인 여부 — 켜면 국적·비자 항목이 나타나요(온보딩 없이도 수집) */}
      <button
        type="button"
        role="switch"
        aria-checked={isForeigner}
        onClick={() => onIsForeigner(!isForeigner)}
        className="mt-4 inline-flex w-fit items-center gap-2 text-[12.5px] font-medium text-foreground/80"
      >
        <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isForeigner ? "bg-[#0B46E8]" : "bg-muted-foreground/30"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isForeigner ? "translate-x-[18px]" : "translate-x-0.5"}`} />
        </span>
        {t.isForeigner}
      </button>

      <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
        <input className={inputCls} placeholder={t.fieldName} value={basic.basicName} onChange={(e) => onBasic({ ...basic, basicName: e.target.value })} />
        <input className={inputCls} placeholder={t.fieldPhone} value={basic.basicPhone} onChange={(e) => onBasic({ ...basic, basicPhone: e.target.value })} />
        <input className={inputCls} placeholder={t.fieldEmail} value={basic.basicEmail} onChange={(e) => onBasic({ ...basic, basicEmail: e.target.value })} />
        <input className={inputCls} placeholder={t.fieldResidence} value={basic.basicResidence} onChange={(e) => onBasic({ ...basic, basicResidence: e.target.value })} />
        <input
          className={`${inputCls} sm:col-span-2`}
          placeholder={t.fieldDesiredRole}
          value={basic.desiredJobRole}
          onChange={(e) => onBasic({ ...basic, desiredJobRole: e.target.value })}
        />
        <input className={inputCls} placeholder={t.desiredLocationPlaceholder} value={basic.desiredLocation} onChange={(e) => onBasic({ ...basic, desiredLocation: e.target.value })} />
        <input className={inputCls} placeholder={t.availableFromPlaceholder} value={basic.availableFrom} onChange={(e) => onBasic({ ...basic, availableFrom: e.target.value })} />
        {isForeigner ? (
          <>
            <input
              className={`${inputCls} sm:col-span-2`}
              placeholder={t.nationalityPlaceholder}
              value={basic.nationality}
              onChange={(e) => onBasic({ ...basic, nationality: e.target.value })}
            />
            <div className="sm:col-span-2">
              <SelectField
                label={t.visaLabel}
                placeholder={t.selectPlaceholder}
                options={visaOptions}
                value={basic.basicVisa || undefined}
                onChange={(v) => onBasic({ ...basic, basicVisa: v as CandidateVisaType })}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ---- 자기소개 섹션 (자기소개 작성 → AI 다듬기 / 자기소개 기반 한 줄 요약 추천) ----
function IntroSection({
  basic,
  onBasic,
  setHighlight,
  jobCategories
}: {
  basic: Basic;
  onBasic: (b: Basic) => void;
  setHighlight: (s: "summary" | "selfIntro" | "careers" | "activities" | null) => void;
  jobCategories: string[];
}) {
  const toast = useToast();
  const t = useEditorCopy();
  const polishLabel = usePolishStyleLabel();
  const [polishingStyle, setPolishingStyle] = useState<PolishStyle | null>(null);
  const [polished, setPolished] = useState<{ style: PolishStyle; text: string } | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const runPolish = async (style: PolishStyle) => {
    const text = basic.selfIntroduction.trim();
    if (text.length < 10) {
      toast.info(t.writeSelfIntroFirst);
      return;
    }
    setPolishingStyle(style);
    try {
      const result = await polishSelfIntro({
        text,
        style,
        desiredJobRole: basic.desiredJobRole || undefined,
        jobCategories: jobCategories.length ? jobCategories : undefined
      });
      setPolished({ style, text: result });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.polishFailed);
    } finally {
      setPolishingStyle(null);
    }
  };

  const runSummary = async () => {
    const text = basic.selfIntroduction.trim();
    if (text.length < 10) {
      toast.info(t.writeSelfIntroForSummary);
      return;
    }
    setSummarizing(true);
    setSummarySuggestion(null);
    try {
      const s = await summarizeSelfIntro({ text, desiredJobRole: basic.desiredJobRole || undefined });
      setSummarySuggestion(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.summaryFailed);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="mt-1 space-y-5">
      {/* 자기소개 — 먼저 작성하고, 형식을 골라 AI로 다듬어 볼 수 있어요. */}
      <div>
        <textarea
          className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-primary focus:outline-none"
          rows={8}
          placeholder={t.selfIntroLongPlaceholder}
          value={basic.selfIntroduction}
          onFocus={() => setHighlight("selfIntro")}
          onBlur={() => setHighlight(null)}
          onChange={(e) => onBasic({ ...basic, selfIntroduction: e.target.value })}
        />
        <div className="mt-2">
          <p className="mb-1.5 text-[12px] text-muted-foreground">{t.polishWithAi}</p>
          <div className="flex flex-wrap gap-1.5">
            {POLISH_STYLES.map((s) => (
              <AiChipButton
                key={s.value}
                loading={polishingStyle === s.value}
                disabled={polishingStyle !== null}
                onClick={() => runPolish(s.value)}
                feature="polish_intro"
              >
                {polishLabel(s.value)}
              </AiChipButton>
            ))}
          </div>
        </div>
        {polished !== null ? (
          <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-[12px] font-semibold text-[#0B46E8]">
              {t.aiPolished(polishLabel(polished.style))}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{polished.text}</p>
            <div className="mt-2.5 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onBasic({ ...basic, selfIntroduction: polished.text });
                  setPolished(null);
                  toast.success(t.polishReplaced);
                }}
              >
                {t.replaceWithThis}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPolished(null)}>
                {t.close}
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">{t.tryOtherStyles}</p>
          </div>
        ) : null}

        <p className="mt-2 text-[11.5px] text-muted-foreground">{t.translateHint}</p>
      </div>

      {/* 한 줄 요약 — 자기소개를 바탕으로 AI가 추천, 넣을지 말지 선택 */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold text-[#0B1227]">{t.oneLineSummaryHeading}</h3>
          <AiChipButton loading={summarizing} onClick={runSummary} feature="summarize_intro">
            {summarizing ? t.generating : t.aiRecommend}
          </AiChipButton>
        </div>
        <input
          className={`${inputCls} mt-2`}
          placeholder={t.summaryInputPlaceholder}
          value={basic.summary}
          onFocus={() => setHighlight("summary")}
          onBlur={() => setHighlight(null)}
          onChange={(e) => onBasic({ ...basic, summary: e.target.value })}
        />
        {summarySuggestion !== null ? (
          <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-[12px] font-semibold text-[#0B46E8]">{t.aiRecommendedSummary}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/90">{summarySuggestion}</p>
            <div className="mt-2.5 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onBasic({ ...basic, summary: summarySuggestion });
                  setSummarySuggestion(null);
                  toast.success(t.summaryInserted);
                }}
              >
                {t.insert}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSummarySuggestion(null)}>
                {t.dontInsert}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---- 학력 섹션 (스마트: 구분·상태 칩 + 재학중이면 졸업 숨김) ----
// 빈 상태 — 항목이 하나도 없을 때 "첫 OO를 추가해 볼까요?" CTA 카드(경험 목록과 동일 톤).
function EmptyAddCard({ title, desc, onAdd }: { title: string; desc: string; onAdd: () => void }) {
  const t = useEditorCopy();
  return (
    <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <Sparkle className="mx-auto h-7 w-7 text-[#0B46E8]" weight="fill" aria-hidden />
      <p className="mt-3 text-[15px] font-bold text-[#0B1227]">{title}</p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{desc}</p>
      <Button variant="default" size="sm" className="mt-4" onClick={onAdd}>
        <Plus weight="bold" /> {t.add}
      </Button>
    </div>
  );
}

const eduStatusLabel = (t: EditorCopy, s?: string) => educationStatuses(t).find((x) => x.value === s)?.label ?? "";

function EducationSection({ educations, onChange }: { educations: ResumeEducationEntry[]; onChange: (eds: ResumeEducationEntry[]) => void }) {
  const t = useEditorCopy();
  const update = (i: number, patch: Partial<ResumeEducationEntry>) => onChange(educations.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  if (educations.length === 0)
    return <EmptyAddCard title={t.emptyEducationTitle} desc={t.emptyEducationDesc} onAdd={() => onChange([{ status: "GRADUATED" }])} />;
  return (
    <AccordionRows
      items={educations}
      label={(i) => t.eduRowLabel(i + 1)}
      summary={(e) => [e.schoolName, e.major, eduStatusLabel(t, e.status)].filter(Boolean).join(" · ")}
      onRemove={(i) => onChange(educations.filter((_, idx) => idx !== i))}
      removeLabel={t.remove}
      renderBody={(e, i) => {
        const enrolled = e.status === "ENROLLED" || e.status === "LEAVE_OF_ABSENCE";
        const isHighSchool = e.educationType === "HIGH_SCHOOL";
        return (
          <>
            <input className={inputCls} placeholder={t.schoolNamePlaceholder} value={e.schoolName ?? ""} onChange={(ev) => update(i, { schoolName: ev.target.value })} />
            <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
              <SelectField label={t.eduTypeLabel} placeholder={t.selectPlaceholder} options={educationTypes(t)} value={e.educationType} onChange={(v) => update(i, { educationType: v })} />
              <SelectField
                label={t.eduStatusLabel}
                options={educationStatuses(t)}
                value={e.status}
                onChange={(v) => update(i, { status: v, ...(v === "ENROLLED" || v === "LEAVE_OF_ABSENCE" ? { endDate: "" } : {}) })}
              />
            </div>
            {!isHighSchool ? (
              <input className={inputCls} placeholder={t.majorPlaceholder} value={e.major ?? ""} onChange={(ev) => update(i, { major: ev.target.value })} />
            ) : null}
            <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
              <label className="text-[12px] font-medium text-foreground/80">
                {t.admission}
                <input type="month" className={`${inputCls} mt-1`} value={e.startDate ?? ""} onChange={(ev) => update(i, { startDate: ev.target.value })} aria-label={t.admissionMonth} />
              </label>
              {enrolled ? (
                <div className="text-[12px] font-medium text-foreground/80">
                  {t.graduation}
                  <div className="mt-1 flex h-10 items-center rounded-xl border border-dashed border-border px-3 text-[13px] text-muted-foreground">{t.currentlyEnrolled}</div>
                </div>
              ) : (
                <label className="text-[12px] font-medium text-foreground/80">
                  {t.graduation}
                  <input type="month" className={`${inputCls} mt-1`} value={e.endDate ?? ""} onChange={(ev) => update(i, { endDate: ev.target.value })} aria-label={t.graduationMonth} />
                </label>
              )}
            </div>
          </>
        );
      }}
    />
  );
}

// ---- 자격 · 수상 섹션 (certifications) ----
function AwardsSection({ items, onChange }: { items: ResumeCertificationEntry[]; onChange: (cs: ResumeCertificationEntry[]) => void }) {
  const t = useEditorCopy();
  const update = (i: number, patch: Partial<ResumeCertificationEntry>) => onChange(items.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  if (items.length === 0)
    return <EmptyAddCard title={t.emptyAwardsTitle} desc={t.emptyAwardsDesc} onAdd={() => onChange([{}])} />;
  return (
    <AccordionRows
      items={items}
      label={(i) => t.awardRowLabel(i + 1)}
      summary={(c) => [c.name, c.issuer].filter(Boolean).join(" · ")}
      onRemove={(i) => onChange(items.filter((_, idx) => idx !== i))}
      removeLabel={t.remove}
      renderBody={(c, i) => (
        <>
          <input className={inputCls} placeholder={t.awardNamePlaceholder} value={c.name ?? ""} onChange={(ev) => update(i, { name: ev.target.value })} />
          <input className={inputCls} placeholder={t.awardIssuerPlaceholder} value={c.issuer ?? ""} onChange={(ev) => update(i, { issuer: ev.target.value })} />
          <label className="block text-[12px] font-medium text-foreground/80">
            {t.awardDateLabel} <span className="text-muted-foreground">{t.awardDateOptional}</span>
            <input type="month" className={`${inputCls} mt-1`} value={c.date ?? ""} onChange={(ev) => update(i, { date: ev.target.value })} aria-label={t.awardDateAria} />
          </label>
        </>
      )}
    />
  );
}

// ---- 스킬 섹션 ----
function SkillsSection({
  skills,
  onChange,
  context
}: {
  skills: string[];
  onChange: (s: string[]) => void;
  context?: { desiredJobRole?: string; jobCategories?: string[]; major?: string; experiences?: string[] };
}) {
  const toast = useToast();
  const t = useEditorCopy();
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const addOne = (v: string) => {
    const t = v.trim();
    if (!t || skills.some((s) => s.toLowerCase() === t.toLowerCase())) return;
    onChange([...skills, t]);
  };
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    addOne(v);
    setDraft("");
  };
  const runSuggest = async () => {
    setSuggesting(true);
    try {
      const result = await suggestSkills({ ...context, have: skills });
      const fresh = result.filter((s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase()));
      setSuggestions(fresh);
      if (fresh.length === 0) toast.info(t.noNewSkills);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.skillRecommendFailed);
    } finally {
      setSuggesting(false);
    }
  };
  const pickSuggestion = (s: string) => {
    addOne(s);
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };
  return (
    <div className="mt-1">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder={t.skillPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="default" size="sm" className="h-10 shrink-0" onClick={add}>
          <Plus weight="bold" /> {t.add}
        </Button>
      </div>

      {/* AI 추천 — 칩을 눌러 추가만 하면 됨 */}
      <div className="mt-2">
        <AiChipButton loading={suggesting} onClick={() => void runSuggest()} feature="suggest_skills">
          {suggesting ? t.recommending : t.aiSkillRecommend}
        </AiChipButton>
        {suggestions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickSuggestion(s)}
                className="inline-flex items-center gap-1 rounded-full border border-[#0B46E8]/40 bg-primary/5 px-3 py-1 text-[12.5px] font-semibold text-[#0B46E8] transition hover:bg-primary/10"
              >
                <Plus className="h-3 w-3" weight="bold" /> {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-[12.5px] text-foreground/80">
              {s}
              <button
                type="button"
                onClick={() => onChange(skills.filter((_, idx) => idx !== i))}
                aria-label={t.remove}
                className="text-muted-foreground transition hover:text-destructive"
              >
                <X className="h-3 w-3" weight="bold" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- 어학 섹션 ----
function LanguagesSection({ languages, onChange }: { languages: ResumeLanguageEntry[]; onChange: (l: ResumeLanguageEntry[]) => void }) {
  const t = useEditorCopy();
  const update = (i: number, patch: Partial<ResumeLanguageEntry>) => onChange(languages.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  if (languages.length === 0)
    return <EmptyAddCard title={t.emptyLanguagesTitle} desc={t.emptyLanguagesDesc} onAdd={() => onChange([{}])} />;
  return (
    <AccordionRows
      items={languages}
      label={(i) => t.langRowLabel(i + 1)}
      summary={(l) => [l.language, l.level].filter(Boolean).join(" · ")}
      onRemove={(i) => onChange(languages.filter((_, idx) => idx !== i))}
      removeLabel={t.remove}
      renderBody={(l, i) => (
        <>
          <input className={inputCls} placeholder={t.languagePlaceholder} value={l.language ?? ""} onChange={(e) => update(i, { language: e.target.value })} />
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">{t.levelLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {languageLevels(t).map((lv) => (
                <button key={lv} type="button" onClick={() => update(i, { level: lv })} className={chipCls(l.level === lv)}>
                  {lv}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    />
  );
}

// ---- 링크 섹션 ----
function LinksSection({ links, onChange }: { links: ResumeLinkEntry[]; onChange: (l: ResumeLinkEntry[]) => void }) {
  const t = useEditorCopy();
  const update = (i: number, patch: Partial<ResumeLinkEntry>) => onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  if (links.length === 0)
    return <EmptyAddCard title={t.emptyLinksTitle} desc={t.emptyLinksDesc} onAdd={() => onChange([{}])} />;
  return (
    <AccordionRows
      items={links}
      label={(i) => t.linkRowLabel(i + 1)}
      summary={(l) => l.label || l.url || ""}
      onRemove={(i) => onChange(links.filter((_, idx) => idx !== i))}
      removeLabel={t.remove}
      renderBody={(l, i) => (
        <>
          <input className={inputCls} placeholder={t.linkLabelPlaceholder} value={l.label ?? ""} onChange={(e) => update(i, { label: e.target.value })} />
          <input className={inputCls} placeholder={t.linkUrlPlaceholder} value={l.url ?? ""} onChange={(e) => update(i, { url: e.target.value })} />
        </>
      )}
    />
  );
}

// ---- 디자인 탭 ----
// 섹션 순서 — 드래그앤드랍(데스크탑) + 위/아래 버튼(모바일·접근성)으로 재정렬.
function SectionOrderEditor({ design, onChange }: { design: ResumeDesignSettings; onChange: (d: ResumeDesignSettings) => void }) {
  const t = useEditorCopy();
  const sectionLabel = useResumeSectionLabel();
  const base = design.sectionOrder?.length ? design.sectionOrder : TEMPLATE_SECTION_ORDER[design.templateId] ?? TEMPLATE_SECTION_ORDER.basic;
  const order: ResumeSectionKey[] = [...base, ...RESUME_SECTION_KEYS.filter((k) => !base.includes(k))];
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange({ ...design, sectionOrder: next });
  };

  return (
    <div>
      <p className="text-[12px] font-bold text-[#0B1227]">{t.sectionOrder} <span className="font-normal text-muted-foreground">{t.sectionOrderHint}</span></p>
      <div className="mt-2 space-y-1.5">
        {order.map((key, i) => (
          <div
            key={key}
            draggable
            onDragStart={() => {
              dragIdx.current = i;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIdx !== i) setOverIdx(i);
            }}
            onDrop={() => {
              if (dragIdx.current !== null) move(dragIdx.current, i);
              dragIdx.current = null;
              setOverIdx(null);
            }}
            onDragEnd={() => {
              dragIdx.current = null;
              setOverIdx(null);
            }}
            className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition ${overIdx === i ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <DotsSixVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" weight="bold" aria-hidden />
            <span className="flex-1 text-[13px] font-semibold text-[#0B1227]">{sectionLabel(key)}</span>
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={t.moveUp} className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30">
              <ArrowUp className="h-3.5 w-3.5" weight="bold" />
            </button>
            <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label={t.moveDown} className="rounded p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-30">
              <ArrowDown className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-muted-foreground">{t.emptySectionHint}</p>
    </div>
  );
}

function DesignTab({ design, onChange }: { design: ResumeDesignSettings; onChange: (d: ResumeDesignSettings) => void }) {
  const t = useEditorCopy();
  const layoutOptions = useLayoutOptions();
  const markerOptions = useTitleMarkerOptions();
  const layout = design.layout ?? "modern";
  const accent = design.accentColor || "#0B46E8";
  function pickLayout(id: ResumeLayoutId) {
    onChange({ ...design, layout: id });
  }
  const optionRow = (label: string, options: { v: number; t: string }[], value: number, set: (v: number) => void) => (
    <div>
      <p className="text-[12px] font-bold text-[#0B1227]">{label}</p>
      <div className="mt-2 flex gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => set(o.v)}
            className={`flex-1 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${
              value === o.v ? "border-primary bg-primary/10 text-[#0B46E8]" : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="mt-5 space-y-6">
      <div>
        <p className="text-[12px] font-bold text-[#0B1227]">{t.layout}</p>
        <div className="mt-2 space-y-2">
          {layoutOptions.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => pickLayout(l.id)}
              className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                layout === l.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block text-[13.5px] font-bold text-[#0B1227]">{l.label}</span>
                <span className="mt-0.5 block text-[12px] text-muted-foreground">{l.desc}</span>
              </span>
              {layout === l.id ? <CheckCircle className="h-5 w-5 shrink-0 text-primary" weight="fill" /> : null}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12px] font-bold text-[#0B1227]">{t.accentColor}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...design, accentColor: c })}
              aria-label={t.colorAria(c)}
              className={`h-7 w-7 rounded-full ring-offset-2 transition ${accent.toLowerCase() === c.toLowerCase() ? "ring-2 ring-[#0B1227]" : "ring-1 ring-border"}`}
              style={{ background: c }}
            />
          ))}
          <label className="ml-1 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 text-[12px] text-muted-foreground">
            <span className="inline-block h-4 w-4 rounded-full border border-border" style={{ background: accent }} />
            {t.pickCustom}
            <input
              type="color"
              value={accent}
              onChange={(e) => onChange({ ...design, accentColor: e.target.value })}
              className="sr-only"
              aria-label={t.accentColorAria}
            />
          </label>
        </div>
      </div>
      <div>
        <p className="text-[12px] font-bold text-[#0B1227]">{t.titleMarker}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {markerOptions.map((m) => {
            const active = (design.titleMarker ?? "diamond") === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ ...design, titleMarker: m.id })}
                className={`rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${
                  active ? "border-primary bg-primary/10 text-[#0B46E8]" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
      <SectionOrderEditor design={design} onChange={onChange} />
      {optionRow(t.fontSize, [{ v: 0.9, t: t.small }, { v: 1, t: t.normal }, { v: 1.1, t: t.large }], design.fontScale, (v) => onChange({ ...design, fontScale: v }))}
      {optionRow(t.lineSpacing, [{ v: 1.4, t: t.narrow }, { v: 1.6, t: t.normal }, { v: 1.8, t: t.wide }], design.lineHeight, (v) => onChange({ ...design, lineHeight: v }))}
      {optionRow(t.sectionGap, [{ v: 16, t: t.narrow }, { v: 22, t: t.normal }, { v: 30, t: t.wide }], design.sectionGap, (v) => onChange({ ...design, sectionGap: v }))}
    </div>
  );
}
