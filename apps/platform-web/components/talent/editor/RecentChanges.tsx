"use client";

// 최근 변경 — 되돌릴 수 있는 지점과 **그 지점 이후 무엇이 달라졌는지**.
//
// 되돌리기 버튼만 있으면 사용자는 무엇이 사라질지 모른 채 눌러야 한다. 그래서 각 줄은
// "무엇이 달라졌나"(+추가 ~수정 −삭제와 예시)를 먼저 보여 주고, 되돌리기는 그 아래 작게 둔다.
//
// 지점은 이미 저장되고 있었다(스토어가 저장할 때마다 이전 문서를 최대 3개까지 보관).
// 보여 줄 화면이 없어서 아무도 못 쓰던 것을 꺼낸 것이다.
import { useState } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import type { PlatformT } from "../../../lib/i18n";
import { Section } from "./editor-shared";
import { isEmptyChange, type DocChange } from "../../../lib/talent/doc-diff";
import { formatRelativeTime } from "../../../lib/talent/career-feed";

export type ChangePoint = {
  savedAt: number;
  /** 이 지점 이후에 한 작업(있으면). 없으면 직접 편집으로 본다. */
  label?: string;
  change: DocChange;
};

export function RecentChanges({ t, points, onRestore }: { t: PlatformT; points: ChangePoint[]; onRestore: (savedAt: number) => void }) {
  const [confirming, setConfirming] = useState<number | null>(null);
  // 달라진 게 없는 지점은 보여 주지 않는다 — 되돌려도 아무 일이 없으면 혼란만 준다.
  const rows = points.filter((p) => !isEmptyChange(p.change));
  if (rows.length === 0) return null;

  const fieldLabel = (f: string) =>
    ({
      targetRole: t("희망 직무", "Target role", "期望职位", "Vị trí mong muốn", "希望職種", "Peran target"),
      summary: t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang"),
      links: t("링크", "Links", "链接", "Liên kết", "リンク", "Tautan"),
      questions: t("문항 구성", "Questions", "题目构成", "Câu hỏi", "設問構成", "Pertanyaan"),
      companyName: t("지원 회사", "Company", "应聘公司", "Công ty", "応募会社", "Perusahaan"),
      keywords: t("필수 소재", "Must-include points", "必写素材", "Nội dung bắt buộc", "必須要素", "Poin wajib")
    })[f] ?? f;

  const summaryOf = (c: DocChange) => {
    const parts: string[] = [];
    if (c.added) parts.push(t(`${c.added}개 추가`, `${c.added} added`, `新增 ${c.added}`, `thêm ${c.added}`, `${c.added}件追加`, `${c.added} ditambah`));
    if (c.edited) parts.push(t(`${c.edited}개 수정`, `${c.edited} edited`, `修改 ${c.edited}`, `sửa ${c.edited}`, `${c.edited}件修正`, `${c.edited} diubah`));
    if (c.removed) parts.push(t(`${c.removed}개 삭제`, `${c.removed} removed`, `删除 ${c.removed}`, `xóa ${c.removed}`, `${c.removed}件削除`, `${c.removed} dihapus`));
    for (const f of c.fields) parts.push(fieldLabel(f));
    return parts.join(" · ");
  };

  return (
    <Section title={t("최근 변경", "Recent changes", "最近更改", "Thay đổi gần đây", "最近の変更", "Perubahan terbaru")}>
      <p className="text-[11.5px] leading-[1.6] text-[#8B95A1]">
        {t(
          "그 지점 이후로 달라진 내용이에요. 되돌리면 지금 문서는 목록 맨 위로 보관돼요.",
          "What changed since each point. Restoring keeps your current document at the top of this list.",
          "每个时间点之后的变化。恢复后当前文档会保存在列表最上方。",
          "Những gì đã đổi kể từ mỗi mốc. Khôi phục sẽ giữ bản hiện tại ở đầu danh sách.",
          "各時点以降に変わった内容です。戻すと今の文書はリストの一番上に保管されます。",
          "Apa yang berubah sejak tiap titik. Memulihkan menyimpan dokumen saat ini di paling atas."
        )}
      </p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((p) => (
          <li key={p.savedAt} className="rounded-[10px] bg-[#F7F8FA] p-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#333D4B]">
                {p.label ?? t("직접 편집", "Your edits", "手动编辑", "Bạn tự sửa", "手動の編集", "Suntingan sendiri")}
              </span>
              <span className="shrink-0 text-[11px] text-[#8B95A1]">{formatRelativeTime(p.savedAt, undefined, t)}</span>
            </div>
            <p className="mt-0.5 text-[11.5px] leading-[1.6] text-[#4E5968]">{summaryOf(p.change)}</p>
            {p.change.examples.length ? (
              <p className="mt-0.5 break-anywhere text-[11px] leading-[1.6] text-[#8B95A1]">{p.change.examples.join("  ")}</p>
            ) : null}

            {confirming === p.savedAt ? (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onRestore(p.savedAt);
                    setConfirming(null);
                  }}
                  className="h-8 rounded-[8px] bg-[#0B46E8] text-[12px] font-bold leading-none text-white transition hover:bg-[#0A3ECB]"
                >
                  {t("이 지점으로 되돌리기", "Restore this point", "恢复到此", "Khôi phục mốc này", "この時点に戻す", "Pulihkan titik ini")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="h-8 rounded-[8px] bg-white text-[12px] font-semibold leading-none text-[#4E5968] ring-1 ring-[#E5E8EB] transition hover:bg-[#F2F4F6]"
                >
                  {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(p.savedAt)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#6B7684] underline-offset-2 transition hover:text-[#0B46E8] hover:underline"
              >
                <ArrowCounterClockwise size={12} weight="bold" />
                {t("되돌리기", "Restore", "恢复", "Khôi phục", "戻す", "Pulihkan")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
