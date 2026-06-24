// resume-maker i18n — AI 무료 월 한도(업셀) 공용 문구.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  remaining: (n: number) => string; // 버튼 옆 "이번 달 N회 남음"
  limitTitle: string; // 한도 초과 모달 제목
  limitDesc: (date: string) => string; // 다시 충전되는 날짜 안내
  comingSoon: string; // 결제 전 — 무제한 곧 제공 안내
  ok: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    remaining: (n) => `이번 달 AI 티켓 ${n}개`,
    limitTitle: "이번 달 무료 한도를 다 썼어요",
    limitDesc: (date) => `${date}에 무료 한도가 다시 충전돼요.`,
    comingSoon: "곧 프리미엄으로 무제한 이용할 수 있어요.",
    ok: "확인"
  },
  en: {
    remaining: (n) => `${n} AI tickets this month`,
    limitTitle: "You've used this month's free limit",
    limitDesc: (date) => `Your free limit refreshes on ${date}.`,
    comingSoon: "Unlimited use with Premium is coming soon.",
    ok: "Got it"
  },
  "zh-CN": {
    remaining: (n) => `本月 AI 券 ${n} 张`,
    limitTitle: "本月免费次数已用完",
    limitDesc: (date) => `免费次数将于 ${date} 重置。`,
    comingSoon: "高级版无限使用即将上线。",
    ok: "知道了"
  },
  vi: {
    remaining: (n) => `${n} vé AI tháng này`,
    limitTitle: "Bạn đã dùng hết lượt miễn phí tháng này",
    limitDesc: (date) => `Lượt miễn phí sẽ làm mới vào ${date}.`,
    comingSoon: "Dùng không giới hạn với Premium sẽ sớm ra mắt.",
    ok: "Đã hiểu"
  },
  ja: {
    remaining: (n) => `今月の AI チケット ${n} 枚`,
    limitTitle: "今月の無料回数を使い切りました",
    limitDesc: (date) => `${date} に無料回数がリセットされます。`,
    comingSoon: "プレミアムでの無制限利用は近日提供予定です。",
    ok: "OK"
  },
  id: {
    remaining: (n) => `${n} tiket AI bulan ini`,
    limitTitle: "Kuota gratis bulan ini sudah habis",
    limitDesc: (date) => `Kuota gratis akan disetel ulang pada ${date}.`,
    comingSoon: "Penggunaan tanpa batas dengan Premium segera hadir.",
    ok: "Mengerti"
  }
};

export function useQuotaCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
