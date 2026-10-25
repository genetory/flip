"use client";

// v2 기업 연결 — 기존 기업 연결(TalentConnectionsScreen)과 '나에게 관심 준 회사'(InterestedCompaniesScreen, /talent/feed)를 한 화면에.
// 받은 연결 요청(수락·거절) → 나에게 관심 준 회사 → 기업 인재 검색 노출(켜고 끄기·기업에게 보이는 내 카드).
// 같은 API(lib/candidate-connect-client · getInterestedCompanies)를 쓴다. 관심 준 회사 구획은 #interested 로 바로 갈 수 있다.
import { useEffect, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Empty, Masthead, Page, Row, RowsSkeleton, Section, Switch } from "../ui";
import { TalentCardSheet, useTalentPool } from "../talent-pool";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { listMyConnections, respondConnection, type MyConnection } from "../../../lib/candidate-connect-client";
import { getInterestedCompanies, type InterestedCompany } from "../../../lib/member-profile-client";

export function V2ConnectionsScreen() {
  return (
    <V2Shell requireAuth>
      <Connections />
    </V2Shell>
  );
}

function Connections() {
  const t = usePlatformT();
  const toast = useTalentPopup();
  const pool = useTalentPool();
  const [conns, setConns] = useState<MyConnection[] | null>(null);
  const [interested, setInterested] = useState<InterestedCompany[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let alive = true;
    listMyConnections()
      .then((c) => alive && setConns(c))
      .catch(() => alive && setConns([]));
    getInterestedCompanies()
      .then((l) => alive && setInterested(l))
      .catch(() => alive && setInterested([]));
    return () => {
      alive = false;
    };
  }, []);

  // 주소에 #interested 가 있으면 다 불러온 뒤 그 구획으로.
  useEffect(() => {
    if (interested === null || conns === null || typeof window === "undefined") return;
    if (window.location.hash === "#interested") document.getElementById("interested")?.scrollIntoView({ block: "start" });
  }, [interested, conns]);

  // 인재 검색 노출은 가입하면 기본으로 켜져 있다 — 끈 기록(optedOut)이 있을 때만 꺼짐.
  const optIn = pool.status ? !pool.status.optedOut : true;
  const togglePool = (on: boolean) =>
    pool
      .setVisible(on)
      .then(() => toast.success(on ? t("인재 검색 노출을 켰어요", "Talent search visibility on", "已开启人才搜索展示", "Đã bật hiển thị", "人材検索への表示をオンにしました", "Visibilitas aktif") : t("인재 검색 노출을 껐어요", "Talent search visibility off", "已关闭人才搜索展示", "Đã tắt hiển thị", "人材検索への表示をオフにしました", "Visibilitas nonaktif")))
      .catch(() => toast.error(t("바꾸지 못했어요. 잠시 후 다시 해 주세요.", "Couldn't change it. Try again.", "更改失败，请稍后再试。", "Không đổi được. Thử lại.", "変更できませんでした。", "Gagal mengubah.")));

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      await respondConnection(id, action);
      setConns((prev) => (prev ?? []).map((c) => (c.id === id ? { ...c, status: action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date().toISOString() } : c)));
      toast.success(action === "accept" ? t("연결을 수락했어요", "Connection accepted", "已接受连接", "Đã chấp nhận kết nối", "つながりを承認しました", "Koneksi diterima") : t("연결을 거절했어요", "Connection declined", "已拒绝连接", "Đã từ chối kết nối", "つながりを拒否しました", "Koneksi ditolak"));
    } catch {
      toast.error(t("처리하지 못했어요. 잠시 후 다시 해 주세요.", "Something went wrong. Try again.", "处理失败，请稍后再试。", "Xử lý thất bại. Thử lại.", "処理できませんでした。", "Gagal memproses."));
    } finally {
      setBusyId(null);
    }
  }

  const pending = (conns ?? []).filter((c) => c.status === "PENDING").length;

  return (
    <Page>
      <Masthead
        eyebrow={t("기업 연결", "Connections", "企业连接", "Kết nối", "企業とのつながり", "Koneksi")}
        title={
          pending
            ? t(`답을 기다리는 연결 요청이 ${pending}개 있어요`, `${pending} request${pending > 1 ? "s" : ""} waiting for you`, `有 ${pending} 个连接请求待回复`, `${pending} yêu cầu đang chờ bạn`, `返事待ちの申請が${pending}件あります`, `${pending} permintaan menunggu`)
            : t("나를 찾는 회사를 모아 봤어요", "Companies reaching out to you", "关注你的公司都在这里", "Công ty đang tìm bạn", "あなたに注目する企業", "Perusahaan yang mencarimu")
        }
        lede={t("기업이 보낸 연결 요청과 관심을 확인하고, 인재 검색 노출을 관리해요.", "Review requests and interest from companies, and manage your visibility.", "查看企业发来的连接请求和关注，并管理人才搜索展示。", "Xem yêu cầu, sự quan tâm và quản lý hiển thị.", "企業からの申請・関心を確認し、人材検索への表示を管理します。", "Lihat permintaan & minat, serta atur visibilitas.")}
      />

      {/* 받은 연결 요청 — 수락하면 서로 연락처가 공개된다 */}
      <Section
        title={t("받은 연결 요청", "Requests", "收到的请求", "Yêu cầu", "つながり申請", "Permintaan")}
        aside={conns?.length ? <span className="text-[14px] text-[color:var(--v2-muted)]">{conns.length}</span> : undefined}
      >
        {conns === null ? (
          <RowsSkeleton count={2} />
        ) : conns.length ? (
          <div className="flex flex-col gap-2">
            {conns.map((c) => (
              <ConnectionCard key={c.id} t={t} c={c} busy={busyId === c.id} onRespond={(a) => void respond(c.id, a)} />
            ))}
          </div>
        ) : (
          <Empty>
            {optIn
              ? t("아직 받은 연결 요청이 없어요. 인재 검색에 보이면 기업이 먼저 연락할 수 있어요.", "No requests yet. Companies can reach out first while you're visible in talent search.", "还没有收到连接请求。在人才搜索中可见时，企业可以主动联系你。", "Chưa có yêu cầu. Khi hiển thị, doanh nghiệp có thể liên hệ trước.", "まだ申請はありません。人材検索に表示されていると企業から連絡が来ることがあります。", "Belum ada permintaan. Saat terlihat, perusahaan bisa menghubungimu.")
              : t("아직 받은 연결 요청이 없어요. 인재 검색 노출을 켜면 기업이 먼저 연락할 수 있어요.", "No requests yet. Turn on visibility so companies can reach out.", "还没有收到连接请求。开启人才搜索展示后，企业可以主动联系你。", "Chưa có yêu cầu. Bật hiển thị để doanh nghiệp liên hệ.", "まだ申請はありません。表示をオンにすると企業から連絡が来ることがあります。", "Belum ada permintaan. Aktifkan visibilitas.")}
          </Empty>
        )}
      </Section>

      {/* 나에게 관심 준 회사 — 파트너가 블라인드(능력만 보고)로 나를 관심 목록에 담은 회사 */}
      <div id="interested" className="scroll-mt-28">
        <Section
          title={t("나에게 관심 준 회사", "Interested in you", "对你感兴趣的公司", "Quan tâm đến bạn", "あなたに関心を持った企業", "Tertarik padamu")}
          aside={interested?.length ? <span className="text-[14px] text-[color:var(--v2-muted)]">{interested.length}</span> : undefined}
        >
          <p className="text-[14px] leading-[1.6] text-[color:var(--v2-faint)]">
            {t("회사에는 이름·사진·성별·국적이 가려진 채 스킬·경험·언어 능력만 보여요. 이력서·자기소개서를 충실히 채울수록 관심받기 쉬워요.", "Companies see only your skills, experience and languages — name, photo, gender and nationality are hidden. A fuller resume gets more interest.", "企业只能看到你的技能、经验和语言能力，姓名、照片、性别和国籍都被隐藏。资料越完整，越容易获得关注。", "Doanh nghiệp chỉ thấy kỹ năng, kinh nghiệm, ngôn ngữ — tên, ảnh, giới tính, quốc tịch được ẩn.", "企業にはスキル・経験・語学力だけが見え、名前・写真・性別・国籍は隠されます。", "Perusahaan hanya melihat keahlian, pengalaman, dan bahasa — data pribadi disembunyikan.")}
          </p>
          <div className="mt-2">
            {interested === null ? (
              <RowsSkeleton count={2} />
            ) : interested.length ? (
              interested.map((c) => <InterestedLine key={c.organizationId} t={t} c={c} />)
            ) : (
              <Empty>{t("아직 관심을 준 회사가 없어요. 이력서를 채우면 회사들이 능력을 보고 관심을 표할 수 있어요.", "No companies yet. Fill in your resume so companies can show interest in your skills.", "还没有公司关注你。完善简历后，公司可凭能力关注你。", "Chưa có công ty nào. Hoàn thiện CV để công ty quan tâm theo năng lực.", "まだありません。履歴書を埋めると企業が能力を見て関心を示せます。", "Belum ada. Lengkapi CV agar perusahaan tertarik.")}</Empty>
            )}
          </div>
        </Section>
      </div>

      {/* 기업 인재 검색 노출 — 가입하면 기본으로 켜져 있다(블라인드). 끄면 검색·새 연결 요청에서 빠진다. */}
      <Section title={t("인재 검색 노출", "Talent search", "人才搜索展示", "Hiển thị tìm kiếm", "人材検索への表示", "Pencarian talenta")}>
        <div className="flex items-center gap-3 py-3.5">
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{t("기업 인재 검색에 보이기", "Show me to companies", "在企业人才搜索中展示", "Hiển thị với doanh nghiệp", "企業の人材検索に表示", "Tampil ke perusahaan")}</span>
            <span className="mt-0.5 block text-[14px] leading-[1.5] text-[color:var(--v2-faint)]">
              {t("대표 이력서가 이름·연락처를 가린 채 보이고, 연락처는 내가 연결을 수락할 때만 공개돼요. 끄면 검색과 새 연결 요청에서 빠져요.", "Your main resume shows with name and contact hidden; contact is shared only when you accept. Off = out of search and new requests.", "主简历会隐藏姓名和联系方式展示，仅在你接受连接时公开联系方式。关闭后不再出现在搜索和新请求中。", "CV chính hiển thị, ẩn tên và liên hệ; chỉ chia sẻ khi bạn chấp nhận. Tắt = rời tìm kiếm.", "代表の履歴書が名前・連絡先を隠して表示され、連絡先は承認時のみ公開。オフで検索と新規申請から外れます。", "CV utama tampil tanpa nama & kontak; kontak dibagikan saat kamu menerima.")}
            </span>
          </span>
          <Switch on={optIn} onChange={(v) => void togglePool(v)} label={<span className="sr-only">{t("기업 인재 검색에 보이기", "Show me to companies", "在企业人才搜索中展示", "Hiển thị với doanh nghiệp", "企業の人材検索に表示", "Tampil ke perusahaan")}</span>} />
        </div>
        {pool.status && optIn && !pool.status.complete ? (
          <p className="pb-2 text-[14px] leading-[1.6] text-[color:var(--v2-attention)]">{t("이력서와 자기소개서가 어느 정도 채워져야 검색 결과에 보여요.", "Your resume and cover letter need to be reasonably complete to appear.", "简历和自我介绍需填写到一定程度才会出现在搜索结果中。", "Cần điền CV và thư tương đối đầy đủ mới hiển thị.", "履歴書と自己PRがある程度埋まると検索結果に表示されます。", "Lengkapi CV & surat agar tampil.")}</p>
        ) : null}
        {pool.status?.card ? (
          <Row
            onClick={() => setPreview(true)}
            lead="👀"
            title={t("기업에게 이렇게 보여요", "How companies see you", "企业看到的你", "Doanh nghiệp thấy bạn", "企業からの見え方", "Tampilan bagi perusahaan")}
            meta={pool.status.visible ? t("지금 인재 검색에 보이는 중", "Visible now", "当前可见", "Đang hiển thị", "現在表示中", "Terlihat") : pool.status.optedOut ? t("지금은 꺼져 있어요", "Currently off", "当前已关闭", "Đang tắt", "現在オフ", "Nonaktif") : t("이력서를 더 채우면 보여요", "Fill your resume to appear", "完善简历后可见", "Hoàn thiện CV để hiển thị", "履歴書を埋めると表示", "Lengkapi CV")}
          />
        ) : null}
      </Section>

      {preview && pool.status ? <TalentCardSheet t={t} status={pool.status} onClose={() => setPreview(false)} /> : null}
    </Page>
  );
}

