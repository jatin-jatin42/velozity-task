import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AccessTokenPayload = AuthUser & {
  type: "access";
};

export type RefreshTokenPayload = {
  type: "refresh";
  sessionId: string;
  tokenHash: string;
  userId: string;
};
