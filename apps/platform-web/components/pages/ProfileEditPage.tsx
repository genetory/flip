"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { PartnerAdminTwoColumn } from "../partner/PartnerAdminTwoColumn";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { logoutPlatformSession } from "../../lib/auth-client";
import { isMemberNotFoundError, updateMyBasicInfo } from "../../lib/member-profile-client";
import { CandidateDocumentsSection } from "../profile/CandidateDocumentsSection";
import { getStoredProfilePhoto, setStoredProfilePhoto } from "../../lib/profile-media";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_SQUIRCLE_CLIP_ID = "profile-edit-squircle-clip";
const PROFILE_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const PROFILE_SQUIRCLE_STYLE = {
  clipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`
} as const;

export function ProfileEditPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated, setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const [realName, setRealName] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const copyByLocale = {
    ko: {
      imageOnly: "이미지 파일만 업로드할 수 있습니다.",
      maxSize: "이미지 크기는 5MB 이하여야 합니다.",
      nicknameRequired: "닉네임을 입력해주세요.",
      saveFailed: "프로필 저장에 실패했습니다.",
      title: "프로필 편집",
      loading: "정보를 불러오는 중...",
      loginRequired: "로그인이 필요합니다.",
      goLogin: "로그인하러 가기",
      profilePhoto: "프로필 사진",
      changePhoto: "사진 변경",
      realName: "실명",
      nickname: "닉네임",
      phone: "연락처",
      phonePlaceholder: "예: 010-0000-0000",
      gender: "성별",
      noSelection: "선택 안 함",
      male: "남성",
      female: "여성",
      other: "기타",
      birthDate: "생년월일",
      cancel: "취소",
      saving: "저장 중...",
      save: "저장",
      subtitle: "기본 프로필 정보를 보기 쉽게 관리할 수 있어요."
    },
    en: {
      imageOnly: "Only image files can be uploaded.",
      maxSize: "Image size must be 5MB or less.",
      nicknameRequired: "Please enter a nickname.",
      saveFailed: "Failed to save profile.",
      title: "Edit profile",
      loading: "Loading information...",
      loginRequired: "Sign in is required.",
      goLogin: "Go to login",
      profilePhoto: "Profile photo",
      changePhoto: "Change photo",
      realName: "Legal name",
      nickname: "Nickname",
      phone: "Phone",
      phonePlaceholder: "e.g., +82-10-0000-0000",
      gender: "Gender",
      noSelection: "Prefer not to say",
      male: "Male",
      female: "Female",
      other: "Other",
      birthDate: "Date of birth",
      cancel: "Cancel",
      saving: "Saving...",
      save: "Save",
      subtitle: "Manage your basic profile information with a clearer layout."
    },
    "zh-CN": {
      imageOnly: "仅可上传图片文件。",
      maxSize: "图片大小必须小于 5MB。",
      nicknameRequired: "请输入昵称。",
      saveFailed: "保存资料失败。",
      title: "编辑资料",
      loading: "正在加载信息...",
      loginRequired: "需要先登录。",
      goLogin: "前往登录",
      profilePhoto: "头像",
      changePhoto: "更换头像",
      realName: "真实姓名",
      nickname: "昵称",
      phone: "联系方式",
      phonePlaceholder: "例如：010-0000-0000",
      gender: "性别",
      noSelection: "不选择",
      male: "男性",
      female: "女性",
      other: "其他",
      birthDate: "出生日期",
      cancel: "取消",
      saving: "保存中...",
      save: "保存",
      subtitle: "可更清晰地管理你的基础资料信息。"
    },
    vi: {
      imageOnly: "Chỉ có thể tải lên tệp hình ảnh.",
      maxSize: "Kích thước ảnh phải nhỏ hơn 5MB.",
      nicknameRequired: "Vui lòng nhập biệt danh.",
      saveFailed: "Lưu hồ sơ thất bại.",
      title: "Chỉnh sửa hồ sơ",
      loading: "Đang tải thông tin...",
      loginRequired: "Cần đăng nhập.",
      goLogin: "Đi tới đăng nhập",
      profilePhoto: "Ảnh hồ sơ",
      changePhoto: "Đổi ảnh",
      realName: "Tên thật",
      nickname: "Biệt danh",
      phone: "Số điện thoại",
      phonePlaceholder: "Ví dụ: 010-0000-0000",
      gender: "Giới tính",
      noSelection: "Không chọn",
      male: "Nam",
      female: "Nữ",
      other: "Khác",
      birthDate: "Ngày sinh",
      cancel: "Hủy",
      saving: "Đang lưu...",
      save: "Lưu",
      subtitle: "Bạn có thể quản lý thông tin hồ sơ cơ bản rõ ràng hơn."
    },
    ja: {
      imageOnly: "画像ファイルのみアップロードできます。",
      maxSize: "画像サイズは5MB以下にしてください。",
      nicknameRequired: "ニックネームを入力してください。",
      saveFailed: "プロフィールの保存に失敗しました。",
      title: "プロフィール編集",
      loading: "情報を読み込み中...",
      loginRequired: "ログインが必要です。",
      goLogin: "ログインへ移動",
      profilePhoto: "プロフィール写真",
      changePhoto: "写真を変更",
      realName: "本名",
      nickname: "ニックネーム",
      phone: "連絡先",
      phonePlaceholder: "例: 010-0000-0000",
      gender: "性別",
      noSelection: "選択しない",
      male: "男性",
      female: "女性",
      other: "その他",
      birthDate: "生年月日",
      cancel: "キャンセル",
      saving: "保存中...",
      save: "保存",
      subtitle: "基本プロフィール情報を見やすく管理できます。"
    },
    id: {
      imageOnly: "Hanya file gambar yang dapat diunggah.",
      maxSize: "Ukuran gambar harus 5MB atau kurang.",
      nicknameRequired: "Silakan masukkan nama panggilan.",
      saveFailed: "Gagal menyimpan profil.",
      title: "Edit profil",
      loading: "Memuat informasi...",
      loginRequired: "Diperlukan masuk.",
      goLogin: "Pergi ke halaman masuk",
      profilePhoto: "Foto profil",
      changePhoto: "Ganti foto",
      realName: "Nama asli",
      nickname: "Nama panggilan",
      phone: "Nomor telepon",
      phonePlaceholder: "Contoh: 010-0000-0000",
      gender: "Jenis kelamin",
      noSelection: "Tidak memilih",
      male: "Laki-laki",
      female: "Perempuan",
      other: "Lainnya",
      birthDate: "Tanggal lahir",
      cancel: "Batal",
      saving: "Menyimpan...",
      save: "Simpan",
      subtitle: "Kelola informasi profil dasar Anda dengan tata letak yang lebih jelas."
    }
  } as const;
  const copy = copyByLocale[locale] ?? copyByLocale.en;

  useEffect(() => {
    if (!user) return;
    setRealName(user.realName ?? "");
    setName(user.name ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setGender(user.gender ?? "");
    setBirthDate(user.birthDate ? user.birthDate.slice(0, 10) : "");
    setPreviewImage(user.profileImageUrl ?? getStoredProfilePhoto(user.id));
  }, [user]);

  const avatarFallback = useMemo(() => {
    if (name.trim()) return name.trim()[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  }, [name, user?.email]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage(copy.imageOnly);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(copy.maxSize);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setPreviewImage(value);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!user) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage(copy.nicknameRequired);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const isNewImage = previewImage && previewImage.startsWith("data:");
      const updated = await updateMyBasicInfo({
        realName: realName.trim() ? realName.trim() : null,
        name: trimmedName,
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
        gender: gender.trim() ? gender.trim() : null,
        birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`).toISOString() : null,
        ...(isNewImage ? { profileImageData: previewImage } : {})
      });
      setAuthenticatedUser({
        id: updated.id,
        email: updated.email,
        realName: updated.realName ?? null,
        name: updated.name ?? null,
        phoneNumber: updated.phoneNumber ?? null,
        birthDate: updated.birthDate ?? null,
        gender: updated.gender ?? null,
        role: updated.role,
        profileImageUrl: updated.profileImageUrl ?? null,
        partnerType: updated.partnerType ?? null
      });

      if (updated.profileImageUrl && /^https?:\/\//i.test(updated.profileImageUrl)) {
        setStoredProfilePhoto(updated.id, updated.profileImageUrl);
      }

      router.push("/profile");
      router.refresh();
    } catch (error) {
      if (isMemberNotFoundError(error)) {
        await logoutPlatformSession();
        window.location.href = "/login";
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={PROFILE_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={PROFILE_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <Header />
      <main className="container py-10 md:py-14">
        <PartnerAdminTwoColumn className="p-0 md:p-0">
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <span aria-hidden>←</span>
            {locale === "ko" ? "뒤로" : locale === "zh-CN" ? "返回" : locale === "vi" ? "Quay lại" : locale === "ja" ? "戻る" : locale === "id" ? "Kembali" : "Back"}
          </button>
          <div>
            <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">{copy.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          {!isReady ? (
            <p className="text-sm text-muted-foreground">{copy.loading}</p>
          ) : !isAuthenticated || !user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{copy.loginRequired}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{copy.goLogin}</Link>
              </Button>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="rounded-2xl bg-white p-4 md:p-5">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={copy.profilePhoto}
                      className="h-20 w-20 object-cover"
                      style={PROFILE_SQUIRCLE_STYLE}
                    />
                  ) : (
                    <div className={`grid h-20 w-20 place-items-center text-xl font-semibold ${
                      user.role === "STUDENT" ? "border border-border/60 bg-[#F8FAFC] text-muted-foreground" : "bg-muted"
                    }`} style={PROFILE_SQUIRCLE_STYLE}>
                      {avatarFallback}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{copy.profilePhoto}</p>
                    <label className="mt-2 inline-flex cursor-pointer rounded-md border border-input/60 px-3 py-2 text-sm">
                      {copy.changePhoto}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
              </div>
              </div>

              <div className="rounded-2xl bg-white p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-real-name">
                  {copy.realName}
                </label>
                <input
                  id="profile-real-name"
                  className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={realName}
                  onChange={(event) => setRealName(event.target.value)}
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-nickname">
                  {copy.nickname}
                </label>
                <input
                  id="profile-nickname"
                  className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-phone">
                  {copy.phone}
                </label>
                <input
                  id="profile-phone"
                  className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  maxLength={30}
                  placeholder={copy.phonePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-gender">
                  {copy.gender}
                </label>
                <select
                  id="profile-gender"
                  className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                >
                  <option value="">{copy.noSelection}</option>
                  <option value="MALE">{copy.male}</option>
                  <option value="FEMALE">{copy.female}</option>
                  <option value="OTHER">{copy.other}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-birth-date">
                  {copy.birthDate}
                </label>
                <input
                  id="profile-birth-date"
                  type="date"
                  className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
              </div>
              </div>
              </div>

              {user.role === "STUDENT" ? <CandidateDocumentsSection /> : null}

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="rounded-2xl bg-white p-4 md:p-5">
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.push("/profile")} disabled={isSaving}>
                  {copy.cancel}
                </Button>
                <Button variant="dark" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? copy.saving : copy.save}
                </Button>
              </div>
              </div>
            </section>
          )}
        </div>
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}
