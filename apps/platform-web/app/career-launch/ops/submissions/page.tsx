"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 피드백 관리 — 기수별로 학생의 제출물과 피드백 전달 상태(보냄/미확인/미작성)를
// 한눈에 보고, 피드백이 필요한 학생을 먼저 찾아 상세에서 작성한다.
export default function LaunchOpsFeedbackPage() {
  const t = useLaunchT();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all"); // "all" | cohortId | "none"
  const [needOnly, setNeedOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchOpsStudents();
        if (alive) setStudents(list);
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

  const cohorts = useMemo(() => {
    const map = new Map<string, { id: string; university: string; name: string }>();
    for (const s of students) if (s.cohort) map.set(s.cohort.id, s.cohort);
    return [...map.values()].sort((a, b) => `${a.university}${a.name}`.localeCompare(`${b.university}${b.name}`));
  }, [students]);
  const hasUnassigned = students.some((s) => !s.cohort);

  const hasSubmission = (s: OpsStudent) => s.hasResume || s.coverItems > 0 || s.interviewPracticed > 0;
  const needsFeedback = (s: OpsStudent) => hasSubmission(s) && s.feedbackTotal === 0;

  const byCohort = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "none") return students.filter((s) => !s.cohort);
    return students.filter((s) => s.cohort?.id === filter);
  }, [students, filter]);

  const filtered = useMemo(() => {
    const list = needOnly ? byCohort.filter(needsFeedback) : byCohort;
    // 피드백 필요 → 미확인 있음 → 나머지 순으로 정렬해 손이 필요한 학생을 위로.
    return [...list].sort((a, b) => {
      const rank = (s: OpsStudent) => (needsFeedback(s) ? 0 : s.feedbackUnread > 0 ? 1 : 2);
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
    });
  }, [byCohort, needOnly]);

  const submitted = byCohort.filter(hasSubmission).length;
  const needCount = byCohort.filter(needsFeedback).length;
  const unreadCount = byCohort.reduce((n, s) => n + s.feedbackUnread, 0);
  const sentCount = byCohort.reduce((n, s) => n + s.feedbackTotal, 0);

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6">
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{t("피드백 관리", "Feedback management", "反馈管理", "Quản lý phản hồi", "フィードバック管理", "Manajemen umpan balik")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("제출물과 피드백 전달 상태를 보고, 피드백이 필요한 학생을 먼저 챙기세요.", "Track submissions and delivery status, and prioritize students who still need feedback.", "查看提交物与反馈送达状态，优先处理仍需反馈的学生。", "Theo dõi bài nộp và trạng thái gửi phản hồi, ưu tiên sinh viên còn cần phản hồi.", "提出物とフィードバックの送達状況を確認し、フィードバックが必要な学生を優先しましょう。", "Pantau kiriman dan status pengiriman umpan balik, dahulukan siswa yang masih butuh umpan balik.")}</p>
        </div>

        {/* 기수 필터 */}
        {!loading && (cohorts.length > 0 || hasUnassigned) ? (
          <div className="mb-5 flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>{t("전체", "All", "全部", "Tất cả", "全体", "Semua")} {students.length}</FilterChip>
            {cohorts.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.university} · {c.name} {students.filter((s) => s.cohort?.id === c.id).length}
              </FilterChip>
            ))}
            {hasUnassigned ? (
              <FilterChip active={filter === "none"} onClick={() => setFilter("none")}>{t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")} {students.filter((s) => !s.cohort).length}</FilterChip>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2.5 sm:max-w-lg">
          {[
            { id: "submitted", k: t("제출한 학생", "Submitted", "已提交", "Đã nộp", "提出済み", "Sudah kirim"), v: submitted, tone: "text-[#0B46E8]" },
            { id: "need", k: t("피드백 필요", "Needs feedback", "需反馈", "Cần phản hồi", "要対応", "Butuh umpan balik"), v: needCount, tone: "text-amber-600" },
            { id: "unread", k: t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca"), v: unreadCount, tone: "text-amber-600" },
            { id: "sent", k: t("보낸 피드백", "Feedback sent", "已发送", "Đã gửi", "送信済み", "Terkirim"), v: sentCount, tone: "text-[#3A6B00]" }
          ].map((s) => (
            <Card key={s.id} className="!p-4 text-center">
              <p className={`text-[22px] font-black ${s.tone}`}>{s.v}</p>
              <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{s.k}</p>
            </Card>
          ))}
        </div>

        <div className="mt-7">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <SectionTitle sub={t("카드를 누르면 상세에서 피드백을 작성해요", "Tap a card to write feedback on the detail page", "点击卡片可在详情页填写反馈", "Nhấn vào thẻ để viết phản hồi ở trang chi tiết", "カードをタップすると詳細でフィードバックを書けます", "Ketuk kartu untuk menulis umpan balik di halaman detail")}>{t("학생별 피드백 현황", "Feedback by student", "各学生反馈状态", "Phản hồi theo sinh viên", "学生別フィードバック状況", "Umpan balik per siswa")}</SectionTitle>
            <button
              type="button"
              onClick={() => setNeedOnly((v) => !v)}
              className={`flex-none rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${needOnly ? "bg-amber-500 text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E9ECF0]"}`}
            >
              {t("피드백 필요만", "Needs feedback only", "仅需反馈", "Chỉ cần phản hồi", "要対応のみ", "Hanya butuh umpan balik")} {needCount}
            </button>
          </div>
          {loading ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
          ) : error ? (
            <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
          ) : filtered.length === 0 ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{needOnly ? t("피드백이 필요한 학생이 없어요.", "No students need feedback.", "没有需要反馈的学生。", "Không có sinh viên cần phản hồi.", "対応が必要な学生はいません。", "Tidak ada siswa yang butuh umpan balik.") : t("표시할 학생이 없어요.", "No students to show.", "没有可显示的学生。", "Không có sinh viên để hiển thị.", "表示する学生がいません。", "Tidak ada siswa untuk ditampilkan.")}</Card>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((st) => (
                <Link key={st.userId} href={`/career-launch/ops/students/${st.userId}`} className="block">
                  <Card className="h-full !p-4 transition hover:border-[#0B46E8]/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">
                          {(st.name ?? st.email).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#191F28]">{st.name ?? t("이름 미설정", "No name set", "未设置姓名", "Chưa đặt tên", "名前未設定", "Nama belum diatur")}</p>
                          {st.cohort ? (
                            <p className="truncate text-[11.5px] font-semibold text-[#0B46E8]">🎓 {st.cohort.university} · {st.cohort.name}</p>
                          ) : (
                            <p className="truncate text-[12px] text-[#8B95A1]">{st.email}</p>
                          )}
                        </div>
                      </div>
                      {needsFeedback(st) ? (
                        <Pill tone="grey"><span className="text-amber-600">{t("피드백 필요", "Needs feedback", "需反馈", "Cần phản hồi", "要対応", "Butuh")}</span></Pill>
                      ) : st.feedbackUnread > 0 ? (
                        <Pill tone="grey"><span className="text-amber-600">{t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum")} {st.feedbackUnread}</span></Pill>
                      ) : st.feedbackTotal > 0 ? (
                        <Pill tone="green">{t("전달됨", "Delivered", "已送达", "Đã gửi", "送達済み", "Terkirim")}</Pill>
                      ) : null}
                    </div>

                    {/* 제출물 신호 */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Sig on={st.hasResume}>{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</Sig>
                      <Sig on={st.coverItems > 0}>{t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")} {st.coverItems}</Sig>
                      <Sig on={st.interviewPracticed > 0}>{t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} {st.interviewPracticed}/3</Sig>
                    </div>

                    {/* 피드백 전달 상태 */}
                    <div className="mt-2.5 border-t border-[#F2F4F6] pt-2.5 text-[12px]">
                      {st.feedbackTotal > 0 ? (
                        <div className="flex items-center gap-2 text-[#4E5968]">
                          <span className="font-bold">{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")} {st.feedbackTotal}</span>
                          {st.feedbackUnread > 0 ? (
                            <span className="text-amber-600">· {t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca")} {st.feedbackUnread}</span>
                          ) : (
                            <span className="text-[#3A6B00]">· {t("모두 읽음", "All read", "全部已读", "Đã đọc hết", "全て既読", "Semua dibaca")}</span>
                          )}
                          {st.feedbackLastAt ? <span className="ml-auto text-[#B0B8C1]">{st.feedbackLastAt.slice(0, 10)}</span> : null}
                        </div>
                      ) : hasSubmission(st) ? (
                        <span className="font-semibold text-amber-600">{t("아직 피드백을 보내지 않았어요", "No feedback sent yet", "尚未发送反馈", "Chưa gửi phản hồi", "まだフィードバックを送っていません", "Belum ada umpan balik terkirim")}</span>
                      ) : (
                        <span className="text-[#B0B8C1]">{t("제출물이 아직 없어요", "No submissions yet", "尚无提交物", "Chưa có bài nộp", "提出物がまだありません", "Belum ada kiriman")}</span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </LaunchContainer>
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E9ECF0]"}`}
    >
      {children}
    </button>
  );
}

// 제출 신호 배지 — 있으면 초록, 없으면 회색.
function Sig({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-[#EAFFD1] text-[#3A6B00]" : "bg-[#F2F4F6] text-[#B0B8C1]"}`}>{children}</span>
  );
}
