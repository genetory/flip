"use client";

// 알림 — 내 활동(지원·팔로우·저장)과 소식(팔로잉 새 글·회사 새 공고)을 함께 모아본다.
// 언더라인 탭(포지션 탐색과 동일) + 리스트 형식. 동적 스토어(mock).
import { useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight, Checks } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useNotifications, markAllNotificationsRead, markNotificationRead, type Notification, type NotificationKind } from "../../../lib/talent/notifications";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

type Filter = "all" | "activity" | "update";

function filters(t: PlatformT): { key: Filter; label: string }[] {
  return [
    { key: "all", label: t("전체", "All", "全部", "Tất cả", "すべて", "Semua") },
    { key: "activity", label: t("내 활동", "My activity", "我的活动", "Hoạt động của tôi", "自分の活動", "Aktivitas saya") },
    { key: "update", label: t("소식", "Updates", "动态", "Tin tức", "お知らせ", "Kabar") }
  ];
}

// 동적 알림이 없을 때 노출할 추천(정적).
function suggestions(t: PlatformT) {
  return [
    { id: "tip-resume", emoji: "📝", title: t("이력서를 완성해보세요", "Complete your resume", "完善你的简历", "Hoàn thành hồ sơ", "履歴書を完成させましょう", "Lengkapi resume kamu"), body: t("기본 정보를 등록하면 이력서를 만들 수 있어요.", "Add basic info to create your resume.", "填写基本信息即可创建简历。", "Điền thông tin cơ bản để tạo hồ sơ.", "基本情報を登録すると履歴書を作れます。", "Isi info dasar untuk membuat resume."), href: talentAppRoutes.resume },
    { id: "tip-jobs", emoji: "💼", title: t("새로운 추천 공고가 있어요", "New recommended jobs", "有新的推荐职位", "Có việc gợi ý mới", "新しいおすすめ求人があります", "Ada lowongan rekomendasi baru"), body: t("관심 직무에 맞는 공고를 확인해보세요.", "Check jobs matching your interests.", "查看符合你兴趣的职位。", "Xem việc phù hợp với sở thích.", "関心のある職種に合う求人を確認しましょう。", "Cek lowongan sesuai minatmu."), href: talentAppRoutes.jobs }
  ];
}

export function NotificationsScreen() {
  const t = usePlatformT();
  const dynamic = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const unread = useMemo(() => dynamic.filter((n) => n.unread).length, [dynamic]);

  const filtered = useMemo(
    () => (filter === "all" ? dynamic : dynamic.filter((n) => (n.kind ?? "update") === filter)),
    [dynamic, filter]
  );

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("알림", "Notifications", "通知", "Thông báo", "お知らせ", "Notifikasi")}{unread > 0 ? <span className="ml-1.5 align-middle text-[15px] font-black text-[#0B46E8]">{unread}</span> : null}</h1>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
              >
                <Checks className="h-4 w-4" weight="bold" /> {t("모두 읽음", "Mark all read", "全部已读", "Đọc hết", "すべて既読", "Tandai dibaca")}
              </button>
            ) : null}
          </div>
        </div>

        {/* 카테고리 탭 — 포지션 탐색과 동일한 언더라인 탭 바 */}
        <div className="flex gap-6">
          {filters(t).map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-current={active ? "page" : undefined}
                className={`relative pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
              >
                {f.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
            {filtered.map((n, i) => (
              <Row key={n.id} n={n} last={i === filtered.length - 1} />
            ))}
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}

function kindStyle(t: PlatformT): Record<NotificationKind, { text: string; label: string; avatar: string }> {
  return {
    activity: { text: "text-[#8B95A1]", label: t("내 활동", "My activity", "我的活动", "Hoạt động của tôi", "自分の活動", "Aktivitas saya"), avatar: "bg-[#EDF1FD]" },
    update: { text: "text-[#8B95A1]", label: t("소식", "Updates", "动态", "Tin tức", "お知らせ", "Kabar"), avatar: "bg-[#F2F4F6]" }
  };
}

function Row({ n, last }: { n: Notification; last: boolean }) {
  const t = usePlatformT();
  const style = kindStyle(t);
  const s = style[n.kind] ?? style.update;
  return (
    <Link
      href={n.href}
      onClick={() => markNotificationRead(n.id)}
      className={`flex items-start gap-3.5 px-4 py-4 transition ${n.unread ? "bg-[#F5F8FF] hover:bg-[#EEF3FE]" : "hover:bg-[#F6F8FB]"} ${last ? "" : "border-b border-[#F2F4F6]"}`}
    >
      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[19px] ${s.avatar}`} aria-hidden>
        {n.emoji}
        {n.unread ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0B46E8]" aria-label={t("안 읽음", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca")} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-normal ${s.text}`}>{s.label}</span>
          <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(n.createdAt, undefined, t)}</span>
        </div>
        <p className={`mt-1.5 truncate text-[14.5px] ${n.unread ? "font-bold text-[#191F28]" : "font-semibold text-[#4E5968]"}`}>{n.title}</p>
        <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{n.body}</p>
      </div>
      <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
    </Link>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const t = usePlatformT();
  const msg =
    filter === "activity"
      ? t("지원·팔로우·저장 같은 활동이 여기 쌓여요.", "Activity like applications, follows, and saves collects here.", "申请、关注、收藏等活动会汇集在这里。", "Các hoạt động như ứng tuyển, theo dõi, lưu sẽ tập hợp ở đây.", "応募・フォロー・保存などの活動がここに集まります。", "Aktivitas seperti lamaran, follow, dan simpan terkumpul di sini.")
      : filter === "update"
        ? t("팔로우한 사람·회사의 새 소식이 여기 도착해요.", "New updates from people and companies you follow arrive here.", "你关注的人和公司的新动态会到达这里。", "Tin mới từ người và công ty bạn theo dõi sẽ đến đây.", "フォローした人・会社の新しいお知らせがここに届きます。", "Kabar baru dari orang dan perusahaan yang kamu ikuti muncul di sini.")
        : t("활동이 생기면 여기에서 알려드릴게요.", "We'll let you know here when something happens.", "有动态时会在这里通知你。", "Khi có hoạt động, chúng tôi sẽ báo tại đây.", "動きがあればここでお知らせします。", "Kami beri tahu di sini saat ada aktivitas.");
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🔔</span>
        <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("새로운 알림이 없어요", "No new notifications", "没有新通知", "Chưa có thông báo mới", "新しいお知らせはありません", "Tidak ada notifikasi baru")}</p>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{msg}</p>
      </div>
      {filter !== "update" ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
          {suggestions(t).map((sug, i, arr) => (
            <Link
              key={sug.id}
              href={sug.href}
              className={`flex items-start gap-3.5 px-4 py-4 transition hover:bg-[#F6F8FB] ${i === arr.length - 1 ? "" : "border-b border-[#F2F4F6]"}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[19px]" aria-hidden>{sug.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-[#191F28]">{sug.title}</p>
                <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{sug.body}</p>
              </div>
              <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
