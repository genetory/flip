"use client";

// 파트너 회사 프로필 — 실서버 회사 정보 편집(로고·사무실 사진 + 기본 정보 + 소개).
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageSquare, Plus, X, Sparkle, CircleNotch } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { getMyPartnerOrganization, updateMyPartnerOrganizationBasic, getMembersMeta, aiPolishCompanyDescription, type MyPartnerOrganization } from "../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { convertImageFileToWebpDataUrl, estimateDataUrlBytes, parseOfficePhotos } from "../../../lib/image-upload";

const SIZE_OPTIONS: { value: NonNullable<MyPartnerOrganization["companySize"]>; label: string }[] = [
  { value: "SIZE_1_10", label: "1~10인" },
  { value: "SIZE_UNDER_30", label: "30인 이하" },
  { value: "SIZE_UNDER_50", label: "50인 이하" },
  { value: "SIZE_OVER_100", label: "100인 이상" }
];

const MAX_RAW_BYTES = 20 * 1024 * 1024;
const MAX_OUT_BYTES = 5 * 1024 * 1024;
const MAX_OFFICE_PHOTOS = 10;

type Form = {
  name: string;
  industry: string;
  companySize: string;
  officeAddress: string;
  website: string;
  description: string;
  strengths: string;
};

export function PartnerCompanyScreen() {
  const toast = useTalentPopup();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [industries, setIndustries] = useState<string[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [officePhotos, setOfficePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"logo" | "office" | null>(null);
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const officeInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setStatus("loading");
    Promise.all([getMyPartnerOrganization(), getMembersMeta().catch(() => ({ partnerIndustries: [] as string[] }))])
      .then(([org, meta]) => {
        if (!org) throw new Error("no org");
        setIndustries((meta as { partnerIndustries?: string[] }).partnerIndustries ?? []);
        setForm({
          name: org.name ?? "",
          industry: org.industry ?? "",
          companySize: org.companySize ?? "",
          officeAddress: org.officeAddress ?? "",
          website: org.website ?? "",
          description: org.description ?? "",
          strengths: org.strengths ?? ""
        });
        setLogo(org.companyLogoImageData ?? null);
        setOfficePhotos(parseOfficePhotos(org.officePhotoImageData));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function onPickLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_RAW_BYTES) {
      toast.error("원본 파일은 20MB 이하만 올릴 수 있어요.");
      return;
    }
    setUploading("logo");
    try {
      const data = await convertImageFileToWebpDataUrl(file);
      if (estimateDataUrlBytes(data) > MAX_OUT_BYTES) {
        toast.error("변환 후에도 용량이 커요. 더 작은 이미지를 선택해주세요.");
        return;
      }
      setLogo(data);
    } catch {
      toast.error("이미지를 처리하지 못했어요.");
    } finally {
      setUploading(null);
    }
  }

  async function onPickOffice(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    if (files.length === 0) return;
    if (files.some((f) => f.size > MAX_RAW_BYTES)) {
      toast.error("원본 파일은 20MB 이하만 올릴 수 있어요.");
      return;
    }
    const room = MAX_OFFICE_PHOTOS - officePhotos.length;
    if (room <= 0) {
      toast.error(`사무실 사진은 최대 ${MAX_OFFICE_PHOTOS}장까지 올릴 수 있어요.`);
      return;
    }
    setUploading("office");
    try {
      const picked = files.slice(0, room);
      const images = await Promise.all(picked.map((f) => convertImageFileToWebpDataUrl(f)));
      const ok = images.filter((d) => estimateDataUrlBytes(d) <= MAX_OUT_BYTES);
      if (ok.length < images.length) toast.error("일부 이미지는 용량이 커서 제외했어요.");
      if (ok.length) setOfficePhotos((prev) => [...prev, ...ok].slice(0, MAX_OFFICE_PHOTOS));
    } catch {
      toast.error("이미지를 처리하지 못했어요.");
    } finally {
      setUploading(null);
    }
  }

  // 지원자에게 보이는 핵심 항목 기준 완성도(6개).
  const completeness = useMemo(() => {
    if (!form) return 0;
    const checks = [!!form.name.trim(), !!form.description.trim(), !!logo, !!form.industry, !!form.companySize, !!form.officeAddress.trim()];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, logo]);

  // AI로 회사 소개 다듬기 — 초안(현재 입력값)을 매끄럽게. 없는 사실은 지어내지 않음.
  function polishDescription() {
    if (!form || polishing) return;
    const seed = form.description.trim();
    if (!seed) {
      toast.error("먼저 소개를 간단히 적어주세요. AI가 다듬어드려요.");
      return;
    }
    setPolishing(true);
    aiPolishCompanyDescription({ text: seed, name: form.name.trim() || undefined, industry: form.industry ? partnerIndustryLabel(form.industry) : undefined })
      .then((d) => {
        if (d) {
          setForm((f) => (f ? { ...f, description: d } : f));
          toast.success("소개를 다듬었어요. 확인 후 저장하세요.");
        }
      })
      .catch(() => toast.error("다듬기에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setPolishing(false));
  }

  function save() {
    if (!form || saving) return;
    if (!form.name.trim()) {
      toast.error("회사명을 입력해주세요.");
      return;
    }
    setSaving(true);
    updateMyPartnerOrganizationBasic({
      name: form.name.trim(),
      industry: form.industry || undefined,
      companySize: (form.companySize || null) as MyPartnerOrganization["companySize"],
      officeAddress: form.officeAddress.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      strengths: form.strengths.trim() || null,
      companyLogoImageData: logo,
      officePhotoImageData: officePhotos.length > 0 ? JSON.stringify(officePhotos) : null
    })
      .then(() => toast.success("회사 정보를 저장했어요"))
      .catch(() => toast.error("저장에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setSaving(false));
  }

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">회사 프로필</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">지원자에게 보이는 우리 회사 정보예요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" && form ? (
          <>
            {/* 프로필 완성도 — 미완성일 때만 */}
            {completeness < 100 ? (
              <div className="rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13.5px] font-bold text-[#191F28]">프로필 완성도</p>
                  <span className="text-[18px] font-black tabular-nums text-[#0B46E8]">{completeness}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${completeness}%` }} />
                </div>
                <p className="mt-2 break-keep text-[12px] text-[#8B95A1]">로고·소개·업종·규모·주소를 채우면 지원자에게 더 신뢰를 줘요.</p>
              </div>
            ) : null}

            {/* 로고 · 사무실 사진 */}
            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#191F28]">회사 로고</h2>
              <p className="mt-1 text-[12.5px] text-[#8B95A1]">정사각형 이미지를 권장해요.</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
              <div className="mt-3 flex items-center gap-4">
                {logo ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F5F6F8]">
                    <Image src={logo} alt="회사 로고" fill sizes="80px" className="object-cover" unoptimized />
                    <button type="button" onClick={() => setLogo(null)} aria-label="로고 삭제" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B1227]/70 text-white">
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] text-[#B0B8C1] transition hover:border-[#B0C4F5]">
                    <ImageSquare className="h-6 w-6" />
                  </button>
                )}
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploading === "logo"} className="rounded-xl bg-[#F2F4F6] px-3.5 py-2 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  {uploading === "logo" ? "처리 중…" : logo ? "로고 변경" : "로고 올리기"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-bold text-[#191F28]">관련 사진</h2>
                  <p className="mt-1 text-[12.5px] text-[#8B95A1]">사무실·팀·제품 등 · 최대 {MAX_OFFICE_PHOTOS}장 · {officePhotos.length}장 등록됨</p>
                </div>
                <input ref={officeInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickOffice} />
                <button type="button" onClick={() => officeInputRef.current?.click()} disabled={uploading === "office" || officePhotos.length >= MAX_OFFICE_PHOTOS} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#F2F4F6] px-3 py-2 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  <Plus className="h-4 w-4" weight="bold" /> {uploading === "office" ? "처리 중…" : "사진 추가"}
                </button>
              </div>
              {officePhotos.length ? (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {officePhotos.map((src, i) => (
                    <div key={`${i}-${src.slice(0, 24)}`} className="relative aspect-square overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
                      <Image src={src} alt={`관련 사진 ${i + 1}`} fill sizes="90px" className="object-cover" unoptimized />
                      <button type="button" onClick={() => setOfficePhotos((prev) => prev.filter((_, j) => j !== i))} aria-label="사진 삭제" className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0B1227]/70 text-white">
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" onClick={() => officeInputRef.current?.click()} className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] py-8 text-[#B0B8C1] transition hover:border-[#B0C4F5]">
                  <ImageSquare className="h-7 w-7" />
                  <span className="text-[13px] font-semibold">회사 관련 사진을 올려보세요</span>
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#191F28]">기본 정보</h2>
              <div className="mt-4 flex flex-col gap-3.5">
                <Field label="회사명"><Input value={form.name} onChange={(v) => set("name", v)} placeholder="회사명" /></Field>
                <Field label="업종">
                  <Select value={form.industry} onChange={(v) => set("industry", v)}>
                    <option value="">선택 안 함</option>
                    {industries.map((i) => (
                      <option key={i} value={i}>{partnerIndustryLabel(i)}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="회사 규모">
                  <Select value={form.companySize} onChange={(v) => set("companySize", v)}>
                    <option value="">선택 안 함</option>
                    {SIZE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="주소"><Input value={form.officeAddress} onChange={(v) => set("officeAddress", v)} placeholder="예) 서울 강남구" /></Field>
                <Field label="웹사이트"><Input value={form.website} onChange={(v) => set("website", v)} placeholder="https://" /></Field>
              </div>
            </section>

            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-[#191F28]">회사 소개</h2>
                <button
                  type="button"
                  onClick={polishDescription}
                  disabled={polishing}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-3 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#DFE7FB] disabled:opacity-50"
                >
                  {polishing ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />}
                  {polishing ? "다듬는 중…" : "AI로 다듬기"}
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3.5">
                <Field label="한 줄 소개 · 설명"><Textarea value={form.description} onChange={(v) => set("description", v)} placeholder="우리 회사를 소개해주세요. (간단히 적으면 AI가 다듬어드려요)" /></Field>
                <Field label="회사 자랑거리"><Textarea value={form.strengths} onChange={(v) => set("strengths", v)} placeholder="복지·문화·성장 등 강점을 적어주세요." /></Field>
              </div>
            </section>

            <button
              type="button"
              onClick={save}
              disabled={saving || uploading !== null}
              className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장하기"}
            </button>
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
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
