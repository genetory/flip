"use client";

// 파트너 공고 작성/수정 — 신규(new) & 기존(id) 공용 폼. 서버 create/update/delete 연동.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CaretDown, Plus, X, ImageSquare, Sparkle, CircleNotch } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { usePlatformT } from "../../../lib/i18n";
import { convertImageFileToWebpDataUrl, estimateDataUrlBytes } from "../../../lib/image-upload";
import {
  getMyPartnerPositionById,
  createMyPartnerPosition,
  updateMyPartnerPosition,
  aiDraftPositionContent,
  type PartnerPosition
} from "../../../lib/member-profile-client";

type PositionStatus = PartnerPosition["status"];
type EmploymentType = PartnerPosition["employmentType"];
type WorkType = NonNullable<PartnerPosition["workType"]>;

const EMPLOYMENT_OPTS: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "INTERN", label: "인턴" },
  { value: "PART_TIME", label: "파트타임" },
  { value: "UNPAID_INTERN", label: "무급 인턴" }
];
const WORKTYPE_OPTS: { value: WorkType; label: string }[] = [
  { value: "On-site", label: "출근" },
  { value: "Hybrid", label: "하이브리드" },
  { value: "Remote", label: "재택" }
];

type Form = {
  title: string;
  employmentType: EmploymentType;
  workType: "" | WorkType;
  workLocation: string;
  startDate: string;
  hiringCount: string;
  workingHours: string;
  preferredJobRole: string;
  mainResponsibilities: string;
  requiredQualifications: string;
  preferredQualifications: string;
  hiringProcess: string;
  additionalNotes: string;
  thumbnailImages: string[];
  mockInterviewIntent: string;
  mockInterviewQuestions: string[];
};

const EMPTY: Form = {
  title: "",
  employmentType: "FULL_TIME",
  workType: "",
  workLocation: "",
  startDate: "",
  hiringCount: "",
  workingHours: "",
  preferredJobRole: "",
  mainResponsibilities: "",
  requiredQualifications: "",
  preferredQualifications: "",
  hiringProcess: "",
  additionalNotes: "",
  thumbnailImages: [],
  mockInterviewIntent: "",
  mockInterviewQuestions: []
};

function fromPosition(p: PartnerPosition): Form {
  return {
    title: p.title ?? "",
    employmentType: p.employmentType,
    workType: p.workType ?? "",
    workLocation: p.workLocation ?? "",
    startDate: p.startDate ? p.startDate.slice(0, 10) : "",
    hiringCount: p.hiringCount != null ? String(p.hiringCount) : "",
    workingHours: p.workingHours ?? "",
    preferredJobRole: p.preferredJobRole ?? "",
    mainResponsibilities: p.mainResponsibilities ?? "",
    requiredQualifications: p.requiredQualifications ?? "",
    preferredQualifications: p.preferredQualifications ?? "",
    hiringProcess: p.hiringProcess ?? "",
    additionalNotes: p.additionalNotes ?? "",
    thumbnailImages: Array.isArray(p.thumbnailImages) ? p.thumbnailImages : [],
    mockInterviewIntent: p.mockInterviewIntent ?? "",
    mockInterviewQuestions: Array.isArray(p.mockInterviewQuestions) ? p.mockInterviewQuestions : []
  };
}

function toInput(f: Form) {
  const num = Number(f.hiringCount);
  return {
    title: f.title.trim(),
    employmentType: f.employmentType,
    workType: (f.workType || undefined) as WorkType | undefined,
    workLocation: f.workLocation.trim() || undefined,
    startDate: f.startDate || null,
    hiringCount: f.hiringCount && Number.isFinite(num) ? num : undefined,
    workingHours: f.workingHours.trim() || undefined,
    preferredJobRole: f.preferredJobRole.trim() || undefined,
    mainResponsibilities: f.mainResponsibilities.trim() || undefined,
    requiredQualifications: f.requiredQualifications.trim() || undefined,
    preferredQualifications: f.preferredQualifications.trim() || undefined,
    hiringProcess: f.hiringProcess.trim() || undefined,
    additionalNotes: f.additionalNotes.trim() || undefined,
    thumbnailImages: f.thumbnailImages,
    mockInterviewIntent: f.mockInterviewIntent.trim() || null,
    mockInterviewQuestions: f.mockInterviewQuestions.map((q) => q.trim()).filter(Boolean)
  };
}

