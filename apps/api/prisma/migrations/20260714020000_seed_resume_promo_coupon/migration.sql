-- resume-maker 프로모코드 — 계정당 1회 등록, 500 티켓 충전.
--
-- 티켓 소모량 참고: import_resume 3, cover_letter 2, 대부분의 액션 1
-- → 500 티켓이면 AI 기능을 넉넉히(수백 회) 써볼 수 있다.
--
-- maxUses 10000 : 여러 계정이 각자 등록 가능(전체 등록 횟수 상한)
-- groupKey      : Coupon/CouponRedemption 의 @@unique([groupKey, userId]) 로
--                 한 계정이 이 그룹의 코드를 두 번 등록하는 것을 막는다.
-- code 는 유니크라 재실행해도 안전(ON CONFLICT DO NOTHING).

INSERT INTO "Coupon" ("id", "code", "tickets", "maxUses", "usedCount", "active", "groupKey", "createdAt")
VALUES ('cpnPromo_APLYRESUME500', 'APLYRESUME500', 500, 10000, 0, true, 'PROMO_RESUME_500', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
