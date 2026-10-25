-- 결제 주문의 PG — 'toss'(토스페이먼츠) | 'payapp'(페이앱). 환불할 때 어느 PG 로 취소할지 고른다.
-- additive: 기본값 'toss' 컬럼 추가(기존 주문은 모두 토스). 기존 행 데이터 무변경.

ALTER TABLE "PaymentOrder" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'toss';
