"use client";

import { useEffect, useState } from "react";
import { fetchOpsPrompts, saveOpsPrompt, resetOpsPrompt, type OpsPrompt } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 프롬프트 편집 — 각 스텝 대화의 시스템 프롬프트를 편집/기본값 복원.
// JSON 출력 형식 계약은 서버가 자동으로 붙이므로 여기서 신경 쓰지 않아도 된다.
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

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-5">
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{t("스텝별 대화 프롬프트", "Chat prompts by step", "各步骤对话提示词", "Prompt trò chuyện theo bước", "ステップ別の会話プロンプト", "Prompt obrolan per langkah")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("각 스텝 대화의 시스템 프롬프트를 편집해요. 저장 즉시 다음 대화부터 적용돼요.", "Edit the system prompt for each step's chat. Changes apply from the next conversation right after saving.", "编辑各步骤对话的系统提示词。保存后从下一次对话立即生效。", "Chỉnh sửa system prompt cho trò chuyện của từng bước. Áp dụng từ cuộc trò chuyện tiếp theo ngay sau khi lưu.", "各ステップの会話のシステムプロンプトを編集します。保存後、次の会話からすぐに適用されます。", "Edit system prompt untuk obrolan tiap langkah. Berlaku dari percakapan berikutnya setelah disimpan.")}</p>
        </div>
        <p className="mb-4 rounded-xl bg-[#EDF1FD] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#0B46E8]">
          {t("JSON 출력 형식은 서버가 자동으로 붙여요. 말투·규칙·질문 흐름 등 대화 내용만 편집하면 돼요.", "The server adds the JSON output format automatically. Just edit the conversation content — tone, rules, question flow, and so on.", "服务器会自动添加 JSON 输出格式。您只需编辑语气、规则、提问流程等对话内容。", "Máy chủ tự động thêm định dạng JSON. Bạn chỉ cần chỉnh sửa nội dung trò chuyện như giọng điệu, quy tắc, luồng câu hỏi.", "JSON 出力形式はサーバーが自動で付けます。口調・ルール・質問の流れなど会話の内容だけ編集すればOKです。", "Server menambahkan format keluaran JSON secara otomatis. Cukup edit isi percakapan seperti nada, aturan, dan alur pertanyaan.")}
        </p>

        {loading ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
        ) : error ? (
          <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
        ) : (
          <div className="space-y-8">
            {Array.from(new Set(prompts.map((p) => p.week))).sort((a, b) => a - b).map((week) => (
              <div key={week}>
                <h2 className="mb-3 text-[15px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[16px]">Week {week}</h2>
                <div className="grid gap-4 xl:grid-cols-2">
                  {prompts.filter((p) => p.week === week).map((p) => {
                    const draft = drafts[p.key] ?? "";
                    const dirty = draft !== p.value;
                    return (
                      <Card key={p.key} className="!p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14.5px] font-bold text-[#191F28]">{p.label}</p>
                            <p className="mt-0.5 text-[12px] text-[#8B95A1]">{p.step}</p>
                          </div>
                          {p.isOverridden ? <Pill tone="amber">{t("편집됨", "Edited", "已编辑", "Đã chỉnh sửa", "編集済み", "Diedit")}</Pill> : <Pill tone="grey">{t("기본값", "Default", "默认", "Mặc định", "デフォルト", "Bawaan")}</Pill>}
                        </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.key]: e.target.value }))}
                    rows={12}
                    className="mt-3 w-full resize-y rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-[#191F28] focus:border-[#0B46E8] focus:outline-none"
                  />
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!dirty || savingKey === p.key}
                      onClick={() => void save(p)}
                      className={`rounded-lg px-4 py-2 text-[13px] font-bold transition ${
                        dirty && savingKey !== p.key ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                      }`}
                    >
                      {savingKey === p.key ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
                    </button>
                    {p.isOverridden ? (
                      <button
                        type="button"
                        disabled={savingKey === p.key}
                        onClick={() => void reset(p)}
                        className="rounded-lg border border-[#D7DCE3] bg-white px-4 py-2 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
                      >
                        {t("기본값으로 복원", "Restore default", "恢复默认", "Khôi phục mặc định", "デフォルトに復元", "Pulihkan bawaan")}
                      </button>
                    ) : null}
                    {savedKey === p.key && !dirty ? <span className="text-[12.5px] font-semibold text-emerald-600">{t("저장됨 ✓", "Saved ✓", "已保存 ✓", "Đã lưu ✓", "保存済み ✓", "Tersimpan ✓")}</span> : null}
                  </div>
                </Card>
              );
            })}
                </div>
              </div>
            ))}
          </div>
        )}
      </LaunchContainer>
    </main>
  );
}
