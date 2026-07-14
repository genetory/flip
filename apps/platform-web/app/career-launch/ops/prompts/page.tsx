"use client";

import { useEffect, useState } from "react";
import { fetchOpsPrompts, saveOpsPrompt, resetOpsPrompt, type OpsPrompt } from "../../../../lib/launch/ops-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 프롬프트 편집 — 각 스텝 대화의 시스템 프롬프트를 편집/기본값 복원.
// JSON 출력 형식 계약은 서버가 자동으로 붙으므로 여기서 신경 쓰지 않아도 된다.
export default function LaunchOpsPromptsPage() {
  const t = useLaunchT();
  const [prompts, setPrompts] = useState<OpsPrompt[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  const load = async () => {
    const items = await fetchOpsPrompts();
    setPrompts(items);
    setDrafts(Object.fromEntries(items.map((p) => [p.key, p.value])));
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await load();
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const save = async (p: OpsPrompt) => {
    setSavingKey(p.key);
    setSavedKey("");
    try {
      await saveOpsPrompt(p.key, drafts[p.key] ?? "");
      await load();
      setSavedKey(p.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("저장하지 못했어요.", "Couldn't save.", "保存失败。", "Không thể lưu.", "保存できませんでした。", "Gagal menyimpan."));
    } finally {
      setSavingKey("");
    }
  };

  const reset = async (p: OpsPrompt) => {
    setSavingKey(p.key);
    try {
      const def = await resetOpsPrompt(p.key);
      setDrafts((d) => ({ ...d, [p.key]: def }));
      await load();
      setSavedKey(p.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("복원하지 못했어요.", "Couldn't restore.", "恢复失败。", "Không thể khôi phục.", "復元できませんでした。", "Gagal memulihkan."));
    } finally {
      setSavingKey("");
    }
  };

  const weeks = Array.from(new Set(prompts.map((p) => p.week))).sort((a, b) => a - b);

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("스텝별 대화 프롬프트", "Chat prompts by step", "各步骤对话提示词", "Prompt trò chuyện theo bước", "ステップ別の会話プロンプト", "Prompt obrolan per langkah")}</h1>
          <p>{t("각 스텝 대화의 시스템 프롬프트를 편집해요. 저장 즉시 다음 대화부터 적용돼요.", "Edit the system prompt for each step's chat. Changes apply from the next conversation right after saving.", "编辑各步骤对话的系统提示词。保存后从下一次对话立即生效。", "Chỉnh sửa system prompt cho trò chuyện của từng bước. Áp dụng từ cuộc trò chuyện tiếp theo ngay sau khi lưu.", "各ステップの会話のシステムプロンプトを編集します。保存後、次の会話からすぐに適用されます。", "Edit system prompt untuk obrolan tiap langkah. Berlaku dari percakapan berikutnya setelah disimpan.")}</p>
        </header>

        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("편집 안내", "How it works", "编辑说明", "Hướng dẫn chỉnh sửa", "編集ガイド", "Panduan edit")}</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#4b5563" }}>
            {t("JSON 출력 형식은 서버가 자동으로 붙여요. 말투·규칙·질문 흐름 등 대화 내용만 편집하면 돼요.", "The server adds the JSON output format automatically. Just edit the conversation content — tone, rules, question flow, and so on.", "服务器会自动添加 JSON 输出格式。您只需编辑语气、规则、提问流程等对话内容。", "Máy chủ tự động thêm định dạng JSON. Bạn chỉ cần chỉnh sửa nội dung trò chuyện như giọng điệu, quy tắc, luồng câu hỏi.", "JSON 出力形式はサーバーが自動で付けます。口調・ルール・質問の流れなど会話の内容だけ編集すればOKです。", "Server menambahkan format keluaran JSON secara otomatis. Cukup edit isi percakapan seperti nada, aturan, dan alur pertanyaan.")}
          </p>
        </article>

        {loading ? (
          <div className="ops-empty-card">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : error ? (
          <div className="ops-empty-card">
            <p className="ops-form-error">{error}</p>
          </div>
        ) : prompts.length === 0 ? (
          <div className="ops-empty-card">{t("편집할 프롬프트가 없어요.", "No prompts to edit.", "没有可编辑的提示词。", "Không có prompt để chỉnh sửa.", "編集できるプロンプトがありません。", "Tidak ada prompt untuk diedit.")}</div>
        ) : (
          weeks.map((week) => (
            <article key={week} className="ops-partner-list-card">
              <div className="ops-partner-list-top">
                <h2>
                  {t("주차", "Week", "周", "Tuần", "週", "Minggu")} {week}
                </h2>
                <span className="ops-status-badge ops-status-draft">
                  {prompts.filter((p) => p.week === week).length} {t("개 스텝", "steps", "个步骤", "bước", "ステップ", "langkah")}
                </span>
              </div>

              <div className="ops-detail-sections">
                {prompts
                  .filter((p) => p.week === week)
                  .map((p) => {
                    const draft = drafts[p.key] ?? "";
                    const dirty = draft !== p.value;
                    return (
                      <section key={p.key} className="ops-detail-section">
                        <h3 style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span>{p.label}</span>
                          {p.isOverridden ? (
                            <span className="ops-status-badge ops-status-pending">{t("편집됨", "Edited", "已编辑", "Đã chỉnh sửa", "編集済み", "Diedit")}</span>
                          ) : (
                            <span className="ops-status-badge ops-status-draft">{t("기본값", "Default", "默认", "Mặc định", "デフォルト", "Bawaan")}</span>
                          )}
                        </h3>

                        <label className="ops-partner-form-field">
                          <span className="ops-form-label">{p.step}</span>
                          <textarea
                            className="ops-textarea"
                            value={draft}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.key]: e.target.value }))}
                            rows={12}
                            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, lineHeight: 1.7, minHeight: 220, resize: "vertical" }}
                          />
                        </label>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <button
                            type="button"
                            className="ops-btn ops-btn-primary"
                            disabled={!dirty || savingKey === p.key}
                            onClick={() => void save(p)}
                          >
                            {savingKey === p.key ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
                          </button>
                          {p.isOverridden ? (
                            <button
                              type="button"
                              className="ops-btn ops-btn-danger"
                              disabled={savingKey === p.key}
                              onClick={() => void reset(p)}
                            >
                              {t("기본값으로 복원", "Restore default", "恢复默认", "Khôi phục mặc định", "デフォルトに復元", "Pulihkan bawaan")}
                            </button>
                          ) : null}
                          {savedKey === p.key && !dirty ? (
                            <span className="ops-status-badge ops-status-approved">{t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")}</span>
                          ) : null}
                        </div>
                      </section>
                    );
                  })}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
