"use client";

// 파트너 공고 작성/수정 — 신규(new) & 기존(id) 공용 폼. 서버 create/update/delete 연동.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CaretDown, Plus, X, ImageSquare } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import { convertImageFileToWebpDataUrl, estimateDataUrlBytes } from "../../../lib/image-upload";
import {
  getMyPartnerPositionById,
  createMyPartnerPosition,
  updateMyPartnerPosition,
  deleteMyPartnerPosition,
  type PartnerPosition
} from "../../../lib/member-profile-client";

type PositionStatus = PartnerPosition["status"];
type EmploymentType = PartnerPosition["employmentType"];
type WorkType = NonNullable<PartnerPosition["workType"]>;

const EMPLOYMENT_OPTS: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "INTERN", label: "인턴" },
  { value: "PART_TIME", label: "파트타임" },
  { value: "UNPAID_INTERN", label: "무급 인턴" }
];
const WORKTYPE_OPTS: { value: WorkType; label: string }[] = [
  { value: "On-site", label: "출근" },
  { value: "Hybrid", label: "하이브리드" },
  { value: "Remote", label: "재택" }
];
const STATUS_OPTS: PositionStatus[] = ["DRAFT", "PENDING_REVIEW", "OPEN", "PAUSED", "CLOSED"];

type Form = {
  title: string;
  employmentType: EmploymentType;
  workType: "" | WorkType;
  workLocation: string;
  startDate: string;
  hiringCount: string;
  workingHours: string;
  preferredJobRole: string;
  mainResponsibilities: string;
  requiredQualifications: string;
  preferredQualifications: string;
  hiringProcess: string;
  additionalNotes: string;
  thumbnailImages: string[];
};

const EMPTY: Form = {
  title: "",
  employmentType: "FULL_TIME",
  workType: "",
  workLocation: "",
  startDate: "",
  hiringCount: "",
  workingHours: "",
  preferredJobRole: "",
  mainResponsibilities: "",
  requiredQualifications: "",
  preferredQualifications: "",
  hiringProcess: "",
  additionalNotes: "",
  thumbnailImages: []
};

function fromPosition(p: PartnerPosition): Form {
  return {
    title: p.title ?? "",
    employmentType: p.employmentType,
    workType: p.workType ?? "",
    workLocation: p.workLocation ?? "",
    startDate: p.startDate ? p.startDate.slice(0, 10) : "",
    hiringCount: p.hiringCount != null ? String(p.hiringCount) : "",
    workingHours: p.workingHours ?? "",
    preferredJobRole: p.preferredJobRole ?? "",
    mainResponsibilities: p.mainResponsibilities ?? "",
    requiredQualifications: p.requiredQualifications ?? "",
    preferredQualifications: p.preferredQualifications ?? "",
    hiringProcess: p.hiringProcess ?? "",
    additionalNotes: p.additionalNotes ?? "",
    thumbnailImages: Array.isArray(p.thumbnailImages) ? p.thumbnailImages : []
  };
}

function toInput(f: Form) {
  const num = Number(f.hiringCount);
  return {
    title: f.title.trim(),
    employmentType: f.employmentType,
    workType: (f.workType || undefined) as WorkType | undefined,
    workLocation: f.workLocation.trim() || undefined,
    startDate: f.startDate || null,
    hiringCount: f.hiringCount && Number.isFinite(num) ? num : undefined,
    workingHours: f.workingHours.trim() || undefined,
    preferredJobRole: f.preferredJobRole.trim() || undefined,
    mainResponsibilities: f.mainResponsibilities.trim() || undefined,
    requiredQualifications: f.requiredQualifications.trim() || undefined,
    preferredQualifications: f.preferredQualifications.trim() || undefined,
    hiringProcess: f.hiringProcess.trim() || undefined,
    additionalNotes: f.additionalNotes.trim() || undefined,
    thumbnailImages: f.thumbnailImages
  };
}

