import type { Response } from "express";
import { env } from "../config/env.js";
import { REFRESH_COOKIE_NAME } from "../constants/auth.js";

const cookieBaseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/auth"
};

export const setRefreshCookie = (response: Response, token: string) => {
  response.cookie(REFRESH_COOKIE_NAME, token, {
    ...cookieBaseOptions,
    domain: env.COOKIE_DOMAIN,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
};

export const clearRefreshCookie = (response: Response) => {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    ...cookieBaseOptions,
    domain: env.COOKIE_DOMAIN
  });
};
