import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { listUsers } from "../services/user-service.js";

export const listUsersController = async (request: Request, response: Response) => {
  const users = await listUsers(request.authUser!, request.query.role as never);
  return response.json(success(users));
};
