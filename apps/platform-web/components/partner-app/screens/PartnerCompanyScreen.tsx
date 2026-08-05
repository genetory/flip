"use client";

// 파트너 회사 프로필 — 실서버 회사 정보 편집(기본 정보 + 소개).
import { useEffect, useState } from "react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { getMyPartnerOrganization, updateMyPartnerOrganizationBasic, getMembersMeta, type MyPartnerOrganization } from "../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";

const SIZE_OPTIONS: { value: NonNullable<MyPartnerOrganization["companySize"]>; label: string }[] = [
  { value: "SIZE_1_10", label: "1~10인" },
  { value: "SIZE_UNDER_30", label: "30인 이하" },
  { value: "SIZE_UNDER_50", label: "50인 이하" },
  { value: "SIZE_OVER_100", label: "100인 이상" }
];

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
  const [saving, setSaving] = useState(false);

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

  function save() {
    if (!form || saving) return;
    setSaving(true);
    updateMyPartnerOrganizationBasic({
      name: form.name.trim(),
      industry: form.industry || undefined,
      companySize: (form.companySize || null) as MyPartnerOrganization["companySize"],
      officeAddress: form.officeAddress.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      strengths: form.strengths.trim() || null
    })
      .then(() => toast.success("회사 정보를 저장했어요"))
      .catch(() => toast.error("저장에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setSaving(false));
  }

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">회사 프로필</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">지원자에게 보이는 우리 회사 정보예요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" && form ? (
          <>
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
              <h2 className="text-[15px] font-bold text-[#191F28]">회사 소개</h2>
              <div className="mt-4 flex flex-col gap-3.5">
                <Field label="한 줄 소개 · 설명"><Textarea value={form.description} onChange={(v) => set("description", v)} placeholder="우리 회사를 소개해주세요." /></Field>
                <Field label="회사 자랑거리"><Textarea value={form.strengths} onChange={(v) => set("strengths", v)} placeholder="복지·문화·성장 등 강점을 적어주세요." /></Field>
              </div>
            </section>

            <button
              type="button"
              onClick={save}
              disabled={saving}
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