export function PartnerPositionEditorScreen({ positionId }: { positionId?: string }) {
  const router = useRouter();
  const toast = useTalentPopup();
  const t = usePlatformT();
  const isEdit = Boolean(positionId);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(isEdit ? "loading" : "ready");
  const [form, setForm] = useState<Form>(EMPTY);
  const [posStatus, setPosStatus] = useState<PositionStatus>("DRAFT");
  const [initialStatus, setInitialStatus] = useState<PositionStatus>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  function load() {
    if (!positionId) return;
    setStatus("loading");
    getMyPartnerPositionById(positionId)
      .then((p) => {
        setForm(fromPosition(p));
        setPosStatus(p.status);
        setInitialStatus(p.status);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    if (isEdit) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // AI 초안 — 제목·직무로 주요 업무/자격 요건/우대 사항을 생성해 채운다.
  function aiDraft() {
    if (drafting) return;
    if (!form.title.trim()) {
      toast.error(t("공고 제목을 먼저 입력해주세요.", "Please enter the posting title first.", "请先输入职位标题。", "Vui lòng nhập tiêu đề tin trước.", "先に求人タイトルを入力してください。", "Masukkan judul lowongan dulu."));
      return;
    }
    const hasContent = form.mainResponsibilities.trim() || form.requiredQualifications.trim() || form.preferredQualifications.trim();
    if (hasContent && typeof window !== "undefined" && !window.confirm(t("주요 업무·자격 요건·우대 사항을 AI 초안으로 덮어쓸까요?", "Overwrite responsibilities, requirements and preferred qualifications with an AI draft?", "用 AI 草稿覆盖主要工作、任职要求和优先条件吗？", "Ghi đè công việc chính, yêu cầu và ưu tiên bằng bản nháp AI?", "主な業務・応募要件・優遇事項をAI下書きで上書きしますか？", "Timpa tugas utama, syarat, dan nilai plus dengan draf AI?"))) return;
    setDrafting(true);
    const empLabel = EMPLOYMENT_OPTS.find((o) => o.value === form.employmentType)?.label;
    aiDraftPositionContent({ title: form.title.trim(), jobRole: form.preferredJobRole.trim() || undefined, employmentType: empLabel })
      .then((d) => {
        setForm((f) => ({
          ...f,
          mainResponsibilities: d.mainResponsibilities || f.mainResponsibilities,
          requiredQualifications: d.requiredQualifications || f.requiredQualifications,
          preferredQualifications: d.preferredQualifications || f.preferredQualifications
        }));
        toast.success(t("AI 초안을 채웠어요. 검토 후 수정하세요.", "AI draft added. Review and edit it.", "AI 草稿已填入。请检查后修改。", "Đã điền bản nháp AI. Hãy xem lại và sửa.", "AI下書きを入力しました。確認して修正してください。", "Draf AI terisi. Tinjau dan ubah."));
      })
      .catch(() => toast.error(t("초안 생성에 실패했어요. 잠시 후 다시 시도해주세요.", "Couldn't generate a draft. Please try again later.", "草稿生成失败，请稍后再试。", "Không tạo được bản nháp. Vui lòng thử lại sau.", "下書きの生成に失敗しました。しばらくして再度お試しください。", "Gagal membuat draf. Coba lagi nanti.")))
      .finally(() => setDrafting(false));
  }

  // 공고 사진 업로드 — WebP 압축 후 data URL(서버가 업로드 처리). 최대 5장.
  async function onPickImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    if (files.length === 0) return;
    if (files.some((f) => f.size > 20 * 1024 * 1024)) {
      toast.error(t("원본 파일은 20MB 이하만 올릴 수 있어요.", "Original files must be 20MB or less.", "原始文件不能超过 20MB。", "Tệp gốc phải từ 20MB trở xuống.", "元のファイルは20MB以下のみアップロードできます。", "File asli maksimal 20MB."));
      return;
    }
    const room = 5 - form.thumbnailImages.length;
    if (room <= 0) {
      toast.error(t("사진은 최대 5장까지 올릴 수 있어요.", "You can upload up to 5 photos.", "最多可上传 5 张照片。", "Bạn có thể tải lên tối đa 5 ảnh.", "写真は最大5枚までアップロードできます。", "Maksimal unggah 5 foto."));
      return;
    }
    setUploadingImg(true);
    try {
      const images = await Promise.all(files.slice(0, room).map((f) => convertImageFileToWebpDataUrl(f)));
      const ok = images.filter((d) => estimateDataUrlBytes(d) <= 5 * 1024 * 1024);
      if (ok.length < images.length) toast.error(t("일부 이미지는 용량이 커서 제외했어요.", "Some images were skipped because they were too large.", "部分图片因过大已被排除。", "Một số ảnh bị bỏ qua vì quá lớn.", "一部の画像はサイズが大きく除外しました。", "Beberapa gambar dilewati karena terlalu besar."));
      if (ok.length) set("thumbnailImages", [...form.thumbnailImages, ...ok].slice(0, 5));
    } catch {
      toast.error(t("이미지를 처리하지 못했어요.", "Couldn't process the image.", "无法处理图片。", "Không xử lý được ảnh.", "画像を処理できませんでした。", "Gagal memproses gambar."));
    } finally {
      setUploadingImg(false);
    }
  }

  // 저장 — 편집: 내용 저장 후 게시 상태가 바뀌었으면 상태도 반영(백엔드는 둘을 동시에
  // 받지 않아 순차 전송). 신규: 등록 시점 상태를 함께 지정.
  async function save(newStatus?: PositionStatus) {
    if (saving) return;
    if (!form.title.trim()) {
      toast.error(t("공고 제목을 입력해주세요.", "Please enter the posting title.", "请输入职位标题。", "Vui lòng nhập tiêu đề tin.", "求人タイトルを入力してください。", "Masukkan judul lowongan."));
      return;
    }
    setSaving(true);
    const body = toInput(form);
    try {
      if (isEdit) {
        await updateMyPartnerPosition(positionId as string, body);
        if (posStatus !== initialStatus) {
          await updateMyPartnerPosition(positionId as string, { status: posStatus });
        }
        toast.success(t("공고를 저장했어요", "Posting saved", "职位已保存", "Đã lưu tin", "求人を保存しました", "Lowongan disimpan"));
      } else {
        await createMyPartnerPosition({ ...body, status: newStatus ?? "DRAFT" });
        toast.success(t("공고를 등록했어요", "Posting created", "职位已提交", "Đã tạo tin", "求人を登録しました", "Lowongan dibuat"));
      }
      router.push(isEdit ? `${partnerRoutes.positions}/${positionId}` : partnerRoutes.positions);
    } catch {
      toast.error(t("저장에 실패했어요. 잠시 후 다시 시도해주세요.", "Couldn't save. Please try again later.", "保存失败，请稍后再试。", "Không lưu được. Vui lòng thử lại sau.", "保存に失敗しました。しばらくして再度お試しください。", "Gagal menyimpan. Coba lagi nanti."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" ? (
        <div className="flex flex-col gap-10">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{isEdit ? t("공고 수정", "Edit posting", "编辑职位", "Sửa tin", "求人を編集", "Ubah lowongan") : t("새 공고 등록", "New posting", "创建职位", "Tạo tin mới", "求人を新規登録", "Lowongan baru")}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("채용하려는 포지션 정보를 작성해요.", "Fill in the details of the position you're hiring for.", "填写你要招聘的职位信息。", "Điền thông tin vị trí bạn muốn tuyển.", "採用したいポジションの情報を入力します。", "Isi detail posisi yang Anda rekrut.")}</p>
          </div>

          {/* 기본 정보 */}
          <section>
            <SectionHeader title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")} />
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex flex-col gap-3.5">
              {/* 공고 사진 — 맨 위 */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-normal text-[#4E5968]">{t("공고 사진 · 최대 5장", "Photos · up to 5", "职位照片 · 最多 5 张", "Ảnh tin · tối đa 5", "求人写真 · 最大5枚", "Foto · maks 5")} {form.thumbnailImages.length ? t(`· ${form.thumbnailImages.length}장`, `· ${form.thumbnailImages.length}`, `· ${form.thumbnailImages.length}张`, `· ${form.thumbnailImages.length}`, `· ${form.thumbnailImages.length}枚`, `· ${form.thumbnailImages.length}`) : ""}</span>
                  <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
                  {form.thumbnailImages.length ? (
                    <button type="button" onClick={() => imgRef.current?.click()} disabled={uploadingImg || form.thumbnailImages.length >= 5} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                      <Plus className="h-3.5 w-3.5" weight="bold" /> {uploadingImg ? t("처리 중…", "Processing…", "处理中…", "Đang xử lý…", "処理中…", "Memproses…") : t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
                    </button>
                  ) : null}
                </div>
                {form.thumbnailImages.length ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {form.thumbnailImages.map((src, i) => (
                      <div key={`${i}-${src.slice(0, 24)}`} className="relative aspect-square overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
                        <Image src={src} alt={t(`공고 사진 ${i + 1}`, `Photo ${i + 1}`, `职位照片 ${i + 1}`, `Ảnh ${i + 1}`, `求人写真 ${i + 1}`, `Foto ${i + 1}`)} fill sizes="90px" className="object-cover" unoptimized />
                        <button type="button" onClick={() => set("thumbnailImages", form.thumbnailImages.filter((_, j) => j !== i))} aria-label={t("사진 삭제", "Delete photo", "删除照片", "Xóa ảnh", "写真を削除", "Hapus foto")} className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0B1227]/70 text-white">
                          <X className="h-3 w-3" weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => imgRef.current?.click()} disabled={uploadingImg} className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] py-7 text-[#B0B8C1] transition hover:border-[#B0C4F5] disabled:opacity-50">
                    <ImageSquare className="h-6 w-6" />
                    <span className="text-[12.5px] font-semibold">{uploadingImg ? t("처리 중…", "Processing…", "处理中…", "Đang xử lý…", "処理中…", "Memproses…") : t("공고에 보여줄 사진을 올려보세요", "Upload photos to show on the posting", "上传要在职位上展示的照片", "Tải ảnh để hiển thị trên tin", "求人に表示する写真をアップロード", "Unggah foto untuk lowongan")}</span>
                  </button>
                )}
              </div>

              <Field label={t("공고 제목", "Posting title", "职位标题", "Tiêu đề tin", "求人タイトル", "Judul lowongan")}><Input value={form.title} onChange={(v) => set("title", v)} placeholder={t("예) 백엔드 엔지니어 (신입/경력)", "e.g. Backend Engineer (entry/experienced)", "例) 后端工程师（应届/有经验）", "VD) Kỹ sư Backend (mới/có kinh nghiệm)", "例) バックエンドエンジニア（新卒/経験者）", "Cth) Backend Engineer (fresh/berpengalaman)")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("고용 형태", "Employment type", "雇佣类型", "Loại hình", "雇用形態", "Jenis kerja")}>
                  <Select value={form.employmentType} onChange={(v) => set("employmentType", v as EmploymentType)}>
                    {EMPLOYMENT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </Field>
                <Field label={t("근무 형태", "Work type", "工作方式", "Hình thức", "勤務形態", "Cara kerja")}>
                  <Select value={form.workType} onChange={(v) => set("workType", v as "" | WorkType)}>
                    <option value="">{t("선택 안 함", "Not set", "不选择", "Không chọn", "選択なし", "Tidak dipilih")}</option>
                    {WORKTYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label={t("근무지", "Location", "工作地点", "Nơi làm việc", "勤務地", "Lokasi")}><Input value={form.workLocation} onChange={(v) => set("workLocation", v)} placeholder={t("예) 서울 강남구", "e.g. Gangnam-gu, Seoul", "例) 首尔江南区", "VD) Gangnam-gu, Seoul", "例) ソウル江南区", "Cth) Gangnam-gu, Seoul")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("채용 인원", "Openings", "招聘人数", "Số lượng", "採用人数", "Jumlah")}><Input value={form.hiringCount} onChange={(v) => set("hiringCount", v.replace(/[^0-9]/g, ""))} placeholder={t("예) 2", "e.g. 2", "例) 2", "VD) 2", "例) 2", "Cth) 2")} inputMode="numeric" /></Field>
                <Field label={t("입사 예정일", "Start date", "入职日期", "Ngày bắt đầu", "入社予定日", "Tanggal mulai")}><Input value={form.startDate} onChange={(v) => set("startDate", v)} type="date" /></Field>
              </div>
              <Field label={t("근무 시간", "Work hours", "工作时间", "Giờ làm việc", "勤務時間", "Jam kerja")}><Input value={form.workingHours} onChange={(v) => set("workingHours", v)} placeholder={t("예) 주 5일 · 09:00~18:00", "e.g. 5 days/week · 09:00–18:00", "例) 每周 5 天 · 09:00~18:00", "VD) 5 ngày/tuần · 09:00~18:00", "例) 週5日 · 09:00~18:00", "Cth) 5 hari/minggu · 09:00~18:00")} /></Field>
              <Field label={t("선호 직무", "Preferred role", "偏好岗位", "Vị trí ưu tiên", "希望職種", "Peran diutamakan")}><Input value={form.preferredJobRole} onChange={(v) => set("preferredJobRole", v)} placeholder={t("예) 서버 개발", "e.g. Server development", "例) 服务器开发", "VD) Phát triển server", "例) サーバー開発", "Cth) Pengembangan server")} /></Field>
            </div>
            </div>
          </section>

          {/* 상세 내용 */}
          <section>
            <SectionHeader title={t("상세 내용", "Details", "详细内容", "Nội dung chi tiết", "詳細内容", "Detail")} />
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="mb-3.5 flex items-center justify-between gap-3 rounded-xl bg-[#F5F8FF] px-3.5 py-3">
              <p className="min-w-0 flex-1 break-keep text-[12.5px] text-[#4E5968]">{t("제목·직무만 있으면 AI가 주요 업무·자격 요건·우대 사항 초안을 만들어드려요.", "With just a title and role, AI drafts the responsibilities, requirements and preferred qualifications.", "只需标题和岗位，AI 就能为你生成主要工作、任职要求和优先条件的草稿。", "Chỉ cần tiêu đề và vị trí, AI sẽ soạn công việc chính, yêu cầu và ưu tiên.", "タイトルと職種だけでAIが主な業務・応募要件・優遇事項の下書きを作成します。", "Cukup judul dan peran, AI membuat draf tugas, syarat, dan nilai plus.")}</p>
              <button
                type="button"
                onClick={aiDraft}
                disabled={drafting}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"
              >
                {drafting ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />}
                {drafting ? t("생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…") : t("AI로 초안 작성", "AI draft", "AI 起草", "Nháp bằng AI", "AIで下書き", "Draf AI")}
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              <Field label={t("주요 업무", "Responsibilities", "主要工作", "Công việc chính", "主な業務", "Tugas utama")}><Textarea value={form.mainResponsibilities} onChange={(v) => set("mainResponsibilities", v)} placeholder={t("담당하게 될 주요 업무를 적어주세요.", "Describe the main responsibilities.", "请填写将负责的主要工作。", "Mô tả các công việc chính sẽ đảm nhận.", "担当する主な業務を記入してください。", "Jelaskan tugas utama yang diemban.")} /></Field>
              <Field label={t("자격 요건", "Requirements", "任职要求", "Yêu cầu", "応募要件", "Syarat")}><Textarea value={form.requiredQualifications} onChange={(v) => set("requiredQualifications", v)} placeholder={t("필수 자격 요건을 적어주세요.", "List the required qualifications.", "请填写必备任职要求。", "Liệt kê các yêu cầu bắt buộc.", "必須の応募要件を記入してください。", "Cantumkan syarat wajib.")} /></Field>
              <Field label={t("우대 사항", "Preferred", "优先条件", "Ưu tiên", "優遇事項", "Nilai plus")}><Textarea value={form.preferredQualifications} onChange={(v) => set("preferredQualifications", v)} placeholder={t("있으면 좋은 경험/역량을 적어주세요.", "List nice-to-have experience or skills.", "请填写加分的经验/能力。", "Liệt kê kinh nghiệm/kỹ năng nên có.", "あると望ましい経験・スキルを記入してください。", "Cantumkan pengalaman/skill yang jadi nilai plus.")} /></Field>
              <Field label={t("채용 절차", "Hiring process", "招聘流程", "Quy trình tuyển", "採用プロセス", "Alur rekrut")}><Textarea value={form.hiringProcess} onChange={(v) => set("hiringProcess", v)} placeholder={t("예) 서류 → 1차 면접 → 최종 면접", "e.g. Resume → 1st interview → Final interview", "例) 简历 → 一面 → 终面", "VD) Hồ sơ → Phỏng vấn 1 → Phỏng vấn cuối", "例) 書類 → 一次面接 → 最終面接", "Cth) Berkas → Wawancara 1 → Wawancara akhir")} /></Field>
              <Field label={t("추가 안내", "Additional notes", "补充说明", "Ghi chú thêm", "追加案内", "Catatan tambahan")}><Textarea value={form.additionalNotes} onChange={(v) => set("additionalNotes", v)} placeholder={t("복지, 근무 환경 등 추가로 알리고 싶은 내용", "Benefits, work environment, or anything else to share", "福利、工作环境等想补充告知的内容", "Phúc lợi, môi trường làm việc, hoặc điều khác muốn chia sẻ", "福利厚生や勤務環境など追加で伝えたい内容", "Tunjangan, lingkungan kerja, atau hal lain")} /></Field>
            </div>
            </div>
          </section>

          {/* 모의 면접 */}
          <section>
            <SectionHeader title={t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} />
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <p className="mb-3 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("지원자가 지원 전에 이 포지션 모의 면접을 연습하고 AI 피드백을 받을 수 있어요. 면접에서 보려는 포인트만 적으면 AI가 질문을 만들고, 대표 질문을 직접 넣어도 됩니다.", "Applicants can practice this position's mock interview and get AI feedback before applying. Just note what you want to assess and AI writes the questions, or add your own key questions.", "申请者可在申请前练习本职位的模拟面试并获得 AI 反馈。只需写下你想考察的要点，AI 就会生成问题，你也可以自行添加代表性问题。", "Ứng viên có thể luyện phỏng vấn thử vị trí này và nhận phản hồi AI trước khi ứng tuyển. Chỉ cần ghi điểm muốn đánh giá, AI sẽ tạo câu hỏi, hoặc bạn tự thêm câu hỏi.", "応募者は応募前にこのポジションの模擬面接を練習しAIフィードバックを受けられます。見たいポイントを書けばAIが質問を作成し、代表質問を直接入れることもできます。", "Pelamar bisa berlatih wawancara simulasi posisi ini dan mendapat masukan AI sebelum melamar. Cukup tulis poin yang ingin dinilai, AI membuat pertanyaan, atau tambahkan sendiri.")}</p>
              <div className="flex flex-col gap-3.5">
                <Field label={t("면접에서 보려는 포인트", "What to assess", "想考察的要点", "Điểm muốn đánh giá", "見たいポイント", "Poin penilaian")}>
                  <Textarea value={form.mockInterviewIntent} onChange={(v) => set("mockInterviewIntent", v)} placeholder={t("예) 문제를 정의하고 우선순위를 정하는 방식, 협업 경험, 고객 관점 사고", "e.g. How they frame problems and set priorities, collaboration experience, customer-centric thinking", "例) 定义问题和排定优先级的方式、协作经验、客户视角思维", "VD) Cách xác định vấn đề và ưu tiên, kinh nghiệm hợp tác, tư duy hướng khách hàng", "例) 問題を定義し優先順位を決める方法、協働経験、顧客視点の思考", "Cth) Cara mendefinisikan masalah dan prioritas, pengalaman kolaborasi, pola pikir berorientasi pelanggan")} />
                </Field>
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-normal text-[#4E5968]">{t("대표 질문", "Key questions", "代表性问题", "Câu hỏi chính", "代表質問", "Pertanyaan utama")} <span className="text-[#B0B8C1]">{t("(선택 · 없으면 AI가 생성)", "(optional · AI generates if empty)", "（可选 · 留空则由 AI 生成）", "(tùy chọn · để trống thì AI tạo)", "（任意 · 空欄ならAIが生成）", "(opsional · kosong maka AI buat)")}</span></span>
                  <div className="flex flex-col gap-2">
                    {form.mockInterviewQuestions.map((q, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input value={q} onChange={(e) => set("mockInterviewQuestions", form.mockInterviewQuestions.map((x, j) => (j === i ? e.target.value : x)))} placeholder={t(`질문 ${i + 1}`, `Question ${i + 1}`, `问题 ${i + 1}`, `Câu hỏi ${i + 1}`, `質問 ${i + 1}`, `Pertanyaan ${i + 1}`)} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
                        <button type="button" onClick={() => set("mockInterviewQuestions", form.mockInterviewQuestions.filter((_, j) => j !== i))} aria-label={t("질문 삭제", "Delete question", "删除问题", "Xóa câu hỏi", "質問を削除", "Hapus pertanyaan")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {form.mockInterviewQuestions.length < 10 ? (
                      <button type="button" onClick={() => set("mockInterviewQuestions", [...form.mockInterviewQuestions, ""])} className="inline-flex w-fit items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]"><Plus className="h-3.5 w-3.5" weight="bold" /> {t("질문 추가", "Add question", "添加问题", "Thêm câu hỏi", "質問を追加", "Tambah pertanyaan")}</button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 액션 — 우측 하단 */}
          <div className="flex flex-wrap justify-end gap-2.5">
            {isEdit ? (
              <button type="button" onClick={() => save()} disabled={saving} className="inline-flex h-[46px] min-w-[120px] items-center justify-center rounded-2xl bg-[#0B46E8] px-6 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                {saving ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장하기", "Save", "保存", "Lưu", "保存", "Simpan")}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => save("DRAFT")} disabled={saving} className="inline-flex h-[46px] min-w-[110px] items-center justify-center rounded-2xl bg-[#F2F4F6] px-5 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">
                  {t("임시저장", "Save draft", "存草稿", "Lưu nháp", "下書き保存", "Simpan draf")}
                </button>
                <button type="button" onClick={() => save("PENDING_REVIEW")} disabled={saving} className="inline-flex h-[46px] min-w-[120px] items-center justify-center rounded-2xl bg-[#0B46E8] px-6 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {saving ? t("등록 중…", "Submitting…", "提交中…", "Đang gửi…", "登録中…", "Mengirim…") : t("검토 요청하기", "Request review", "申请审核", "Yêu cầu duyệt", "審査を依頼", "Minta tinjauan")}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </PartnerAppShell>
  );
}

// 섹션 타이틀 — 카드 밖. 다른 섹션 페이지와 동일한 스타일.
function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-normal text-[#4E5968]">{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder, type, inputMode }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: "numeric" }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode} className="w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none [color-scheme:light] placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
  );
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-lg bg-[#F5F6F8] py-2.5 pl-3.5 pr-9 text-[14px] text-[#191F28] outline-none [color-scheme:light] focus:ring-2 focus:ring-[#0B46E8]/30">
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
    </div>
  );
}
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full resize-none rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
  );
}
