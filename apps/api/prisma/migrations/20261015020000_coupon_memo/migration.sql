-- 포인트 코드(쿠폰) 운영 메모 — 어떤 이벤트·용도로 만든 코드인지 운영 콘솔에 보이게.
-- additive: nullable 컬럼 하나 추가. 기존 행 데이터 무변경.

ALTER TABLE "Coupon" ADD COLUMN "memo" TEXT;
