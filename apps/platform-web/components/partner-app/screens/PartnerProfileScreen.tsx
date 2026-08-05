"use client";

// 파트너 개인 프로필 — 탤런트 프로필(/talent/career/profile)과 동일한 결.
// 계정 기본 정보(이름·연락처·사진)를 인앱에서 편집(PATCH /members/me) + 회사 바로가기.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, UserCircle, CheckCircle, Buildings, CaretRight } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TalentButton } from "../../talent/TalentButton";
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

  const complete = Boolean(realName.trim() && phoneNumber.trim());

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
            <div className="mb-4 flex items-center justify-end">
              {complete ? (
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]">
                  <CheckCircle className="h-4 w-4" weight="fill" /> 등록 완료
                </span>
              ) : (
                <span className="text-[12.5px] font-semibold text-[#F04452]">미완료</span>
              )}
            </div>

            {/* 프로필 사진 */}
            <div className="mb-5 flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative h-[92px] w-[72px] shrink-0"
                aria-label="프로필 사진 업로드"
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
                  {photo ? (
                    <Image src={photo} alt="" width={72} height={92} className="h-full w-full object-cover" unoptimized />
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
                <p className="mt-0.5 text-[12px] text-[#8B95A1]">선택 · 프로필에 보이는 사진이에요</p>
                {photo ? (
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">
                      {uploading ? "처리 중…" : "변경"}
                    </button>
                    <button type="button" onClick={removePhoto} className="rounded-lg bg-[#FDECEE] px-2.5 py-1.5 text-[12px] font-semibold text-[#F04452] transition hover:bg-[#FBDDE1]">
                      삭제
                    </button>
                  </div>
                ) : null}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
            </div>

            {/* 입력 필드 */}
            <div className="flex flex-col gap-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">이름</span>
                <input
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="예) 김지훈"
                  className="w-full rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-[14.5px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">이메일</span>
                <input
                  value={user?.email || ""}
                  readOnly
                  aria-readonly
                  placeholder="-"
                  className="w-full cursor-not-allowed rounded-xl border border-[#EEF1F5] bg-[#F9FAFB] px-4 py-3 text-[14.5px] text-[#8B95A1] outline-none"
                />
                <span className="mt-1 block text-[11.5px] text-[#B0B8C1]">이메일은 계정에서만 변경할 수 있어요.</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">연락처</span>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="예) 010-1234-5678"
                  type="tel"
                  inputMode="tel"
                  className="w-full rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-[14.5px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
              </label>
            </div>

            <div className="mt-5">
              <TalentButton onClick={save} variant="primary" size="lg" fullWidth disabled={saving || uploading} aria-label="기본 정보 저장">
                {saving ? "저장 중…" : "저장하기"}
              </TalentButton>
            </div>
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
