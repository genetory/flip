import type { MemberRole, PartnerType } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: MemberRole;
        partnerType: PartnerType | null;
      };
    }
  }
}

export {};

