"use client";

// v2 프로필 편집 — 기존 프로필(ProfileScreen: BasicInfoForm·NationalityField·JobInterestCard)과 같은 데이터를 v2 모양으로.
// 사진·기본 정보는 [저장하기]로 한 번에, 국적은 고르면 바로 저장, 관심 직무는 칩에서 바로 빼고 [+ 추가]로 고른다.
import { useEffect, useRef, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Masthead, Page, Section } from "../ui";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { NationalityField } from "../../talent/career/NationalityField";
import { JobInterestModal } from "../../talent/jobs/JobInterestModal";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { getStoredProfilePhoto, setStoredProfilePhoto } from "../../../lib/profile-media";
import { updateMyBasicInfo } from "../../../lib/member-profile-client";
import { useBasicInfo, saveBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { useJobInterests, saveJobInterests } from "../../../lib/talent/job-interest";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

type FieldKey = keyof Omit<BasicInfo, "photoUrl">;
const fields = (t: PlatformT): { key: FieldKey; label: string; placeholder: string; type?: string; inputMode?: "email" | "tel" | "text"; autoComplete?: string }[] => [
  { key: "realName", label: t("실명", "Full name", "真实姓名", "Họ và tên", "氏名", "Nama lengkap"), placeholder: t("예) 김지훈", "e.g. Jihoon Kim", "例）金智勋", "vd) Kim Jihoon", "例）キム・ジフン", "cth) Kim Jihoon"), autoComplete: "name" },
  { key: "email", label: t("이메일", "Email", "邮箱", "Email", "メール", "Email"), placeholder: "jihoon@example.com", type: "email", inputMode: "email", autoComplete: "email" },
  { key: "phone", label: t("연락처", "Phone", "联系方式", "Số điện thoại", "連絡先", "Kontak"), placeholder: "010-1234-5678", type: "tel", inputMode: "tel", autoComplete: "tel" },
  { key: "address", label: t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat"), placeholder: t("예) 서울시 강남구", "e.g. Gangnam-gu, Seoul", "例）首尔市江南区", "vd) Gangnam-gu, Seoul", "例）ソウル市江南区", "cth) Gangnam-gu, Seoul"), autoComplete: "street-address" }
];

