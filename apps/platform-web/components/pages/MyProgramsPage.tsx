"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { readAccessToken } from "../../lib/auth-client";

type MyProgram = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  application: {
    id: string;
    position: {
      id: string;
      title: string;
      partnerOrganization: { id: string; name: string } | null;
    };
  };
  meetings: Array<{ id: string; scheduledAt: string; status: string }>;
  certificate: { id: string } | null;
  recommendation: { id: string } | null;
  schoolCreditRequest: { id: string; status: string } | null;
};

const STATUS: Record<MyProgram["status"], { label: string; className: string }> = {
  ACTIVE: { label: "진행 중", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "완료", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "취소", className: "bg-gray-100 text-gray-500" }
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function MyProgramsPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;

  const [items, setItems] = useState<MyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/members/me/programs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: MyProgram[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로그램 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [isReady, isAuthenticated]);

  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-2xl font-bold">{tr("로그인이 필요합니다", "Sign in required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Diperlukan masuk")}</h1>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            {tr("로그인하기", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {tr("내 프로그램", "My programs", "我的项目", "Chương trình của tôi", "私のプログラム", "Program saya")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("합격한 회사의 인턴십/프로그램 진행 상황을 확인하고 피드백, 학점 인정을 관리하세요.", "Review the progress, feedback, and school credit requests for accepted programs.", "查看已通过项目的进展、反馈和学分认定。", "Xem tiến trình, phản hồi và yêu cầu công nhận tín chỉ.", "合格した企業のインターンシップ・プログラムの進行状況を確認し、フィードバックや単位認定を管理してください。", "Pantau progres, umpan balik, dan permintaan kredit akademik untuk program yang diterima.")}
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-muted-foreground">{tr("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</p>
        ) : error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {tr("아직 합격한 프로그램이 없습니다.", "No accepted programs yet.", "暂无通过的项目。", "Chưa có chương trình nào được chấp nhận.", "まだ合格したプログラムはありません。", "Belum ada program yang diterima.")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((p) => {
              const badge = STATUS[p.status];
              const upcoming = p.meetings.find((m) => m.status === "SCHEDULED");
              return (
                <Link
                  key={p.id}
                  href={`/profile/programs/${p.id}`}
                  className="block rounded-2xl border border-border/70 bg-card p-5 transition hover:border-foreground/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        {p.application.position.partnerOrganization?.name ?? "-"}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">{p.application.position.title}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <dt>{tr("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")}</dt>
                      <dd className="text-foreground">{formatDate(p.startsAt)}</dd>
                    </div>
                    <div>
                      <dt>{tr("종료", "End", "结束", "Kết thúc", "終了", "Selesai")}</dt>
                      <dd className="text-foreground">{formatDate(p.endsAt)}</dd>
                    </div>
                  </dl>
                  {upcoming ? (
                    <p className="mt-2 text-xs text-foreground">
                      {tr("다음 미팅", "Next meeting", "下次会议", "Cuộc họp tiếp theo", "次回のミーティング", "Pertemuan berikutnya")}: {new Date(upcoming.scheduledAt).toLocaleString("ko-KR")}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.certificate ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{tr("수료증", "Certificate", "结业证", "Chứng nhận", "修了証", "Sertifikat")}</span> : null}
                    {p.recommendation ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{tr("추천서", "Recommendation", "推荐信", "Thư giới thiệu", "推薦状", "Surat rekomendasi")}</span> : null}
                    {p.schoolCreditRequest ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {tr("학점 인정", "School credit", "学分认定", "Tín chỉ", "単位認定", "Kredit akademik")} · {p.schoolCreditRequest.status === "APPROVED" ? tr("승인", "Approved", "已批准", "Đã duyệt", "承認", "Disetujui") : p.schoolCreditRequest.status === "REJECTED" ? tr("반려", "Rejected", "已拒绝", "Từ chối", "却下", "Ditolak") : tr("심사 중", "Pending", "审核中", "Đang xét", "審査中", "Sedang ditinjau")}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
