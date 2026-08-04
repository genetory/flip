"use client";

// 기본 정보 등록 폼 — 실명·이메일·연락처·주소 + (선택)이력서용 프로필 사진.
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, UserCircle } from "@phosphor-icons/react";
import { TalentButton } from "../TalentButton";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { useBasicInfo, saveBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";

const FIELDS: { key: keyof Omit<BasicInfo, "photoUrl">; label: string; placeholder: string; type?: string; inputMode?: "email" | "tel" | "text" }[] = [
  { key: "realName", label: "실명", placeholder: "예) 김지훈" },
  { key: "email", label: "이메일", placeholder: "예) jihoon@example.com", type: "email", inputMode: "email" },
  { key: "phone", label: "연락처", placeholder: "예) 010-1234-5678", type: "tel", inputMode: "tel" },
  { key: "address", label: "주소", placeholder: "예) 서울시 강남구" }
];

export function BasicInfoForm({ defaultName }: { defaultName?: string }) {
  const stored = useBasicInfo();
  const toast = useTalentPopup();
  const [form, setForm] = useState<BasicInfo>(stored);
  const fileRef = useRef<HTMLInputElement>(null);

  // 저장소가 바뀌면(다른 탭 등) 반영 + 실명은 로그인 이름으로 선제안.
  useEffect(() => {
    setForm((prev) => ({ ...stored, realName: stored.realName || prev.realName || defaultName || "" }));
  }, [stored, defaultName]);

  const complete = isBasicInfoComplete(form);

  function set<K extends keyof BasicInfo>(key: K, value: BasicInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("photoUrl", String(reader.result));
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    set("photoUrl", "");
    if (fileRef.current) fileRef.current.value = "";
  }

  function onSave() {
    saveBasicInfo(form);
    toast.success("기본 정보를 저장했어요");
  }

  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <div className="mb-4 flex items-center justify-end">
        {complete ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]">
            <CheckCircle className="h-4 w-4" weight="fill" /> 등록 완료
          </span>
        ) : (
          <span className="text-[12.5px] font-semibold text-[#F04452]">미완료</span>
        )}
      </div>

      {/* 프로필 사진(이력서용, 세로 비율) */}
      <div className="mb-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-[92px] w-[72px] shrink-0"
          aria-label="프로필 사진 업로드"
        >
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
            {form.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-9 w-9 text-[#C4CAD2]" weight="fill" />
            )}
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-2xl border-2 border-white bg-[#0B46E8] text-white shadow-sm">
            <Camera className="h-3.5 w-3.5" weight="fill" />
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-[#191F28]">프로필 사진</p>
          <p className="mt-0.5 text-[12px] text-[#8B95A1]">선택 · 이력서에 들어가는 사진이에요</p>
          {form.photoUrl ? (
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">
                변경
              </button>
              <button type="button" onClick={removePhoto} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[#F04452] transition hover:bg-[#FDECEE]">
                삭제
              </button>
            </div>
          ) : null}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
      </div>

      {/* 입력 필드 */}
      <div className="flex flex-col gap-3.5">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{f.label}</span>
            <input
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              type={f.type ?? "text"}
              inputMode={f.inputMode}
              className="w-full rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-[14.5px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
          </label>
        ))}
      </div>

      <div className="mt-5">
        <TalentButton onClick={onSave} variant="primary" size="lg" fullWidth aria-label="기본 정보 저장">
          저장하기
        </TalentButton>
      </div>
    </section>
  );
}
