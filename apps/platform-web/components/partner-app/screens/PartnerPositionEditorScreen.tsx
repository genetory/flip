"use client";

// 파트너 공고 작성/수정 — 신규(new) & 기존(id) 공용 폼. 서버 create/update/delete 연동.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
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
  additionalNotes: ""
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
    additionalNotes: p.additionalNotes ?? ""
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
    additionalNotes: f.additionalNotes.trim() || undefined
  };
}

export function PartnerPositionEditorScreen({ positionId }: { positionId?: string }) {
  const router = useRouter();
  const toast = useTalentPopup();
  const isEdit = Boolean(positionId);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(isEdit ? "loading" : "ready");
  const [form, setForm] = useState<Form>(EMPTY);
  const [posStatus, setPosStatus] = useState<PositionStatus>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function load() {
    if (!positionId) return;
    setStatus("loading");
    getMyPartnerPositionById(positionId)
      .then((p) => {
        setForm(fromPosition(p));
        setPosStatus(p.status);
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

  function save(nextStatus?: PositionStatus) {
    if (saving) return;
    if (!form.title.trim()) {
      toast.error("공고 제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    const body = toInput(form);
    const run = isEdit
      ? updateMyPartnerPosition(positionId as string, { ...body, status: nextStatus })
      : createMyPartnerPosition({ ...body, status: nextStatus ?? "DRAFT" });
    run
      .then(() => {
        toast.success(isEdit ? "공고를 저장했어요" : "공고를 등록했어요");
        router.push(partnerRoutes.positions);
      })
      .catch(() => toast.error("저장에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setSaving(false));
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
                <Select value={posStatus} onChange={(v) => setPosStatus(v as PositionStatus)}>
                  {STATUS_OPTS.map((s) => <option key={s} value={s}>{PARTNER_POSITION_STATUS[s].label}</option>)}
                </Select>
              </div>
            </section>
          ) : null}

          {/* 액션 */}
          <div className="flex flex-col gap-2.5">
            {isEdit ? (
              <>
                <button type="button" onClick={() => save(posStatus)} disabled={saving} className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {saving ? "저장 중…" : "저장하기"}
                </button>
                <button type="button" onClick={remove} disabled={deleting} className="inline-flex h-[48px] items-center justify-center rounded-2xl bg-[#FDECEE] text-[14px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1] disabled:opacity-50">
                  {deleting ? "삭제 중…" : "공고 삭제"}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => save("PENDING_REVIEW")} disabled={saving} className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {saving ? "등록 중…" : "검토 요청하기"}
                </button>
                <button type="button" onClick={() => save("DRAFT")} disabled={saving} className="inline-flex h-[48px] items-center justify-center rounded-2xl bg-[#F2F4F6] text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  임시저장
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
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{label}</span>
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
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none [color-scheme:light] focus:ring-2 focus:ring-[#0B46E8]/30">
      {children}
    </select>
  );
}
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full resize-none rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
  );
}
