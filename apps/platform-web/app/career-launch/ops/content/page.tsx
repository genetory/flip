"use client";

import { useEffect, useMemo, useState } from "react";
import { WEEKS } from "../../../../lib/launch/data";
import { fetchOpsCareerContent, saveOpsCareerContent, type CareerContent } from "../../../../lib/launch/content-client";
import { useLaunchT, type LT } from "../../../../lib/launch/i18n";

const LOCALES = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "zh-CN", label: "中文" },
  { key: "vi", label: "Tiếng Việt" },
  { key: "ja", label: "日本語" },
  { key: "id", label: "Indonesia" }
] as const;
type LocaleKey = (typeof LOCALES)[number]["key"];

// 운영자 프로그램 콘텐츠 관리 — 주차·스텝 문구를 6개 언어로 덮어쓴다.
// 비워두면 코드의 기본값(data.ts / data-i18n.ts)으로 되돌아간다.
export default function LaunchOpsContentPage() {
  const t = useLaunchT();
  const [content, setContent] = useState<CareerContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<LocaleKey>("ko");
  const [openWeek, setOpenWeek] = useState<number>(1);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const c = await fetchOpsCareerContent();
        if (alive) setContent(c ?? {});
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setWeekField = (week: number, field: "title" | "subtitle" | "goal", value: string) => {
    setSaved(false);
    setContent((prev) => {
      const weeks = { ...(prev.weeks ?? {}) };
      const w = { ...(weeks[String(week)] ?? {}) };
      const lt = { ...((w[field] ?? {}) as Record<string, string>) };
      lt[locale] = value;
      w[field] = lt as LT;
      weeks[String(week)] = w;
      return { ...prev, weeks };
    });
  };

  const setStepField = (stepId: string, field: "title" | "desc", value: string) => {
    setSaved(false);
    setContent((prev) => {
      const steps = { ...(prev.steps ?? {}) };
      const st = { ...(steps[stepId] ?? {}) };
      const lt = { ...((st[field] ?? {}) as Record<string, string>) };
      lt[locale] = value;
      st[field] = lt as LT;
      steps[stepId] = st;
      return { ...prev, steps };
    });
  };

  const weekVal = (week: number, field: "title" | "subtitle" | "goal") =>
    ((content.weeks?.[String(week)]?.[field] as Record<string, string> | undefined)?.[locale] ?? "");
  const stepVal = (stepId: string, field: "title" | "desc") =>
    ((content.steps?.[stepId]?.[field] as Record<string, string> | undefined)?.[locale] ?? "");

  // 이 로케일에서 실제로 덮어쓴 항목 수 — "무엇이 기본값이 아닌지" 한눈에.
  const overriddenCount = useMemo(() => {
    let n = 0;
    for (const w of Object.values(content.weeks ?? {})) {
      for (const f of ["title", "subtitle", "goal"] as const) {
        const v = (w[f] as Record<string, string> | undefined)?.[locale];
        if (v && v.trim()) n += 1;
      }
    }
    for (const s of Object.values(content.steps ?? {})) {
      for (const f of ["title", "desc"] as const) {
        const v = (s[f] as Record<string, string> | undefined)?.[locale];
        if (v && v.trim()) n += 1;
      }
    }
    return n;
  }, [content, locale]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await saveOpsCareerContent(content);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("저장하지 못했어요.", "Couldn't save.", "保存失败。", "Không thể lưu.", "保存できませんでした。", "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!confirm(t("편집한 문구를 모두 지우고 기본값으로 되돌릴까요?", "Clear all edits and restore defaults?", "清除所有编辑并恢复默认？", "Xóa mọi chỉnh sửa và khôi phục mặc định?", "編集した文言をすべて消して初期値に戻しますか？", "Hapus semua editan dan pulihkan default?"))) return;
    setSaving(true);
    try {
      await saveOpsCareerContent({});
      setContent({});
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("저장하지 못했어요.", "Couldn't save.", "保存失败。", "Không thể lưu.", "保存できませんでした。", "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  };

  const week = WEEKS.find((w) => w.week === openWeek) ?? WEEKS[0];

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("프로그램 콘텐츠", "Program content", "项目内容", "Nội dung chương trình", "プログラム内容", "Konten program")}</h1>
          <p>
            {t(
              "주차·스텝에 보이는 문구를 코드 수정 없이 6개 언어로 바꿔요. 비워두면 기본값이 그대로 쓰입니다.",
              "Change week and step copy in 6 languages without touching code. Leave blank to keep the default.",
              "无需改代码，即可用 6 种语言修改周次与步骤文案。留空则使用默认值。",
              "Thay đổi nội dung tuần và bước bằng 6 ngôn ngữ mà không cần sửa code. Để trống sẽ dùng mặc định.",
              "コードを触らずに週・ステップの文言を6言語で変更できます。空欄なら既定値が使われます。",
              "Ubah teks minggu dan langkah dalam 6 bahasa tanpa mengubah kode. Kosongkan untuk memakai default."
            )}
          </p>
        </header>

        {loading ? (
          <div className="ops-empty-card">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : (
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>
                {t("문구 편집", "Edit copy", "编辑文案", "Chỉnh sửa nội dung", "文言の編集", "Edit teks")}{" "}
                <span className={`ops-status-badge ${overriddenCount > 0 ? "ops-status-pending" : "ops-status-draft"}`}>
                  {overriddenCount > 0
                    ? t(`${overriddenCount}개 편집됨`, `${overriddenCount} edited`, `已编辑 ${overriddenCount} 项`, `${overriddenCount} đã sửa`, `${overriddenCount}件を編集`, `${overriddenCount} diedit`)
                    : t("전부 기본값", "All default", "全部默认", "Toàn bộ mặc định", "すべて既定値", "Semua default")}
                </span>
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ops-btn ops-btn-danger" disabled={saving} onClick={() => void resetAll()}>
                  {t("전체 기본값 복원", "Restore all defaults", "恢复全部默认", "Khôi phục mặc định", "すべて既定値に戻す", "Pulihkan default")}
                </button>
                <button type="button" className="ops-btn ops-btn-primary" disabled={saving} onClick={() => void save()}>
                  {saving ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
                </button>
              </div>
            </div>

            {error ? <p className="ops-form-error">{error}</p> : null}
            {saved ? (
              <p className="ops-detail-empty" style={{ color: "#047857", fontWeight: 700 }}>
                {t("저장했어요. 학생 화면에 바로 반영됩니다.", "Saved. It applies to the student view right away.", "已保存，学生端立即生效。", "Đã lưu. Áp dụng ngay cho sinh viên.", "保存しました。学生画面に即反映されます。", "Tersimpan. Langsung berlaku di tampilan siswa.")}
              </p>
            ) : null}

            {/* 언어 선택 */}
            <div className="ops-filter-chip-row">
              {LOCALES.map((l) => (
                <button key={l.key} type="button" className={`ops-filter-chip ${locale === l.key ? "is-active" : ""}`} onClick={() => setLocale(l.key)}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* 주차 선택 */}
            <div className="ops-filter-chip-row">
              {WEEKS.map((w) => (
                <button key={w.week} type="button" className={`ops-filter-chip ${openWeek === w.week ? "is-active" : ""}`} onClick={() => setOpenWeek(w.week)}>
                  Week {w.week}
                  <span className="ops-filter-chip-count">{w.steps.length}</span>
                </button>
              ))}
            </div>

            {/* 주차 문구 */}
            <div className="ops-detail-sections">
              <section className="ops-detail-section">
                <h3>
                  Week {week.week} · {t("주차 문구", "Week copy", "周次文案", "Nội dung tuần", "週の文言", "Teks minggu")}
                </h3>
                {(
                  [
                    { f: "title", label: t("제목", "Title", "标题", "Tiêu đề", "タイトル", "Judul"), orig: week.title },
                    { f: "subtitle", label: t("부제", "Subtitle", "副标题", "Phụ đề", "サブタイトル", "Subjudul"), orig: week.subtitle },
                    { f: "goal", label: t("목표", "Goal", "目标", "Mục tiêu", "目標", "Tujuan"), orig: week.goal }
                  ] as const
                ).map((row) => (
                  <div key={row.f} style={{ marginBottom: 14 }}>
                    <label className="ops-form-label">{row.label}</label>
                    <textarea
                      value={weekVal(week.week, row.f)}
                      onChange={(e) => setWeekField(week.week, row.f, e.target.value)}
                      rows={row.f === "goal" ? 3 : 2}
                      className="w-full rounded-lg border border-[#e5e7eb] p-2.5 text-[13px] leading-relaxed"
                      placeholder={row.orig}
                    />
                    <p className="ops-detail-empty" style={{ marginTop: 4 }}>
                      {t("기본값", "Default", "默认值", "Mặc định", "既定値", "Default")}: {row.orig}
                    </p>
                  </div>
                ))}
              </section>

              {/* 스텝 문구 */}
              {week.steps.map((st) => (
                <section key={st.id} className="ops-detail-section">
                  <h3>
                    {st.id} · {t("스텝", "Step", "步骤", "Bước", "ステップ", "Langkah")}
                  </h3>
                  {(
                    [
                      { f: "title", label: t("제목", "Title", "标题", "Tiêu đề", "タイトル", "Judul"), orig: st.title, rows: 2 },
                      { f: "desc", label: t("설명", "Description", "说明", "Mô tả", "説明", "Deskripsi"), orig: st.desc, rows: 3 }
                    ] as const
                  ).map((row) => (
                    <div key={row.f} style={{ marginBottom: 14 }}>
                      <label className="ops-form-label">{row.label}</label>
                      <textarea
                        value={stepVal(st.id, row.f)}
                        onChange={(e) => setStepField(st.id, row.f, e.target.value)}
                        rows={row.rows}
                        className="w-full rounded-lg border border-[#e5e7eb] p-2.5 text-[13px] leading-relaxed"
                        placeholder={row.orig}
                      />
                      <p className="ops-detail-empty" style={{ marginTop: 4 }}>
                        {t("기본값", "Default", "默认值", "Mặc định", "既定値", "Default")}: {row.orig}
                      </p>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
