"use client";

// 파트너 개인 프로필 — 탤런트 프로필(/talent/career/profile)과 동일한 결.
// 계정 기본 정보(이름·연락처·사진)를 인앱에서 편집(PATCH /members/me) + 회사 바로가기.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, SealCheck, Buildings, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TPageHeader } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { getMyPartnerOrganization, updateMyBasicInfo, type MyPartnerOrganization } from "../../../lib/member-profile-client";
import { convertImageFileToWebpDataUrl, estimateDataUrlBytes } from "../../../lib/image-upload";

const MAX_RAW_BYTES = 20 * 1024 * 1024;
const MAX_OUT_BYTES = 5 * 1024 * 1024;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{children}</p>;
}

export function PartnerProfileScreen() {
  const { user, refreshSession } = useAuthSession();
  const toast = useTalentPopup();
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);

  const [realName, setRealName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // photo: 현재 표시할 이미지(기존 URL 또는 새 data URL). photoChanged 로 전송 여부 판단.
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const emailVerified = Boolean(user?.emailVerified);
  const displayName = realName || user?.name || "파트너";

  // 세션 로드되면 폼 초기화.
  useEffect(() => {
    setRealName(user?.realName || user?.name || "");
    setPhoneNumber(user?.phoneNumber || "");
    setPhoto(user?.profileImageUrl || null);
    setPhotoChanged(false);
  }, [user?.realName, user?.name, user?.phoneNumber, user?.profileImageUrl]);

  useEffect(() => {
    void getMyPartnerOrganization().then(setOrg).catch(() => {});
  }, []);

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_RAW_BYTES) {
      toast.error("원본 파일은 20MB 이하만 올릴 수 있어요.");
      return;
    }
    setUploading(true);
    try {
      const data = await convertImageFileToWebpDataUrl(file);
      if (estimateDataUrlBytes(data) > MAX_OUT_BYTES) {
        toast.error("변환 후에도 용량이 커요. 더 작은 이미지를 선택해주세요.");
        return;
      }
      setPhoto(data);
      setPhotoChanged(true);
    } catch {
      toast.error("이미지를 처리하지 못했어요.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoChanged(true);
  }

  function save() {
    if (saving) return;
    if (!realName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    updateMyBasicInfo({
      realName: realName.trim(),
      phoneNumber: phoneNumber.trim() || null,
      ...(photoChanged ? { profileImageData: photo } : {})
    })
      .then(async () => {
        await refreshSession();
        setPhotoChanged(false);
        toast.success("프로필을 저장했어요");
      })
      .catch(() => toast.error("저장에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setSaving(false));
  }

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-5" />
      <div className="flex flex-col gap-12">
        <TPageHeader title="프로필" description="내 계정 기본 정보예요. 회사 정보는 회사 프로필에서 관리해요." />

        {/* 기본 정보 */}
        <section>
          <SectionTitle>기본 정보</SectionTitle>
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            {/* 프로필 사진 */}
            <div className="mb-5 flex items-center gap-4">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="프로필 사진 업로드"
                className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]"
              >
                {photo ? (
                  <Image src={photo} alt="" fill sizes="76px" className="object-cover" unoptimized />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[26px] font-black text-[#0B46E8]">{displayName.slice(0, 1)}</span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-[#0B1227]/55 py-1 text-[10px] font-bold text-white">
                  <Camera className="h-3 w-3" weight="fill" /> {uploading ? "처리 중" : "변경"}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[16px] font-black text-[#0B1227]">{displayName}</p>
                  {emailVerified ? (
                    <SealCheck className="h-[16px] w-[16px] shrink-0 text-[#0B46E8]" weight="fill" aria-label="이메일 인증됨" />
                  ) : (
                    <span className="shrink-0 rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">인증 안됨</span>
                  )}
                </div>
                {photo ? (
                  <button type="button" onClick={removePhoto} className="mt-1 text-[12px] font-semibold text-[#8B95A1] transition hover:text-[#F04452]">사진 삭제</button>
                ) : (
                  <p className="mt-1 text-[12px] text-[#8B95A1]">사진을 등록해보세요</p>
                )}
              </div>
            </div>

            {/* 필드 */}
            <div className="flex flex-col gap-3.5">
              <Field label="이름">
                <Input value={realName} onChange={setRealName} placeholder="예) 김지훈" />
              </Field>
              <Field label="이메일">
                <div className="flex items-center gap-2 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[14px] text-[#8B95A1]">{user?.email || "-"}</span>
                  <span className="shrink-0 text-[11.5px] text-[#B0B8C1]">계정에서 변경</span>
                </div>
              </Field>
              <Field label="연락처">
                <Input value={phoneNumber} onChange={setPhoneNumber} placeholder="예) 010-1234-5678" type="tel" inputMode="tel" />
              </Field>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving || uploading}
              className="mt-5 inline-flex h-[48px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"
            >
              {saving ? "저장 중…" : (<><CheckCircle className="h-4 w-4" weight="fill" /> 저장하기</>)}
            </button>
          </div>
        </section>

        {/* 회사 */}
        <section>
          <SectionTitle>회사</SectionTitle>
          <Link href={partnerRoutes.company} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
            {org?.companyLogoImageData ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
                <Image src={org.companyLogoImageData} alt="" fill sizes="44px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-[#191F28]">{org?.name || "회사 프로필"}</p>
              <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">지원자에게 보이는 우리 회사 정보를 관리해요.</p>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
          </Link>
        </section>
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
function Input({ value, onChange, placeholder, type, inputMode }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: "tel" }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode} className="w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
  );
}
