"use client";

// 파트너 개인 프로필 — 탤런트 프로필(/talent/career/profile)과 동일한 결.
// 계정 기본 정보(이름·연락처·사진)를 인앱에서 편집(PATCH /members/me) + 회사 바로가기.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, UserCircle, CheckCircle, Buildings, CaretRight } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { usePlatformT } from "../../../lib/i18n";
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
  const t = usePlatformT();
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
      toast.error(t("원본 파일은 20MB 이하만 올릴 수 있어요.", "Original files must be 20MB or less.", "原始文件不能超过20MB。", "Tệp gốc phải từ 20MB trở xuống.", "元のファイルは20MB以下のみアップロードできます。", "File asli maksimal 20MB."));
      return;
    }
    setUploading(true);
    try {
      const data = await convertImageFileToWebpDataUrl(file);
      if (estimateDataUrlBytes(data) > MAX_OUT_BYTES) {
        toast.error(t("변환 후에도 용량이 커요. 더 작은 이미지를 선택해주세요.", "Still too large after conversion. Please choose a smaller image.", "转换后仍然过大。请选择更小的图片。", "Vẫn quá lớn sau khi chuyển đổi. Vui lòng chọn ảnh nhỏ hơn.", "変換後もサイズが大きいです。より小さい画像を選んでください。", "Masih terlalu besar setelah konversi. Pilih gambar yang lebih kecil."));
        return;
      }
      setPhoto(data);
      setPhotoChanged(true);
    } catch {
      toast.error(t("이미지를 처리하지 못했어요.", "Couldn't process the image.", "无法处理图片。", "Không thể xử lý ảnh.", "画像を処理できませんでした。", "Gagal memproses gambar."));
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
      toast.error(t("이름을 입력해주세요.", "Please enter your name.", "请输入姓名。", "Vui lòng nhập tên.", "名前を入力してください。", "Masukkan nama Anda."));
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
        toast.success(t("프로필을 저장했어요", "Profile saved", "已保存资料", "Đã lưu hồ sơ", "プロフィールを保存しました", "Profil disimpan"));
      })
      .catch(() => toast.error(t("저장에 실패했어요. 잠시 후 다시 시도해주세요.", "Couldn't save. Please try again shortly.", "保存失败。请稍后再试。", "Không thể lưu. Vui lòng thử lại sau.", "保存に失敗しました。しばらくして再度お試しください。", "Gagal menyimpan. Coba lagi nanti.")))
      .finally(() => setSaving(false));
  }

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-5" />
      <div className="flex flex-col gap-12">
        <TPageHeader title={t("프로필", "Profile", "个人资料", "Hồ sơ", "プロフィール", "Profil")} description={t("내 계정 기본 정보예요. 회사 정보는 회사 프로필에서 관리해요.", "Your basic account info. Manage company info in the company profile.", "这是您的账户基本信息。公司信息请在公司资料中管理。", "Thông tin cơ bản của tài khoản. Quản lý thông tin công ty trong hồ sơ công ty.", "アカウントの基本情報です。会社情報は会社プロフィールで管理します。", "Info dasar akun Anda. Kelola info perusahaan di profil perusahaan.")} />

        {/* 기본 정보 */}
        <section>
          <SectionTitle>{t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")}</SectionTitle>
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="mb-4 flex items-center justify-end">
              {complete ? (
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]">
                  <CheckCircle className="h-4 w-4" weight="fill" /> {t("등록 완료", "Complete", "已完成", "Hoàn tất", "登録完了", "Selesai")}
                </span>
              ) : (
                <span className="text-[12.5px] font-semibold text-[#F04452]">{t("미완료", "Incomplete", "未完成", "Chưa xong", "未完了", "Belum lengkap")}</span>
              )}
            </div>

            {/* 프로필 사진 */}
            <div className="mb-5 flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative h-[92px] w-[72px] shrink-0"
                aria-label={t("프로필 사진 업로드", "Upload profile photo", "上传头像", "Tải ảnh hồ sơ", "プロフィール写真をアップロード", "Unggah foto profil")}
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
                <p className="text-[13.5px] font-semibold text-[#191F28]">{t("프로필 사진", "Profile photo", "头像", "Ảnh hồ sơ", "プロフィール写真", "Foto profil")}</p>
                <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("선택 · 프로필에 보이는 사진이에요", "Optional · Shown on your profile", "可选 · 显示在资料上的照片", "Tùy chọn · Ảnh hiển thị trên hồ sơ", "任意 · プロフィールに表示される写真です", "Opsional · Foto yang tampil di profil")}</p>
                {photo ? (
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">
                      {uploading ? t("처리 중…", "Processing…", "处理中…", "Đang xử lý…", "処理中…", "Memproses…") : t("변경", "Change", "更换", "Đổi", "変更", "Ganti")}
                    </button>
                    <button type="button" onClick={removePhoto} className="rounded-lg bg-[#FDECEE] px-2.5 py-1.5 text-[12px] font-semibold text-[#F04452] transition hover:bg-[#FBDDE1]">
                      {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                    </button>
                  </div>
                ) : null}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
            </div>

            {/* 입력 필드 */}
            <div className="flex flex-col gap-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("이름", "Name", "姓名", "Tên", "名前", "Nama")}</span>
                <input
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder={t("예) 김지훈", "e.g. John Kim", "例）张三", "VD: Nguyễn Văn A", "例）山田太郎", "Mis: Budi")}
                  className="w-full rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-[14.5px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("이메일", "Email", "邮箱", "Email", "メール", "Email")}</span>
                <input
                  value={user?.email || ""}
                  readOnly
                  aria-readonly
                  placeholder="-"
                  className="w-full cursor-not-allowed rounded-xl border border-[#EEF1F5] bg-[#F9FAFB] px-4 py-3 text-[14.5px] text-[#8B95A1] outline-none"
                />
                <span className="mt-1 block text-[11.5px] text-[#B0B8C1]">{t("이메일은 계정에서만 변경할 수 있어요.", "Email can only be changed in your account.", "邮箱只能在账户中更改。", "Email chỉ có thể đổi trong tài khoản.", "メールはアカウントでのみ変更できます。", "Email hanya bisa diubah di akun.")}</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("연락처", "Contact", "联系方式", "Liên hệ", "連絡先", "Kontak")}</span>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t("예) 010-1234-5678", "e.g. 010-1234-5678", "例）010-1234-5678", "VD: 010-1234-5678", "例）010-1234-5678", "Mis: 010-1234-5678")}
                  type="tel"
                  inputMode="tel"
                  className="w-full rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-[14.5px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
              </label>
            </div>

            <div className="mt-5">
              <TalentButton onClick={save} variant="primary" size="lg" fullWidth disabled={saving || uploading} aria-label={t("기본 정보 저장", "Save basic info", "保存基本信息", "Lưu thông tin cơ bản", "基本情報を保存", "Simpan info dasar")}>
                {saving ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장하기", "Save", "保存", "Lưu", "保存", "Simpan")}
              </TalentButton>
            </div>
          </div>
        </section>

        {/* 회사 */}
        <section>
          <SectionTitle>{t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")}</SectionTitle>
          <Link href={partnerRoutes.company} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
            {org?.companyLogoImageData ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
                <Image src={org.companyLogoImageData} alt="" fill sizes="44px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-[#191F28]">{org?.name || t("회사 프로필", "Company profile", "公司资料", "Hồ sơ công ty", "会社プロフィール", "Profil perusahaan")}</p>
              <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{t("지원자에게 보이는 우리 회사 정보를 관리해요.", "Manage the company info applicants see.", "管理申请者可见的公司信息。", "Quản lý thông tin công ty mà ứng viên thấy.", "応募者に表示される会社情報を管理します。", "Kelola info perusahaan yang dilihat pelamar.")}</p>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
          </Link>
        </section>
      </div>
    </PartnerAppShell>
  );
}
