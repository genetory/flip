"use client";

// Phase 7 학생 리그·성장 카드 — 점수·순위 구간·다음 행동(예상 변화)·배지·기수 공동목표·익명 활동 피드.
// 하위권에는 꼴찌 대신 현재 단계·다음 한 가지 행동·예상 변화를 우선 표시.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, ArrowRight, Trophy, Users } from "@phosphor-icons/react";
import { Card, Pill, SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import { fetchLeague, type LeagueData } from "../../lib/launch/league";
import { logActivity } from "../../lib/launch/pilot-client";

const BUCKET_LABEL: Record<string, string> = { top: "상위권", upper: "중상위", middle: "중간", lower: "성장 중" };

export function LeagueCard() {
  const t = useLaunchT();
  const [data, setData] = useState<LeagueData | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    trackCareerFunnel("career_league_viewed");
    void logActivity("league_view"); // Phase 10 계기(리그 조회율)
    void (async () => {
      try {
        const d = await fetchLeague();
        if (alive.current) {
          setData(d);
          setPhase("ready");
        }
      } catch {
        if (alive.current) setPhase("error");
      }
    })();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "loading") return <Card><p className="flex items-center gap-2 py-4 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p></Card>;
  if (phase === "error" || !data) return null; // 조용히 숨김(핵심 진행 방해 금지)

  const score = data.score;
  const league = data.league;
  const isLower = league?.bucket === "lower" || league?.bucket === "middle";

  return (
    <div className="space-y-4">
      {/* 점수 + 순위 구간 */}
      {score ? (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <SectionTitle sub={t("완료·결과물·성장·훈련·오답해결을 종합해요", "Combines completion, artifacts, growth, practice, corrections", "综合完成·成果·成长·训练·错题", "Tổng hợp hoàn thành, kết quả, tiến bộ, luyện tập, sửa lỗi", "完了・成果・成長・訓練・オ답を総合", "Gabungan penyelesaian, hasil, pertumbuhan, latihan, koreksi")}>{t("내 준비 점수", "My readiness score", "我的准备分数", "Điểm chuẩn bị", "私の準備スコア", "Skor kesiapanku")}</SectionTitle>
            <p className="text-[26px] font-black text-[#0B46E8]">{score.total}</p>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5 text-center text-[10.5px]">
            {([["mission", t("미션", "Mission", "任务", "NV", "ミッション", "Misi")], ["artifact", t("결과물", "Docs", "成果", "HS", "成果", "Dok")], ["growth", t("성장", "Growth", "成长", "TB", "成長", "Tumbuh")], ["practice", t("훈련", "Practice", "训练", "LT", "訓練", "Latih")], ["correction", t("오답", "Fixes", "错题", "SL", "オ답", "Koreksi")]] as const).map(([k, label]) => (
              <div key={k} className="rounded-lg bg-[#FAFBFC] px-1 py-1"><p className="text-[#8B95A1]">{label}</p><p className="text-[12px] font-extrabold tabular-nums text-[#191F28]">{score.breakdown[k as keyof typeof score.breakdown]}</p></div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[#8B95A1]">{t("점수는 취업 준비 정도를 보여주는 지표예요. 합격 가능성이 아니에요.", "This shows readiness, not hiring likelihood.", "该分数表示准备程度，非录用可能性。", "Điểm cho thấy mức chuẩn bị, không phải khả năng trúng tuyển.", "このスコアは準備度で、合格可能性ではありません。", "Skor menunjukkan kesiapan, bukan peluang diterima.")}{data.contributionDisabled ? ` ${t("(동료 기여 항목은 준비 중)", "(Peer contribution coming soon)", "（同伴贡献项开发中）", "(Đóng góp đồng đội sắp có)", "(同僚貢献は準備中)", "(Kontribusi rekan segera)")}` : ""}</p>
        </Card>
      ) : null}

      {/* 리그 위치 */}
      {league ? (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <SectionTitle sub={t("같은 기수에서 함께 준비하고 있어요", "Preparing together in your cohort", "同期一起准备", "Cùng chuẩn bị trong khóa", "同じ期で一緒に準備中", "Bersiap bersama dalam kohor")}>{t("내 리그", "My league", "我的联赛", "Giải của tôi", "私のリーグ", "Liga saya")}</SectionTitle>
            <Pill tone="blue"><Users className="mr-1 inline h-3.5 w-3.5" />{league.memberCount}</Pill>
          </div>
          {league.rankHidden ? (
            <p className="mt-2 text-[12.5px] text-[#8B95A1]">{t("참여자가 적어 상세 순위는 표시하지 않아요. 지금 단계에 집중해요.", "Too few members to show detailed rank — focus on your step.", "参与者较少，不显示详细排名。专注当前阶段。", "Ít người nên ẩn xếp hạng chi tiết — tập trung bước hiện tại.", "参加者が少なく詳細順位は非表示。今の段階に集中を。", "Anggota sedikit, peringkat detail disembunyikan.")}</p>
          ) : isLower ? (
            <div className="mt-2 rounded-xl bg-[#F5F8FF] p-3">
              <p className="text-[12.5px] font-bold text-[#0B46E8]">{BUCKET_LABEL[league.bucket ?? "middle"]} {t("구간이에요", "range", "区间", "khoảng", "区間です", "rentang")}</p>
              <p className="mt-1 text-[12px] text-[#4E5968]">{t("아래 다음 행동을 하면 구간이 올라가요. 지금까지 잘 오고 있어요!", "Do the next action below to move up — you're on track!", "完成下面的下一步即可上升。你做得很好！", "Làm hành động tiếp theo để lên hạng — bạn đang đi đúng hướng!", "下の次の行動で区間が上がります。よく来ています！", "Lakukan aksi berikut untuk naik — kamu di jalur benar!")}</p>
            </div>
          ) : (
            <p className="mt-2 text-[13px] font-bold text-[#191F28]">{BUCKET_LABEL[league.bucket ?? "top"]} · {league.rank}{t("등", "th", "名", "", "位", "")} <span className="text-[12px] font-normal text-[#8B95A1]">({t("상위", "top", "前", "top", "上位", "atas")} {100 - (league.percentile ?? 0)}%)</span>{score?.rankDelta ? <span className={`ml-1 text-[11.5px] ${score.rankDelta > 0 ? "text-[#0A9B59]" : "text-[#8B95A1]"}`}>{score.rankDelta > 0 ? `▲${score.rankDelta}` : score.rankDelta < 0 ? `▼${-score.rankDelta}` : ""}</span> : null}</p>
          )}
        </Card>
      ) : null}

      {/* 다음 행동(예상 변화) */}
      {data.nextActions.length ? (
        <Card>
          <SectionTitle sub={t("지금 가장 영향력이 큰 행동이에요", "Highest-impact actions right now", "当前影响最大的行动", "Hành động ảnh hưởng nhất", "今最も影響が大きい行動", "Aksi paling berdampak")}>{t("다음 행동", "Next actions", "下一步", "Việc tiếp theo", "次の行動", "Aksi berikut")}</SectionTitle>
          <div className="mt-2 space-y-1.5">
            {/* UX Phase 8 — 다음 행동은 정보 표시(내비게이션 없음). 클릭 가능한 div a11y 이슈 제거. */}
            {data.nextActions.map((a) => (
              <div key={a.key} className="flex items-center justify-between gap-2 rounded-xl border border-[#EEF1F5] bg-white p-3">
                <p className="min-w-0 break-keep text-[12.5px] text-[#333D4B]">{a.label}</p>
                {a.projectedDelta > 0 ? <Pill tone="green">+{a.projectedDelta}{t("점", "pt", "分", "đ", "点", "poin")}</Pill> : <ArrowRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* 배지 + 공동목표 + 피드 */}
      {(data.badges.length || data.cohortGoals.length || data.activityFeed.length) ? (
        <Card>
          {data.badges.length ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]"><Trophy className="mr-1 inline h-3.5 w-3.5" weight="fill" />{t("내 배지", "My badges", "我的徽章", "Huy hiệu", "私のバッジ", "Lencana")}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {data.badges.map((b) => (
                  <span key={b.id} title={b.description} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[11.5px] font-semibold text-[#0B46E8]">🏅 {b.title ?? b.badgeKey}</span>
                ))}
              </div>
            </div>
          ) : null}
          {data.cohortGoals.length ? (
            <div className={data.badges.length ? "mt-3" : ""}>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("기수 공동 목표", "Cohort goals", "同期共同目标", "Mục tiêu chung", "期の共同目標", "Target kohor")}</p>
              {data.cohortGoals.map((g) => (
                <div key={g.id} className="mt-1">
                  <div className="flex items-center justify-between text-[12px]"><span className="text-[#4E5968]">{g.goalType}</span><span className="font-bold text-[#191F28]">{g.currentValue}/{g.targetValue}</span></div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#EEF1F5]"><div className="h-full rounded-full bg-[#0B46E8]" style={{ width: `${Math.min(100, g.targetValue ? (g.currentValue / g.targetValue) * 100 : 0)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : null}
          {data.activityFeed.length ? (
            <div className={data.badges.length || data.cohortGoals.length ? "mt-3" : ""}>
              {data.activityFeed.map((f, i) => <p key={i} className="text-[12px] text-[#8B95A1]">👥 {f}</p>)}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
