"use client";

// v2 커리어 기록 — 기존 작성 히스토리(CareerHistoryScreen)와 같은 데이터(useCareerFeed·removeFeedEntry)를 v2 모양으로.
// 이력서·자기소개서에 남긴 기록이 최신순으로 쌓이고, 한 줄씩 지울 수 있다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { V2Shell } from "../V2Shell";
import { Button, Masthead, Page, Section } from "../ui";
import { SECTION_META, type CareerSection } from "../../../lib/talent/career-chat";
import { formatRelativeTime, removeFeedEntry, useCareerFeed, type FeedEntry } from "../../../lib/talent/career-feed";
import { usePlatformT } from "../../../lib/i18n";

const R = {
  career: "/talent/career",
  resume: "/talent/career/resume/editor",
  cover: "/talent/career/cover/editor"
};

// 목적격 조사(을/를) — 한글 받침 여부로(기존 FeedCard 와 같은 규칙).
function withObjectParticle(word: string): string {
  const ch = word.charCodeAt(word.length - 1);
  const isHangul = ch >= 0xac00 && ch <= 0xd7a3;
  if (!isHangul) return `${word}을`;
  return `${word}${(ch - 0xac00) % 28 !== 0 ? "을" : "를"}`;
}

// 섹션 표시 이름(언어별 짧은 라벨) — 기존 FeedCard 와 같은 값.
const SECTION_BASE: Record<CareerSection, [string, string, string, string, string, string]> = {
  education: ["학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan"],
  certificate: ["자격증", "Certificate", "证书", "Chứng chỉ", "資格", "Sertifikat"],
  experience: ["경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman"],
  project: ["프로젝트", "Project", "项目", "Dự án", "プロジェクト", "Proyek"],
  language: ["어학", "Language", "语言", "Ngoại ngữ", "語学", "Bahasa"],
  skill: ["스킬", "Skill", "技能", "Kỹ năng", "スキル", "Keahlian"],
  award: ["수상", "Award", "获奖", "Giải thưởng", "受賞", "Penghargaan"],
  activity: ["대외활동", "Activity", "课外活动", "Hoạt động", "課外活動", "Aktivitas"]
};

export function V2HistoryScreen() {
  const t = usePlatformT();
  const feed = useCareerFeed();
  return (
    <V2Shell requireAuth>
      <Page>
        <BackLink />
        <Masthead
          eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karierku")}
          title={t("커리어 기록", "Career log", "职业记录", "Nhật ký", "キャリア記録", "Catatan karier")}
          lede={t("이력서·자기소개서에 남긴 내용이 순서대로 쌓여요.", "What you add to your resume and cover letter piles up here.", "你在简历和求职信中留下的内容会按顺序累积。", "Nội dung bạn thêm vào CV và thư được lưu theo thứ tự.", "履歴書・自己PRに残した内容が順に積み重なります。", "Isian CV dan surat lamaranmu tersimpan berurutan.")}
        />
        <Section title={feed.length ? t(`전체 ${feed.length}`, `All ${feed.length}`, `全部 ${feed.length}`, `Tất cả ${feed.length}`, `すべて ${feed.length}`, `Semua ${feed.length}`) : t("전체", "All", "全部", "Tất cả", "すべて", "Semua")}>
          {feed.length ? (
            <ul className="flex flex-col">
              {feed.map((e) => (
                <FeedRow key={e.id} entry={e} />
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl bg-[color:var(--v2-fill)] px-5 py-10 text-center">
              <span aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--v2-band)] text-[26px]">📝</span>
              <p className="mt-4 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("아직 남긴 기록이 없어요", "No records yet", "还没有记录", "Chưa có ghi chép", "まだ記録がありません", "Belum ada catatan")}</p>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("이력서나 자기소개서를 만들면 자동으로 여기에 쌓여요.", "Make a resume or cover letter and it shows up here.", "制作简历或求职信后会自动累积在这里。", "Tạo CV hoặc thư xin việc sẽ tự lưu tại đây.", "履歴書や自己PRを作ると自動でここに溜まります。", "Buat CV atau surat lamaran, otomatis muncul di sini.")}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button href={R.resume} variant="secondary">
                  {t("이력서 쓰기", "Write resume", "写简历", "Viết CV", "履歴書を書く", "Tulis CV")}
                </Button>
                <Button href={R.cover} variant="neutral">
                  {t("자소서 쓰기", "Write letter", "写求职信", "Viết thư", "自己PRを書く", "Tulis surat")}
                </Button>
              </div>
            </div>
          )}
        </Section>
      </Page>
    </V2Shell>
  );
}

/** 뒤로 — 들어온 곳으로(바로 열었으면 내 커리어로). */
function BackLink() {
  const t = usePlatformT();
  const router = useRouter();
  return (
    <div className="px-5 pt-5">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(R.career))}
        className="-ml-1.5 inline-flex h-9 items-center gap-0.5 rounded-lg pl-1 pr-2.5 text-[15px] font-semibold text-[color:var(--v2-muted)] transition hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-ink-3)]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {t("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}
      </button>
    </div>
  );
}

/** 기록 한 줄 — 왼쪽 아이콘, 제목('경험을 업데이트했어요!')·내용 두 줄·시간, 오른쪽 지우기. 누르면 그 기록이 있던 곳으로. */
function FeedRow({ entry }: { entry: FeedEntry }) {
  const t = usePlatformT();
  const emoji = entry.emoji ?? SECTION_META[entry.section]?.emoji ?? "📝";
  const b = SECTION_BASE[entry.section] ?? ["항목", "item", "项目", "mục", "項目", "item"];
  const title = t(`${withObjectParticle(b[0])} 업데이트했어요!`, `Updated ${b[1]}!`, `已更新${b[2]}！`, `Đã cập nhật ${b[3]}!`, `${b[4]}を更新しました！`, `${b[5]} diperbarui!`);
  // 기존 기록의 href 는 옛 주소일 수 있다 — 옛 주소는 next.config 에서 이관되므로 그대로 따른다. 없으면 내 커리어로.
  const href = entry.href ?? R.career;
  return (
    <li className="relative">
      <Link href={href} className="-mx-2 flex w-[calc(100%+16px)] items-start gap-3.5 rounded-2xl py-3.5 pl-2 pr-12 transition active:bg-[color:var(--v2-band)] md:hover:bg-[color:var(--v2-fill)]">
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-band)] text-[20px]">
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{title}</span>
          <span className="mt-0.5 line-clamp-2 text-[15px] leading-[1.5] text-[color:var(--v2-ink-3)]">{entry.text}</span>
          <span className="mt-1 block text-[13px] text-[color:var(--v2-faint)]">{formatRelativeTime(entry.createdAt, undefined, t)}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => removeFeedEntry(entry.id)}
        aria-label={t("기록 삭제", "Delete entry", "删除记录", "Xóa mục", "記録を削除", "Hapus catatan")}
        className="absolute right-0 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--v2-faint)] transition hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-attention)]"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </svg>
      </button>
    </li>
  );
}
