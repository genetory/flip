"use client";

// 기업 인재 검색 노출 — 가입하면 기본으로 켜져 있고(블라인드), 설정에서 끌 수 있다.
//  - useTalentPool: 노출 상태 + 기업에게 보이는 내 카드(서버 GET /members/me/talent-pool)
//  - TalentPoolLine: 홈 서류 칸 아래 한 줄(노출 중·관심 준 회사 / 덜 채움 / 꺼 둠)
//  - TalentCardSheet: '기업에게 이렇게 보여요' — 파트너 인재 검색 카드와 같은 내용(이름·연락처 등은 가림)
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sheet } from "./sheets";
import { Button } from "./ui";
import { type PlatformT } from "../../lib/i18n";
import { getTalentPoolStatus, setTalentPool, type TalentPoolStatus } from "../../lib/candidate-connect-client";

export function useTalentPool(): { status: TalentPoolStatus | null; setVisible: (on: boolean) => Promise<void> } {
  const [status, setStatus] = useState<TalentPoolStatus | null>(null);
  const load = useCallback(() => {
    getTalentPoolStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const setVisible = async (on: boolean) => {
    setStatus((s) => (s ? { ...s, optedOut: !on, visible: on && s.complete } : s));
    try {
      await setTalentPool(on);
    } catch (e) {
      load(); // 실패하면 서버 상태로 되돌린다
      throw e;
    }
  };
  return { status, setVisible };
}

/** 홈 서류 칸 아래 한 줄 — 지금 기업에게 보이는지. 보이면 [이렇게 보여요]로 미리보기. */
export function TalentPoolLine({ t, status, onPreview }: { t: PlatformT; status: TalentPoolStatus | null; onPreview: () => void }) {
  if (!status) return null;
  const dot = status.visible ? "bg-[color:var(--v2-good)]" : "bg-[color:var(--v2-line)]";
  const text = status.optedOut
    ? t("기업 인재 검색 노출을 꺼 두었어요", "Hidden from company talent search", "已关闭企业人才搜索展示", "Đang ẩn khỏi tìm kiếm", "人材検索への表示はオフです", "Disembunyikan dari pencarian")
    : !status.complete
      ? t("이력서를 채우면 기업이 나를 찾을 수 있어요", "Fill your resume so companies can find you", "完善简历后企业就能找到你", "Hoàn thiện CV để doanh nghiệp tìm thấy bạn", "履歴書を埋めると企業があなたを見つけられます", "Lengkapi CV agar perusahaan menemukanmu")
      : status.interestedCount
        ? t(`기업 인재 검색에 보이는 중 · 관심 준 회사 ${status.interestedCount}곳`, `Visible to companies · ${status.interestedCount} interested`, `企业可见 · ${status.interestedCount} 家感兴趣`, `Đang hiển thị · ${status.interestedCount} quan tâm`, `企業に表示中 · 関心${status.interestedCount}社`, `Terlihat · ${status.interestedCount} tertarik`)
        : t("기업 인재 검색에 보이는 중", "Visible in company talent search", "在企业人才搜索中可见", "Đang hiển thị với doanh nghiệp", "企業の人材検索に表示中", "Terlihat di pencarian");
  return (
    <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl px-1 py-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[14px] text-[color:var(--v2-ink-3)]">{text}</span>
      {status.optedOut ? (
        <Link href="/v2/settings" className="shrink-0 whitespace-nowrap text-[14px] font-semibold text-[color:var(--v2-accent)]">
          {t("설정", "Settings", "设置", "Cài đặt", "設定", "Atur")}
        </Link>
      ) : status.card ? (
        <button type="button" onClick={onPreview} className="shrink-0 whitespace-nowrap text-[14px] font-semibold text-[color:var(--v2-accent)]">
          {t("이렇게 보여요", "Preview", "预览", "Xem trước", "見え方", "Pratinjau")} ›
        </button>
      ) : null}
    </div>
  );
}

/** 기업에게 보이는 내 카드 — 파트너 인재 검색 카드와 같은 내용(블라인드). */
export function TalentCardSheet({ t, status, onClose }: { t: PlatformT; status: TalentPoolStatus; onClose: () => void }) {
  const c = status.card;
  const counts = c ? [c.careerCount ? t(`경력 ${c.careerCount}`, `${c.careerCount} jobs`, `经历 ${c.careerCount}`, `${c.careerCount} KN`, `経歴${c.careerCount}`, `${c.careerCount} kerja`) : null, c.activityCount ? t(`활동·프로젝트 ${c.activityCount}`, `${c.activityCount} projects`, `活动 ${c.activityCount}`, `${c.activityCount} dự án`, `活動${c.activityCount}`, `${c.activityCount} proyek`) : null].filter(Boolean) : [];
  return (
    <Sheet
      tall
      title={t("기업에게 이렇게 보여요", "How companies see you", "企业看到的你", "Doanh nghiệp thấy bạn thế nào", "企業からの見え方", "Tampilan bagi perusahaan")}
      subtitle={t("기업 인재 검색에 나오는 내 카드예요", "Your card in company talent search", "企业人才搜索中的你的卡片", "Thẻ của bạn trong tìm kiếm", "人材検索に出るあなたのカード", "Kartumu di pencarian")}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="neutral" full href="/v2/settings">
            {t("노출 설정", "Visibility", "展示设置", "Cài đặt", "表示設定", "Atur")}
          </Button>
          <Button full href="/talent/career/resume/editor">
            {t("이력서 고치기", "Edit resume", "修改简历", "Sửa CV", "履歴書を編集", "Ubah CV")}
          </Button>
        </div>
      }
    >
      {c ? (
        <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[20px] text-[color:var(--v2-faint)]" aria-hidden>
              ?
            </span>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-bold text-[color:var(--v2-ink)]">{c.desiredJobRole || t("희망 직무 미입력", "No desired role", "未填写期望职位", "Chưa có vị trí", "希望職種未入力", "Belum ada peran")}</p>
              <p className="truncate text-[13px] text-[color:var(--v2-muted)]">{[c.school, c.major].filter(Boolean).join(" · ") || t("학력 미입력", "No education", "未填写学历", "Chưa có học vấn", "学歴未入力", "Belum ada pendidikan")}</p>
            </div>
          </div>
          {c.summary ? <p className="mt-4 text-[14px] leading-[1.65] text-[color:var(--v2-ink-2)]">{c.summary}</p> : null}
          {c.skills.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.skills.map((k) => (
                <span key={k} className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
                  {k}
                </span>
              ))}
            </div>
          ) : null}
          {c.languages.length || counts.length ? <p className="mt-3 text-[13px] text-[color:var(--v2-muted)]">{[...c.languages.slice(0, 2), ...counts].join(" · ")}</p> : null}
        </div>
      ) : null}
      <ul className="mt-5 flex flex-col gap-2.5 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">
        <Note icon="🙈">{t("이름·사진·연락처·국적·비자는 가려져요. 글 속 이름·연락처도 지워서 보여 줘요.", "Name, photo, contact, nationality and visa are hidden — even inside your text.", "姓名、照片、联系方式、国籍和签证都会隐藏，文中的也会删除。", "Tên, ảnh, liên hệ, quốc tịch, visa được ẩn — kể cả trong nội dung.", "名前・写真・連絡先・国籍・ビザは隠れます。本文中のものも消します。", "Nama, foto, kontak, kewarganegaraan, visa disembunyikan.")}</Note>
        <Note icon="🤝">{t("기업이 연결을 요청하고 내가 수락해야 연락처가 공개돼요.", "Contact is shared only after you accept a company's request.", "企业发出请求且你接受后才会公开联系方式。", "Liên hệ chỉ chia sẻ sau khi bạn chấp nhận.", "企業の申請をあなたが承認して初めて連絡先が公開されます。", "Kontak dibagikan setelah kamu menerima.")}</Note>
        <Note icon="📝">{t("자기소개서 답변은 연결 전에도 기업이 읽을 수 있어요. 이름·연락처는 적지 않는 게 좋아요.", "Companies can read your cover letter answers before connecting — avoid writing your name or contact.", "连接前企业也能阅读你的自我介绍回答，建议不要写姓名和联系方式。", "Doanh nghiệp đọc được thư giới thiệu trước khi kết nối — đừng ghi tên, liên hệ.", "自己紹介書の回答はつながる前でも読めます。名前・連絡先は書かないのがおすすめ。", "Perusahaan bisa membaca surat lamaranmu — jangan tulis nama/kontak.")}</Note>
        <Note icon="⚙️">{t("원하지 않으면 설정에서 언제든 끌 수 있어요.", "You can turn this off anytime in Settings.", "可随时在设置中关闭。", "Có thể tắt bất cứ lúc nào trong Cài đặt.", "設定でいつでもオフにできます。", "Bisa dimatikan kapan saja di Pengaturan.")}</Note>
      </ul>
    </Sheet>
  );
}

function Note({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="shrink-0" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