export function V2ProfileScreen() {
  const t = usePlatformT();
  return (
    <V2Shell requireAuth>
      <Page>
        <Masthead
          eyebrow={t("내 프로필", "My profile", "我的资料", "Hồ sơ của tôi", "マイプロフィール", "Profil saya")}
          title={t("프로필 편집", "Edit profile", "编辑资料", "Sửa hồ sơ", "プロフィール編集", "Edit profil")}
          lede={t("이력서·자기소개서에 쓰이는 기본 정보예요.", "Basic info used in your resume and cover letter.", "用于简历和求职信的基本信息。", "Thông tin dùng cho CV và thư xin việc.", "履歴書・自己PRに使う基本情報です。", "Info dasar untuk CV dan surat lamaran.")}
        />
        <BasicInfoSection />
        <Section title={t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kebangsaan")}>
          <NationalityField />
        </Section>
        <InterestsSection />
      </Page>
    </V2Shell>
  );
}

function BasicInfoSection() {
  const t = usePlatformT();
  const stored = useBasicInfo();
  const toast = useTalentPopup();
  const { user, setAuthenticatedUser } = useAuthSession();
  const defaultName = user?.realName || user?.name || "";
  const [form, setForm] = useState<BasicInfo>(stored);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoDirty, setPhotoDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 계정 사진(GNB·설정과 같은 것) — 이력서 사진과는 별개.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 로그인 사용자가 바뀌면 사진을 다시 읽는다(기존 BasicInfoForm 과 같은 규칙).
    setPhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    setPhotoDirty(false);
  }, [user]);
  // 저장소가 바뀌면(다른 탭 등) 반영 + 실명은 로그인 이름으로 먼저 채워 둔다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 계정 저장소와 폼을 맞춘다.
    setForm((prev) => ({ ...stored, realName: stored.realName || prev.realName || defaultName }));
  }, [stored, defaultName]);

  const complete = isBasicInfoComplete(form);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result)); // 미리보기만 — 저장은 [저장하기]에서
      setPhotoDirty(true);
    };
    reader.readAsDataURL(file);
  };
  const removePhoto = () => {
    setPhoto(null);
    setPhotoDirty(true);
    if (fileRef.current) fileRef.current.value = "";
  };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      saveBasicInfo(form);
      if (photoDirty) {
        const u = await updateMyBasicInfo({ profileImageData: photo ?? null });
        setAuthenticatedUser({ id: u.id, email: u.email, realName: u.realName ?? null, name: u.name ?? null, phoneNumber: u.phoneNumber ?? null, birthDate: u.birthDate ?? null, gender: u.gender ?? null, role: u.role, profileImageUrl: u.profileImageUrl ?? null, partnerType: u.partnerType ?? null });
        setStoredProfilePhoto(u.id, u.profileImageUrl ?? "");
        setPhoto(u.profileImageUrl ?? null);
        setPhotoDirty(false);
      }
      toast.success(t("저장했어요", "Saved", "已保存", "Đã lưu", "保存しました", "Tersimpan"));
    } catch {
      toast.error(t("저장하지 못했어요. 잠시 후 다시 해 주세요.", "Couldn't save. Try again soon.", "保存失败，请稍后再试。", "Không lưu được. Thử lại sau.", "保存できませんでした。", "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  };
  const initial = (form.realName || defaultName || "?").charAt(0).toUpperCase();

  return (
    <Section
      title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")}
      aside={
        complete ? (
          <span className="rounded-full bg-[#e8f8f1] px-2.5 py-1 text-[13px] font-bold text-[color:var(--v2-good)]">{t("다 채웠어요", "Complete", "已完成", "Đã đủ", "入力済み", "Lengkap")}</span>
        ) : (
          <span className="rounded-full bg-[#fff4e8] px-2.5 py-1 text-[13px] font-bold text-[#c2410c]">{t("빈칸 있어요", "Incomplete", "未填完", "Còn thiếu", "未入力あり", "Belum lengkap")}</span>
        )
      }
    >
      {/* 사진 — 누르면 고르기 */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} aria-label={t("프로필 사진 바꾸기", "Change profile photo", "更换头像", "Đổi ảnh hồ sơ", "写真を変更", "Ganti foto")} className="relative h-20 w-20 shrink-0">
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--v2-band)] text-[28px] font-bold text-[color:var(--v2-faint)]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- 계정 사진은 data URL·외부 주소가 섞여 next/image 로 못 받는다.
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </span>
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[color:var(--v2-accent)] text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4Z" />
            </svg>
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-[color:var(--v2-ink)]">{t("프로필 사진", "Profile photo", "头像", "Ảnh hồ sơ", "プロフィール写真", "Foto profil")}</p>
          <p className="mt-0.5 text-[13px] leading-[1.5] text-[color:var(--v2-faint)]">{t("선택 · 이력서 사진은 이력서에서 따로 넣어요", "Optional · resume photo is set on the resume", "可选 · 简历照片在简历中设置", "Tùy chọn · ảnh CV đặt riêng", "任意 · 履歴書写真は別", "Opsional · foto CV terpisah")}</p>
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[14px] font-semibold text-[color:var(--v2-accent)]">
              {photo ? t("바꾸기", "Change", "更换", "Đổi", "変更", "Ubah") : t("올리기", "Upload", "上传", "Tải lên", "アップロード", "Unggah")}
            </button>
            {photo ? (
              <button type="button" onClick={removePhoto} className="text-[14px] font-semibold text-[color:var(--v2-faint)]">
                {t("지우기", "Remove", "删除", "Xóa", "削除", "Hapus")}
              </button>
            ) : null}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {fields(t).map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{f.label}</span>
            <input
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              type={f.type ?? "text"}
              inputMode={f.inputMode}
              autoComplete={f.autoComplete}
              className="h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2"
            />
          </label>
        ))}
      </div>
      <div className="mt-6">
        <Button full onClick={() => void save()} disabled={saving}>
          {saving ? t("저장하는 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장하기", "Save", "保存", "Lưu", "保存する", "Simpan")}
        </Button>
      </div>
    </Section>
  );
}

function InterestsSection() {
  const t = usePlatformT();
  const interests = useJobInterests();
  const [open, setOpen] = useState(false);
  return (
    <Section title={t("관심 직무", "Job interests", "感兴趣的职位", "Ngành quan tâm", "関心職種", "Minat kerja")}>
      <p className="-mt-1 mb-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("맞는 공고와 면접 질문을 골라 드릴 때 써요.", "Used to pick jobs and interview questions for you.", "用于为你推荐职位和面试问题。", "Dùng để gợi ý việc và câu hỏi.", "求人と面接質問のおすすめに使います。", "Dipakai untuk rekomendasi.")}</p>
      <div className="flex flex-wrap gap-2">
        {interests.map((r) => {
          const label = jobTaxonomyLabelOf(t, r);
          return (
            <span key={r} className="inline-flex h-10 items-center gap-1 rounded-full bg-[#edf1fd] pl-4 pr-2 text-[15px] font-semibold text-[color:var(--v2-accent)]">
              {label}
              <button type="button" onClick={() => saveJobInterests(interests.filter((x) => x !== r))} aria-label={t(`${label} 빼기`, `Remove ${label}`, `删除 ${label}`, `Xóa ${label}`, `${label}を外す`, `Hapus ${label}`)} className="flex h-6 w-6 items-center justify-center rounded-full text-[16px] leading-none text-[#8aa6ef] transition hover:bg-white/70 hover:text-[color:var(--v2-accent)]">
                ×
              </button>
            </span>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center rounded-full bg-[color:var(--v2-band)] px-4 text-[15px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">
          + {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
        </button>
      </div>
      {open ? <JobInterestModal initial={interests} onClose={() => setOpen(false)} /> : null}
    </Section>
  );
}
