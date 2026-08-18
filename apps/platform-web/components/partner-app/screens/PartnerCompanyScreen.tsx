"use client";

// 파트너 회사 프로필 — 실서버 회사 정보 편집(로고·사무실 사진 + 기본 정보 + 소개).
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageSquare, Plus, X, Sparkle, CircleNotch, SealCheck, FileArrowUp, Buildings } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { getMyPartnerOrganization, updateMyPartnerOrganizationBasic, getMembersMeta, aiPolishCompanyDescription, type MyPartnerOrganization } from "../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { convertImageFileToWebpDataUrl, estimateDataUrlBytes, parseOfficePhotos } from "../../../lib/image-upload";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

const SIZE_OPTIONS: { value: NonNullable<MyPartnerOrganization["companySize"]> }[] = [
  { value: "SIZE_1_10" },
  { value: "SIZE_UNDER_30" },
  { value: "SIZE_UNDER_50" },
  { value: "SIZE_OVER_100" }
];
function sizeOptLabel(t: PlatformT, v: NonNullable<MyPartnerOrganization["companySize"]>): string {
  switch (v) {
    case "SIZE_1_10":
      return t("1~10인", "1–10", "1~10人", "1–10 người", "1~10人", "1–10 orang");
    case "SIZE_UNDER_30":
      return t("30인 이하", "≤30", "30人以下", "≤30 người", "30人以下", "≤30 orang");
    case "SIZE_UNDER_50":
      return t("50인 이하", "≤50", "50人以下", "≤50 người", "50人以下", "≤50 orang");
    case "SIZE_OVER_100":
      return t("100인 이상", "100+", "100人以上", "100+ người", "100人以上", "100+ orang");
  }
}

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
  const t = usePlatformT();
  const toast = useTalentPopup();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [industries, setIndustries] = useState<string[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [officePhotos, setOfficePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"logo" | "office" | null>(null);
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  // org 가 아직 없는(갓 가입한) 파트너면 생성 모드 — throw 하지 않고 빈 폼을 띄운다.
  const [isCreate, setIsCreate] = useState(false);
  // 인증 서류(사업자등록증·4대보험) + 서버가 계산한 인증 요약.
  const [bizDoc, setBizDoc] = useState<string | null>(null);
  const [insDoc, setInsDoc] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<"biz" | "ins" | null>(null);
  const [verification, setVerification] = useState<MyPartnerOrganization["verification"] | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const officeInputRef = useRef<HTMLInputElement>(null);
  const bizInputRef = useRef<HTMLInputElement>(null);
  const insInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setStatus("loading");
    Promise.all([getMyPartnerOrganization(), getMembersMeta().catch(() => ({ partnerIndustries: [] as string[] }))])
      .then(([org, meta]) => {
        setIndustries((meta as { partnerIndustries?: string[] }).partnerIndustries ?? []);
        // org 가 없으면(갓 가입) 빈 폼으로 회사 등록을 유도한다.
        setIsCreate(!org);
        setForm({
          name: org?.name ?? "",
          industry: org?.industry ?? "",
          companySize: org?.companySize ?? "",
          officeAddress: org?.officeAddress ?? "",
          website: org?.website ?? "",
          description: org?.description ?? "",
          strengths: org?.strengths ?? ""
        });
        setLogo(org?.companyLogoImageData ?? null);
        setOfficePhotos(parseOfficePhotos(org?.officePhotoImageData));
        setBizDoc(org?.businessRegistrationDocumentData ?? null);
        setInsDoc(org?.fourInsuranceSubscriberListData ?? null);
        setVerification(org?.verification ?? null);
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
      toast.error(t("원본 파일은 20MB 이하만 올릴 수 있어요.", "Original files must be 20MB or smaller.", "原始文件不能超过20MB。", "Tệp gốc phải nhỏ hơn hoặc bằng 20MB.", "元のファイルは20MB以下のみアップロードできます。", "File asli maksimal 20MB."));
      return;
    }
    setUploading("logo");
    try {
      const data = await convertImageFileToWebpDataUrl(file);
      if (estimateDataUrlBytes(data) > MAX_OUT_BYTES) {
        toast.error(t("변환 후에도 용량이 커요. 더 작은 이미지를 선택해주세요.", "Still too large after conversion. Please choose a smaller image.", "转换后仍然过大。请选择更小的图片。", "Vẫn quá lớn sau khi chuyển đổi. Vui lòng chọn ảnh nhỏ hơn.", "変換後もサイズが大きいです。より小さい画像を選んでください。", "Masih terlalu besar setelah konversi. Pilih gambar lebih kecil."));
        return;
      }
      setLogo(data);
    } catch {
      toast.error(t("이미지를 처리하지 못했어요.", "Couldn't process the image.", "无法处理图片。", "Không thể xử lý ảnh.", "画像を処理できませんでした。", "Tidak dapat memproses gambar."));
    } finally {
      setUploading(null);
    }
  }

  async function onPickOffice(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    if (files.length === 0) return;
    if (files.some((f) => f.size > MAX_RAW_BYTES)) {
      toast.error(t("원본 파일은 20MB 이하만 올릴 수 있어요.", "Original files must be 20MB or smaller.", "原始文件不能超过20MB。", "Tệp gốc phải nhỏ hơn hoặc bằng 20MB.", "元のファイルは20MB以下のみアップロードできます。", "File asli maksimal 20MB."));
      return;
    }
    const room = MAX_OFFICE_PHOTOS - officePhotos.length;
    if (room <= 0) {
      toast.error(t(`사무실 사진은 최대 ${MAX_OFFICE_PHOTOS}장까지 올릴 수 있어요.`, `You can upload up to ${MAX_OFFICE_PHOTOS} office photos.`, `办公室照片最多可上传${MAX_OFFICE_PHOTOS}张。`, `Bạn có thể tải lên tối đa ${MAX_OFFICE_PHOTOS} ảnh văn phòng.`, `オフィス写真は最大${MAX_OFFICE_PHOTOS}枚までアップロードできます。`, `Anda dapat mengunggah maksimal ${MAX_OFFICE_PHOTOS} foto kantor.`));
      return;
    }
    setUploading("office");
    try {
      const picked = files.slice(0, room);
      const images = await Promise.all(picked.map((f) => convertImageFileToWebpDataUrl(f)));
      const ok = images.filter((d) => estimateDataUrlBytes(d) <= MAX_OUT_BYTES);
      if (ok.length < images.length) toast.error(t("일부 이미지는 용량이 커서 제외했어요.", "Some images were too large and were skipped.", "部分图片过大，已被排除。", "Một số ảnh quá lớn nên đã bị bỏ qua.", "一部の画像はサイズが大きく除外しました。", "Beberapa gambar terlalu besar dan dilewati."));
      if (ok.length) setOfficePhotos((prev) => [...prev, ...ok].slice(0, MAX_OFFICE_PHOTOS));
    } catch {
      toast.error(t("이미지를 처리하지 못했어요.", "Couldn't process the image.", "无法处理图片。", "Không thể xử lý ảnh.", "画像を処理できませんでした。", "Tidak dapat memproses gambar."));
    } finally {
      setUploading(null);
    }
  }

  async function onPickDoc(kind: "biz" | "ins", e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_RAW_BYTES) {
      toast.error(t("원본 파일은 20MB 이하만 올릴 수 있어요.", "Original files must be 20MB or smaller.", "原始文件不能超过20MB。", "Tệp gốc phải nhỏ hơn hoặc bằng 20MB.", "元のファイルは20MB以下のみアップロードできます。", "File asli maksimal 20MB."));
      return;
    }
    setUploadingDoc(kind);
    try {
      const data = await convertImageFileToWebpDataUrl(file);
      if (estimateDataUrlBytes(data) > MAX_OUT_BYTES) {
        toast.error(t("변환 후에도 용량이 커요. 더 작은 이미지를 선택해주세요.", "Still too large after conversion. Please choose a smaller image.", "转换后仍然过大。请选择更小的图片。", "Vẫn quá lớn sau khi chuyển đổi. Vui lòng chọn ảnh nhỏ hơn.", "変換後もサイズが大きいです。より小さい画像を選んでください。", "Masih terlalu besar setelah konversi. Pilih gambar lebih kecil."));
        return;
      }
      if (kind === "biz") setBizDoc(data);
      else setInsDoc(data);
    } catch {
      toast.error(t("이미지를 처리하지 못했어요.", "Couldn't process the image.", "无法处理图片。", "Không thể xử lý ảnh.", "画像を処理できませんでした。", "Tidak dapat memproses gambar."));
    } finally {
      setUploadingDoc(null);
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
      toast.error(t("먼저 소개를 간단히 적어주세요. AI가 다듬어드려요.", "Write a brief introduction first. AI will polish it.", "请先简单写下简介，AI会帮您润色。", "Hãy viết giới thiệu ngắn gọn trước. AI sẽ trau chuốt lại.", "まず簡単に紹介を書いてください。AIが仕上げます。", "Tulis perkenalan singkat dulu. AI akan menyempurnakannya."));
      return;
    }
    setPolishing(true);
    aiPolishCompanyDescription({ text: seed, name: form.name.trim() || undefined, industry: form.industry ? partnerIndustryLabel(form.industry) : undefined })
      .then((d) => {
        if (d) {
          setForm((f) => (f ? { ...f, description: d } : f));
          toast.success(t("소개를 다듬었어요. 확인 후 저장하세요.", "Introduction polished. Review and save.", "简介已润色。请确认后保存。", "Đã trau chuốt giới thiệu. Kiểm tra và lưu.", "紹介を仕上げました。確認して保存してください。", "Perkenalan disempurnakan. Periksa dan simpan."));
        }
      })
      .catch(() => toast.error(t("다듬기에 실패했어요. 잠시 후 다시 시도해주세요.", "Couldn't polish it. Please try again shortly.", "润色失败。请稍后再试。", "Không thể trau chuốt. Vui lòng thử lại sau.", "仕上げに失敗しました。しばらくして再度お試しください。", "Gagal menyempurnakan. Coba lagi nanti.")))
      .finally(() => setPolishing(false));
  }

  function save() {
    if (!form || saving) return;
    if (!form.name.trim()) {
      toast.error(t("회사명을 입력해주세요.", "Please enter the company name.", "请输入公司名称。", "Vui lòng nhập tên công ty.", "会社名を入力してください。", "Masukkan nama perusahaan."));
      return;
    }
    // 신규 등록은 백엔드에서 회사명+업종이 필수다(생성 조건).
    if (isCreate && !form.industry) {
      toast.error(t("업종을 선택해주세요. 회사 등록에 필요해요.", "Please select an industry. It's required to register.", "请选择行业。注册公司需要填写。", "Vui lòng chọn ngành. Cần thiết để đăng ký công ty.", "業種を選択してください。会社登録に必要です。", "Pilih industri. Diperlukan untuk mendaftar perusahaan."));
      return;
    }
    const creating = isCreate;
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
      officePhotoImageData: officePhotos.length > 0 ? JSON.stringify(officePhotos) : null,
      businessRegistrationDocumentData: bizDoc,
      fourInsuranceSubscriberListData: insDoc
    })
      .then(() => {
        toast.success(creating ? t("회사를 등록했어요", "Company registered", "已注册公司", "Đã đăng ký công ty", "会社を登録しました", "Perusahaan terdaftar") : t("회사 정보를 저장했어요", "Company info saved", "已保存公司信息", "Đã lưu thông tin công ty", "会社情報を保存しました", "Info perusahaan tersimpan"));
        // 생성 직후에는 org id·인증 요약·소유자 권한이 새로 생기므로 다시 불러온다.
        if (creating) load();
      })
      .catch(() => toast.error(creating ? t("회사 등록에 실패했어요. 잠시 후 다시 시도해주세요.", "Couldn't register the company. Please try again shortly.", "注册公司失败。请稍后再试。", "Không thể đăng ký công ty. Vui lòng thử lại sau.", "会社登録に失敗しました。しばらくして再度お試しください。", "Gagal mendaftar perusahaan. Coba lagi nanti.") : t("저장에 실패했어요. 잠시 후 다시 시도해주세요.", "Couldn't save. Please try again shortly.", "保存失败。请稍后再试。", "Không thể lưu. Vui lòng thử lại sau.", "保存に失敗しました。しばらくして再度お試しください。", "Gagal menyimpan. Coba lagi nanti.")))
      .finally(() => setSaving(false));
  }

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{isCreate ? t("회사 등록", "Register company", "注册公司", "Đăng ký công ty", "会社登録", "Daftar perusahaan") : t("회사 프로필", "Company profile", "公司资料", "Hồ sơ công ty", "会社プロフィール", "Profil perusahaan")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{isCreate ? t("회사를 먼저 등록하면 공고 등록·지원자 관리를 시작할 수 있어요.", "Register your company to start posting jobs and managing applicants.", "先注册公司即可开始发布职位和管理申请者。", "Đăng ký công ty để bắt đầu đăng tin và quản lý ứng viên.", "会社を登録すると求人掲載・応募者管理を始められます。", "Daftarkan perusahaan untuk mulai memasang lowongan dan mengelola pelamar.") : t("지원자에게 보이는 우리 회사 정보예요.", "This is how applicants see your company.", "这是申请者看到的公司信息。", "Đây là thông tin công ty mà ứng viên nhìn thấy.", "応募者に表示される会社情報です。", "Ini info perusahaan yang dilihat pelamar.")}</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" && isCreate ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B46E8] text-white"><Buildings className="h-5 w-5" weight="fill" /></span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-[#191F28]">{t("아직 소속된 회사가 없어요", "You don't belong to a company yet", "您还没有所属公司", "Bạn chưa thuộc công ty nào", "まだ所属会社がありません", "Anda belum tergabung di perusahaan")}</p>
              <p className="mt-0.5 break-keep text-[12.5px] text-[#4E5968]">{t("회사명과 업종만 입력하면 바로 등록돼요. 등록하면 이 회사의 관리자(OWNER)가 됩니다.", "Just enter the company name and industry to register. You'll become the company OWNER.", "只需填写公司名称和行业即可注册。注册后您将成为该公司管理员（OWNER）。", "Chỉ cần nhập tên công ty và ngành để đăng ký. Bạn sẽ trở thành quản trị viên (OWNER) của công ty.", "会社名と業種を入力するだけで登録されます。登録するとこの会社の管理者（OWNER）になります。", "Cukup masukkan nama dan industri untuk mendaftar. Anda akan menjadi admin (OWNER) perusahaan.")}</p>
            </div>
          </div>
        ) : null}

        {status === "ready" && form ? (
          <>
            {/* 프로필 완성도 — 미완성일 때만 */}
            {completeness < 100 ? (
              <div className="rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13.5px] font-bold text-[#191F28]">{t("프로필 완성도", "Profile completeness", "资料完整度", "Mức hoàn thiện hồ sơ", "プロフィール完成度", "Kelengkapan profil")}</p>
                  <span className="text-[18px] font-black tabular-nums text-[#0B46E8]">{completeness}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${completeness}%` }} />
                </div>
                <p className="mt-2 break-keep text-[12px] text-[#8B95A1]">{t("로고·소개·업종·규모·주소를 채우면 지원자에게 더 신뢰를 줘요.", "Filling in logo, intro, industry, size, and address builds more trust with applicants.", "填写标志、简介、行业、规模和地址能赢得申请者更多信任。", "Điền logo, giới thiệu, ngành, quy mô và địa chỉ giúp tạo niềm tin với ứng viên.", "ロゴ・紹介・業種・規模・住所を埋めると応募者からの信頼が高まります。", "Mengisi logo, intro, industri, ukuran, dan alamat menambah kepercayaan pelamar.")}</p>
              </div>
            ) : null}

            {/* 로고 · 사무실 사진 */}
            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#191F28]">{t("회사 로고", "Company logo", "公司标志", "Logo công ty", "会社ロゴ", "Logo perusahaan")}</h2>
              <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("정사각형 이미지를 권장해요.", "A square image is recommended.", "建议使用正方形图片。", "Nên dùng ảnh vuông.", "正方形の画像を推奨します。", "Disarankan gambar persegi.")}</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
              <div className="mt-3 flex items-center gap-4">
                {logo ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F5F6F8]">
                    <Image src={logo} alt={t("회사 로고", "Company logo", "公司标志", "Logo công ty", "会社ロゴ", "Logo perusahaan")} fill sizes="80px" className="object-cover" unoptimized />
                    <button type="button" onClick={() => setLogo(null)} aria-label={t("로고 삭제", "Delete logo", "删除标志", "Xóa logo", "ロゴ削除", "Hapus logo")} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B1227]/70 text-white">
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] text-[#B0B8C1] transition hover:border-[#B0C4F5]">
                    <ImageSquare className="h-6 w-6" />
                  </button>
                )}
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploading === "logo"} className="rounded-xl bg-[#F2F4F6] px-3.5 py-2 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  {uploading === "logo" ? t("처리 중…", "Processing…", "处理中…", "Đang xử lý…", "処理中…", "Memproses…") : logo ? t("로고 변경", "Change logo", "更换标志", "Đổi logo", "ロゴ変更", "Ganti logo") : t("로고 올리기", "Upload logo", "上传标志", "Tải logo", "ロゴを追加", "Unggah logo")}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-bold text-[#191F28]">{t("관련 사진", "Photos", "相关照片", "Ảnh liên quan", "関連写真", "Foto terkait")}</h2>
                  <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t(`사무실·팀·제품 등 · 최대 ${MAX_OFFICE_PHOTOS}장 · ${officePhotos.length}장 등록됨`, `Office, team, product, etc. · up to ${MAX_OFFICE_PHOTOS} · ${officePhotos.length} added`, `办公室·团队·产品等 · 最多${MAX_OFFICE_PHOTOS}张 · 已添加${officePhotos.length}张`, `Văn phòng, nhóm, sản phẩm... · tối đa ${MAX_OFFICE_PHOTOS} · đã thêm ${officePhotos.length}`, `オフィス・チーム・製品など · 最大${MAX_OFFICE_PHOTOS}枚 · ${officePhotos.length}枚登録済み`, `Kantor, tim, produk, dll. · maks ${MAX_OFFICE_PHOTOS} · ${officePhotos.length} ditambahkan`)}</p>
                </div>
                <input ref={officeInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickOffice} />
                <button type="button" onClick={() => officeInputRef.current?.click()} disabled={uploading === "office" || officePhotos.length >= MAX_OFFICE_PHOTOS} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#F2F4F6] px-3 py-2 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  <Plus className="h-4 w-4" weight="bold" /> {uploading === "office" ? t("처리 중…", "Processing…", "处理中…", "Đang xử lý…", "処理中…", "Memproses…") : t("사진 추가", "Add photo", "添加照片", "Thêm ảnh", "写真追加", "Tambah foto")}
                </button>
              </div>
              {officePhotos.length ? (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {officePhotos.map((src, i) => (
                    <div key={`${i}-${src.slice(0, 24)}`} className="relative aspect-square overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
                      <Image src={src} alt={t(`관련 사진 ${i + 1}`, `Photo ${i + 1}`, `照片 ${i + 1}`, `Ảnh ${i + 1}`, `写真 ${i + 1}`, `Foto ${i + 1}`)} fill sizes="90px" className="object-cover" unoptimized />
                      <button type="button" onClick={() => setOfficePhotos((prev) => prev.filter((_, j) => j !== i))} aria-label={t("사진 삭제", "Delete photo", "删除照片", "Xóa ảnh", "写真削除", "Hapus foto")} className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0B1227]/70 text-white">
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" onClick={() => officeInputRef.current?.click()} className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] py-8 text-[#B0B8C1] transition hover:border-[#B0C4F5]">
                  <ImageSquare className="h-7 w-7" />
                  <span className="text-[13px] font-semibold">{t("회사 관련 사진을 올려보세요", "Upload photos of your company", "上传公司相关照片", "Tải ảnh về công ty của bạn", "会社の関連写真をアップロード", "Unggah foto perusahaan Anda")}</span>
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#191F28]">{t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")}</h2>
              <div className="mt-4 flex flex-col gap-3.5">
                <Field label={t("회사명", "Company name", "公司名称", "Tên công ty", "会社名", "Nama perusahaan")}><Input value={form.name} onChange={(v) => set("name", v)} placeholder={t("회사명", "Company name", "公司名称", "Tên công ty", "会社名", "Nama perusahaan")} /></Field>
                <Field label={t("업종", "Industry", "行业", "Ngành", "業種", "Industri")}>
                  <Select value={form.industry} onChange={(v) => set("industry", v)}>
                    <option value="">{t("선택 안 함", "Not selected", "未选择", "Chưa chọn", "選択なし", "Tidak dipilih")}</option>
                    {industries.map((i) => (
                      <option key={i} value={i}>{partnerIndustryLabel(i)}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("회사 규모", "Company size", "公司规模", "Quy mô công ty", "会社規模", "Ukuran perusahaan")}>
                  <Select value={form.companySize} onChange={(v) => set("companySize", v)}>
                    <option value="">{t("선택 안 함", "Not selected", "未选择", "Chưa chọn", "選択なし", "Tidak dipilih")}</option>
                    {SIZE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{sizeOptLabel(t, o.value)}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat")}><Input value={form.officeAddress} onChange={(v) => set("officeAddress", v)} placeholder={t("예) 서울 강남구", "e.g. Gangnam-gu, Seoul", "例）首尔江南区", "vd) Gangnam-gu, Seoul", "例）ソウル江南区", "cth) Gangnam-gu, Seoul")} /></Field>
                <Field label={t("웹사이트", "Website", "网站", "Website", "ウェブサイト", "Website")}><Input value={form.website} onChange={(v) => set("website", v)} placeholder="https://" /></Field>
              </div>
            </section>

            <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-[#191F28]">{t("회사 소개", "About the company", "公司介绍", "Giới thiệu công ty", "会社紹介", "Tentang perusahaan")}</h2>
                <button
                  type="button"
                  onClick={polishDescription}
                  disabled={polishing}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-3 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#DFE7FB] disabled:opacity-50"
                >
                  {polishing ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />}
                  {polishing ? t("다듬는 중…", "Polishing…", "润色中…", "Đang trau chuốt…", "仕上げ中…", "Menyempurnakan…") : t("AI로 다듬기", "Polish with AI", "AI润色", "Trau chuốt bằng AI", "AIで仕上げ", "Sempurnakan dengan AI")}
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3.5">
                <Field label={t("한 줄 소개 · 설명", "Tagline · description", "一句话简介 · 描述", "Giới thiệu ngắn · mô tả", "一言紹介 · 説明", "Ringkasan · deskripsi")}><Textarea value={form.description} onChange={(v) => set("description", v)} placeholder={t("우리 회사를 소개해주세요. (간단히 적으면 AI가 다듬어드려요)", "Introduce your company. (Write briefly and AI will polish it.)", "介绍一下您的公司。（简单写下，AI会帮您润色）", "Giới thiệu công ty của bạn. (Viết ngắn gọn, AI sẽ trau chuốt.)", "会社を紹介してください。（簡単に書けばAIが仕上げます）", "Perkenalkan perusahaan Anda. (Tulis singkat, AI menyempurnakannya.)")} /></Field>
                <Field label={t("회사 자랑거리", "Company highlights", "公司亮点", "Điểm nổi bật", "会社の自慢", "Keunggulan perusahaan")}><Textarea value={form.strengths} onChange={(v) => set("strengths", v)} placeholder={t("복지·문화·성장 등 강점을 적어주세요.", "Describe strengths like benefits, culture, and growth.", "写下福利、文化、成长等优势。", "Nêu điểm mạnh như phúc lợi, văn hóa, cơ hội phát triển.", "福利厚生・文化・成長などの強みを書いてください。", "Tuliskan keunggulan seperti benefit, budaya, dan pertumbuhan.")} /></Field>
              </div>
            </section>

            {/* 회사 인증 — 서류 제출(사업자등록증·4대보험). 생성 직후엔 저장 후 노출 */}
            {!isCreate ? (
              <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-[#191F28]">{t("회사 인증", "Company verification", "公司认证", "Xác minh công ty", "会社認証", "Verifikasi perusahaan")}</h2>
                    <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("서류를 제출하면 인증 배지가 부여돼요. 지원자에게 신뢰를 줍니다.", "Submit documents to earn a verified badge. It builds trust with applicants.", "提交材料即可获得认证徽章，赢得申请者信任。", "Nộp giấy tờ để nhận huy hiệu xác minh. Tạo niềm tin với ứng viên.", "書類を提出すると認証バッジが付与されます。応募者に信頼を与えます。", "Kirim dokumen untuk mendapat lencana verifikasi. Menambah kepercayaan pelamar.")}</p>
                  </div>
                  {verification?.isApproved ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#E7F8EF] px-2.5 py-1 text-[12px] font-bold text-[#0A9B59]"><SealCheck className="h-4 w-4" weight="fill" /> {t("인증 완료", "Verified", "已认证", "Đã xác minh", "認証済み", "Terverifikasi")}</span>
                  ) : verification?.hasRequiredDocuments ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#FFF3E6] px-2.5 py-1 text-[12px] font-bold text-[#E8890C]">{t("심사 중", "In review", "审核中", "Đang xét", "審査中", "Ditinjau")}</span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-[12px] font-bold text-[#8B95A1]">{t("미인증", "Unverified", "未认证", "Chưa xác minh", "未認証", "Belum verifikasi")}</span>
                  )}
                </div>
                <input ref={bizInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickDoc("biz", e)} />
                <input ref={insInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickDoc("ins", e)} />
                <div className="mt-4 flex flex-col gap-2.5">
                  <DocRow label={t("사업자등록증", "Business registration", "营业执照", "Giấy phép kinh doanh", "事業者登録証", "Izin usaha")} value={bizDoc} busy={uploadingDoc === "biz"} onPick={() => bizInputRef.current?.click()} onRemove={() => setBizDoc(null)} />
                  <DocRow label={t("4대보험 가입자 명부", "Insurance subscriber list", "四大保险参保名单", "Danh sách bảo hiểm", "社会保険加入者名簿", "Daftar peserta asuransi")} value={insDoc} busy={uploadingDoc === "ins"} onPick={() => insInputRef.current?.click()} onRemove={() => setInsDoc(null)} />
                </div>
                {!verification?.isApproved ? (
                  <p className="mt-3 break-keep text-[12px] text-[#8B95A1]">{t("두 서류를 올리고 아래 ", "Upload both documents and press ", "上传两份材料并点击下方的", "Tải cả hai giấy tờ rồi nhấn ", "両方の書類をアップロードして下の", "Unggah kedua dokumen lalu tekan ")}<b className="font-bold text-[#4E5968]">{t("저장하기", "Save", "保存", "Lưu", "保存", "Simpan")}</b>{t("를 누르면 심사가 진행돼요. 서류는 이미지(사진·캡처)로 올려주세요.", " below to start the review. Upload documents as images (photos or screenshots).", "开始审核。请以图片（照片或截图）形式上传材料。", " bên dưới để bắt đầu xét duyệt. Vui lòng tải giấy tờ dưới dạng ảnh (ảnh chụp hoặc chụp màn hình).", "を押すと審査が始まります。書類は画像（写真・スクリーンショット）でアップロードしてください。", " di bawah untuk mulai peninjauan. Unggah dokumen sebagai gambar (foto atau tangkapan layar).")}</p>
                ) : null}
              </section>
            ) : null}

            <button
              type="button"
              onClick={save}
              disabled={saving || uploading !== null || uploadingDoc !== null}
              className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"
            >
              {saving ? (isCreate ? t("등록 중…", "Registering…", "注册中…", "Đang đăng ký…", "登録中…", "Mendaftar…") : t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")) : isCreate ? t("회사 등록하기", "Register company", "注册公司", "Đăng ký công ty", "会社を登録", "Daftar perusahaan") : t("저장하기", "Save", "保存", "Lưu", "保存", "Simpan")}
            </button>
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function DocRow({ label, value, busy, onPick, onRemove }: { label: string; value: string | null; busy: boolean; onPick: () => void; onRemove: () => void }) {
  const t = usePlatformT();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#EEF1F5] bg-[#FAFBFC] p-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${value ? "bg-[#E7F8EF] text-[#0A9B59]" : "bg-[#F2F4F6] text-[#B0B8C1]"}`}>
        {value ? <SealCheck className="h-5 w-5" weight="fill" /> : <FileArrowUp className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-[#191F28]">{label}</p>
        <p className={`mt-0.5 text-[12px] ${value ? "text-[#0A9B59]" : "text-[#8B95A1]"}`}>{busy ? t("처리 중…", "Processing…", "处理中…", "Đang xử lý…", "処理中…", "Memproses…") : value ? t("제출됨", "Submitted", "已提交", "Đã nộp", "提出済み", "Terkirim") : t("미제출", "Not submitted", "未提交", "Chưa nộp", "未提出", "Belum")}</p>
      </div>
      {value ? (
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onPick} disabled={busy} className="rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">{t("변경", "Change", "更换", "Đổi", "変更", "Ganti")}</button>
          <button type="button" onClick={onRemove} disabled={busy} className="rounded-lg px-2 py-1.5 text-[12px] font-bold text-[#F04452] transition hover:bg-[#FDECEE] disabled:opacity-50">{t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}</button>
        </div>
      ) : (
        <button type="button" onClick={onPick} disabled={busy} className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DFE7FB] disabled:opacity-50">{t("올리기", "Upload", "上传", "Tải lên", "アップロード", "Unggah")}</button>
      )}
    </div>
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
