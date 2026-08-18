"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  deleteMyCandidateDocument,
  getMyCandidateProfile,
  uploadMyCandidateDocument,
  type CandidateDocumentKind,
  type MyCandidateProfile
} from "../../lib/member-profile-client";

type DocSlot = {
  kind: CandidateDocumentKind;
  title: string;
  hint: string;
  accept: string;
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPT_DOCUMENT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ACCEPT_DOCUMENT_OR_IMAGE = `${ACCEPT_DOCUMENT},image/jpeg,image/png,image/webp`;
const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";

type Copy = {
  title: string;
  subtitle: string;
  loading: string;
  empty: string;
  upload: string;
  replace: string;
  remove: string;
  uploading: string;
  removing: string;
  download: string;
  oversize: string;
  uploadFailed: string;
  removeFailed: string;
  resumeTitle: string;
  resumeHint: string;
  coverLetterTitle: string;
  coverLetterHint: string;
  portfolioTitle: string;
  portfolioHint: string;
  passportTitle: string;
  passportHint: string;
};

const copyByLocale: Record<string, Copy> = {
  ko: {
    title: "이력서 및 문서",
    subtitle: "이력서 / 커버레터 / 포트폴리오 / 여권 사본을 업로드하세요. 매칭과 면접 단계에서 호스트 기업에 공유됩니다.",
    loading: "불러오는 중...",
    empty: "업로드된 파일 없음",
    upload: "파일 선택",
    replace: "파일 교체",
    remove: "삭제",
    uploading: "업로드 중...",
    removing: "삭제 중...",
    download: "다운로드",
    oversize: "파일 크기는 20MB 이하여야 합니다.",
    uploadFailed: "업로드에 실패했습니다.",
    removeFailed: "삭제에 실패했습니다.",
    resumeTitle: "이력서",
    resumeHint: "PDF / DOC / DOCX (최대 20MB)",
    coverLetterTitle: "커버레터",
    coverLetterHint: "PDF / DOC / DOCX (최대 20MB)",
    portfolioTitle: "포트폴리오",
    portfolioHint: "PDF / DOC / DOCX 또는 이미지 (최대 20MB)",
    passportTitle: "여권 사본",
    passportHint: "JPG / PNG / WEBP (최대 20MB)"
  },
  en: {
    title: "Resume & documents",
    subtitle: "Upload your resume, cover letter, portfolio, and passport copy. Shared with host partners during matching and interviews.",
    loading: "Loading...",
    empty: "No file uploaded",
    upload: "Choose file",
    replace: "Replace",
    remove: "Remove",
    uploading: "Uploading...",
    removing: "Removing...",
    download: "Download",
    oversize: "File must be 20MB or smaller.",
    uploadFailed: "Upload failed.",
    removeFailed: "Removal failed.",
    resumeTitle: "Resume",
    resumeHint: "PDF / DOC / DOCX (max 20MB)",
    coverLetterTitle: "Cover letter",
    coverLetterHint: "PDF / DOC / DOCX (max 20MB)",
    portfolioTitle: "Portfolio",
    portfolioHint: "PDF / DOC / DOCX or image (max 20MB)",
    passportTitle: "Passport copy",
    passportHint: "JPG / PNG / WEBP (max 20MB)"
  },
  "zh-CN": {
    title: "简历及文档",
    subtitle: "上传你的简历 / 求职信 / 作品集 / 护照复印件。在匹配和面试阶段将共享给东道企业。",
    loading: "加载中...",
    empty: "未上传文件",
    upload: "选择文件",
    replace: "替换文件",
    remove: "删除",
    uploading: "上传中...",
    removing: "删除中...",
    download: "下载",
    oversize: "文件大小必须小于 20MB。",
    uploadFailed: "上传失败。",
    removeFailed: "删除失败。",
    resumeTitle: "简历",
    resumeHint: "PDF / DOC / DOCX（最大 20MB）",
    coverLetterTitle: "求职信",
    coverLetterHint: "PDF / DOC / DOCX（最大 20MB）",
    portfolioTitle: "作品集",
    portfolioHint: "PDF / DOC / DOCX 或图片（最大 20MB）",
    passportTitle: "护照复印件",
    passportHint: "JPG / PNG / WEBP（最大 20MB）"
  },
  vi: {
    title: "Hồ sơ & tài liệu",
    subtitle: "Tải lên hồ sơ, thư xin việc, portfolio và bản sao hộ chiếu. Được chia sẻ với doanh nghiệp tiếp nhận khi ghép cặp và phỏng vấn.",
    loading: "Đang tải...",
    empty: "Chưa có tệp nào được tải lên",
    upload: "Chọn tệp",
    replace: "Thay tệp",
    remove: "Xóa",
    uploading: "Đang tải lên...",
    removing: "Đang xóa...",
    download: "Tải xuống",
    oversize: "Tệp phải nhỏ hơn hoặc bằng 20MB.",
    uploadFailed: "Tải lên thất bại.",
    removeFailed: "Xóa thất bại.",
    resumeTitle: "Hồ sơ",
    resumeHint: "PDF / DOC / DOCX (tối đa 20MB)",
    coverLetterTitle: "Thư xin việc",
    coverLetterHint: "PDF / DOC / DOCX (tối đa 20MB)",
    portfolioTitle: "Portfolio",
    portfolioHint: "PDF / DOC / DOCX hoặc hình ảnh (tối đa 20MB)",
    passportTitle: "Bản sao hộ chiếu",
    passportHint: "JPG / PNG / WEBP (tối đa 20MB)"
  },
  ja: {
    title: "履歴書および書類",
    subtitle: "履歴書 / カバーレター / ポートフォリオ / パスポートの写しをアップロードしてください。マッチングと面接の段階で受け入れ企業に共有されます。",
    loading: "読み込み中...",
    empty: "アップロードされたファイルなし",
    upload: "ファイルを選択",
    replace: "ファイルを差し替え",
    remove: "削除",
    uploading: "アップロード中...",
    removing: "削除中...",
    download: "ダウンロード",
    oversize: "ファイルサイズは20MB以下にしてください。",
    uploadFailed: "アップロードに失敗しました。",
    removeFailed: "削除に失敗しました。",
    resumeTitle: "履歴書",
    resumeHint: "PDF / DOC / DOCX（最大20MB）",
    coverLetterTitle: "カバーレター",
    coverLetterHint: "PDF / DOC / DOCX（最大20MB）",
    portfolioTitle: "ポートフォリオ",
    portfolioHint: "PDF / DOC / DOCX または画像（最大20MB）",
    passportTitle: "パスポートの写し",
    passportHint: "JPG / PNG / WEBP（最大20MB）"
  },
  id: {
    title: "Resume & dokumen",
    subtitle: "Unggah resume, surat lamaran, portofolio, dan salinan paspor Anda. Dibagikan ke perusahaan tuan rumah saat pencocokan dan wawancara.",
    loading: "Memuat...",
    empty: "Tidak ada file yang diunggah",
    upload: "Pilih file",
    replace: "Ganti",
    remove: "Hapus",
    uploading: "Mengunggah...",
    removing: "Menghapus...",
    download: "Unduh",
    oversize: "File harus 20MB atau lebih kecil.",
    uploadFailed: "Gagal mengunggah.",
    removeFailed: "Gagal menghapus.",
    resumeTitle: "Resume",
    resumeHint: "PDF / DOC / DOCX (maks 20MB)",
    coverLetterTitle: "Surat lamaran",
    coverLetterHint: "PDF / DOC / DOCX (maks 20MB)",
    portfolioTitle: "Portofolio",
    portfolioHint: "PDF / DOC / DOCX atau gambar (maks 20MB)",
    passportTitle: "Salinan paspor",
    passportHint: "JPG / PNG / WEBP (maks 20MB)"
  }
};

function pickCopy(locale: string): Copy {
  return copyByLocale[locale] ?? copyByLocale.en ?? copyByLocale.ko;
}

export function CandidateDocumentsSection() {
  const { locale } = useLanguage();
  const copy = pickCopy(locale);

  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKind, setBusyKind] = useState<CandidateDocumentKind | null>(null);
  const [busyOp, setBusyOp] = useState<"upload" | "remove" | null>(null);
  const [errorByKind, setErrorByKind] = useState<Partial<Record<CandidateDocumentKind, string>>>({});

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await getMyCandidateProfile();
        if (active) setProfile(data);
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const slots: DocSlot[] = [
    { kind: "resume", title: copy.resumeTitle, hint: copy.resumeHint, accept: ACCEPT_DOCUMENT },
    { kind: "coverLetter", title: copy.coverLetterTitle, hint: copy.coverLetterHint, accept: ACCEPT_DOCUMENT },
    { kind: "portfolio", title: copy.portfolioTitle, hint: copy.portfolioHint, accept: ACCEPT_DOCUMENT_OR_IMAGE },
    { kind: "passportImage", title: copy.passportTitle, hint: copy.passportHint, accept: ACCEPT_IMAGE }
  ];

  const readSlot = (kind: CandidateDocumentKind) => {
    if (!profile) return { url: null, fileName: null };
    if (kind === "resume") return { url: profile.resumeUrl ?? null, fileName: profile.resumeFileName ?? null };
    if (kind === "coverLetter") return { url: profile.coverLetterUrl ?? null, fileName: profile.coverLetterFileName ?? null };
    if (kind === "portfolio") return { url: profile.portfolioUrl ?? null, fileName: profile.portfolioFileName ?? null };
    return { url: profile.passportImageUrl ?? null, fileName: profile.passportImageFileName ?? null };
  };

  const onPick = async (kind: CandidateDocumentKind, file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setErrorByKind((prev) => ({ ...prev, [kind]: copy.oversize }));
      return;
    }
    setBusyKind(kind);
    setBusyOp("upload");
    setErrorByKind((prev) => ({ ...prev, [kind]: undefined }));
    try {
      const result = await uploadMyCandidateDocument(kind, file);
      setProfile((prev) => ({
        ...(prev ?? { userId: "" }),
        ...(kind === "resume" ? { resumeUrl: result.url, resumeFileName: result.fileName } : {}),
        ...(kind === "coverLetter" ? { coverLetterUrl: result.url, coverLetterFileName: result.fileName } : {}),
        ...(kind === "portfolio" ? { portfolioUrl: result.url, portfolioFileName: result.fileName } : {}),
        ...(kind === "passportImage" ? { passportImageUrl: result.url, passportImageFileName: result.fileName } : {})
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.uploadFailed;
      setErrorByKind((prev) => ({ ...prev, [kind]: message }));
    } finally {
      setBusyKind(null);
      setBusyOp(null);
    }
  };

  const onRemove = async (kind: CandidateDocumentKind) => {
    setBusyKind(kind);
    setBusyOp("remove");
    setErrorByKind((prev) => ({ ...prev, [kind]: undefined }));
    try {
      await deleteMyCandidateDocument(kind);
      setProfile((prev) => ({
        ...(prev ?? { userId: "" }),
        ...(kind === "resume" ? { resumeUrl: null, resumeFileName: null } : {}),
        ...(kind === "coverLetter" ? { coverLetterUrl: null, coverLetterFileName: null } : {}),
        ...(kind === "portfolio" ? { portfolioUrl: null, portfolioFileName: null } : {}),
        ...(kind === "passportImage" ? { passportImageUrl: null, passportImageFileName: null } : {})
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.removeFailed;
      setErrorByKind((prev) => ({ ...prev, [kind]: message }));
    } finally {
      setBusyKind(null);
      setBusyOp(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 md:p-5">
      <header className="mb-4">
        <h2 className="text-base font-semibold">{copy.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{copy.subtitle}</p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {slots.map((slot) => (
            <DocSlotRow
              key={slot.kind}
              slot={slot}
              current={readSlot(slot.kind)}
              busy={busyKind === slot.kind ? busyOp : null}
              error={errorByKind[slot.kind] ?? null}
              copy={copy}
              onUpload={(file) => void onPick(slot.kind, file)}
              onRemove={() => void onRemove(slot.kind)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocSlotRow({
  slot,
  current,
  busy,
  error,
  copy,
  onUpload,
  onRemove
}: {
  slot: DocSlot;
  current: { url: string | null; fileName: string | null };
  busy: "upload" | "remove" | null;
  error: string | null;
  copy: Copy;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasFile = !!current.url;

  return (
    <article className="rounded-xl border border-border/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{slot.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{slot.hint}</p>
          {hasFile ? (
            <a
              href={current.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block max-w-full truncate text-xs text-primary underline"
              title={current.fileName ?? ""}
            >
              📎 {current.fileName ?? copy.download}
            </a>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{copy.empty}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" ? copy.uploading : hasFile ? copy.replace : copy.upload}
        </Button>
        {hasFile ? (
          <Button variant="ghost" size="sm" disabled={busy !== null} onClick={onRemove}>
            {busy === "remove" ? copy.removing : copy.remove}
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={slot.accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </article>
  );
}
