import { prisma } from "../config/prisma.js";
import type { AuthUser, RefreshTokenPayload } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { comparePassword } from "../utils/password.js";
import { createTokenHash, hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { serializeUser } from "./presenters.js";

const getRefreshExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7));
  return expiresAt;
};

const issueRefreshToken = async (userId: string) => {
  const tokenHash = createTokenHash();

  const session = await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: hashToken(tokenHash),
      expiresAt: getRefreshExpiry()
    }
  });

  const payload: RefreshTokenPayload = {
    type: "refresh",
    sessionId: session.id,
    tokenHash,
    userId
  };

  return signRefreshToken(payload);
};

const buildAuthPayload = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "User account not found.");
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  return {
    accessToken: signAccessToken(authUser),
    refreshToken: await issueRefreshToken(user.id),
    user: serializeUser(user)
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  return buildAuthPayload(user.id);
};

export const refreshAuthSession = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is missing.");
  }

  let payload: RefreshTokenPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid.");
  }

  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: true
    }
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    session.tokenHash !== hashToken(payload.tokenHash) ||
    session.userId !== payload.userId
  ) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid.");
  }

  await prisma.refreshSession.update({
    where: { id: session.id },
    data: {
      revokedAt: new Date()
    }
  });

  return buildAuthPayload(session.userId);
};

export const logout = async (refreshToken?: string) => {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.refreshSession.findUnique({
      where: { id: payload.sessionId }
    });

    if (session && session.tokenHash === hashToken(payload.tokenHash) && !session.revokedAt) {
      await prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date()
        }
      });
    }
  } catch {
    return;
  }
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
  }

  return serializeUser(user);
};
