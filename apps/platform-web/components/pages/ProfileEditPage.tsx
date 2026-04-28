"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { logoutPlatformSession } from "../../lib/auth-client";
import { isMemberNotFoundError, updateMyBasicInfo } from "../../lib/member-profile-client";
import { getStoredProfilePhoto, setStoredProfilePhoto } from "../../lib/profile-media";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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

  const copy = {
    imageOnly: locale === "ko" ? "이미지 파일만 업로드할 수 있습니다." : "Only image files can be uploaded.",
    maxSize: locale === "ko" ? "이미지 크기는 5MB 이하여야 합니다." : "Image size must be 5MB or less.",
    nicknameRequired: locale === "ko" ? "닉네임을 입력해주세요." : "Please enter a nickname.",
    saveFailed: locale === "ko" ? "프로필 저장에 실패했습니다." : "Failed to save profile.",
    title: locale === "ko" ? "프로필 편집" : "Edit profile",
    loading: locale === "ko" ? "정보를 불러오는 중..." : "Loading information...",
    loginRequired: locale === "ko" ? "로그인이 필요합니다." : "Sign in is required.",
    goLogin: locale === "ko" ? "로그인하러 가기" : "Go to login",
    profilePhoto: locale === "ko" ? "프로필 사진" : "Profile photo",
    changePhoto: locale === "ko" ? "사진 변경" : "Change photo",
    realName: locale === "ko" ? "실명" : "Legal name",
    nickname: locale === "ko" ? "닉네임" : "Nickname",
    phone: locale === "ko" ? "연락처" : "Phone",
    phonePlaceholder: locale === "ko" ? "예: 010-0000-0000" : "e.g., +82-10-0000-0000",
    gender: locale === "ko" ? "성별" : "Gender",
    noSelection: locale === "ko" ? "선택 안 함" : "Prefer not to say",
    male: locale === "ko" ? "남성" : "Male",
    female: locale === "ko" ? "여성" : "Female",
    other: locale === "ko" ? "기타" : "Other",
    birthDate: locale === "ko" ? "생년월일" : "Date of birth",
    cancel: locale === "ko" ? "취소" : "Cancel",
    saving: locale === "ko" ? "저장 중..." : "Saving...",
    save: locale === "ko" ? "저장" : "Save"
  } as const;

  useEffect(() => {
    if (!user) return;
    setRealName(user.realName ?? "");
    setName(user.name ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setGender(user.gender ?? "");
    setBirthDate(user.birthDate ? user.birthDate.slice(0, 10) : "");
    setPreviewImage(getStoredProfilePhoto(user.id));
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
      const updated = await updateMyBasicInfo({
        realName: realName.trim() ? realName.trim() : null,
        name: trimmedName,
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
        gender: gender.trim() ? gender.trim() : null,
        birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`).toISOString() : null
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
        partnerType: updated.partnerType ?? null
      });

      if (previewImage) {
        setStoredProfilePhoto(updated.id, previewImage);
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
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{copy.title}</h1>

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
            <section className="space-y-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={copy.profilePhoto}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`grid h-20 w-20 place-items-center rounded-full text-xl font-semibold ${
                      user.role === "STUDENT" ? "border border-border/60 bg-[#F8FAFC] text-muted-foreground" : "bg-muted"
                    }`}>
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

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="profile-real-name">
                  {copy.realName}
                </label>
                <input
                  id="profile-real-name"
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.push("/profile")} disabled={isSaving}>
                  {copy.cancel}
                </Button>
                <Button variant="dark" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? copy.saving : copy.save}
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
