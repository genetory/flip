import { MemberRole } from "@prisma/client";
import type { PartnerType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

type TokenPayload = {
  sub: string;
  role: MemberRole;
  partnerType: PartnerType | null;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "flip-dev-secret";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function signRefreshToken(payload: { sub: string; jti: string }) {
  return jwt.sign({ sub: payload.sub, jti: payload.jti, type: "refresh" }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string; jti: string; type: "refresh" } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { sub?: string; jti?: string; type?: string };
    if (!decoded?.sub || !decoded?.jti || decoded.type !== "refresh") return null;
    return { sub: decoded.sub, jti: decoded.jti, type: "refresh" };
  } catch {
    return null;
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, message: "missing bearer token" });
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ ok: false, message: "invalid token" });
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role,
    partnerType: payload.partnerType
  };
  return next();
}

// 선택적 인증 — 유효한 토큰이 있으면 req.auth 를 세팅하고, 없거나 무효면 그냥 게스트로 진행.
// 마스킹된 공개 데이터(예: 인재검색)를 비회원도 열람할 수 있게 할 때 사용.
export function authenticateOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    if (payload) {
      req.auth = { userId: payload.sub, role: payload.role, partnerType: payload.partnerType };
    }
  }
  return next();
}

export function requireRoles(allowed: MemberRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ ok: false, message: "authentication required" });
    }
    // 운영자(OPERATOR)는 학생·파트너가 할 수 있는 모든 기능에 접근 가능한 슈퍼유저로 취급한다.
    // (역할별 requireRoles 게이트를 항상 통과 — 개별 라우트에 OPERATOR 를 일일이 추가하지 않아도 됨.)
    if (req.auth.role === MemberRole.OPERATOR) {
      return next();
    }
    if (!allowed.includes(req.auth.role)) {
      return res.status(403).json({ ok: false, message: "forbidden" });
    }
    return next();
  };
}
