// resume-maker i18n — AI 무료 월 한도(업셀) 공용 문구.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  remaining: (n: number) => string; // 버튼 옆 "이번 달 N회 남음"
  limitTitle: string; // 한도 초과 모달 제목
  limitDesc: (date: string) => string; // 다시 충전되는 날짜 안내
  comingSoon: string; // 결제 전 — 무제한 곧 제공 안내
  ok: string;
  statusTitle: string; // 티켓 현황 모달 제목
  balanceLabel: string; // "보유한 티켓"
  earnTitle: string; // "얻는 방법"
  earnDaily: (n: number) => string; // 매일 N장 자동 충전 안내
  nextCharge: (date: string) => string; // 다음 충전일
  nextChargeIn: (time: string) => string; // 다음 충전까지 남은 시간(타이머)
  usedForNote: string; // 티켓 사용처 안내
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    remaining: (n) => `AI 티켓 ${n}개`,
    limitTitle: "AI 티켓을 다 썼어요",
    limitDesc: (date) => `${date}에 티켓이 다시 충전돼요.`,
    comingSoon: "곧 프리미엄으로 무제한 이용할 수 있어요.",
    ok: "확인",
    statusTitle: "AI 티켓",
    balanceLabel: "보유한 티켓",
    earnTitle: "얻는 방법",
    earnDaily: (n) => `매일 ${n}장씩 자동으로 충전돼요`,
    nextCharge: (date) => `다음 충전 ${date}`,
    nextChargeIn: (t) => `다음 충전까지 ${t}`,
    usedForNote: "공고 맞춤·모의 면접 등 AI 기능을 쓸 때 사용돼요."
  },
  en: {
    remaining: (n) => `${n} AI tickets`,
    limitTitle: "You are out of AI tickets",
    limitDesc: (date) => `Your tickets refill on ${date}.`,
    comingSoon: "Unlimited use with Premium is coming soon.",
    ok: "Got it",
    statusTitle: "AI tickets",
    balanceLabel: "You have",
    earnTitle: "How to get more",
    earnDaily: (n) => `${n} tickets refill automatically every day`,
    nextCharge: (date) => `Next refill ${date}`,
    nextChargeIn: (t) => `Next refill in ${t}`,
    usedForNote: "Used for AI features like Job Match and Mock Interview."
  },
  "zh-CN": {
    remaining: (n) => `AI 券 ${n} 张`,
    limitTitle: "AI 券已用完",
    limitDesc: (date) => `券将于 ${date} 补充。`,
    comingSoon: "高级版无限使用即将上线。",
    ok: "知道了",
    statusTitle: "AI 券",
    balanceLabel: "持有",
    earnTitle: "获取方式",
    earnDaily: (n) => `每天自动补充 ${n} 张`,
    nextCharge: (date) => `下次补充 ${date}`,
    nextChargeIn: (t) => `距下次补充 ${t}`,
    usedForNote: "用于岗位匹配、模拟面试等 AI 功能。"
  },
  vi: {
    remaining: (n) => `${n} vé AI`,
    limitTitle: "Bạn đã hết vé AI",
    limitDesc: (date) => `Vé sẽ được nạp lại vào ${date}.`,
    comingSoon: "Dùng không giới hạn với Premium sẽ sớm ra mắt.",
    ok: "Đã hiểu",
    statusTitle: "Vé AI",
    balanceLabel: "Bạn có",
    earnTitle: "Cách nhận thêm",
    earnDaily: (n) => `Mỗi ngày tự động nạp lại ${n} vé`,
    nextCharge: (date) => `Nạp lại tiếp theo ${date}`,
    nextChargeIn: (t) => `Nạp lại sau ${t}`,
    usedForNote: "Dùng cho các tính năng AI như Khớp tin tuyển và Phỏng vấn thử."
  },
  ja: {
    remaining: (n) => `AI チケット ${n} 枚`,
    limitTitle: "AI チケットを使い切りました",
    limitDesc: (date) => `${date} にチケットが補充されます。`,
    comingSoon: "プレミアムでの無制限利用は近日提供予定です。",
    ok: "OK",
    statusTitle: "AI チケット",
    balanceLabel: "保有",
    earnTitle: "入手方法",
    earnDaily: (n) => `毎日 ${n} 枚が自動で補充されます`,
    nextCharge: (date) => `次回補充 ${date}`,
    nextChargeIn: (t) => `次回補充まで ${t}`,
    usedForNote: "求人マッチ・模擬面接などの AI 機能に使われます。"
  },
  id: {
    remaining: (n) => `${n} tiket AI`,
    limitTitle: "Tiket AI Anda habis",
    limitDesc: (date) => `Tiket akan diisi ulang pada ${date}.`,
    comingSoon: "Penggunaan tanpa batas dengan Premium segera hadir.",
    ok: "Mengerti",
    statusTitle: "Tiket AI",
    balanceLabel: "Anda punya",
    earnTitle: "Cara mendapatkan",
    earnDaily: (n) => `${n} tiket diisi ulang otomatis setiap hari`,
    nextCharge: (date) => `Pengisian berikutnya ${date}`,
    nextChargeIn: (t) => `Pengisian berikutnya dalam ${t}`,
    usedForNote: "Dipakai untuk fitur AI seperti Cocokkan Lowongan dan Wawancara."
  }
};

export function useQuotaCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
