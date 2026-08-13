"use client";

// 기본 정보 등록 폼 — 실명·이메일·연락처·주소 + (선택)서비스 프로필 사진(계정 사진).
// 사진은 서비스 계정 사진으로, GNB·기본정보와 공유. 이력서/자소서용 사진은 각 페이지에서 별도 관리.
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, UserCircle } from "@phosphor-icons/react";
import { TalentButton } from "../TalentButton";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { getStoredProfilePhoto, setStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../../lib/profile-media";
import { useBasicInfo, saveBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

const buildFields = (t: PlatformT): { key: keyof Omit<BasicInfo, "photoUrl">; label: string; placeholder: string; type?: string; inputMode?: "email" | "tel" | "text" }[] => [
  { key: "realName", label: t("실명", "Full name", "真实姓名", "Họ và tên", "氏名", "Nama lengkap"), placeholder: t("예) 김지훈", "e.g. Jihoon Kim", "例）金智勋", "vd) Kim Jihoon", "例）キム・ジフン", "cth) Kim Jihoon") },
  { key: "email", label: t("이메일", "Email", "邮箱", "Email", "メール", "Email"), placeholder: t("예) jihoon@example.com", "e.g. jihoon@example.com", "例）jihoon@example.com", "vd) jihoon@example.com", "例）jihoon@example.com", "cth) jihoon@example.com"), type: "email", inputMode: "email" },
  { key: "phone", label: t("연락처", "Phone", "联系方式", "Số điện thoại", "連絡先", "Kontak"), placeholder: t("예) 010-1234-5678", "e.g. 010-1234-5678", "例）010-1234-5678", "vd) 010-1234-5678", "例）010-1234-5678", "cth) 010-1234-5678"), type: "tel", inputMode: "tel" },
  { key: "address", label: t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat"), placeholder: t("예) 서울시 강남구", "e.g. Gangnam-gu, Seoul", "例）首尔市江南区", "vd) Gangnam-gu, Seoul", "例）ソウル市江南区", "cth) Gangnam-gu, Seoul") }
];

export function BasicInfoForm({ defaultName }: { defaultName?: string }) {
  const t = usePlatformT();
  const stored = useBasicInfo();
  const toast = useTalentPopup();
  const { user } = useAuthSession();
  const FIELDS = buildFields(t);
  const [form, setForm] = useState<BasicInfo>(stored);
  const fileRef = useRef<HTMLInputElement>(null);

  // 서비스(계정) 프로필 사진 — GNB·기본정보와 공유(이력서/자소서 사진과는 별개).
  const [accountPhoto, setAccountPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setAccountPhoto(null); return; }
    setAccountPhoto(user.profileImageUrl ?? getStoredProfilePhoto(user.id));
  }, [user?.id, user?.profileImageUrl]);

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
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAccountPhoto(url);
      setStoredProfilePhoto(user.id, url); // 계정 사진으로 저장 + GNB/기본정보 브로드캐스트
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setAccountPhoto(null);
    if (user) setStoredProfilePhoto(user.id, "");
    if (fileRef.current) fileRef.current.value = "";
  }

  function onSave() {
    saveBasicInfo(form);
    toast.success(t("기본 정보를 저장했어요", "Basic info saved", "已保存基本信息", "Đã lưu thông tin cơ bản", "基本情報を保存しました", "Info dasar tersimpan"));
  }

  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <div className="mb-4 flex items-center justify-end">
        {complete ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]">
            <CheckCircle className="h-4 w-4" weight="fill" /> {t("등록 완료", "Complete", "已完成", "Hoàn tất", "登録完了", "Selesai")}
          </span>
        ) : (
          <span className="text-[12.5px] font-semibold text-[#F04452]">{t("미완료", "Incomplete", "未完成", "Chưa xong", "未完了", "Belum lengkap")}</span>
        )}
      </div>

      {/* 서비스 프로필 사진(계정 사진) — 정방형. GNB·기본정보와 공유. */}
      <div className="mb-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-[80px] w-[80px] shrink-0"
          aria-label={t("프로필 사진 업로드", "Upload profile photo", "上传头像", "Tải ảnh hồ sơ", "プロフィール写真をアップロード", "Unggah foto profil")}
        >
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
            {accountPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={accountPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-9 w-9 text-[#C4CAD2]" weight="fill" />
            )}
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-2xl border-2 border-white bg-[#0B46E8] text-white shadow-sm">
            <Camera className="h-3.5 w-3.5" weight="fill" />
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-[#191F28]">{t("서비스 프로필 사진", "Profile photo", "服务头像", "Ảnh hồ sơ dịch vụ", "サービスプロフィール写真", "Foto profil layanan")}</p>
          <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("선택 · GNB·프로필에 쓰여요 (이력서 사진은 이력서에서 따로)", "Optional · used in the app profile (resume photo is set on the resume)", "可选 · 用于应用资料（简历照片在简历中单独设置）", "Tùy chọn · dùng cho hồ sơ ứng dụng (ảnh CV đặt riêng ở CV)", "任意 · アプリのプロフィールに使用（履歴書写真は履歴書で別途）", "Opsional · dipakai di profil aplikasi (foto CV diatur di CV)")}</p>
          {accountPhoto ? (
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">
                {t("변경", "Change", "更换", "Đổi", "変更", "Ubah")}
              </button>
              <button type="button" onClick={removePhoto} className="rounded-lg bg-[#FDECEE] px-2.5 py-1.5 text-[12px] font-semibold text-[#F04452] transition hover:bg-[#FBDDE1]">
                {t("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}
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
        <TalentButton onClick={onSave} variant="primary" size="lg" fullWidth aria-label={t("기본 정보 저장", "Save basic info", "保存基本信息", "Lưu thông tin cơ bản", "基本情報を保存", "Simpan info dasar")}>
          {t("저장하기", "Save", "保存", "Lưu", "保存する", "Simpan")}
        </TalentButton>
      </div>
    </section>
  );
}
