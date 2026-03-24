import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AccessTokenPayload, AuthUser, RefreshTokenPayload } from "../types/auth.js";

const minutesToSeconds = (minutes: number) => minutes * 60;
const daysToSeconds = (days: number) => days * 24 * 60 * 60;

export const createTokenHash = () => crypto.randomBytes(32).toString("hex");

export const hashToken = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const signAccessToken = (user: AuthUser) =>
  jwt.sign(
    {
      ...user,
      type: "access"
    } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: minutesToSeconds(env.ACCESS_TOKEN_TTL_MINUTES)
    }
  );

export const signRefreshToken = (payload: RefreshTokenPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: daysToSeconds(env.REFRESH_TOKEN_TTL_DAYS)
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
