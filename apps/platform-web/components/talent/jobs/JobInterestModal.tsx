"use client";

// 관심 직무 선택 — 2단(왼쪽 대분류 · 오른쪽 중/소분류). 소분류 최대 3개 선택해 저장.
import { useMemo, useState } from "react";
import { X, MagnifyingGlass } from "@phosphor-icons/react";
import { saveJobInterests } from "../../../lib/talent/job-interest";
import { JOB_TAXONOMY } from "../../../lib/talent/job-taxonomy";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { usePlatformT } from "../../../lib/i18n";

const MAX = 3;

export function JobInterestModal({ initial, onClose }: { initial: string[]; onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  const [major, setMajor] = useState(0);
  const [selected, setSelected] = useState<string[]>(initial);
  const [query, setQuery] = useState("");

  const atMax = selected.length >= MAX;
  const active = JOB_TAXONOMY[major];

  // 검색: 소분류/중분류/대분류 라벨 매칭 → 대분류별로 그룹.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const groups: { label: string; minors: string[] }[] = [];
    for (const mj of JOB_TAXONOMY) {
      const majorHit = mj.label.toLowerCase().includes(q);
      const minors: string[] = [];
      for (const mid of mj.middles) {
        const midHit = mid.label.toLowerCase().includes(q);
        for (const mn of mid.minors) {
          if (majorHit || midHit || mn.toLowerCase().includes(q)) minors.push(mn);
        }
      }
      if (minors.length) groups.push({ label: mj.label, minors });
    }
    return groups;
  }, [query]);

  function toggle(minor: string) {
    setSelected((prev) => {
      if (prev.includes(minor)) return prev.filter((m) => m !== minor);
      if (prev.length >= MAX) return prev;
      return [...prev, minor];
    });
  }

  function save() {
    saveJobInterests(selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[85vh] max-h-[720px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-black text-[#0B1227]">{t("관심 직무 선택", "Choose interests", "选择兴趣职位", "Chọn sở thích", "関心職種を選ぶ", "Pilih minat")}</h2>
            <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{t(`최대 ${MAX}개 · ${selected.length}개 선택됨`, `Up to ${MAX} · ${selected.length} selected`, `最多 ${MAX} 个 · 已选 ${selected.length} 个`, `Tối đa ${MAX} · Đã chọn ${selected.length}`, `最大${MAX}件 · ${selected.length}件選択済み`, `Maks ${MAX} · ${selected.length} dipilih`)}</p>
          </div>
          <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#F5F6F8] px-3.5 py-2.5">
            <MagnifyingGlass className="h-[18px] w-[18px] shrink-0 text-[#8B95A1]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("직무 검색 (예: 마케팅, 백엔드)", "Search roles (e.g. Marketing, Backend)", "搜索职位（如：市场、后端）", "Tìm nghề (vd: Marketing, Backend)", "職種を検索（例：マーケ、バックエンド）", "Cari peran (mis. Marketing, Backend)")}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
            />
            {query ? (
              <button type="button" aria-label={t("지우기", "Clear", "清除", "Xóa", "クリア", "Hapus")} onClick={() => setQuery("")} className="shrink-0 text-[#B0B8C1] transition hover:text-[#4E5968]">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* 선택 요약 */}
        {selected.length ? (
          <div className="flex flex-wrap gap-1.5 border-b border-[#F2F4F6] px-5 py-3">
            {selected.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggle(m)}
                className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]"
              >
                {m} <X className="h-3 w-3" weight="bold" />
              </button>
            ))}
          </div>
        ) : null}

        {/* 검색 결과 */}
        {query.trim() ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {/* 직접 추가 — 보기에 없는 직무 */}
            {(() => {
              const v = query.trim();
              const already = selected.includes(v);
              const canAdd = !already && !atMax;
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (!canAdd) return;
                    setSelected((prev) => [...prev, v]);
                    setQuery("");
                  }}
                  disabled={!canAdd}
                  className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] px-4 py-3 text-left transition hover:border-[#0B46E8]/40 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">+</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#4E5968]">
                    <span className="font-bold text-[#191F28]">&lsquo;{v}&rsquo;</span> {already ? t("이미 추가됨", "Already added", "已添加", "Đã thêm", "追加済み", "Sudah ditambah") : t("직접 추가하기", "Add it", "直接添加", "Thêm mới", "直接追加する", "Tambahkan")}
                  </span>
                </button>
              );
            })()}

            {results.length === 0 ? (
              <p className="py-6 text-center text-[13.5px] text-[#B0B8C1]">{t("목록에 없으면 위에서 직접 추가할 수 있어요.", "Not in the list? Add it manually above.", "列表中没有？可在上方直接添加。", "Không có trong danh sách? Thêm thủ công ở trên.", "リストにない場合は上で直接追加できます。", "Tidak ada di daftar? Tambah manual di atas.")}</p>
            ) : (
              <div className="flex flex-col gap-5">
                {results.map((g) => (
                  <div key={g.label}>
                    <p className="mb-2 text-[13px] font-bold text-[#191F28]">{g.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.minors.map((minor) => {
                        const on = selected.includes(minor);
                        const disabled = !on && atMax;
                        return (
                          <button
                            key={minor}
                            type="button"
                            onClick={() => toggle(minor)}
                            disabled={disabled}
                            aria-pressed={on}
                            className={`rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
                              on ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] disabled:opacity-40 disabled:hover:bg-[#F2F4F6]"
                            }`}
                          >
                            {minor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        /* 본문 2단 */
        <div className="flex min-h-0 flex-1">
          {/* 대분류 */}
          <aside className="w-[112px] shrink-0 overflow-y-auto border-r border-[#F2F4F6] bg-[#FAFBFC] py-2 sm:w-[140px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {JOB_TAXONOMY.map((mj, i) => {
              const on = i === major;
              const count = mj.middles.reduce((acc, mid) => acc + mid.minors.filter((mn) => selected.includes(mn)).length, 0);
              return (
                <button
                  key={mj.label}
                  type="button"
                  onClick={() => setMajor(i)}
                  className={`flex w-full items-center gap-1.5 px-3.5 py-3 text-left text-[13.5px] font-semibold transition ${
                    on ? "bg-white text-[#0B46E8]" : "text-[#4E5968] hover:bg-white/60"
                  }`}
                >
                  <span aria-hidden>{mj.emoji}</span>
                  <span className="min-w-0 flex-1 break-keep">{mj.label}</span>
                  {count ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden /> : null}
                </button>
              );
            })}
          </aside>

          {/* 중/소분류 */}
          <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-5">
              {active.middles.map((mid) => (
                <div key={mid.label}>
                  <p className="mb-2 text-[13px] font-bold text-[#191F28]">{mid.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {mid.minors.map((minor) => {
                      const on = selected.includes(minor);
                      const disabled = !on && atMax;
                      return (
                        <button
                          key={minor}
                          type="button"
                          onClick={() => toggle(minor)}
                          disabled={disabled}
                          aria-pressed={on}
                          className={`rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
                            on ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] disabled:opacity-40 disabled:hover:bg-[#F2F4F6]"
                          }`}
                        >
                          {minor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* 저장 */}
        <div className="border-t border-[#F2F4F6] p-4">
          <button
            type="button"
            onClick={save}
            disabled={selected.length === 0}
            className="flex h-[48px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40"
          >
            {selected.length ? t(`${selected.length}개 직무로 저장`, `Save ${selected.length} interest${selected.length > 1 ? "s" : ""}`, `保存 ${selected.length} 个职位`, `Lưu ${selected.length} nghề`, `${selected.length}件の職種を保存`, `Simpan ${selected.length} minat`) : t("직무를 선택해주세요", "Select a role", "请选择职位", "Hãy chọn nghề", "職種を選んでください", "Pilih peran")}
          </button>
        </div>
      </div>
    </div>
  );
}