/** 받은 연결 요청 한 장 — 회사 · 언제 · 메시지 · (수락하면) 담당자 이메일 · 수락/거절. */
function ConnectionCard({ t, c, busy, onRespond }: { t: PlatformT; c: MyConnection; busy: boolean; onRespond: (a: "accept" | "decline") => void }) {
  return (
    <article className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[17px] font-bold text-[color:var(--v2-faint)]" aria-hidden>
          {c.orgName.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="min-w-0 truncate text-[17px] font-semibold text-[color:var(--v2-ink)]">{c.orgName}</p>
            <span className="shrink-0 text-[13px] text-[color:var(--v2-faint)]">{formatRelativeTime(new Date(c.createdAt).getTime(), undefined, t)}</span>
          </div>
          {c.message ? <p className="mt-1 whitespace-pre-wrap text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">“{c.message}”</p> : null}
          {c.status === "ACCEPTED" && c.partnerEmail ? (
            <a href={`mailto:${c.partnerEmail}`} className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[14px] font-semibold text-[color:var(--v2-accent)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <span className="truncate">{c.partnerEmail}</span>
            </a>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {c.status === "PENDING" ? (
          <>
            <Button size="sm" variant="white" disabled={busy} onClick={() => onRespond("decline")}>
              {t("거절", "Decline", "拒绝", "Từ chối", "拒否", "Tolak")}
            </Button>
            <Button size="sm" disabled={busy} onClick={() => onRespond("accept")}>
              {t("수락하기", "Accept", "接受", "Chấp nhận", "承認する", "Terima")}
            </Button>
          </>
        ) : c.status === "ACCEPTED" ? (
          <span className="inline-flex h-7 items-center rounded-md bg-white px-2.5 text-[13px] font-semibold text-[color:var(--v2-good)]">{t("수락함", "Accepted", "已接受", "Đã nhận", "承認済み", "Diterima")}</span>
        ) : (
          <span className="inline-flex h-7 items-center rounded-md bg-white px-2.5 text-[13px] font-semibold text-[color:var(--v2-faint)]">{t("거절함", "Declined", "已拒绝", "Đã từ chối", "拒否済み", "Ditolak")}</span>
        )}
      </div>
    </article>
  );
}

/** 관심 준 회사 한 줄 — 누르면 회사 상세, 홈페이지가 있으면 옆에 바로 가기. */
function InterestedLine({ t, c }: { t: PlatformT; c: InterestedCompany }) {
  const date = c.interestedAt.slice(0, 10).replace(/-/g, ".");
  const site = c.website ? (/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`) : null;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <Row
          href={`/talent/company/${encodeURIComponent(c.name)}`}
          thumb={{ src: c.logo, fallback: c.name }}
          title={c.name}
          meta={c.summary || [c.industry ? partnerIndustryLabel(c.industry) : null, t(`${date} 관심`, `Interested ${date}`, `${date} 关注`, `Quan tâm ${date}`, `${date} 関心`, `Tertarik ${date}`)].filter(Boolean).join(" · ")}
        />
      </div>
      {site ? (
        <a href={site} target="_blank" rel="noopener noreferrer" aria-label={t("홈페이지", "Website", "官网", "Website", "サイト", "Website")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--v2-faint)] transition hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-ink-3)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
