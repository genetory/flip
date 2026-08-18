"use client";

// 이력서·자소서용 사진 — 업로드/변경/삭제 + 문서 표시 토글.
// 계정(서비스) 프로필 사진과는 별개인 BasicInfo.photoUrl 을 편집한다.
import { useRef } from "react";
import { Camera, UserCircle } from "@phosphor-icons/react";
import { useBasicInfo, saveBasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT } from "../../../lib/i18n";

export function ResumePhotoRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  const t = usePlatformT();
  const info = useBasicInfo();
  const fileRef = useRef<HTMLInputElement>(null);
  const photo = info.photoUrl;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveBasicInfo({ ...info, photoUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }
  function remove() {
    saveBasicInfo({ ...info, photoUrl: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-[64px] w-[64px] shrink-0"
          aria-label={t("문서용 사진 업로드", "Upload document photo", "上传照片", "Tải ảnh", "写真をアップロード", "Unggah foto")}
        >
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5E8EB] bg-[#F2F4F6]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-8 w-8 text-[#C4CAD2]" weight="fill" />
            )}
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-xl border-2 border-white bg-[#0B46E8] text-white">
            <Camera className="h-3 w-3" weight="fill" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#191F28]">{label}</p>
          <p className="mt-0.5 break-keep text-[12px] text-[#8B95A1]">{t("이 문서에만 쓰는 사진이에요 (계정 프로필 사진과 별개)", "Used only on this document (separate from your account photo)", "仅用于本文档（与账号头像分开）", "Chỉ dùng cho tài liệu này (tách khỏi ảnh tài khoản)", "この書類にのみ使用（アカウント写真とは別）", "Hanya untuk dokumen ini (terpisah dari foto akun)")}</p>
          {photo ? (
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">{t("변경", "Change", "更换", "Đổi", "変更", "Ubah")}</button>
              <button type="button" onClick={remove} className="rounded-lg bg-[#FDECEE] px-2.5 py-1 text-[12px] font-semibold text-[#F04452] transition hover:bg-[#FBDDE1]">{t("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}</button>
            </div>
          ) : null}
        </div>
      </div>
      {photo ? (
        <div className="mt-3 flex items-center justify-between border-t border-[#F2F4F6] pt-3">
          <span className="text-[13px] font-semibold text-[#4E5968]">{t("문서에 표시", "Show on document", "在文档显示", "Hiển thị trên tài liệu", "書類に表示", "Tampilkan di dokumen")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={() => onChange(!on)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      ) : null}
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  );
}
