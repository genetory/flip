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
  codeTitle: string;
  codePlaceholder: string;
  redeemBtn: string;
  redeemSuccess: (n: number) => string;
  codeInvalid: string;
  codeExpired: string;
  codeAlready: string;
  codeExhausted: string;
  codeGroupUsed: string;
  redeemFailed: string;
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
    usedForNote: "공고 맞춤·모의 면접 등 AI 기능을 쓸 때 사용돼요.",
    codeTitle: "코드로 충전",
    codePlaceholder: "쿠폰 코드 입력",
    redeemBtn: "충전",
    redeemSuccess: (n) => `티켓 ${n}장이 충전됐어요!`,
    codeInvalid: "유효하지 않은 코드예요.",
    codeExpired: "만료된 코드예요.",
    codeAlready: "이미 사용한 코드예요.",
    codeExhausted: "모두 사용된 코드예요.",
    codeGroupUsed: "이미 이 이벤트의 코드를 사용했어요.",
    redeemFailed: "충전에 실패했어요. 잠시 후 다시 시도해 주세요."
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
    usedForNote: "Used for AI features like Job Match and Mock Interview.",
    codeTitle: "Redeem a code",
    codePlaceholder: "Enter coupon code",
    redeemBtn: "Redeem",
    redeemSuccess: (n) => `${n} tickets added!`,
    codeInvalid: "Invalid code.",
    codeExpired: "This code has expired.",
    codeAlready: "You already used this code.",
    codeExhausted: "This code is fully used.",
    codeGroupUsed: "You already used a code from this event.",
    redeemFailed: "Couldn't redeem. Please try again."
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
    usedForNote: "用于岗位匹配、模拟面试等 AI 功能。",
    codeTitle: "用代码充值",
    codePlaceholder: "输入优惠码",
    redeemBtn: "充值",
    redeemSuccess: (n) => `已充值 ${n} 张券！`,
    codeInvalid: "无效的代码。",
    codeExpired: "代码已过期。",
    codeAlready: "你已使用过此代码。",
    codeExhausted: "此代码已用完。",
    codeGroupUsed: "你已使用过此活动的代码。",
    redeemFailed: "充值失败，请稍后再试。"
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
    usedForNote: "Dùng cho các tính năng AI như Khớp tin tuyển và Phỏng vấn thử.",
    codeTitle: "Nhập mã",
    codePlaceholder: "Nhập mã ưu đãi",
    redeemBtn: "Nạp",
    redeemSuccess: (n) => `Đã thêm ${n} vé!`,
    codeInvalid: "Mã không hợp lệ.",
    codeExpired: "Mã đã hết hạn.",
    codeAlready: "Bạn đã dùng mã này.",
    codeExhausted: "Mã đã được dùng hết.",
    codeGroupUsed: "Bạn đã dùng một mã của sự kiện này.",
    redeemFailed: "Không nạp được. Vui lòng thử lại."
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
    usedForNote: "求人マッチ・模擬面接などの AI 機能に使われます。",
    codeTitle: "コードでチャージ",
    codePlaceholder: "クーポンコードを入力",
    redeemBtn: "チャージ",
    redeemSuccess: (n) => `チケットを${n}枚チャージしました！`,
    codeInvalid: "無効なコードです。",
    codeExpired: "期限切れのコードです。",
    codeAlready: "すでに使用済みのコードです。",
    codeExhausted: "すべて使用されたコードです。",
    codeGroupUsed: "このイベントのコードはすでに使用済みです。",
    redeemFailed: "チャージに失敗しました。後でもう一度お試しください。"
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
    usedForNote: "Dipakai untuk fitur AI seperti Cocokkan Lowongan dan Wawancara.",
    codeTitle: "Tukar kode",
    codePlaceholder: "Masukkan kode kupon",
    redeemBtn: "Isi",
    redeemSuccess: (n) => `${n} tiket ditambahkan!`,
    codeInvalid: "Kode tidak valid.",
    codeExpired: "Kode kedaluwarsa.",
    codeAlready: "Anda sudah memakai kode ini.",
    codeExhausted: "Kode sudah habis dipakai.",
    codeGroupUsed: "Anda sudah memakai kode dari acara ini.",
    redeemFailed: "Gagal mengisi. Coba lagi."
  }
};

export function useQuotaCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