export function PartnerPositionEditorScreen({ positionId }: { positionId?: string }) {
  const router = useRouter();
  const toast = useTalentPopup();
  const isEdit = Boolean(positionId);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(isEdit ? "loading" : "ready");
  const [form, setForm] = useState<Form>(EMPTY);
  const [posStatus, setPosStatus] = useState<PositionStatus>("DRAFT");
  const [initialStatus, setInitialStatus] = useState<PositionStatus>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  function load() {
    if (!positionId) return;
    setStatus("loading");
    getMyPartnerPositionById(positionId)
      .then((p) => {
        setForm(fromPosition(p));
        setPosStatus(p.status);
        setInitialStatus(p.status);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    if (isEdit) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // 공고 사진 업로드 — WebP 압축 후 data URL(서버가 업로드 처리). 최대 5장.
  async function onPickImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    if (files.length === 0) return;
    if (files.some((f) => f.size > 20 * 1024 * 1024)) {
      toast.error("원본 파일은 20MB 이하만 올릴 수 있어요.");
      return;
    }
    const room = 5 - form.thumbnailImages.length;
    if (room <= 0) {
      toast.error("사진은 최대 5장까지 올릴 수 있어요.");
      return;
    }
    setUploadingImg(true);
    try {
      const images = await Promise.all(files.slice(0, room).map((f) => convertImageFileToWebpDataUrl(f)));
      const ok = images.filter((d) => estimateDataUrlBytes(d) <= 5 * 1024 * 1024);
      if (ok.length < images.length) toast.error("일부 이미지는 용량이 커서 제외했어요.");
      if (ok.length) set("thumbnailImages", [...form.thumbnailImages, ...ok].slice(0, 5));
    } catch {
      toast.error("이미지를 처리하지 못했어요.");
    } finally {
      setUploadingImg(false);
    }
  }

  // 저장 — 편집: 내용 저장 후 게시 상태가 바뀌었으면 상태도 반영(백엔드는 둘을 동시에
  // 받지 않아 순차 전송). 신규: 등록 시점 상태를 함께 지정.
  async function save(newStatus?: PositionStatus) {
    if (saving) return;
    if (!form.title.trim()) {
      toast.error("공고 제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    const body = toInput(form);
    try {
      if (isEdit) {
        await updateMyPartnerPosition(positionId as string, body);
        if (posStatus !== initialStatus) {
          await updateMyPartnerPosition(positionId as string, { status: posStatus });
        }
        toast.success("공고를 저장했어요");
      } else {
        await createMyPartnerPosition({ ...body, status: newStatus ?? "DRAFT" });
        toast.success("공고를 등록했어요");
      }
      router.push(partnerRoutes.positions);
    } catch {
      toast.error("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!positionId || deleting) return;
    if (!window.confirm("이 공고를 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeleting(true);
    deleteMyPartnerPosition(positionId)
      .then(() => {
        toast.success("공고를 삭제했어요");
        router.push(partnerRoutes.positions);
      })
      .catch(() => toast.error("삭제에 실패했어요."))
      .finally(() => setDeleting(false));
  }

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" ? (
        <div className="flex flex-col gap-10">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{isEdit ? "공고 수정" : "새 공고 등록"}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">채용하려는 포지션 정보를 작성해요.</p>
          </div>

          {/* 기본 정보 */}
          <section>
            <SectionHeader title="기본 정보" />
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex flex-col gap-3.5">
              <Field label="공고 제목"><Input value={form.title} onChange={(v) => set("title", v)} placeholder="예) 백엔드 엔지니어 (신입/경력)" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="고용 형태">
                  <Select value={form.employmentType} onChange={(v) => set("employmentType", v as EmploymentType)}>
                    {EMPLOYMENT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </Field>
                <Field label="근무 형태">
                  <Select value={form.workType} onChange={(v) => set("workType", v as "" | WorkType)}>
                    <option value="">선택 안 함</option>
                    {WORKTYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="근무지"><Input value={form.workLocation} onChange={(v) => set("workLocation", v)} placeholder="예) 서울 강남구" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="채용 인원"><Input value={form.hiringCount} onChange={(v) => set("hiringCount", v.replace(/[^0-9]/g, ""))} placeholder="예) 2" inputMode="numeric" /></Field>
                <Field label="입사 예정일"><Input value={form.startDate} onChange={(v) => set("startDate", v)} type="date" /></Field>
              </div>
              <Field label="근무 시간"><Input value={form.workingHours} onChange={(v) => set("workingHours", v)} placeholder="예) 주 5일 · 09:00~18:00" /></Field>
              <Field label="선호 직무"><Input value={form.preferredJobRole} onChange={(v) => set("preferredJobRole", v)} placeholder="예) 서버 개발" /></Field>
            </div>
            </div>
          </section>

          {/* 사진 */}
          <section>
            <SectionHeader title="공고 사진" />
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12.5px] text-[#8B95A1]">근무 환경·팀·제품 등 · 최대 5장 · {form.thumbnailImages.length}장 등록됨</p>
                <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
                <button type="button" onClick={() => imgRef.current?.click()} disabled={uploadingImg || form.thumbnailImages.length >= 5} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#F2F4F6] px-3 py-2 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  <Plus className="h-4 w-4" weight="bold" /> {uploadingImg ? "처리 중…" : "사진 추가"}
                </button>
              </div>
              {form.thumbnailImages.length ? (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {form.thumbnailImages.map((src, i) => (
                    <div key={`${i}-${src.slice(0, 24)}`} className="relative aspect-square overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
                      <Image src={src} alt={`공고 사진 ${i + 1}`} fill sizes="90px" className="object-cover" unoptimized />
                      <button type="button" onClick={() => set("thumbnailImages", form.thumbnailImages.filter((_, j) => j !== i))} aria-label="사진 삭제" className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0B1227]/70 text-white">
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" onClick={() => imgRef.current?.click()} className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] py-8 text-[#B0B8C1] transition hover:border-[#B0C4F5]">
                  <ImageSquare className="h-7 w-7" />
                  <span className="text-[13px] font-semibold">공고에 보여줄 사진을 올려보세요</span>
                </button>
              )}
            </div>
          </section>

          {/* 상세 내용 */}
          <section>
            <SectionHeader title="상세 내용" />
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex flex-col gap-3.5">
              <Field label="주요 업무"><Textarea value={form.mainResponsibilities} onChange={(v) => set("mainResponsibilities", v)} placeholder="담당하게 될 주요 업무를 적어주세요." /></Field>
              <Field label="자격 요건"><Textarea value={form.requiredQualifications} onChange={(v) => set("requiredQualifications", v)} placeholder="필수 자격 요건을 적어주세요." /></Field>
              <Field label="우대 사항"><Textarea value={form.preferredQualifications} onChange={(v) => set("preferredQualifications", v)} placeholder="있으면 좋은 경험/역량을 적어주세요." /></Field>
              <Field label="채용 절차"><Textarea value={form.hiringProcess} onChange={(v) => set("hiringProcess", v)} placeholder="예) 서류 → 1차 면접 → 최종 면접" /></Field>
              <Field label="추가 안내"><Textarea value={form.additionalNotes} onChange={(v) => set("additionalNotes", v)} placeholder="복지, 근무 환경 등 추가로 알리고 싶은 내용" /></Field>
            </div>
            </div>
          </section>

          {isEdit ? (
            <section>
              <SectionHeader title="게시 상태" />
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <p className="mb-3 text-[12.5px] text-[#8B95A1]">상태를 선택하고 저장하면 반영돼요.</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTS.map((s) => {
                    const on = posStatus === s;
                    return (
                      <button key={s} type="button" onClick={() => setPosStatus(s)} className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition ${on ? "bg-[#0B46E8] text-white" : "bg-white text-[#4E5968] ring-1 ring-[#E4EAF2] hover:bg-[#EDF1FD]"}`}>
                        {PARTNER_POSITION_STATUS[s].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {/* 액션 — 우측 하단 2컬럼 */}
          <div className="flex justify-end gap-2.5">
            {isEdit ? (
              <>
                <button type="button" onClick={remove} disabled={deleting || saving} className="inline-flex h-[46px] min-w-[110px] items-center justify-center rounded-2xl bg-[#FDECEE] px-5 text-[14px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1] disabled:opacity-50">
                  {deleting ? "삭제 중…" : "공고 삭제"}
                </button>
                <button type="button" onClick={() => save()} disabled={saving} className="inline-flex h-[46px] min-w-[120px] items-center justify-center rounded-2xl bg-[#0B46E8] px-6 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {saving ? "저장 중…" : "저장하기"}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => save("DRAFT")} disabled={saving} className="inline-flex h-[46px] min-w-[110px] items-center justify-center rounded-2xl bg-[#F2F4F6] px-5 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  임시저장
                </button>
                <button type="button" onClick={() => save("PENDING_REVIEW")} disabled={saving} className="inline-flex h-[46px] min-w-[120px] items-center justify-center rounded-2xl bg-[#0B46E8] px-6 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {saving ? "등록 중…" : "검토 요청하기"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </PartnerAppShell>
  );
}

// 섹션 타이틀 — 카드 밖. 다른 섹션 페이지와 동일한 스타일.
function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-normal text-[#4E5968]">{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder, type, inputMode }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: "numeric" }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode} className="w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none [color-scheme:light] placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
  );
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-lg bg-[#F5F6F8] py-2.5 pl-3.5 pr-9 text-[14px] text-[#191F28] outline-none [color-scheme:light] focus:ring-2 focus:ring-[#0B46E8]/30">
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
    </div>
  );
}
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full resize-none rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
  );
}
