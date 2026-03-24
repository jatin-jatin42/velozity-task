import type { Request, Response } from "express";
import { REFRESH_COOKIE_NAME } from "../constants/auth.js";
import { success } from "../http/response.js";
import { clearRefreshCookie, setRefreshCookie } from "../utils/cookies.js";
import { getMe, login, logout, refreshAuthSession } from "../services/auth-service.js";

export const loginController = async (request: Request, response: Response) => {
  const result = await login(request.body.email, request.body.password);
  setRefreshCookie(response, result.refreshToken);

  return response.json(
    success({
      accessToken: result.accessToken,
      user: result.user
    })
  );
};

export const refreshController = async (request: Request, response: Response) => {
  const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
  const result = await refreshAuthSession(refreshToken);
  setRefreshCookie(response, result.refreshToken);

  return response.json(
    success({
      accessToken: result.accessToken,
      user: result.user
    })
  );
};

export const logoutController = async (request: Request, response: Response) => {
  await logout(request.cookies[REFRESH_COOKIE_NAME]);
  clearRefreshCookie(response);

  return response.json(success({ message: "Logged out successfully." }));
};

export const meController = async (request: Request, response: Response) => {
  const user = await getMe(request.authUser!.id);
  return response.json(success(user));
};
